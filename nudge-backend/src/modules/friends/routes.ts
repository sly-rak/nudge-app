import { FastifyPluginAsync } from 'fastify';
import { query } from '../../db/index.js';

export const friendRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('onRequest', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.status(401).send({ error: { code: 'UNAUTHENTICATED', message: 'Unauthorized' } });
    }
  });

  // Get friends list
  fastify.get('/', async (request) => {
    const decoded = request.user as { id: string };

    const res = await query(
      `SELECT u.id, u.username, u.display_name as "displayName", u.bio,
              u.avatar_url as "avatarUrl", u.avatar_kind as "avatarKind",
              s.down_for as "downFor", s.text as "statusText"
       FROM friendships f
       JOIN users u ON (CASE WHEN f.user_a = $1 THEN f.user_b ELSE f.user_a END) = u.id
       LEFT JOIN user_status s ON u.id = s.user_id
       WHERE (f.user_a = $1 OR f.user_b = $1) AND f.status = 'accepted'`,
      [decoded.id]
    );

    return { friends: res.rows };
  });

  // Send friend request
  fastify.post('/requests', async (request, reply) => {
    const decoded = request.user as { id: string };
    const { targetUserId } = request.body as any;

    if (!targetUserId || targetUserId === decoded.id) {
      return reply.status(400).send({ error: { code: 'VALIDATION_FAILED', message: 'Invalid target user' } });
    }

    const [userA, userB] = decoded.id < targetUserId ? [decoded.id, targetUserId] : [targetUserId, decoded.id];

    await query(
      `INSERT INTO friendships (user_a, user_b, requester_id, status)
       VALUES ($1, $2, $3, 'pending')
       ON CONFLICT (user_a, user_b) DO UPDATE
       SET status = CASE WHEN friendships.status = 'pending' THEN 'accepted' ELSE friendships.status END,
           responded_at = NOW()`,
      [userA, userB, decoded.id]
    );

    return { success: true };
  });

  // Accept friend request
  fastify.post('/requests/:userId/accept', async (request) => {
    const decoded = request.user as { id: string };
    const { userId } = request.params as { userId: string };

    const [userA, userB] = decoded.id < userId ? [decoded.id, userId] : [userId, decoded.id];

    await query(
      `UPDATE friendships
       SET status = 'accepted', responded_at = NOW()
       WHERE user_a = $1 AND user_b = $2`,
      [userA, userB]
    );

    return { success: true };
  });
};
