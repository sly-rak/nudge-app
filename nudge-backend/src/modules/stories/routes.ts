import { FastifyPluginAsync } from 'fastify';
import { query } from '../../db/index.js';

export const storyRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('onRequest', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.status(401).send({ error: { code: 'UNAUTHENTICATED', message: 'Unauthorized' } });
    }
  });

  // Get active stories feed
  fastify.get('/feed', async (request) => {
    const decoded = request.user as { id: string };

    const storiesRes = await query(
      `SELECT s.id, s.author_id as "authorId", s.type, s.media_url as "mediaUrl",
              s.text, s.background, s.audience, s.expires_at as "expiresAt", s.created_at as "createdAt",
              u.username, u.display_name as "authorName", u.avatar_url as "authorAvatarUrl",
              u.avatar_kind as "authorAvatarKind",
              (EXISTS (SELECT 1 FROM story_views sv WHERE sv.story_id = s.id AND sv.viewer_id = $1)) as "hasViewed"
       FROM stories s
       JOIN users u ON s.author_id = u.id
       WHERE s.expires_at > NOW()
       ORDER BY s.created_at DESC`,
      [decoded.id]
    );

    // Group stories by author
    const groupsMap = new Map<string, any>();
    for (const story of storiesRes.rows) {
      if (!groupsMap.has(story.authorId)) {
        groupsMap.set(story.authorId, {
          authorId: story.authorId,
          username: story.username,
          displayName: story.authorName,
          avatarUrl: story.authorAvatarUrl,
          avatarKind: story.authorAvatarKind,
          allViewed: true,
          stories: [],
        });
      }
      const group = groupsMap.get(story.authorId);
      if (!story.hasViewed) {
        group.allViewed = false;
      }
      group.stories.push(story);
    }

    return { feeds: Array.from(groupsMap.values()) };
  });

  // Create story
  fastify.post('/', async (request) => {
    const decoded = request.user as { id: string };
    const { type = 'text', text = '', mediaUrl, background = '#0F6B58', audience = 'friends' } = request.body as any;

    const res = await query(
      `INSERT INTO stories (author_id, type, media_url, text, background, audience)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, author_id as "authorId", type, media_url as "mediaUrl", text, background, audience, expires_at as "expiresAt", created_at as "createdAt"`,
      [decoded.id, type, mediaUrl || null, text, background, audience]
    );

    return { story: res.rows[0] };
  });

  // View story
  fastify.post('/:id/view', async (request) => {
    const decoded = request.user as { id: string };
    const { id } = request.params as { id: string };

    await query(
      `INSERT INTO story_views (story_id, viewer_id)
       VALUES ($1, $2)
       ON CONFLICT (story_id, viewer_id) DO NOTHING`,
      [id, decoded.id]
    );

    return { success: true };
  });
};
