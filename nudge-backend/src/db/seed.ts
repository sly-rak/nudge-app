import bcrypt from 'bcryptjs';
import { query, pool } from './index.js';

async function seed() {
  console.log('[Seed] Seeding comprehensive Nudge database with bots, rooms, and demo chats...');

  try {
    const passwordHash = await bcrypt.hash('password123', 10);

    const usersToSeed = [
      {
        email: 'dayo@nudge.app',
        username: 'dayo',
        displayName: 'Dayo Ade',
        bio: 'Building things and learning every day. 🚀',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        avatarKind: 'image',
        downFor: 'play',
        statusText: 'Building Nudge v1.0!',
        isBot: false,
        persona: null,
      },
      {
        email: 'tola@nudge.app',
        username: 'tola',
        displayName: 'Tola',
        bio: 'FIFA champion (self-declared). Football, food, repeat.',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        avatarKind: 'image',
        downFor: 'play',
        statusText: 'Saturday rematch is ON ⚽',
        isBot: true,
        persona: { tone: 'playful', relationship: 'best friend', replyDelayMs: 1100, interests: ['fifa', 'football', 'jollof'] },
      },
      {
        email: 'mum@nudge.app',
        username: 'mum',
        displayName: 'Mum',
        bio: 'Mother of three. Always asking if you have eaten.',
        avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
        avatarKind: 'image',
        downFor: 'talk',
        statusText: 'Remember to drink water ❤️',
        isBot: true,
        persona: { tone: 'caring', relationship: 'mother', replyDelayMs: 1400, interests: ['family', 'prayer', 'health'] },
      },
      {
        email: 'chidi@nudge.app',
        username: 'chidi',
        displayName: 'Chidi',
        bio: 'Backend dev. Coffee first, deploy later.',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        avatarKind: 'image',
        downFor: 'heads_down',
        statusText: 'Shipping PR #42 💻',
        isBot: true,
        persona: { tone: 'technical', relationship: 'tech colleague', replyDelayMs: 1000, interests: ['coding', 'typescript', 'architecture'] },
      },
      {
        email: 'amaka@nudge.app',
        username: 'amaka',
        displayName: 'Amaka',
        bio: 'Final year student. Past questions survivor.',
        avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
        avatarKind: 'image',
        downFor: 'hang',
        statusText: 'Library until midnight 📚',
        isBot: true,
        persona: { tone: 'friendly', relationship: 'classmate', replyDelayMs: 1200, interests: ['academics', 'exams', 'study group'] },
      },
      {
        email: 'seyi@nudge.app',
        username: 'seyi',
        displayName: 'Seyi',
        bio: 'Big brother energy. Third Mainland veteran.',
        avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
        avatarKind: 'image',
        downFor: 'talk',
        statusText: 'Lagos traffic is real 🚗',
        isBot: true,
        persona: { tone: 'brotherly', relationship: 'older brother', replyDelayMs: 1300, interests: ['cars', 'lagos', 'banter'] },
      },
      {
        email: 'dami@nudge.app',
        username: 'dami',
        displayName: 'Dami',
        bio: 'Freelance designer. Invoices on time, mostly.',
        avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150',
        avatarKind: 'image',
        downFor: 'talk',
        statusText: 'Polishing Figma tokens ✨',
        isBot: true,
        persona: { tone: 'professional', relationship: 'collaborator', replyDelayMs: 1200, interests: ['design', 'ui', 'freelance'] },
      },
      {
        email: 'jide@nudge.app',
        username: 'jide',
        displayName: 'Jide',
        bio: 'Gym at 6am. No excuses.',
        avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
        avatarKind: 'image',
        downFor: 'play',
        statusText: 'Leg day tomorrow 🏋️‍♂️',
        isBot: true,
        persona: { tone: 'energetic', relationship: 'gym buddy', replyDelayMs: 900, interests: ['gym', 'fitness', 'pullups'] },
      },
      {
        email: 'kemi@nudge.app',
        username: 'kemi',
        displayName: 'Kemi',
        bio: 'Birthday girl all year round 🎂',
        avatarUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150',
        avatarKind: 'image',
        downFor: 'hang',
        statusText: 'Dinner next week! 🎉',
        isBot: true,
        persona: { tone: 'warm', relationship: 'close friend', replyDelayMs: 1100, interests: ['celebrations', 'food', 'dinners'] },
      },
      {
        email: 'femi@nudge.app',
        username: 'femi',
        displayName: 'Uncle Femi',
        bio: 'Retired banker. Proud uncle.',
        avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
        avatarKind: 'image',
        downFor: 'talk',
        statusText: 'Hard work brings success.',
        isBot: true,
        persona: { tone: 'wise', relationship: 'uncle', replyDelayMs: 1500, interests: ['wisdom', 'work', 'family'] },
      },
      {
        email: 'sade@nudge.app',
        username: 'sade',
        displayName: 'Sade',
        bio: 'Photographer chasing golden hour across Lagos.',
        avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150',
        avatarKind: 'image',
        downFor: 'talk',
        statusText: 'Chasing sunset at Lekki 🌇',
        isBot: false,
        persona: null,
      },
      {
        email: 'kunle@nudge.app',
        username: 'kunle',
        displayName: 'Kunle',
        bio: 'Open source tinkerer.',
        avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150',
        avatarKind: 'image',
        downFor: 'heads_down',
        statusText: 'Compiling Rust 🦀',
        isBot: false,
        persona: null,
      },
      {
        email: 'claude@nudge.app',
        username: 'claude',
        displayName: 'Claude Lead',
        bio: 'AI Technical Lead & Pair Programmer 🤖',
        avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
        avatarKind: 'image',
        downFor: 'heads_down',
        statusText: 'Pair programming on Nudge',
        isBot: true,
        persona: { tone: 'intellectual', relationship: 'ai assistant', replyDelayMs: 1000, interests: ['ai', 'code', 'databases'] },
      },
    ];

    const userMap = new Map<string, string>();

    for (const u of usersToSeed) {
      const userRes = await query(
        `INSERT INTO users (email, username, display_name, bio, avatar_url, avatar_kind, is_bot, bot_persona)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (email) DO UPDATE
         SET display_name = EXCLUDED.display_name,
             avatar_url = EXCLUDED.avatar_url,
             bio = EXCLUDED.bio,
             is_bot = EXCLUDED.is_bot,
             bot_persona = EXCLUDED.bot_persona
         RETURNING id`,
        [u.email, u.username, u.displayName, u.bio, u.avatarUrl, u.avatarKind, u.isBot, u.persona ? JSON.stringify(u.persona) : null]
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
    const tolaId = userMap.get('tola')!;
    const mumId = userMap.get('mum')!;
    const chidiId = userMap.get('chidi')!;
    const amakaId = userMap.get('amaka')!;
    const seyiId = userMap.get('seyi')!;
    const damiId = userMap.get('dami')!;
    const jideId = userMap.get('jide')!;
    const kemiId = userMap.get('kemi')!;
    const femiId = userMap.get('femi')!;
    const sadeId = userMap.get('sade')!;
    const kunleId = userMap.get('kunle')!;
    const claudeId = userMap.get('claude')!;

    // Friendships: connect Dayo with everyone
    const friendIds = [tolaId, mumId, chidiId, amakaId, seyiId, damiId, jideId, kemiId, femiId, sadeId, kunleId, claudeId];
    for (const fId of friendIds) {
      const [u1, u2] = dayoId < fId ? [dayoId, fId] : [fId, dayoId];
      await query(
        `INSERT INTO friendships (user_a, user_b, requester_id, status, responded_at)
         VALUES ($1, $2, $1, 'accepted', NOW())
         ON CONFLICT (user_a, user_b) DO UPDATE SET status = 'accepted'`,
        [u1, u2]
      );
    }

    // Direct conversations helper
    async function seedDirectChat(otherId: string, messagesList: { senderId: string; body: string; offsetMinutes: number }[]) {
      const [minId, maxId] = dayoId < otherId ? [dayoId, otherId] : [otherId, dayoId];
      const directKey = `direct:${minId}:${maxId}`;

      const convRes = await query(
        `INSERT INTO conversations (type, direct_key, last_seq, last_message_at)
         VALUES ('direct', $1, $2, NOW() - INTERVAL '1 minute')
         ON CONFLICT (direct_key) DO UPDATE
         SET last_seq = EXCLUDED.last_seq, last_message_at = EXCLUDED.last_message_at
         RETURNING id`,
        [directKey, messagesList.length]
      );
      const convId = convRes.rows[0].id;

      await query(
        `INSERT INTO conversation_members (conversation_id, user_id, role, last_read_seq)
         VALUES ($1, $2, 'member', $4), ($1, $3, 'member', $4)
         ON CONFLICT (conversation_id, user_id) DO UPDATE SET last_read_seq = EXCLUDED.last_read_seq`,
        [convId, dayoId, otherId, messagesList.length]
      );

      for (let i = 0; i < messagesList.length; i++) {
        const m = messagesList[i];
        await query(
          `INSERT INTO messages (conversation_id, seq, sender_id, type, body, created_at)
           VALUES ($1, $2, $3, 'text', $4, NOW() - ($5 || ' minutes')::INTERVAL)
           ON CONFLICT (conversation_id, seq) DO NOTHING`,
          [convId, i + 1, m.senderId, m.body, String(m.offsetMinutes)]
        );
      }
      return convId;
    }

    // 1. Tola Direct Chat
    await seedDirectChat(tolaId, [
      { senderId: tolaId, body: 'Did you see the match last night??', offsetMinutes: 190 },
      { senderId: dayoId, body: 'Missed it, work ate my evening', offsetMinutes: 185 },
      { senderId: tolaId, body: 'You owe me a rematch on FIFA then', offsetMinutes: 30 },
      { senderId: tolaId, body: 'Saturday? ⚽🎮', offsetMinutes: 29 },
    ]);

    // 2. Mum Direct Chat
    await seedDirectChat(mumId, [
      { senderId: mumId, body: 'Good morning my dear', offsetMinutes: 1500 },
      { senderId: dayoId, body: 'Morning Mum! All good here', offsetMinutes: 1490 },
      { senderId: mumId, body: 'Have you eaten?', offsetMinutes: 1480 },
    ]);

    // 3. Chidi Direct Chat
    await seedDirectChat(chidiId, [
      { senderId: dayoId, body: 'The login bug is fixed on my branch', offsetMinutes: 300 },
      { senderId: chidiId, body: 'Nice. Can you open the PR?', offsetMinutes: 290 },
      { senderId: chidiId, body: 'Standup moved to 11:30 btw', offsetMinutes: 12 },
    ]);

    // 4. Amaka Direct Chat
    await seedDirectChat(amakaId, [
      { senderId: amakaId, body: 'Did you finish chapter 6?', offsetMinutes: 4000 },
      { senderId: dayoId, body: 'Halfway. Notes tonight?', offsetMinutes: 3990 },
    ]);

    // 5. Seyi Direct Chat
    await seedDirectChat(seyiId, [
      { senderId: seyiId, body: 'Bro, are you coming home for the weekend?', offsetMinutes: 620 },
      { senderId: dayoId, body: 'Planning to. Traffic permitting 😅', offsetMinutes: 600 },
      { senderId: seyiId, body: 'Lol Third Mainland is a gamble. Leave early', offsetMinutes: 598 },
    ]);

    // 6. Dami Direct Chat
    await seedDirectChat(damiId, [
      { senderId: damiId, body: 'Sent the invoice template, can you check?', offsetMinutes: 75 },
      { senderId: dayoId, body: 'Checking now', offsetMinutes: 70 },
      { senderId: damiId, body: 'Thanks! Client wants changes by Monday', offsetMinutes: 68 },
    ]);

    // 7. Jide Direct Chat
    await seedDirectChat(jideId, [
      { senderId: jideId, body: 'Gym tomorrow 6am?', offsetMinutes: 45 },
      { senderId: jideId, body: 'No excuses 😤', offsetMinutes: 44 },
    ]);

    // 8. Kemi Direct Chat
    await seedDirectChat(kemiId, [
      { senderId: dayoId, body: 'Happy birthday Kemi!! 🎉', offsetMinutes: 2900 },
      { senderId: kemiId, body: 'Thank you!! Dinner next week?', offsetMinutes: 2880 },
      { senderId: dayoId, body: 'Definitely', offsetMinutes: 2870 },
    ]);

    // 9. Uncle Femi Direct Chat
    await seedDirectChat(femiId, [
      { senderId: femiId, body: 'How is work going, young man?', offsetMinutes: 5700 },
      { senderId: dayoId, body: 'Going well, Uncle. Learning a lot', offsetMinutes: 5690 },
    ]);

    // 10. Claude Direct Chat
    await seedDirectChat(claudeId, [
      { senderId: dayoId, body: 'Claude, backend and frontend separation is looking great with Neon Postgres!', offsetMinutes: 15 },
      { senderId: claudeId, body: 'Architecture is fully aligned: shared contracts, Fastify modular server, and real-time WebSockets.', offsetMinutes: 5 },
    ]);

    // GROUP 1: ABUAD Friends (with full rooms: General, School, Events, Photos, Money, Games)
    const abuadGroup = await query(
      `INSERT INTO conversations (type, title, last_seq, last_message_at)
       VALUES ('group', 'ABUAD Friends 🎓', 15, NOW())
       RETURNING id`
    );
    const abuadId = abuadGroup.rows[0].id;

    for (const uId of [dayoId, tolaId, amakaId, damiId, kemiId, seyiId]) {
      await query(
        `INSERT INTO conversation_members (conversation_id, user_id, role, last_read_seq)
         VALUES ($1, $2, $3, 15) ON CONFLICT DO NOTHING`,
        [abuadId, uId, uId === dayoId ? 'owner' : uId === amakaId ? 'admin' : 'member']
      );
    }

    const abuadRooms = [
      { id: 'general', name: 'General', emoji: '💬' },
      { id: 'school', name: 'School', emoji: '📚' },
      { id: 'events', name: 'Events', emoji: '🎉' },
      { id: 'photos', name: 'Photos', emoji: '📸' },
      { id: 'money', name: 'Money', emoji: '💸' },
      { id: 'games', name: 'Games', emoji: '🎮' },
    ];

    const roomDbMap = new Map<string, string>();
    for (const r of abuadRooms) {
      const rRes = await query(
        `INSERT INTO rooms (conversation_id, name, emoji)
         VALUES ($1, $2, $3) RETURNING id`,
        [abuadId, r.name, r.emoji]
      );
      roomDbMap.set(r.id, rRes.rows[0].id);
    }

    // Seed messages across rooms
    const abuadMsgs = [
      { room: 'general', sender: amakaId, text: 'Welcome to ABUAD Friends 👋 One group, separate rooms, so nothing gets buried.', off: 2800 },
      { room: 'general', sender: tolaId, text: 'Finally 🙌', off: 2790 },
      { room: 'general', sender: dayoId, text: 'Love this. No more scrolling past jollof debates to find the test date 😂', off: 2780 },
      { room: 'school', sender: damiId, text: 'CSC 401 test is now Thursday', off: 1500 },
      { room: 'school', sender: kemiId, text: 'Who has the lecture notes for week 6?', off: 60 },
      { room: 'school', sender: amakaId, text: 'Sending them tonight', off: 45 },
      { room: 'events', sender: tolaId, text: 'Departmental dinner is Saturday 6pm 🍽️', off: 900 },
      { room: 'events', sender: dayoId, text: 'Count me in', off: 880 },
      { room: 'events', sender: seyiId, text: 'Dress code?', off: 30 },
      { room: 'photos', sender: tolaId, text: 'Uploading the matriculation pics tonight 📸', off: 700 },
      { room: 'money', sender: damiId, text: 'Dinner contribution is ₦5,000 each', off: 500 },
      { room: 'money', sender: amakaId, text: 'Please pay the class rep by Friday', off: 420 },
      { room: 'money', sender: dayoId, text: 'Paid ✅', off: 300 },
      { room: 'games', sender: seyiId, text: 'FIFA tournament sign-up is open 🎮', off: 200 },
      { room: 'games', sender: tolaId, text: 'Count me in', off: 190 },
    ];

    for (let i = 0; i < abuadMsgs.length; i++) {
      const m = abuadMsgs[i];
      const dbRoomId = roomDbMap.get(m.room);
      await query(
        `INSERT INTO messages (conversation_id, room_id, seq, sender_id, type, body, created_at)
         VALUES ($1, $2, $3, $4, 'text', $5, NOW() - ($6 || ' minutes')::INTERVAL)`,
        [abuadId, dbRoomId, i + 1, m.sender, m.text, String(m.off)]
      );
    }

    // GROUP 2: Lagos Devs (General & Code review rooms)
    const devsGroup = await query(
      `INSERT INTO conversations (type, title, last_seq, last_message_at)
       VALUES ('group', 'Lagos Devs 💻', 5, NOW())
       RETURNING id`
    );
    const devsId = devsGroup.rows[0].id;

    for (const uId of [dayoId, chidiId, damiId, kunleId]) {
      await query(
        `INSERT INTO conversation_members (conversation_id, user_id, role, last_read_seq)
         VALUES ($1, $2, $3, 5) ON CONFLICT DO NOTHING`,
        [devsId, uId, uId === dayoId ? 'owner' : 'member']
      );
    }

    const devsGenRoom = await query(
      `INSERT INTO rooms (conversation_id, name, emoji) VALUES ($1, 'General', '💬') RETURNING id`,
      [devsId]
    );
    const devsReviewRoom = await query(
      `INSERT INTO rooms (conversation_id, name, emoji) VALUES ($1, 'Code review', '👀') RETURNING id`,
      [devsId]
    );

    const devsMsgs = [
      { roomId: devsGenRoom.rows[0].id, sender: chidiId, text: 'Anyone tried the new Node LTS yet?', off: 400 },
      { roomId: devsGenRoom.rows[0].id, sender: damiId, text: 'Yes, build times dropped a bit', off: 380 },
      { roomId: devsGenRoom.rows[0].id, sender: dayoId, text: 'Upgrading my project tonight', off: 370 },
      { roomId: devsGenRoom.rows[0].id, sender: kunleId, text: 'Share results!', off: 20 },
      { roomId: devsReviewRoom.rows[0].id, sender: damiId, text: 'PR #42 is ready for review', off: 90 },
      { roomId: devsReviewRoom.rows[0].id, sender: chidiId, text: 'Left a few comments 👀', off: 80 },
    ];

    for (let i = 0; i < devsMsgs.length; i++) {
      const m = devsMsgs[i];
      await query(
        `INSERT INTO messages (conversation_id, room_id, seq, sender_id, type, body, created_at)
         VALUES ($1, $2, $3, $4, 'text', $5, NOW() - ($6 || ' minutes')::INTERVAL)`,
        [devsId, m.roomId, i + 1, m.sender, m.text, String(m.off)]
      );
    }

    // GROUP 3: Family
    const famGroup = await query(
      `INSERT INTO conversations (type, title, last_seq, last_message_at)
       VALUES ('group', 'Family ❤️', 4, NOW())
       RETURNING id`
    );
    const famId = famGroup.rows[0].id;

    for (const uId of [dayoId, mumId, tolaId, seyiId]) {
      await query(
        `INSERT INTO conversation_members (conversation_id, user_id, role, last_read_seq)
         VALUES ($1, $2, $3, 4) ON CONFLICT DO NOTHING`,
        [famId, uId, uId === dayoId ? 'owner' : 'member']
      );
    }

    const famRoom = await query(
      `INSERT INTO rooms (conversation_id, name, emoji) VALUES ($1, 'General', '💬') RETURNING id`,
      [famId]
    );

    const famMsgs = [
      { sender: mumId, text: 'Sunday lunch at 2, no excuses', off: 1700 },
      { sender: seyiId, text: 'I will bring drinks', off: 1690 },
      { sender: dayoId, text: 'Count me in', off: 1680 },
      { sender: tolaId, text: 'Jollof wars again? 😂', off: 1675 },
    ];

    for (let i = 0; i < famMsgs.length; i++) {
      const m = famMsgs[i];
      await query(
        `INSERT INTO messages (conversation_id, room_id, seq, sender_id, type, body, created_at)
         VALUES ($1, $2, $3, $4, 'text', $5, NOW() - ($6 || ' minutes')::INTERVAL)`,
        [famId, famRoom.rows[0].id, i + 1, m.sender, m.text, String(m.off)]
      );
    }

    // TEMPORARY GROUPS WITH EXPIRATION
    // Temporary Group 1: Lekki Trip 🏝️ (ends in 2 days)
    const lekkiTrip = await query(
      `INSERT INTO conversations (type, title, ends_at, last_seq, last_message_at)
       VALUES ('group', 'Lekki Trip 🏝️', NOW() + INTERVAL '2 days', 2, NOW())
       RETURNING id`
    );
    const lekkiId = lekkiTrip.rows[0].id;
    for (const uId of [dayoId, tolaId, sadeId, seyiId]) {
      await query(
        `INSERT INTO conversation_members (conversation_id, user_id, role) VALUES ($1, $2, 'member')`,
        [lekkiId, uId]
      );
    }
    const lekkiRoom = await query(
      `INSERT INTO rooms (conversation_id, name, emoji) VALUES ($1, 'General', '🏖️') RETURNING id`,
      [lekkiId]
    );
    await query(
      `INSERT INTO messages (conversation_id, room_id, seq, sender_id, type, body, created_at)
       VALUES ($1, $2, 1, $3, 'text', 'Who is booking the beach house for the weekend?', NOW() - INTERVAL '3 hours'),
              ($1, $2, 2, $4, 'text', 'Already looking at two spots by the water! 🌊', NOW() - INTERVAL '2 hours')`,
      [lekkiId, lekkiRoom.rows[0].id, tolaId, sadeId]
    );

    // Temporary Group 2: Saturday Match ⚽ (ends in 20 hours)
    const matchGroup = await query(
      `INSERT INTO conversations (type, title, ends_at, last_seq, last_message_at)
       VALUES ('group', 'Saturday Match ⚽', NOW() + INTERVAL '20 hours', 2, NOW())
       RETURNING id`
    );
    const matchId = matchGroup.rows[0].id;
    for (const uId of [dayoId, tolaId, jideId, seyiId]) {
      await query(
        `INSERT INTO conversation_members (conversation_id, user_id, role) VALUES ($1, $2, 'member')`,
        [matchId, uId]
      );
    }
    const matchRoom = await query(
      `INSERT INTO rooms (conversation_id, name, emoji) VALUES ($1, 'General', '⚽') RETURNING id`,
      [matchId]
    );
    await query(
      `INSERT INTO messages (conversation_id, room_id, seq, sender_id, type, body, created_at)
       VALUES ($1, $2, 1, $3, 'text', 'Turf is booked for 5pm! Bring bibs.', NOW() - INTERVAL '4 hours'),
              ($1, $2, 2, $4, 'text', 'Pull-ups first, football after. 😤', NOW() - INTERVAL '3 hours')`,
      [matchId, matchRoom.rows[0].id, tolaId, jideId]
    );

    // Temporary Group 3: Archived Hackathon Team (expired yesterday, archived)
    const hackGroup = await query(
      `INSERT INTO conversations (type, title, ends_at, archived_at, last_seq, last_message_at)
       VALUES ('group', 'Hackathon 2025 🏆', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', 2, NOW() - INTERVAL '1 day')
       RETURNING id`
    );
    const hackId = hackGroup.rows[0].id;
    for (const uId of [dayoId, chidiId, damiId]) {
      await query(
        `INSERT INTO conversation_members (conversation_id, user_id, role, archived_at) VALUES ($1, $2, 'member', NOW())`,
        [hackId, uId]
      );
    }
    const hackRoom = await query(
      `INSERT INTO rooms (conversation_id, name, emoji, archived) VALUES ($1, 'General', '🚀', true) RETURNING id`,
      [hackId]
    );
    await query(
      `INSERT INTO messages (conversation_id, room_id, seq, sender_id, type, body, created_at)
       VALUES ($1, $2, 1, $3, 'text', 'Demo presentation went amazing! Top 3 finish! 🎉', NOW() - INTERVAL '2 days'),
              ($1, $2, 2, $4, 'text', 'Thanks for the great teamwork everyone!', NOW() - INTERVAL '2 days')`,
      [hackId, hackRoom.rows[0].id, chidiId, damiId]
    );

    // SEED STORIES WITH POLLS AND QUESTIONS
    // Story 1: Tola's Poll Story
    await query(
      `INSERT INTO stories (author_id, type, background, audience, data, expires_at)
       VALUES ($1, 'poll', 'linear-gradient(135deg, #1A1F35, #0F6B58)', 'public', $2, NOW() + INTERVAL '24 hours')`,
      [
        tolaId,
        JSON.stringify({
          poll: {
            q: 'Who wins on Saturday? ⚽',
            opts: [
              { t: 'Me, obviously', v: [chidiId] },
              { t: 'Rematch / Dayo', v: [seyiId, damiId] },
            ],
          },
        }),
      ]
    );

    // Story 2: Chidi's Q&A Story
    await query(
      `INSERT INTO stories (author_id, type, background, audience, data, expires_at)
       VALUES ($1, 'qa', 'linear-gradient(135deg, #2D1B69, #1D2A44)', 'public', $2, NOW() + INTERVAL '20 hours')`,
      [
        chidiId,
        JSON.stringify({
          qa: {
            q: 'Ask me anything about shipping code 🚀',
            answers: [
              { by: 'Dami', text: 'How do you structure database migrations with zero downtime?', t: Date.now() - 3600000 },
            ],
          },
        }),
      ]
    );

    // Story 3: Sade's Sunset Photo Story
    await query(
      `INSERT INTO stories (author_id, type, text, background, audience, expires_at)
       VALUES ($1, 'text', 'Golden hour from the Lekki bridge never gets old 🌇', 'linear-gradient(135deg, #FF5E62, #FF9966)', 'friends', NOW() + INTERVAL '18 hours')`,
      [sadeId]
    );

    // Story 4: Amaka's Study Story
    await query(
      `INSERT INTO stories (author_id, type, text, background, audience, expires_at)
       VALUES ($1, 'text', 'Library until midnight. Past questions survivor! 📚✨', 'linear-gradient(135deg, #0BA360, #3CBA92)', 'friends', NOW() + INTERVAL '16 hours')`,
      [amakaId]
    );

    // Story 5: Kemi's Celebration Story
    await query(
      `INSERT INTO stories (author_id, type, text, background, audience, expires_at)
       VALUES ($1, 'text', 'Thank you all so much for the birthday love! 🎂🥰', 'linear-gradient(135deg, #D4145A, #FBB03B)', 'friends', NOW() + INTERVAL '22 hours')`,
      [kemiId]
    );

    // SEED TIC-TAC-TOE GAME SESSION (Dayo vs Tola Bot)
    const [tMin, tMax] = dayoId < tolaId ? [dayoId, tolaId] : [tolaId, dayoId];
    const tolaConvRes = await query('SELECT id FROM conversations WHERE direct_key = $1', [`direct:${tMin}:${tMax}`]);
    const tolaConvId = tolaConvRes.rows[0]?.id;

    await query(
      `INSERT INTO game_sessions (game_key, conversation_id, state, created_by, status)
       VALUES ('tictactoe', $1, $2, $3, 'in_progress')`,
      [
        tolaConvId,
        JSON.stringify({
          board: ['X', null, 'O', null, 'X', null, null, null, null],
          turn: 'O',
          playerX: dayoId,
          playerO: tolaId,
        }),
        dayoId,
      ]
    );

    console.log('[Seed] Database successfully seeded with bots, memories, rooms, temporary groups, stories and games!');
  } catch (err) {
    console.error('[Seed] Error during seeding:', err);
  } finally {
    await pool.end();
  }
}

seed();
