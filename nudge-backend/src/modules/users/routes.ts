import { FastifyPluginAsync } from 'fastify';
import { query } from '../../db/index.js';

export const userRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('onRequest', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.status(401).send({ error: { code: 'UNAUTHENTICATED', message: 'Unauthorized' } });
    }
  });

  // Search users
  fastify.get('/search', async (request) => {
    const { q } = request.query as { q?: string };
    const decoded = request.user as { id: string };

    if (!q || q.trim().length === 0) {
      return { users: [] };
    }

    const searchTerm = `%${q.trim()}%`;
    const res = await query(
      `SELECT u.id, u.username, u.display_name as "displayName", u.bio,
              u.avatar_url as "avatarUrl", u.avatar_kind as "avatarKind",
              s.down_for as "downFor", s.text as "statusText"
       FROM users u
       LEFT JOIN user_status s ON u.id = s.user_id
       WHERE (u.username ILIKE $1 OR u.display_name ILIKE $1) AND u.id != $2
       LIMIT 20`,
      [searchTerm, decoded.id]
    );

    return { users: res.rows };
  });

  // Get user by username
  fastify.get('/:username', async (request, reply) => {
    const { username } = request.params as { username: string };

    const res = await query(
      `SELECT u.id, u.username, u.display_name as "displayName", u.bio,
              u.avatar_url as "avatarUrl", u.avatar_kind as "avatarKind",
              u.created_at as "createdAt",
              s.down_for as "downFor", s.text as "statusText"
       FROM users u
       LEFT JOIN user_status s ON u.id = s.user_id
       WHERE u.username = $1`,
      [username.toLowerCase()]
    );

    if (res.rowCount === 0) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'User not found' } });
    }

    return { user: res.rows[0] };
  });

  // Update profile
  fastify.patch('/me', async (request) => {
    const decoded = request.user as { id: string };
    const { displayName, bio, avatarUrl } = request.body as any;

    const res = await query(
      `UPDATE users
       SET display_name = COALESCE($1, display_name),
           bio = COALESCE($2, bio),
           avatar_url = COALESCE($3, avatar_url),
           updated_at = NOW()
       WHERE id = $4
       RETURNING id, username, display_name as "displayName", bio, avatar_url as "avatarUrl", avatar_kind as "avatarKind"`,
      [displayName, bio, avatarUrl, decoded.id]
    );

    return { user: res.rows[0] };
  });

  // Update "Down for" status
  fastify.put('/me/status', async (request) => {
    const decoded = request.user as { id: string };
    const { downFor, text } = request.body as any;

    const res = await query(
      `INSERT INTO user_status (user_id, down_for, text, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (user_id) DO UPDATE
       SET down_for = EXCLUDED.down_for,
           text = EXCLUDED.text,
           updated_at = NOW()
       RETURNING down_for as "downFor", text`,
      [decoded.id, downFor || 'talk', text || '']
    );

    return { status: res.rows[0] };
  });

  // Get and update settings
  fastify.get('/me/settings', async (request) => {
    const decoded = request.user as { id: string };
    const res = await query(
      'SELECT * FROM user_settings WHERE user_id = $1',
      [decoded.id]
    );
    return { settings: res.rows[0] || {} };
  });

  fastify.patch('/me/settings', async (request) => {
    const decoded = request.user as { id: string };
    const { readReceipts, typingIndicators, lastSeenVisibility, onlineVisibility } = request.body as any;

    const res = await query(
      `UPDATE user_settings
       SET read_receipts = COALESCE($1, read_receipts),
           typing_indicators = COALESCE($2, typing_indicators),
           last_seen_visibility = COALESCE($3, last_seen_visibility),
           online_visibility = COALESCE($4, online_visibility),
           updated_at = NOW()
       WHERE user_id = $5
       RETURNING *`,
      [readReceipts, typingIndicators, lastSeenVisibility, onlineVisibility, decoded.id]
    );

    return { settings: res.rows[0] };
  });
};
