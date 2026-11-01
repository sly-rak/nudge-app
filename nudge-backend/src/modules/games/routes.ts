import { FastifyPluginAsync } from 'fastify';
import { query } from '../../db/index.js';
import { realtimeGateway } from '../../realtime/gateway.js';
import { botService } from '../bot/service.js';

export const gameRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('onRequest', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.status(401).send({ error: { code: 'UNAUTHENTICATED', message: 'Unauthorized' } });
    }
  });

  // Game catalog
  fastify.get('/', async () => {
    return {
      games: [
        {
          key: 'tictactoe',
          name: 'Tic-Tac-Toe',
          description: 'Classic 3x3 turn-based board duel',
          icon: 'Grid',
          players: 2,
        },
        {
          key: 'connect4',
          name: 'Four in a Row',
          description: 'Drop discs and connect 4 before your friend',
          icon: 'Disc',
          players: 2,
        },
        {
          key: 'wordguess',
          name: 'Word Guess',
          description: 'Guess the secret 5-letter word in 6 tries',
          icon: 'SpellCheck',
          players: 2,
        },
      ],
    };
  });

  // Create game session
  fastify.post('/sessions', async (request) => {
    const decoded = request.user as { id: string };
    const { gameKey = 'tictactoe', conversationId, opponentId } = request.body as any;

    let targetOpponentId = opponentId;

    // If opponentId is not passed but conversationId is, look up other member
    if (!targetOpponentId && conversationId) {
      const otherRes = await query(
        'SELECT user_id FROM conversation_members WHERE conversation_id = $1 AND user_id != $2 LIMIT 1',
        [conversationId, decoded.id]
      );
      if (otherRes.rowCount && otherRes.rowCount > 0) {
        targetOpponentId = otherRes.rows[0].user_id;
      }
    }

    let initialState: Record<string, any> = {};
    if (gameKey === 'tictactoe') {
      initialState = {
        board: Array(9).fill(null),
        turn: 'X',
        playerX: decoded.id,
        playerO: targetOpponentId || null,
      };
    } else if (gameKey === 'wordguess') {
      initialState = {
        secret: 'NUDGE',
        guesses: [],
        maxAttempts: 6,
      };
    }

    const res = await query(
      `INSERT INTO game_sessions (game_key, conversation_id, state, created_by, status)
       VALUES ($1, $2, $3, $4, 'in_progress')
       RETURNING id, game_key as "gameKey", conversation_id as "conversationId", state, status,
                 created_by as "createdBy", created_at as "createdAt"`,
      [gameKey, conversationId || null, JSON.stringify(initialState), decoded.id]
    );

    const session = res.rows[0];

    // If game has conversation, send system/game invitation message in conversation
    if (conversationId) {
      const seqRes = await query(
        'UPDATE conversations SET last_seq = last_seq + 1, last_message_at = NOW() WHERE id = $1 RETURNING last_seq',
        [conversationId]
      );
      const nextSeq = seqRes.rows[0].last_seq;

      const gameMsg = await query(
        `INSERT INTO messages (conversation_id, seq, sender_id, type, body, created_at)
         VALUES ($1, $2, $3, 'game', $4, NOW())
         RETURNING *`,
        [conversationId, nextSeq, decoded.id, `Started a game of Tic-Tac-Toe! 🎮`]
      );

      const senderRes = await query('SELECT display_name as "displayName" FROM users WHERE id = $1', [decoded.id]);
      await realtimeGateway.broadcastToConversation(conversationId, {
        t: 'message.new',
        d: {
          conversationId,
          message: {
            ...gameMsg.rows[0],
            sender: { id: decoded.id, displayName: senderRes.rows[0]?.displayName || 'Player' },
            reactions: [],
          },
        },
      });
    }

    return { session };
  });

  // Get game session
  fastify.get('/sessions/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const res = await query(
      `SELECT id, game_key as "gameKey", conversation_id as "conversationId", state, status,
              turn_user_id as "turnUserId", created_by as "createdBy", winner_id as "winnerId",
              created_at as "createdAt", updated_at as "updatedAt"
       FROM game_sessions
       WHERE id = $1`,
      [id]
    );

    if (res.rowCount === 0) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Game session not found' } });
    }

    return { session: res.rows[0] };
  });

  // Make move via REST (also supported via websocket)
  fastify.post('/sessions/:id/move', async (request, reply) => {
    const decoded = request.user as { id: string };
    const { id } = request.params as { id: string };
    const { move } = request.body as any;

    const sessionRes = await query('SELECT * FROM game_sessions WHERE id = $1', [id]);
    if (sessionRes.rowCount === 0) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Game session not found' } });
    }
    const session = sessionRes.rows[0];

    // If tictactoe move: { index: number }
    let updatedState = { ...session.state, ...move };
    let winnerId = session.winner_id;
    let status = session.status;

    if (session.game_key === 'tictactoe' && typeof move.index === 'number') {
      const board: (string | null)[] = session.state.board ? [...session.state.board] : Array(9).fill(null);
      const currentTurn = session.state.turn || 'X';

      if (!board[move.index]) {
        board[move.index] = currentTurn;
        const winningLines = [
          [0, 1, 2], [3, 4, 5], [6, 7, 8],
          [0, 3, 6], [1, 4, 7], [2, 5, 8],
          [0, 4, 8], [2, 4, 6]
        ];
        let hasWon = false;
        for (const [a, b, c] of winningLines) {
          if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            hasWon = true;
            break;
          }
        }
        if (hasWon) {
          winnerId = decoded.id;
          status = 'completed';
        } else if (board.every(cell => cell !== null)) {
          status = 'completed';
        }

        const nextTurn = currentTurn === 'X' ? 'O' : 'X';
        updatedState = { ...session.state, board, turn: nextTurn };
      }
    }

    await query(
      `UPDATE game_sessions
       SET state = $2, winner_id = $3, status = $4, updated_at = NOW()
       WHERE id = $1`,
      [id, JSON.stringify(updatedState), winnerId, status]
    );

    const eventPayload = {
      t: 'game.state' as const,
      d: {
        sessionId: id,
        state: updatedState,
        winnerId,
        status,
      },
    };

    if (session.conversation_id) {
      await realtimeGateway.broadcastToConversation(session.conversation_id, eventPayload);
    }

    // Trigger Bot AI move if game is still in progress
    if (status === 'in_progress') {
      botService.handleGameMove(id, decoded.id);
    }

    return { session: { ...session, state: updatedState, winnerId, status } };
  });
};
