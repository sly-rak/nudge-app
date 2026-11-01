import { FastifyPluginAsync } from 'fastify';
import { query } from '../../db/index.js';
import { realtimeGateway } from '../../realtime/gateway.js';

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
              s.text, s.background, s.audience, s.data,
              s.expires_at as "expiresAt", s.created_at as "createdAt",
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
    const {
      type = 'text',
      text = '',
      mediaUrl,
      background = '#0F6B58',
      audience = 'friends',
      data = null,
    } = request.body as any;

    const res = await query(
      `INSERT INTO stories (author_id, type, media_url, text, background, audience, data)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, author_id as "authorId", type, media_url as "mediaUrl", text, background,
                 audience, data, expires_at as "expiresAt", created_at as "createdAt"`,
      [decoded.id, type, mediaUrl || null, text, background, audience, data ? JSON.stringify(data) : null]
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

  // Vote on story poll
  fastify.post('/:id/poll-vote', async (request, reply) => {
    const decoded = request.user as { id: string };
    const { id } = request.params as { id: string };
    const { optionIndex } = request.body as { optionIndex: number };

    const storyRes = await query('SELECT id, data FROM stories WHERE id = $1', [id]);
    if (storyRes.rowCount === 0) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Story not found' } });
    }

    const story = storyRes.rows[0];
    const data = story.data || {};
    if (!data.poll || !data.poll.opts || !data.poll.opts[optionIndex]) {
      return reply.status(400).send({ error: { code: 'INVALID_POLL', message: 'Poll option not found' } });
    }

    // Check if user already voted in any option
    const alreadyVoted = data.poll.opts.some((opt: any) => opt.v.includes(decoded.id));
    if (!alreadyVoted) {
      data.poll.opts[optionIndex].v.push(decoded.id);

      await query(
        'UPDATE stories SET data = $2 WHERE id = $1',
        [id, JSON.stringify(data)]
      );
    }

    return { poll: data.poll };
  });

  // Answer story question
  fastify.post('/:id/qa-answer', async (request, reply) => {
    const decoded = request.user as { id: string };
    const { id } = request.params as { id: string };
    const { text } = request.body as { text: string };

    const storyRes = await query(
      `SELECT s.id, s.author_id as "authorId", s.data, u.display_name as "viewerName"
       FROM stories s
       CROSS JOIN users u
       WHERE s.id = $1 AND u.id = $2`,
      [id, decoded.id]
    );

    if (storyRes.rowCount === 0) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Story not found' } });
    }

    const story = storyRes.rows[0];
    const data = story.data || { qa: { q: 'Question', answers: [] } };
    if (!data.qa) data.qa = { q: 'Question', answers: [] };
    if (!data.qa.answers) data.qa.answers = [];

    data.qa.answers.push({
      by: story.viewerName || 'Friend',
      text,
      t: Date.now(),
    });

    await query('UPDATE stories SET data = $2 WHERE id = $1', [id, JSON.stringify(data)]);

    // Also send a direct message reply to the author
    try {
      const authorId = story.authorId;
      if (authorId !== decoded.id) {
        const [minId, maxId] = decoded.id < authorId ? [decoded.id, authorId] : [authorId, decoded.id];
        const directKey = `direct:${minId}:${maxId}`;

        let convRes = await query('SELECT id FROM conversations WHERE direct_key = $1', [directKey]);
        let convId = convRes.rows[0]?.id;

        if (!convId) {
          const newConv = await query(
            `INSERT INTO conversations (type, direct_key) VALUES ('direct', $1) RETURNING id`,
            [directKey]
          );
          convId = newConv.rows[0].id;
          await query(
            `INSERT INTO conversation_members (conversation_id, user_id, role)
             VALUES ($1, $2, 'member'), ($1, $3, 'member')`,
            [convId, decoded.id, authorId]
          );
        }

        const seqRes = await query(
          'UPDATE conversations SET last_seq = last_seq + 1, last_message_at = NOW() WHERE id = $1 RETURNING last_seq',
          [convId]
        );
        const nextSeq = seqRes.rows[0].last_seq;

        const answerMsg = `Replied to your question "${data.qa.q}":\n"${text}"`;
        await query(
          `INSERT INTO messages (conversation_id, seq, sender_id, type, body, created_at)
           VALUES ($1, $2, $3, 'text', $4, NOW())`,
          [convId, nextSeq, decoded.id, answerMsg]
        );
      }
    } catch (err) {
      console.error('[StoryRoutes] Error sending QA direct message:', err);
    }

    return { qa: data.qa };
  });

  // Story insights
  fastify.get('/:id/insights', async (request, reply) => {
    const { id } = request.params as { id: string };

    const viewsRes = await query(
      `SELECT sv.viewed_at as "viewedAt", u.id, u.username, u.display_name as "displayName", u.avatar_url as "avatarUrl"
       FROM story_views sv
       JOIN users u ON sv.viewer_id = u.id
       WHERE sv.story_id = $1
       ORDER BY sv.viewed_at DESC`,
      [id]
    );

    const storyRes = await query('SELECT data, type FROM stories WHERE id = $1', [id]);
    if (storyRes.rowCount === 0) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Story not found' } });
    }

    return {
      viewsCount: viewsRes.rowCount,
      viewers: viewsRes.rows,
      data: storyRes.rows[0].data,
    };
  });
};
