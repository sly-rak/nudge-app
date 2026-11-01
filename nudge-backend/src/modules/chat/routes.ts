import { FastifyPluginAsync } from 'fastify';
import { query } from '../../db/index.js';
import { realtimeGateway } from '../../realtime/gateway.js';
import { botService } from '../bot/service.js';

export const chatRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('onRequest', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.status(401).send({ error: { code: 'UNAUTHENTICATED', message: 'Unauthorized' } });
    }
  });

  // List conversations
  fastify.get('/', async (request) => {
    const decoded = request.user as { id: string };

    const convsRes = await query(
      `SELECT c.id, c.type, c.title, c.avatar_url as "avatarUrl", c.last_seq as "lastSeq",
              c.last_message_at as "lastMessageAt", c.created_at as "createdAt",
              c.ends_at as "endsAt", c.archived_at as "archivedAt",
              (cm.pinned_at IS NOT NULL) as "isPinned",
              (cm.archived_at IS NOT NULL OR c.archived_at IS NOT NULL) as "isArchived",
              cm.disappearing_seconds as "disappearingSeconds",
              cm.last_read_seq as "lastReadSeq"
       FROM conversations c
       JOIN conversation_members cm ON c.id = cm.conversation_id
       WHERE cm.user_id = $1
       ORDER BY (cm.pinned_at IS NOT NULL) DESC, c.last_message_at DESC`,
      [decoded.id]
    );

    const conversations = [];

    for (const conv of convsRes.rows) {
      // Get members
      const membersRes = await query(
        `SELECT cm.user_id as "userId", cm.role,
                u.username, u.display_name as "displayName", u.avatar_url as "avatarUrl",
                u.avatar_kind as "avatarKind", u.is_bot as "isBot", s.down_for as "downFor", s.text as "statusText"
         FROM conversation_members cm
         JOIN users u ON cm.user_id = u.id
         LEFT JOIN user_status s ON u.id = s.user_id
         WHERE cm.conversation_id = $1`,
        [conv.id]
      );

      // Get rooms for this conversation
      const roomsRes = await query(
        `SELECT id, conversation_id as "conversationId", name, emoji, admin_only as "adminOnly",
                archived, created_at as "createdAt"
         FROM rooms
         WHERE conversation_id = $1
         ORDER BY created_at ASC`,
        [conv.id]
      );

      // Get last message
      const lastMsgRes = await query(
        `SELECT m.id, m.seq, m.sender_id as "senderId", m.type, m.body, m.media_url as "mediaUrl",
                m.room_id as "roomId", m.created_at as "createdAt", u.display_name as "senderName"
         FROM messages m
         JOIN users u ON m.sender_id = u.id
         WHERE m.conversation_id = $1
         ORDER BY m.seq DESC LIMIT 1`,
        [conv.id]
      );

      // If direct conversation, adjust title and avatar to other user
      if (conv.type === 'direct') {
        const otherMember = membersRes.rows.find((m) => m.userId !== decoded.id);
        if (otherMember) {
          conv.title = otherMember.displayName;
          conv.avatarUrl = otherMember.avatarUrl;
          conv.otherUser = otherMember;
        }
      }

      const unreadCount = Math.max(0, conv.lastSeq - (conv.lastReadSeq || 0));

      conversations.push({
        ...conv,
        members: membersRes.rows,
        rooms: roomsRes.rows,
        lastMessage: lastMsgRes.rows[0] || null,
        unreadCount,
      });
    }

    return { conversations };
  });

  // Create conversation (Direct or Group)
  fastify.post('/', async (request, reply) => {
    const decoded = request.user as { id: string };
    const {
      type = 'direct',
      targetUserId,
      title,
      memberIds = [],
      endsAt,
      rooms = [],
    } = request.body as any;

    if (type === 'direct') {
      if (!targetUserId || targetUserId === decoded.id) {
        return reply.status(400).send({ error: { code: 'VALIDATION_FAILED', message: 'Invalid target user' } });
      }

      const [minId, maxId] = decoded.id < targetUserId ? [decoded.id, targetUserId] : [targetUserId, decoded.id];
      const directKey = `direct:${minId}:${maxId}`;

      // Check if conversation already exists
      const existing = await query('SELECT id FROM conversations WHERE direct_key = $1', [directKey]);
      if (existing.rowCount && existing.rowCount > 0) {
        return { conversationId: existing.rows[0].id };
      }

      const convRes = await query(
        `INSERT INTO conversations (type, direct_key)
         VALUES ('direct', $1)
         RETURNING id`,
        [directKey]
      );
      const convId = convRes.rows[0].id;

      // Add both members
      await query(
        `INSERT INTO conversation_members (conversation_id, user_id, role)
         VALUES ($1, $2, 'member'), ($1, $3, 'member')`,
        [convId, decoded.id, targetUserId]
      );

      return { conversationId: convId };
    } else {
      // Group
      const groupTitle = title || 'New Group';
      const convRes = await query(
        `INSERT INTO conversations (type, title, ends_at)
         VALUES ('group', $1, $2)
         RETURNING id`,
        [groupTitle, endsAt ? new Date(endsAt) : null]
      );
      const convId = convRes.rows[0].id;

      // Add creator as owner
      await query(
        `INSERT INTO conversation_members (conversation_id, user_id, role)
         VALUES ($1, $2, 'owner')`,
        [convId, decoded.id]
      );

      // Create rooms
      const defaultRooms = rooms.length > 0
        ? rooms
        : [
            { name: 'General', emoji: '💬' },
            { name: 'School', emoji: '📚' },
            { name: 'Events', emoji: '🎉' },
          ];

      for (const r of defaultRooms) {
        await query(
          `INSERT INTO rooms (conversation_id, name, emoji, admin_only)
           VALUES ($1, $2, $3, $4)`,
          [convId, r.name, r.emoji || '💬', !!r.adminOnly]
        );
      }

      // Add other members
      const allMembers = Array.from(new Set(memberIds.filter((id: string) => id !== decoded.id)));
      for (const mId of allMembers) {
        await query(
          `INSERT INTO conversation_members (conversation_id, user_id, role)
           VALUES ($1, $2, 'member') ON CONFLICT DO NOTHING`,
          [convId, mId]
        );

        // Check if member is a bot -> trigger group invite acceptance greeting
        const botCheck = await query('SELECT id FROM users WHERE id = $1 AND is_bot = true', [mId]);
        if (botCheck.rowCount && botCheck.rowCount > 0) {
          botService.handleGroupInvite(convId, mId as string);
        }
      }

      return { conversationId: convId };
    }
  });

  // Get conversation messages (with optional roomId filtering)
  fastify.get('/:id/messages', async (request, reply) => {
    const decoded = request.user as { id: string };
    const { id } = request.params as { id: string };
    const { roomId } = request.query as { roomId?: string };

    // Verify member
    const memCheck = await query(
      'SELECT 1 FROM conversation_members WHERE conversation_id = $1 AND user_id = $2',
      [id, decoded.id]
    );
    if (memCheck.rowCount === 0) {
      return reply.status(403).send({ error: { code: 'FORBIDDEN', message: 'Not a member' } });
    }

    let messagesRes;
    if (roomId) {
      messagesRes = await query(
        `SELECT m.id, m.conversation_id as "conversationId", m.room_id as "roomId",
                m.seq, m.sender_id as "senderId", m.client_msg_id as "clientMsgId",
                m.type, m.body, m.media_url as "mediaUrl",
                m.reply_to_id as "replyToId", m.edited_at as "editedAt", m.deleted_at as "deletedAt",
                m.created_at as "createdAt",
                u.username, u.display_name as "senderDisplayName", u.avatar_url as "senderAvatarUrl",
                u.avatar_kind as "senderAvatarKind"
         FROM messages m
         JOIN users u ON m.sender_id = u.id
         WHERE m.conversation_id = $1 AND m.room_id = $2 AND m.deleted_at IS NULL
         ORDER BY m.seq ASC
         LIMIT 100`,
        [id, roomId]
      );
    } else {
      messagesRes = await query(
        `SELECT m.id, m.conversation_id as "conversationId", m.room_id as "roomId",
                m.seq, m.sender_id as "senderId", m.client_msg_id as "clientMsgId",
                m.type, m.body, m.media_url as "mediaUrl",
                m.reply_to_id as "replyToId", m.edited_at as "editedAt", m.deleted_at as "deletedAt",
                m.created_at as "createdAt",
                u.username, u.display_name as "senderDisplayName", u.avatar_url as "senderAvatarUrl",
                u.avatar_kind as "senderAvatarKind"
         FROM messages m
         JOIN users u ON m.sender_id = u.id
         WHERE m.conversation_id = $1 AND m.deleted_at IS NULL
         ORDER BY m.seq ASC
         LIMIT 100`,
        [id]
      );
    }

    // Fetch reactions for these messages
    const messageIds = messagesRes.rows.map((m) => m.id);
    let reactionsMap: Record<string, any[]> = {};

    if (messageIds.length > 0) {
      const rxRes = await query(
        `SELECT mr.message_id, mr.user_id, mr.emoji, u.display_name as "userName"
         FROM message_reactions mr
         JOIN users u ON mr.user_id = u.id
         WHERE mr.message_id = ANY($1)`,
        [messageIds]
      );
      for (const rx of rxRes.rows) {
        if (!reactionsMap[rx.message_id]) reactionsMap[rx.message_id] = [];
        reactionsMap[rx.message_id].push({
          userId: rx.user_id,
          emoji: rx.emoji,
          userName: rx.userName,
        });
      }
    }

    const messages = messagesRes.rows.map((m) => ({
      ...m,
      sender: {
        id: m.senderId,
        username: m.username,
        displayName: m.senderDisplayName,
        avatarUrl: m.senderAvatarUrl,
        avatarKind: m.senderAvatarKind,
      },
      reactions: reactionsMap[m.id] || [],
    }));

    return { messages };
  });

  // Send message
  fastify.post('/:id/messages', async (request, reply) => {
    const decoded = request.user as { id: string };
    const { id } = request.params as { id: string };
    const { body, type = 'text', mediaUrl, replyToId, clientMsgId, roomId } = request.body as any;

    const memCheck = await query(
      'SELECT 1 FROM conversation_members WHERE conversation_id = $1 AND user_id = $2',
      [id, decoded.id]
    );
    if (memCheck.rowCount === 0) {
      return reply.status(403).send({ error: { code: 'FORBIDDEN', message: 'Not a member' } });
    }

    const convResult = await query(
      'UPDATE conversations SET last_seq = last_seq + 1, last_message_at = NOW() WHERE id = $1 RETURNING last_seq',
      [id]
    );
    const nextSeq = convResult.rows[0].last_seq;

    const msgResult = await query(
      `INSERT INTO messages (conversation_id, room_id, seq, sender_id, client_msg_id, type, body, media_url, reply_to_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [id, roomId || null, nextSeq, decoded.id, clientMsgId || null, type, body || '', mediaUrl || null, replyToId || null]
    );

    const userResult = await query(
      'SELECT id, username, display_name as "displayName", avatar_url as "avatarUrl", avatar_kind as "avatarKind" FROM users WHERE id = $1',
      [decoded.id]
    );

    const newMsg = {
      ...msgResult.rows[0],
      sender: userResult.rows[0],
      reactions: [],
    };

    // Broadcast in real-time
    await realtimeGateway.broadcastToConversation(id, {
      t: 'message.new',
      d: {
        conversationId: id,
        roomId,
        message: newMsg,
      },
    });

    // Trigger Bot auto-responder & learning engine
    botService.handleMessage(id, newMsg, decoded.id, roomId);

    return { message: newMsg };
  });

  // Add room to group conversation
  fastify.post('/:id/rooms', async (request, reply) => {
    const decoded = request.user as { id: string };
    const { id } = request.params as { id: string };
    const { name, emoji = '💬', adminOnly = false } = request.body as any;

    // Verify user is owner or admin
    const memberRes = await query(
      'SELECT role FROM conversation_members WHERE conversation_id = $1 AND user_id = $2',
      [id, decoded.id]
    );
    if (memberRes.rowCount === 0 || !['owner', 'admin'].includes(memberRes.rows[0].role)) {
      return reply.status(403).send({ error: { code: 'FORBIDDEN', message: 'Only admins can add rooms' } });
    }

    const res = await query(
      `INSERT INTO rooms (conversation_id, name, emoji, admin_only)
       VALUES ($1, $2, $3, $4)
       RETURNING id, conversation_id as "conversationId", name, emoji, admin_only as "adminOnly", archived, created_at as "createdAt"`,
      [id, name, emoji, adminOnly]
    );

    return { room: res.rows[0] };
  });

  // Update/Archive room
  fastify.patch('/:id/rooms/:roomId', async (request, reply) => {
    const decoded = request.user as { id: string };
    const { id, roomId } = request.params as { id: string; roomId: string };
    const { name, emoji, archived, adminOnly } = request.body as any;

    const memberRes = await query(
      'SELECT role FROM conversation_members WHERE conversation_id = $1 AND user_id = $2',
      [id, decoded.id]
    );
    if (memberRes.rowCount === 0 || !['owner', 'admin'].includes(memberRes.rows[0].role)) {
      return reply.status(403).send({ error: { code: 'FORBIDDEN', message: 'Only admins can update rooms' } });
    }

    const res = await query(
      `UPDATE rooms
       SET name = COALESCE($3, name),
           emoji = COALESCE($4, emoji),
           archived = COALESCE($5, archived),
           admin_only = COALESCE($6, admin_only)
       WHERE id = $1 AND conversation_id = $2
       RETURNING id, conversation_id as "conversationId", name, emoji, admin_only as "adminOnly", archived`,
      [roomId, id, name || null, emoji || null, archived !== undefined ? archived : null, adminOnly !== undefined ? adminOnly : null]
    );

    return { room: res.rows[0] };
  });

  // Update group expiration (endsAt)
  fastify.patch('/:id/expiration', async (request, reply) => {
    const decoded = request.user as { id: string };
    const { id } = request.params as { id: string };
    const { endsAt } = request.body as any;

    const memberRes = await query(
      'SELECT role FROM conversation_members WHERE conversation_id = $1 AND user_id = $2',
      [id, decoded.id]
    );
    if (memberRes.rowCount === 0 || !['owner', 'admin'].includes(memberRes.rows[0].role)) {
      return reply.status(403).send({ error: { code: 'FORBIDDEN', message: 'Only admins can change expiration' } });
    }

    const res = await query(
      `UPDATE conversations
       SET ends_at = $2, archived_at = NULL
       WHERE id = $1
       RETURNING id, ends_at as "endsAt", archived_at as "archivedAt"`,
      [id, endsAt ? new Date(endsAt) : null]
    );

    return { conversation: res.rows[0] };
  });

  // Archive / Reopen conversation
  fastify.post('/:id/archive', async (request) => {
    const { id } = request.params as { id: string };
    await query('UPDATE conversations SET archived_at = NOW() WHERE id = $1', [id]);
    return { success: true };
  });

  fastify.post('/:id/reopen', async (request) => {
    const { id } = request.params as { id: string };
    await query('UPDATE conversations SET archived_at = NULL WHERE id = $1', [id]);
    return { success: true };
  });

  // Invite member
  fastify.post('/:id/members', async (request, reply) => {
    const decoded = request.user as { id: string };
    const { id } = request.params as { id: string };
    const { userId, role = 'member' } = request.body as any;

    const memberRes = await query(
      'SELECT role FROM conversation_members WHERE conversation_id = $1 AND user_id = $2',
      [id, decoded.id]
    );
    if (memberRes.rowCount === 0) {
      return reply.status(403).send({ error: { code: 'FORBIDDEN', message: 'Not a member' } });
    }

    await query(
      `INSERT INTO conversation_members (conversation_id, user_id, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (conversation_id, user_id) DO NOTHING`,
      [id, userId, role]
    );

    // If bot, trigger entrance greeting
    const botCheck = await query('SELECT id FROM users WHERE id = $1 AND is_bot = true', [userId]);
    if (botCheck.rowCount && botCheck.rowCount > 0) {
      botService.handleGroupInvite(id, userId);
    }

    return { success: true };
  });

  // Add reaction
  fastify.put('/messages/:messageId/reaction', async (request) => {
    const decoded = request.user as { id: string };
    const { messageId } = request.params as { messageId: string };
    const { emoji } = request.body as any;

    await query(
      `INSERT INTO message_reactions (message_id, user_id, emoji)
       VALUES ($1, $2, $3)
       ON CONFLICT (message_id, user_id) DO UPDATE SET emoji = EXCLUDED.emoji`,
      [messageId, decoded.id, emoji]
    );

    const msgRes = await query('SELECT conversation_id FROM messages WHERE id = $1', [messageId]);
    if (msgRes.rowCount && msgRes.rowCount > 0) {
      const convId = msgRes.rows[0].conversation_id;
      await realtimeGateway.broadcastToConversation(convId, {
        t: 'message.updated',
        d: { conversationId: convId, message: { id: messageId } as any },
      });
    }

    return { success: true };
  });

  // Mark read
  fastify.post('/:id/read', async (request) => {
    const decoded = request.user as { id: string };
    const { id } = request.params as { id: string };

    const convRes = await query('SELECT last_seq FROM conversations WHERE id = $1', [id]);
    const lastSeq = convRes.rows[0]?.last_seq || 0;

    await query(
      'UPDATE conversation_members SET last_read_seq = $1 WHERE conversation_id = $2 AND user_id = $3',
      [lastSeq, id, decoded.id]
    );

    await realtimeGateway.broadcastToConversation(id, {
      t: 'message.status',
      d: {
        conversationId: id,
        lastDeliveredSeq: lastSeq,
        lastReadSeq: lastSeq,
      },
    });

    return { success: true };
  });
};
