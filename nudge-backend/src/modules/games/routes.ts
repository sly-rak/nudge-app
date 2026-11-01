import { FastifyPluginAsync } from 'fastify';
import { query } from '../../db/index.js';

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
          key: 'wordguess',
          name: 'Word Guess',
          description: 'Guess the secret 5-letter word in 6 tries',
          icon: 'SpellCheck',
          players: 2,
        },
        {
          key: 'connect4',
          name: 'Four in a Row',
          description: 'Drop discs and connect 4 before your friend',
          icon: 'Disc',
          players: 2,
        },
      ],
    };
  });

  // Create game session
  fastify.post('/sessions', async (request) => {
    const decoded = request.user as { id: string };
    const { gameKey, conversationId } = request.body as any;

    let initialState: Record<string, any> = {};
    if (gameKey === 'tictactoe') {
      initialState = {
        board: Array(9).fill(null),
        turn: 'X',
        playerX: decoded.id,
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
       RETURNING id, game_key as "gameKey", conversation_id as "conversationId", state, status, created_by as "createdBy", created_at as "createdAt"`,
      [gameKey || 'tictactoe', conversationId || null, JSON.stringify(initialState), decoded.id]
    );

    return { session: res.rows[0] };
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
};
