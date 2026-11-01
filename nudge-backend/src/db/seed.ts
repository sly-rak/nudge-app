import bcrypt from 'bcryptjs';
import { query, pool } from './index.js';

async function seed() {
  console.log('[Seed] Seeding database...');

  try {
    const passwordHash = await bcrypt.hash('password123', 10);

    const demoUsers = [
      {
        email: 'dayo@nudge.app',
        username: 'dayo',
        displayName: 'Dayo Ade',
        bio: 'Building Nudge for the world 🌍',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        avatarKind: 'image',
        downFor: 'play',
        statusText: 'Down for Ludo or TicTacToe!',
      },
      {
        email: 'amara@nudge.app',
        username: 'amara',
        displayName: 'Amara Okafor',
        bio: 'Design, photography & specialty coffee ☕',
        avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
        avatarKind: 'image',
        downFor: 'talk',
        statusText: 'Catching up on designs',
      },
      {
        email: 'tobi@nudge.app',
        username: 'tobi',
        displayName: 'Tobi Balogun',
        bio: 'Full-stack builder & music lover 🎧',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        avatarKind: 'image',
        downFor: 'hang',
        statusText: 'Anyone around Victoria Island?',
      },
      {
        email: 'claude@nudge.app',
        username: 'claude',
        displayName: 'Claude Lead',
        bio: 'AI Technical Lead & Pair Programmer 🤖',
        avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
        avatarKind: 'image',
        downFor: 'heads_down',
        statusText: 'Shipping Nudge v1.0',
      },
    ];

    const userMap = new Map<string, string>();

    for (const u of demoUsers) {
      const userRes = await query(
        `INSERT INTO users (email, username, display_name, bio, avatar_url, avatar_kind)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (email) DO UPDATE
         SET display_name = EXCLUDED.display_name,
             avatar_url = EXCLUDED.avatar_url,
             bio = EXCLUDED.bio
         RETURNING id`,
        [u.email, u.username, u.displayName, u.bio, u.avatarUrl, u.avatarKind]
      );
      const userId = userRes.rows[0].id;
      userMap.set(u.username, userId);

      await query(
        `INSERT INTO auth_identities (user_id, provider, subject, password_hash)
         VALUES ($1, 'password', $2, $3)
         ON CONFLICT (provider, subject) DO UPDATE
         SET password_hash = EXCLUDED.password_hash`,
        [userId, u.email, passwordHash]
      );

      await query(
        `INSERT INTO user_status (user_id, down_for, text)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id) DO UPDATE
         SET down_for = EXCLUDED.down_for, text = EXCLUDED.text`,
        [userId, u.downFor, u.statusText]
      );

      await query(
        `INSERT INTO user_settings (user_id)
         VALUES ($1)
         ON CONFLICT (user_id) DO NOTHING`,
        [userId]
      );
    }

    const dayoId = userMap.get('dayo')!;
    const amaraId = userMap.get('amara')!;
    const tobiId = userMap.get('tobi')!;
    const claudeId = userMap.get('claude')!;

    // Friendships
    const friendPairs = [
      [dayoId, amaraId],
      [dayoId, tobiId],
      [dayoId, claudeId],
      [amaraId, tobiId],
    ];

    for (const [u1, u2] of friendPairs) {
      const [userA, userB] = u1 < u2 ? [u1, u2] : [u2, u1];
      await query(
        `INSERT INTO friendships (user_a, user_b, requester_id, status, responded_at)
         VALUES ($1, $2, $1, 'accepted', NOW())
         ON CONFLICT (user_a, user_b) DO UPDATE
         SET status = 'accepted'`,
        [userA, userB]
      );
    }

    // Direct Conversation between Dayo & Amara
    const [dMin, dMax] = dayoId < amaraId ? [dayoId, amaraId] : [amaraId, dayoId];
    const directKey1 = `direct:${dMin}:${dMax}`;

    const conv1 = await query(
      `INSERT INTO conversations (type, direct_key, last_seq, last_message_at)
       VALUES ('direct', $1, 3, NOW())
       ON CONFLICT (direct_key) DO UPDATE
       SET last_message_at = NOW()
       RETURNING id`,
      [directKey1]
    );
    const conv1Id = conv1.rows[0].id;

    await query(
      `INSERT INTO conversation_members (conversation_id, user_id, role, last_read_seq)
       VALUES ($1, $2, 'member', 3), ($1, $3, 'member', 3)
       ON CONFLICT (conversation_id, user_id) DO NOTHING`,
      [conv1Id, dayoId, amaraId]
    );

    // Messages in conv 1
    const m1 = await query(
      `INSERT INTO messages (conversation_id, seq, sender_id, body, created_at)
       VALUES ($1, 1, $2, 'Hey Amara! How are the new designs coming along?', NOW() - INTERVAL '30 minutes')
       ON CONFLICT (conversation_id, seq) DO NOTHING
       RETURNING id`,
      [conv1Id, dayoId]
    );
    const m2 = await query(
      `INSERT INTO messages (conversation_id, seq, sender_id, body, created_at)
       VALUES ($1, 2, $2, 'Looking so slick! The Geist font and green accents give Nudge such a premium feel.', NOW() - INTERVAL '25 minutes')
       ON CONFLICT (conversation_id, seq) DO NOTHING
       RETURNING id`,
      [conv1Id, amaraId]
    );
    const m3 = await query(
      `INSERT INTO messages (conversation_id, seq, sender_id, body, created_at)
       VALUES ($1, 3, $2, 'Awesome. Ready for a quick Tic-Tac-Toe match while we review?', NOW() - INTERVAL '10 minutes')
       ON CONFLICT (conversation_id, seq) DO NOTHING
       RETURNING id`,
      [conv1Id, dayoId]
    );

    if (m2.rows[0]) {
      await query(
        `INSERT INTO message_reactions (message_id, user_id, emoji)
         VALUES ($1, $2, '🔥')
         ON CONFLICT (message_id, user_id) DO NOTHING`,
        [m2.rows[0].id, dayoId]
      );
    }

    // Direct Conversation between Dayo & Claude
    const [cMin, cMax] = dayoId < claudeId ? [dayoId, claudeId] : [claudeId, dayoId];
    const directKey2 = `direct:${cMin}:${cMax}`;

    const conv2 = await query(
      `INSERT INTO conversations (type, direct_key, last_seq, last_message_at)
       VALUES ('direct', $1, 2, NOW())
       ON CONFLICT (direct_key) DO UPDATE
       SET last_message_at = NOW()
       RETURNING id`,
      [directKey2]
    );
    const conv2Id = conv2.rows[0].id;

    await query(
      `INSERT INTO conversation_members (conversation_id, user_id, role, last_read_seq)
       VALUES ($1, $2, 'member', 2), ($1, $3, 'member', 2)
       ON CONFLICT (conversation_id, user_id) DO NOTHING`,
      [conv2Id, dayoId, claudeId]
    );

    await query(
      `INSERT INTO messages (conversation_id, seq, sender_id, body, created_at)
       VALUES ($1, 1, $2, 'Claude, backend and frontend separation is looking great with Neon Postgres!', NOW() - INTERVAL '15 minutes')
       ON CONFLICT (conversation_id, seq) DO NOTHING`,
      [conv2Id, dayoId]
    );

    await query(
      `INSERT INTO messages (conversation_id, seq, sender_id, body, created_at)
       VALUES ($1, 2, $2, 'Architecture is fully aligned: shared contracts, Fastify modular server, and real-time WebSockets.', NOW() - INTERVAL '5 minutes')
       ON CONFLICT (conversation_id, seq) DO NOTHING`,
      [conv2Id, claudeId]
    );

    // Group conversation "Nudge Founders & Friends"
    const groupConv = await query(
      `INSERT INTO conversations (type, title, last_seq, last_message_at)
       VALUES ('group', 'Nudge Founders ⚡', 2, NOW())
       RETURNING id`
    );
    const groupConvId = groupConv.rows[0].id;

    await query(
      `INSERT INTO conversation_members (conversation_id, user_id, role, last_read_seq)
       VALUES ($1, $2, 'owner', 2), ($1, $3, 'admin', 2), ($1, $4, 'member', 2), ($1, $5, 'member', 2)
       ON CONFLICT (conversation_id, user_id) DO NOTHING`,
      [groupConvId, dayoId, amaraId, tobiId, claudeId]
    );

    await query(
      `INSERT INTO messages (conversation_id, seq, sender_id, body, created_at)
       VALUES ($1, 1, $2, 'Welcome to the Nudge founders group! 🎉', NOW() - INTERVAL '1 hour')
       ON CONFLICT (conversation_id, seq) DO NOTHING`,
      [groupConvId, dayoId]
    );

    await query(
      `INSERT INTO messages (conversation_id, seq, sender_id, body, created_at)
       VALUES ($1, 2, $2, 'Lagos launch wave is going to be epic. Let us test out the games hub!', NOW() - INTERVAL '40 minutes')
       ON CONFLICT (conversation_id, seq) DO NOTHING`,
      [groupConvId, tobiId]
    );

    // Sample Stories
    await query(
      `INSERT INTO stories (author_id, type, text, background, audience)
       VALUES ($1, 'text', 'Building something special with the crew today! ✨', 'linear-gradient(135deg, #0F6B58, #18C8FF)', 'friends'),
              ($2, 'text', 'Sunday design sprints hit different ☕🎨', 'linear-gradient(135deg, #FF3D7F, #7A5CFF)', 'friends')
       ON CONFLICT DO NOTHING`,
      [dayoId, amaraId]
    );

    // Sample Tic-Tac-Toe Game Session
    await query(
      `INSERT INTO game_sessions (game_key, conversation_id, state, created_by, status)
       VALUES ('tictactoe', $1, $2, $3, 'in_progress')
       ON CONFLICT DO NOTHING`,
      [
        conv1Id,
        JSON.stringify({
          board: ['X', null, 'O', null, 'X', null, null, null, null],
          turn: 'O',
          playerX: dayoId,
          playerO: amaraId,
        }),
        dayoId,
      ]
    );

    console.log('[Seed] Database successfully seeded with demo accounts, chats, stories, and games!');
  } catch (err) {
    console.error('[Seed] Error during seeding:', err);
  } finally {
    await pool.end();
  }
}

seed();
