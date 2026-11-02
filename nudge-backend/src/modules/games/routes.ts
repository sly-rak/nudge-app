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
          key: 'rps',
          name: 'Rock Paper Scissors',
          description: 'Best-of-three quick reflex duel',
          icon: 'Hand',
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

    // Default to Tola if still no opponent specified
    if (!targetOpponentId) {
      const defaultBot = await query(
        `SELECT id FROM users WHERE (username = 'tola' OR is_bot = true) AND id != $1 ORDER BY (username = 'tola') DESC LIMIT 1`,
        [decoded.id]
      );
      if (defaultBot.rowCount && defaultBot.rowCount > 0) {
        targetOpponentId = defaultBot.rows[0].id;
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
    } else if (gameKey === 'connect4') {
      initialState = {
        board: Array(42).fill(null),
        turn: 'red',
        playerRed: decoded.id,
        playerYellow: targetOpponentId || null,
        lastMove: null,
      };
    } else if (gameKey === 'rps') {
      initialState = {
        rounds: [],
        playerUser: decoded.id,
        playerOpp: targetOpponentId || null,
        userScore: 0,
        oppScore: 0,
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

    // Fetch opponent info
    let opponent = null;
    if (targetOpponentId) {
      const oppRes = await query(
        `SELECT id, username, display_name as "displayName", bio,
                avatar_url as "avatarUrl", avatar_kind as "avatarKind",
                is_bot as "isBot", bot_persona as "botPersona"
         FROM users WHERE id = $1`,
        [targetOpponentId]
      );
      if (oppRes.rowCount && oppRes.rowCount > 0) {
        opponent = oppRes.rows[0];
      }
    }

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
        [conversationId, nextSeq, decoded.id, `Started a game of ${gameKey === 'tictactoe' ? 'Tic-Tac-Toe' : gameKey === 'connect4' ? 'Four in a Row' : gameKey === 'rps' ? 'Rock Paper Scissors' : 'Word Guess'}! 🎮`]
      );

      const senderRes = await query('SELECT display_name as "displayName" FROM users WHERE id = $1', [decoded.id]);
      const row = gameMsg.rows[0];
      await realtimeGateway.broadcastToConversation(conversationId, {
        t: 'message.new',
        d: {
          conversationId,
          message: {
            id: row.id,
            conversationId: row.conversation_id,
            roomId: row.room_id,
            seq: row.seq,
            senderId: row.sender_id,
            type: row.type,
            body: row.body,
            createdAt: row.created_at,
            sender: { id: decoded.id, displayName: senderRes.rows[0]?.displayName || 'Player' },
            reactions: [],
          },
        },
      });
    }

    return { session, opponent };
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

    const session = res.rows[0];
    let opponent = null;
    const oppId = session.state?.playerO || session.state?.playerYellow || session.state?.playerOpp;
    if (oppId) {
      const oppRes = await query(
        `SELECT id, username, display_name as "displayName", bio,
                avatar_url as "avatarUrl", avatar_kind as "avatarKind",
                is_bot as "isBot", bot_persona as "botPersona"
         FROM users WHERE id = $1`,
        [oppId]
      );
      if (oppRes.rowCount && oppRes.rowCount > 0) {
        opponent = oppRes.rows[0];
      }
    }

    return { session, opponent };
  });

  // Make move via REST
  fastify.post('/sessions/:id/move', async (request, reply) => {
    const decoded = request.user as { id: string };
    const { id } = request.params as { id: string };
    const { move } = request.body as any;

    const sessionRes = await query('SELECT * FROM game_sessions WHERE id = $1', [id]);
    if (sessionRes.rowCount === 0) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Game session not found' } });
    }
    const session = sessionRes.rows[0];

    let updatedState = { ...session.state, ...move };
    let winnerId = session.winner_id;
    let status = session.status;

    // 1. TIC-TAC-TOE
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

    // 2. ROCK PAPER SCISSORS
    if (session.game_key === 'rps' && move.rps) {
      const choices = ['rock', 'paper', 'scissors'];
      const userChoice = move.rps.toLowerCase();
      const oppChoice = choices[Math.floor(Math.random() * choices.length)];

      let roundWinner = 'draw';
      if (
        (userChoice === 'rock' && oppChoice === 'scissors') ||
        (userChoice === 'paper' && oppChoice === 'rock') ||
        (userChoice === 'scissors' && oppChoice === 'paper')
      ) {
        roundWinner = 'user';
      } else if (userChoice !== oppChoice) {
        roundWinner = 'opponent';
      }

      const prevRounds = session.state.rounds || [];
      const newRound = { user: userChoice, opp: oppChoice, winner: roundWinner };
      const allRounds = [...prevRounds, newRound];

      const userScore = allRounds.filter(r => r.winner === 'user').length;
      const oppScore = allRounds.filter(r => r.winner === 'opponent').length;

      if (userScore >= 2) {
        winnerId = decoded.id;
        status = 'completed';
      } else if (oppScore >= 2) {
        winnerId = session.state.playerOpp;
        status = 'completed';
      } else if (allRounds.length >= 5) {
        winnerId = userScore > oppScore ? decoded.id : userScore < oppScore ? session.state.playerOpp : null;
        status = 'completed';
      }

      updatedState = {
        ...session.state,
        rounds: allRounds,
        userScore,
        oppScore,
      };
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
