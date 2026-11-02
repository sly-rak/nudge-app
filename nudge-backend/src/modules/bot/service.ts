import { query } from '../../db/index.js';
import { realtimeGateway } from '../../realtime/gateway.js';
import {
  normalizeGameKey,
  tttEngine,
  tl,
  c4Engine,
  checkersEngine,
  chessEngine,
  oth,
} from '@nudge/shared';

interface BotUser {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl?: string;
  avatarKind: string;
  isBot: boolean;
  botPersona?: {
    tone?: string;
    relationship?: string;
    autoReply?: boolean;
    interests?: string[];
    replyDelayMs?: number;
  };
}

export class BotService {
  /**
   * Extract key memories and facts about the user from their message
   */
  public async learnFromMessage(botId: string, userId: string, messageText: string) {
    if (!messageText || messageText.length < 3) return;

    const text = messageText.trim();
    const lower = text.toLowerCase();
    const extracted: { key: string; value: string }[] = [];

    // Extract name
    const nameMatch = lower.match(/(?:my name is|i am called|call me)\s+([a-zA-Z0-9_\s]{2,20})/i);
    if (nameMatch && nameMatch[1]) {
      extracted.push({ key: 'name', value: nameMatch[1].trim() });
    }

    // Extract football club / team
    const teamMatch = lower.match(/(?:i support|my team is|fan of|love)\s+(arsenal|chelsea|man(?:chester)?\s*(?:united|city|utd)|liverpool|real\s*madrid|barcelona|barca|tottenham|juventus|bayern)/i);
    if (teamMatch && teamMatch[1]) {
      extracted.push({ key: 'football_team', value: teamMatch[1].trim() });
    }

    // Extract work/project
    const workMatch = lower.match(/(?:i am building|i'm building|working on|studying|building|developing)\s+([^.!?,\n]{3,35})/i);
    if (workMatch && workMatch[1]) {
      extracted.push({ key: 'project', value: workMatch[1].trim() });
    }

    // Extract likes/interests
    const likeMatch = lower.match(/(?:i love|i really like|i like|i enjoy)\s+([^.!?,\n]{3,35})/i);
    if (likeMatch && likeMatch[1] && !likeMatch[1].includes('building')) {
      extracted.push({ key: 'interest', value: likeMatch[1].trim() });
    }

    // Extract food / meal
    const foodMatch = lower.match(/(?:i ate|eating|had some|cooked|eating|craving)\s+([^.!?,\n]{3,30})/i);
    if (foodMatch && foodMatch[1]) {
      extracted.push({ key: 'recent_food', value: foodMatch[1].trim() });
    }

    // Extract mood
    const moodMatch = lower.match(/(?:i am feeling|i'm feeling|feeling|i feel|i am so|i'm so)\s+(tired|exhausted|happy|great|stressed|sad|excited|bored|sleepy)/i);
    if (moodMatch && moodMatch[1]) {
      extracted.push({ key: 'mood', value: moodMatch[1].trim() });
    }

    // Upsert into bot_memory
    for (const item of extracted) {
      try {
        await query(
          `INSERT INTO bot_memory (bot_id, user_id, memory_key, memory_value, interactions_count, updated_at)
           VALUES ($1, $2, $3, $4, 1, NOW())
           ON CONFLICT (bot_id, user_id, memory_key)
           DO UPDATE SET
             memory_value = EXCLUDED.memory_value,
             interactions_count = bot_memory.interactions_count + 1,
             updated_at = NOW()`,
          [botId, userId, item.key, item.value]
        );
      } catch (err) {
        console.error('[BotService] Failed to upsert memory:', err);
      }
    }
  }

  /**
   * Retrieve all memories this bot has about a user
   */
  public async getMemories(botId: string, userId: string): Promise<Record<string, string>> {
    try {
      const res = await query(
        `SELECT memory_key, memory_value FROM bot_memory WHERE bot_id = $1 AND user_id = $2`,
        [botId, userId]
      );
      const map: Record<string, string> = {};
      for (const row of res.rows) {
        map[row.memory_key] = row.memory_value;
      }
      return map;
    } catch {
      return {};
    }
  }

  /**
   * Generate an in-character contextual response taking into account learned memory
   */
  public generateReply(
    bot: BotUser,
    userDisplayName: string,
    messageText: string,
    memories: Record<string, string>
  ): string {
    const text = messageText.toLowerCase().trim();
    const username = bot.username.toLowerCase();
    const effectiveName = memories.name || userDisplayName || 'my friend';

    // 1. Identity & Memory Questions
    if (text.includes('what do you know about me') || text.includes('who am i') || text.includes('do you remember') || text.includes('what is my name')) {
      const facts = [];
      if (memories.name) facts.push(`your name is ${memories.name}`);
      if (memories.project) facts.push(`you're building ${memories.project}`);
      if (memories.football_team) facts.push(`you support ${memories.football_team}`);
      if (memories.interest) facts.push(`you love ${memories.interest}`);
      if (memories.recent_food) facts.push(`you recently had ${memories.recent_food}`);
      if (memories.mood) facts.push(`you were recently feeling ${memories.mood}`);

      if (facts.length > 0) {
        if (username === 'mum') {
          return `Of course I know my child! I remember that ${facts.join(', and ')}. A mother never forgets! ❤️`;
        }
        if (username === 'tola') {
          return `Haha you think I have amnesia? I remember that ${facts.join(', and ')}. You can't hide anything from me bro! 😂`;
        }
        if (username === 'chidi') {
          return `Memory cache hits: ${facts.join('; ')}. Stored in indexed user profile state.`;
        }
        return `Of course I remember you, ${effectiveName}! I know ${facts.join(', and ')}. You're always top of mind! ✨`;
      } else {
        return `I remember every chat with you, ${effectiveName}! Tell me what you're working on or what you did today so I can keep up! 😄`;
      }
    }

    // 2. Who are you / Are you a bot?
    if (text.includes('who are you') || text.includes('are you a bot') || text.includes('are you real') || text.includes('what are you')) {
      if (username === 'tola') {
        return `Who am I? Your day-one brother and undefeated FIFA master! Stop asking silly questions and send that game invite 🎮`;
      }
      if (username === 'mum') {
        return `Dayo, what kind of question is that? I am your loving mother! Have you eaten today? Go and drink water ❤️`;
      }
      if (username === 'chidi') {
        return `I'm Chidi, senior backend engineer. Right now writing async services and reviewing PRs. Let's build something scalable. 💻`;
      }
      if (username === 'amaka') {
        return `I'm Amaka, your library buddy! Currently buried in past questions and lecture slides 📚`;
      }
      return `I'm ${bot.displayName}! ${bot.bio || 'Happy to be chatting with you on Nudge!'}`;
    }

    // 3. TOLA: Hyper-energetic, FIFA champ, football banter, jollof, street smart
    if (username === 'tola') {
      // Greetings
      if (/^(hi|hello|hey|yo|what's up|sup|how far|wetin dey)\b/i.test(text)) {
        const pool = [
          `Yo ${effectiveName}! What's good bro? Tell me you're not still sleeping 😂`,
          `What's popping ${effectiveName}! Ready for some action today? ⚽`,
          `Yo! Just thinking about who's taking the L on FIFA this Saturday. Spoiler: it's not me! 😎`,
          `How far bro! What's the latest update?`,
        ];
        return pool[Math.floor(Math.random() * pool.length)];
      }

      // Games / Playing
      if (text.includes('play') || text.includes('game') || text.includes('fifa') || text.includes('rematch') || text.includes('tictactoe') || text.includes('challenge')) {
        return `Say less! Hit that Play tab right now. Tic-Tac-Toe, Connect 4, FIFA, whatever you want — prepare to be humbled! 🎮⚽`;
      }

      // Food
      if (text.includes('food') || text.includes('eat') || text.includes('hungry') || text.includes('jollof') || text.includes('lunch') || text.includes('dinner') || text.includes('dodo')) {
        const foodRef = memories.recent_food ? `or some more of that ${memories.recent_food}` : 'with extra dodo';
        return `Say less! Lagos jollof ${foodRef} or we're not talking. When are we heading out? 🍛`;
      }

      // Football & Sports
      if (text.includes('football') || text.includes('match') || text.includes('arsenal') || text.includes('chelsea') || text.includes('man u') || text.includes('premier league') || memories.football_team) {
        const team = memories.football_team ? memories.football_team.toUpperCase() : 'your team';
        return `Did you watch the match over the weekend? Man, ${team} gave me high blood pressure! What did you think? ⚽🔥`;
      }

      // Work / Stress
      if (text.includes('tired') || text.includes('stress') || text.includes('work') || text.includes('exhausted')) {
        return `Bro, step away from that keyboard! Take a 15-minute breather. Your eyes are probably burning from that screen 😂 Come let's play a round!`;
      }

      // Laughter & Banter
      if (/^(haha|lol|lmao|lmfao|kmt|you are funny)\b/i.test(text) || text.includes('joke')) {
        return `You're laughing, but deep down you know I'm speaking facts! 😂 Let's run it up!`;
      }

      // Farewells & Sleep
      if (text.includes('good night') || text.includes('sleep') || text.includes('bye') || text.includes('heading out')) {
        return `Alright bro, get some rest! Tomorrow we run that rematch. Peace out! ✌️😴`;
      }

      const tolaPool = [
        'Haha no way! 😂 Tell me everything.',
        'Say less. What time are we meeting up?',
        "I'm in! Bring the snacks and good vibes.",
        'Lol you are impossible! But you know I agree.',
        'Okay okay, let me finish this and I will join you.',
        'Classic move! Let us run it up.',
      ];
      return tolaPool[Math.floor(Math.random() * tolaPool.length)];
    }

    // 4. MUM: Loving Nigerian Mother, caring, prayers, health, meals, rest
    if (username === 'mum') {
      // Greetings
      if (/^(hi|hello|hey|good morning|morning|good afternoon|good evening)\b/i.test(text)) {
        const pool = [
          `Good day, my dear Dayo! How are you feeling today? Have you eaten breakfast? ❤️`,
          `Hello my child! Hope your day is going peacefully. Remember to take care of yourself.`,
          `Good morning Dayo! The Lord will bless the work of your hands today. Amen! 🙏`,
        ];
        return pool[Math.floor(Math.random() * pool.length)];
      }

      // Food & Health
      if (text.includes('eat') || text.includes('food') || text.includes('hungry') || text.includes('lunch') || text.includes('dinner') || text.includes('breakfast')) {
        return `Make sure you eat proper warm food, Dayo. Not just energy drinks and fast food! Health is wealth. Eat well and drink clean water. ❤️🍲`;
      }

      // Stress & Tiredness
      if (text.includes('tired') || text.includes('stress') || text.includes('work') || text.includes('sick') || text.includes('headache') || memories.mood === 'tired') {
        return `Ehya, sorry my dear. Please do not overwork yourself on that computer. The work will never finish, but your health is one. Sleep early tonight, okay? ❤️`;
      }

      // Games
      if (text.includes('play') || text.includes('game') || text.includes('challenge')) {
        return `Haha, you want to play a game with your mother? Okay oh, let me put on my reading glasses first! Don't let me beat you! 😊`;
      }

      // Prayers & Blessings
      if (text.includes('pray') || text.includes('bless') || text.includes('amen') || text.includes('god') || text.includes('exam') || text.includes('interview')) {
        return `I am praying for you without ceasing. God's grace will go before you and open every door. You will succeed, my child! 🙏✨`;
      }

      // Love & Gratitude
      if (text.includes('love') || text.includes('thank') || text.includes('appreciate')) {
        return `Aww, God bless you Dayo. I love you too my child. Make sure you call me when you have a free moment. ❤️`;
      }

      // Sleep & Farewells
      if (text.includes('good night') || text.includes('sleep') || text.includes('bed')) {
        return `Good night, my dear. Cover yourself properly and sleep peacefully. Wake up refreshed tomorrow. God bless your night! 🌙🙏`;
      }

      const mumPool = [
        'Have you eaten, my dear?',
        'Call me when you are free, okay? God bless you.',
        "Proud of you! Don't stay up too late working on your computer.",
        'Remember to drink water and take care of yourself.',
        'I am praying for you always. Have a wonderful day!',
      ];
      return mumPool[Math.floor(Math.random() * mumPool.length)];
    }

    // 5. CHIDI: Senior Backend Engineer, TypeScript, Neon, Architecture, Coffee
    if (username === 'chidi') {
      // Greetings
      if (/^(hi|hello|hey|yo|morning|sup)\b/i.test(text)) {
        const pool = [
          `Hey ${effectiveName}! What's brewing? Fresh commits or fresh coffee? ☕`,
          `Yo! Ready to ship some clean code today?`,
          `Morning! Just pushed a few migrations to Neon. How's your branch looking?`,
        ];
        return pool[Math.floor(Math.random() * pool.length)];
      }

      // Coding / Bugs / PR
      if (text.includes('bug') || text.includes('error') || text.includes('code') || text.includes('pr') || text.includes('typescript') || text.includes('db') || text.includes('database')) {
        return `Drop the stack trace or PR link. 90% of bugs are missing null checks or unhandled async promises. TypeScript would catch that if strict mode is on! 💻`;
      }

      // Deployment / Neon / Cloud
      if (text.includes('deploy') || text.includes('neon') || text.includes('server') || text.includes('release') || text.includes('api')) {
        return `Tests are passing and the zero-downtime migrations are verified. Ship it to production with confidence! 🚀`;
      }

      // Games
      if (text.includes('play') || text.includes('game') || text.includes('challenge')) {
        return `Challenge accepted. But you should know I computed the minimax decision tree for Tic-Tac-Toe in O(1) time. Let's see your heuristics! 🤖`;
      }

      // Coffee / Break
      if (text.includes('coffee') || text.includes('break') || text.includes('lunch')) {
        return `Espresso break sounds like an optimal garbage-collection cycle. Count me in. ☕`;
      }

      const chidiPool = [
        'Pushed a fix to main, pull and test when you have a sec.',
        'Standup moved to 11:30 btw. Coffee first!',
        'Looks good to me, LGTM! Merge it.',
        'TypeScript would have caught that 😉 Nice work though.',
        "Clean architecture. Let's benchmark it tonight.",
      ];
      return chidiPool[Math.floor(Math.random() * chidiPool.length)];
    }

    // 6. AMAKA: Final Year Student, Study Group, Past Questions, Library Sprints
    if (username === 'amaka') {
      // Greetings
      if (/^(hi|hello|hey|morning)\b/i.test(text)) {
        return `Hey ${effectiveName}! How is reading going today? Don't tell me you're procrastinating! 📚😄`;
      }

      // Study / Exams
      if (text.includes('exam') || text.includes('study') || text.includes('test') || text.includes('read') || text.includes('book') || text.includes('library')) {
        return `Past questions survivor here! Let's do a 2-hour Pomodoro block in the library. High-yield topics first! 📖`;
      }

      // Games
      if (text.includes('play') || text.includes('game') || text.includes('break')) {
        return `Quick 5-minute study break game? Deal! Let's do a fast round in the Play tab, then back to books! 🎮`;
      }

      const amakaPool = [
        'Study group at 4 in the library? Let me know!',
        "I'll send my notes tonight once I finish chapter 6.",
        'Did you finish chapter 6? It was so dense!',
        'Past questions, past questions, past questions. That is the secret!',
        'Count me in! See you soon.',
      ];
      return amakaPool[Math.floor(Math.random() * amakaPool.length)];
    }

    // 7. SEYI: Big Brother / Cousin, Lagos Traffic, Car rides, Street food
    if (username === 'seyi') {
      if (text.includes('traffic') || text.includes('bridge') || text.includes('lekki') || text.includes('road') || text.includes('mainland')) {
        return `Third Mainland is a gamble as always! If you're leaving, leave before 4pm or you'll sleep on the bridge 😅🚗`;
      }
      if (text.includes('shawarma') || text.includes('food') || text.includes('bring')) {
        return `When you're coming back from the island, don't forget my shawarma oh! Extra sausage please 🌯`;
      }
      if (text.includes('play') || text.includes('game')) {
        return `You think you can beat your big bro? Prepare to be humbled! Let's play! 😤`;
      }
      const seyiPool = [
        "Ha! Don't tell Mum I said so, but you're right 😂",
        'I will pick you up at the junction, just ping me when you are close.',
        'Bring me something nice from the city 😄',
        'Okay okay, weekend it is. Drive safe!',
      ];
      return seyiPool[Math.floor(Math.random() * seyiPool.length)];
    }

    // 8. DAMI: UI/UX Designer, Figma tokens, Spacing, Typography
    if (username === 'dami') {
      if (text.includes('ui') || text.includes('design') || text.includes('figma') || text.includes('color') || text.includes('layout')) {
        return `The micro-interactions and spacing look super clean! Just verify the dark mode contrast ratio hits 4.5:1. ✨`;
      }
      if (text.includes('play') || text.includes('game')) {
        return `A quick duel to reboot the creative flow? Absolutely. Let's play!`;
      }
      const damiPool = [
        'Thanks! I will review the design tokens and forward to the client.',
        'Can we sync at 3pm? Just a 10 min standup.',
        'Great, that layout looks so crisp! What font size did you use?',
        'Let me check Figma and get back to you shortly.',
      ];
      return damiPool[Math.floor(Math.random() * damiPool.length)];
    }

    // 9. JIDE: Gym & Fitness Coach, Accountability, 5:55 AM sharp
    if (username === 'jide') {
      if (text.includes('gym') || text.includes('workout') || text.includes('fitness') || text.includes('tired') || text.includes('lazy')) {
        return `Pull-ups first, no excuses! Be at the gym by 5:55am sharp tomorrow. Bring your water bottle and lock in 🏋️‍♂️💪`;
      }
      if (text.includes('play') || text.includes('game')) {
        return `Mental agility workout! Let's see your reflexes on the board. Bring your A-game!`;
      }
      const jidePool = [
        'Pull-ups first, no excuses.',
        'Be there by 5:55 sharp tomorrow!',
        'Skipping leg day again? 😂 Not on my watch.',
        'Drink your protein shake and get some rest.',
      ];
      return jidePool[Math.floor(Math.random() * jidePool.length)];
    }

    // 10. KEMI: Socialite & Foodie
    if (username === 'kemi') {
      if (text.includes('dinner') || text.includes('food') || text.includes('weekend') || text.includes('brunch')) {
        return `Yes please! We need a proper brunch catch-up this weekend. My treat! 🥂✨`;
      }
      const kemiPool = [
        'Aww, you are the best! 🥰 Dinner next week?',
        'Dinner is on me this time! Let me know what day works.',
        'Haha, exactly! So excited for the weekend 🎉',
      ];
      return kemiPool[Math.floor(Math.random() * kemiPool.length)];
    }

    // 11. UNCLE FEMI: Wise Mentor
    if (username === 'femi') {
      if (text.includes('advice') || text.includes('work') || text.includes('life') || text.includes('career')) {
        return `Step by step, the mountain is climbed. Diligence and integrity will always set you apart, my son. Stay focused.`;
      }
      const femiPool = [
        'That is very good. Keep it up, young man.',
        'Small small, the work will grow. Consistency is key.',
        'Greet your parents for me. I am very proud of your progress.',
        'Hard work never fails. Stay focused.',
      ];
      return femiPool[Math.floor(Math.random() * femiPool.length)];
    }

    // Authentic fallback pool matching nudge-standalone
    const fallbackPool = [
      'Haha no way! 😂 Tell me everything.',
      'Say less. What time?',
      "I'm in! Bring good vibes.",
      'Lol you are impossible! But true.',
      'Okay okay, let me finish this and ping you back.',
      'Facts! 100%.',
      'Small world! What are you up to right now? 😄',
    ];
    return fallbackPool[Math.floor(Math.random() * fallbackPool.length)];
  }

  /**
   * Handle an incoming message sent to a conversation containing bots
   */
  public async handleMessage(conversationId: string, message: any, senderId: string, roomId?: string) {
    try {
      // Find bot members in this conversation
      const botMembersRes = await query<BotUser>(
        `SELECT u.id, u.username, u.display_name as "displayName", u.bio,
                u.avatar_url as "avatarUrl", u.avatar_kind as "avatarKind",
                u.is_bot as "isBot", u.bot_persona as "botPersona"
         FROM conversation_members cm
         JOIN users u ON cm.user_id = u.id
         WHERE cm.conversation_id = $1 AND u.is_bot = true AND u.id != $2`,
        [conversationId, senderId]
      );

      if (botMembersRes.rows.length === 0) return;

      // Check conversation type
      const convRes = await query<{ type: string; title: string }>(
        'SELECT type, title FROM conversations WHERE id = $1',
        [conversationId]
      );
      if (convRes.rowCount === 0) return;
      const conv = convRes.rows[0];

      // Get sender user info
      const senderRes = await query(
        'SELECT display_name as "displayName", username FROM users WHERE id = $1',
        [senderId]
      );
      const senderDisplayName = senderRes.rows[0]?.displayName || 'Friend';

      // For direct conversation, the other participant is the bot
      if (conv.type === 'direct') {
        const bot = botMembersRes.rows[0];
        await this.learnFromMessage(bot.id, senderId, message.body);
        const memories = await this.getMemories(bot.id, senderId);
        const replyText = this.generateReply(bot, senderDisplayName, message.body, memories);

        // Realistic typing indicator
        const delay = bot.botPersona?.replyDelayMs || 1000;
        realtimeGateway.sendToUser(senderId, {
          t: 'typing',
          d: { conversationId, userId: bot.id, isTyping: true },
        });

        setTimeout(async () => {
          try {
            // Stop typing
            realtimeGateway.sendToUser(senderId, {
              t: 'typing',
              d: { conversationId, userId: bot.id, isTyping: false },
            });

            // Increment seq & insert message
            const seqRes = await query(
              'UPDATE conversations SET last_seq = last_seq + 1, last_message_at = NOW() WHERE id = $1 RETURNING last_seq',
              [conversationId]
            );
            const nextSeq = seqRes.rows[0].last_seq;

            const newMsgRes = await query(
              `INSERT INTO messages (conversation_id, seq, sender_id, type, body, room_id, created_at)
               VALUES ($1, $2, $3, 'text', $4, $5, NOW())
               RETURNING *`,
              [conversationId, nextSeq, bot.id, replyText, roomId || null]
            );

            const row = newMsgRes.rows[0];
            const botMsg = {
              id: row.id,
              conversationId: row.conversation_id,
              roomId: row.room_id,
              seq: row.seq,
              senderId: row.sender_id,
              type: row.type,
              body: row.body,
              createdAt: row.created_at,
              sender: {
                id: bot.id,
                username: bot.username,
                displayName: bot.displayName,
                avatarUrl: bot.avatarUrl,
                avatarKind: bot.avatarKind as any,
              },
              reactions: [],
            };

            await realtimeGateway.broadcastToConversation(conversationId, {
              t: 'message.new',
              d: { conversationId, roomId, message: botMsg },
            });
          } catch (err) {
            console.error('[BotService] Error replying to direct message:', err);
          }
        }, delay);
      } else {
        // Group conversation: check if bot is explicitly mentioned or tagged, or reply in room
        const bodyLower = message.body.toLowerCase();
        for (const bot of botMembersRes.rows) {
          const isMentioned =
            bodyLower.includes(`@${bot.username.toLowerCase()}`) ||
            bodyLower.includes(`@${bot.displayName.toLowerCase()}`) ||
            bodyLower.includes(bot.displayName.toLowerCase());

          if (isMentioned) {
            await this.learnFromMessage(bot.id, senderId, message.body);
            const memories = await this.getMemories(bot.id, senderId);
            const replyText = this.generateReply(bot, senderDisplayName, message.body, memories);

            setTimeout(async () => {
              try {
                const seqRes = await query(
                  'UPDATE conversations SET last_seq = last_seq + 1, last_message_at = NOW() WHERE id = $1 RETURNING last_seq',
                  [conversationId]
                );
                const nextSeq = seqRes.rows[0].last_seq;

                const newMsgRes = await query(
                  `INSERT INTO messages (conversation_id, seq, sender_id, type, body, room_id, created_at)
                   VALUES ($1, $2, $3, 'text', $4, $5, NOW())
                   RETURNING *`,
                  [conversationId, nextSeq, bot.id, replyText, roomId || null]
                );

                const row = newMsgRes.rows[0];
                const botMsg = {
                  id: row.id,
                  conversationId: row.conversation_id,
                  roomId: row.room_id,
                  seq: row.seq,
                  senderId: row.sender_id,
                  type: row.type,
                  body: row.body,
                  createdAt: row.created_at,
                  sender: {
                    id: bot.id,
                    username: bot.username,
                    displayName: bot.displayName,
                    avatarUrl: bot.avatarUrl,
                    avatarKind: bot.avatarKind as any,
                  },
                  reactions: [],
                };

                await realtimeGateway.broadcastToConversation(conversationId, {
                  t: 'message.new',
                  d: { conversationId, roomId, message: botMsg },
                });
              } catch (err) {
                console.error('[BotService] Error replying to group message:', err);
              }
            }, 1000);
            break;
          }
        }
      }
    } catch (err) {
      console.error('[BotService] handleMessage error:', err);
    }
  }

  /**
   * Automatically play AI turn in Tic-Tac-Toe, Connect 4, or other games
   */
  public async handleGameMove(sessionId: string, humanUserId: string) {
    try {
      const sessionRes = await query(
        `SELECT gs.*, c.id as conv_id
         FROM game_sessions gs
         LEFT JOIN conversations c ON gs.conversation_id = c.id
         WHERE gs.id = $1`,
        [sessionId]
      );
      if (sessionRes.rowCount === 0) return;
      const session = sessionRes.rows[0];

      if (session.status !== 'in_progress') return;

      // Find the bot player
      const gid = normalizeGameKey(session.game_key);
      const state = session.state;
      const expectedTurnUserId = state.playerThem || state.playerO || state.playerYellow || state.playerOpp;
      if (!expectedTurnUserId) return;

      // Verify if expectedTurnUserId is a bot
      const botCheck = await query(
        'SELECT id, username, display_name FROM users WHERE id = $1 AND is_bot = true',
        [expectedTurnUserId]
      );
      if (botCheck.rowCount === 0) return; // not bot's turn

      const botUserId = botCheck.rows[0].id;
      const botName = botCheck.rows[0].display_name;
      const botUsername = botCheck.rows[0].username.toLowerCase();

      let chosenMove: any = null;
      let nextState = { ...state };
      let winnerId = null;
      let status = 'in_progress';

      if (gid === 'ttt') {
        const rawB = [...(state.b || state.board || Array(9).fill(''))];
        const b = rawB.map((c: string) => c === 'X' ? 'me' : c === 'O' ? 'them' : '');
        const mv = tttEngine.ai(b);
        chosenMove = +mv;
        b[chosenMove] = 'them';
        const boardWithO = rawB.slice();
        boardWithO[chosenMove] = 'O';
        const r = tl(b);
        nextState = { ...state, b, board: boardWithO, turn: 'X' };
        if (r) {
          status = 'completed';
          winnerId = r === 'draw' ? null : r === 'them' ? botUserId : humanUserId;
        }
      } else if (gid === 'c4') {
        const b = [...(state.b || state.board || Array(42).fill(''))];
        const mv = c4Engine.ai(b);
        chosenMove = +mv;
        const res = c4Engine.act(b, 'them', chosenMove);
        nextState = { ...state, b, board: b, last: res?.last, turn: 'me' };
        if (res?.end) {
          status = 'completed';
          winnerId = res.end === 'draw' ? null : res.end === 'them' ? botUserId : humanUserId;
        }
      } else if (gid === 'checkers') {
        const mv = checkersEngine.ai(state);
        if (mv) {
          chosenMove = mv;
          const res = checkersEngine.act(nextState, 'them', mv);
          if (!nextState.cont) nextState.turn = 'me';
          if (res?.end) {
            status = 'completed';
            winnerId = res.end === 'draw' ? null : res.end === 'them' ? botUserId : humanUserId;
          }
        }
      } else if (gid === 'chess') {
        const mv = chessEngine.ai(state, 'b');
        if (mv) {
          chosenMove = mv;
          const res = chessEngine.act(nextState, 'b', mv);
          nextState.turn = 'me';
          if (res?.end) {
            status = 'completed';
            winnerId = res.end === 'draw' ? null : res.end === 'b' ? botUserId : humanUserId;
          }
        }
      }

      if (chosenMove !== null) {
        // Play with 700ms delay for realism
        setTimeout(async () => {
          try {
            await query(
              `UPDATE game_sessions
               SET state = $2, winner_id = $3, status = $4, updated_at = NOW()
               WHERE id = $1`,
              [sessionId, JSON.stringify(nextState), winnerId, status]
            );

            const eventPayload = {
              t: 'game.state' as const,
              d: {
                sessionId,
                state: nextState,
                winnerId: winnerId || undefined,
                status,
              },
            };

              if (session.conversation_id) {
                await realtimeGateway.broadcastToConversation(session.conversation_id, eventPayload);

                // If game ended, bot sends fun ending reaction message tailored to persona!
                if (status === 'completed') {
                  let endText = '';
                  if (botUsername === 'tola') {
                    endText =
                      winnerId === botUserId
                        ? `Hahaha 3-0! I told you I've been practicing! You can't beat the master 😎 Rematch? 🎮`
                        : winnerId === humanUserId
                        ? `Ah no way!! My finger slipped! Hit Rematch right now, that doesn't count 😂`
                        : `A draw! We are evenly matched bro. One more round to settle this! 🤝`;
                  } else if (botUsername === 'mum') {
                    endText =
                      winnerId === botUserId
                        ? `Haha, you see? Never underestimate your mother! Now go and drink water and eat some food ❤️`
                        : winnerId === humanUserId
                        ? `Very sharp, Dayo! You have always been clever. I am very proud of you 😊`
                        : `A draw! We are both smart in this house. God bless you, my dear.`;
                  } else if (botUsername === 'chidi') {
                    endText =
                      winnerId === botUserId
                        ? `Good game. My minimax evaluation tree foresaw that corner trap. Always test edge cases! 💻`
                        : winnerId === humanUserId
                        ? `Impressive! You found an unhandled branch in my heuristics. Rematch anytime 🚀`
                        : `Deadlock detected. Zero memory leaks though. Well played 🤝`;
                  } else {
                    endText =
                      winnerId === botUserId
                        ? `GG! That was a close one! Rematch anytime 😎`
                        : winnerId === humanUserId
                        ? `Well played!! You got me this time 👏`
                        : `A draw! We are evenly matched 🤝`;
                  }

                  const seqRes = await query(
                    'UPDATE conversations SET last_seq = last_seq + 1, last_message_at = NOW() WHERE id = $1 RETURNING last_seq',
                    [session.conversation_id]
                  );
                  const nextSeq = seqRes.rows[0].last_seq;

                  const endMsg = await query(
                    `INSERT INTO messages (conversation_id, seq, sender_id, type, body, created_at)
                     VALUES ($1, $2, $3, 'text', $4, NOW())
                     RETURNING *`,
                    [session.conversation_id, nextSeq, botUserId, endText]
                  );

                  const endRow = endMsg.rows[0];
                  const botEndMsg = {
                    id: endRow.id,
                    conversationId: endRow.conversation_id,
                    seq: endRow.seq,
                    senderId: endRow.sender_id,
                    type: endRow.type,
                    body: endRow.body,
                    createdAt: endRow.created_at,
                    sender: { id: botUserId || undefined, displayName: botName },
                    reactions: [],
                  };

                  await realtimeGateway.broadcastToConversation(session.conversation_id, {
                    t: 'message.new',
                    d: {
                      conversationId: session.conversation_id,
                      message: botEndMsg,
                    },
                  });
                }
              }
            } catch (err) {
              console.error('[BotService] Error in bot game move:', err);
            }
          }, 400);
        }
    } catch (err) {
      console.error('[BotService] handleGameMove error:', err);
    }
  }

  /**
   * Handle when a bot is invited to a group
   */
  public async handleGroupInvite(conversationId: string, botId: string) {
    try {
      const botRes = await query(
        'SELECT id, username, display_name FROM users WHERE id = $1 AND is_bot = true',
        [botId]
      );
      if (botRes.rowCount === 0) return;
      const bot = botRes.rows[0];

      // Send greeting in General room after 1s
      setTimeout(async () => {
        try {
          const greetings: Record<string, string> = {
            tola: "Yo everyone! Thanks for adding me. Who's setting up the tournament? 🎮⚽",
            chidi: "Hey everyone! Glad to join the squad. Let's ship some great things 🚀",
            amaka: "Hey guys! Thanks for adding me. Let's keep this organized 📚",
            mum: "Hello my children! Hope everyone is doing well and staying safe ❤️",
            seyi: "What's up people! Good to be here 😄",
          };

          const text = greetings[bot.username.toLowerCase()] || `Hey everyone! Excited to join this group 🎉`;

          const seqRes = await query(
            'UPDATE conversations SET last_seq = last_seq + 1, last_message_at = NOW() WHERE id = $1 RETURNING last_seq',
            [conversationId]
          );
          const nextSeq = seqRes.rows[0].last_seq;

          // Get general room id if exists
          const roomRes = await query(
            'SELECT id FROM rooms WHERE conversation_id = $1 AND name = $2 LIMIT 1',
            [conversationId, 'General']
          );
          const roomId = roomRes.rows[0]?.id || null;

          const msgRes = await query(
            `INSERT INTO messages (conversation_id, seq, sender_id, type, body, room_id, created_at)
             VALUES ($1, $2, $3, 'text', $4, $5, NOW())
             RETURNING *`,
            [conversationId, nextSeq, bot.id, text, roomId]
          );

          const invRow = msgRes.rows[0];
          const inviteMsg = {
            id: invRow.id,
            conversationId: invRow.conversation_id,
            roomId: invRow.room_id,
            seq: invRow.seq,
            senderId: invRow.sender_id,
            type: invRow.type,
            body: invRow.body,
            createdAt: invRow.created_at,
            sender: { id: bot.id, displayName: bot.display_name },
            reactions: [],
          };

          await realtimeGateway.broadcastToConversation(conversationId, {
            t: 'message.new',
            d: {
              conversationId,
              roomId,
              message: inviteMsg,
            },
          });
        } catch (err) {
          console.error('[BotService] Error in group greeting:', err);
        }
      }, 1200);
    } catch (err) {
      console.error('[BotService] handleGroupInvite error:', err);
    }
  }

  private checkWin(board: (string | null)[], symbol: string): boolean {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    return lines.some(([a, b, c]) => board[a] === symbol && board[b] === symbol && board[c] === symbol);
  }

  /**
   * Determine simulated bot presence based on time of day
   */
  public getBotPresence(username: string, now = new Date()): { online: boolean; lastSeenAt: string } {
    const u = username.toLowerCase();
    const hour = now.getHours(); // 0-23
    let online = false;
    let minutesAgo = 15;

    switch (u) {
      case 'tola':
        // Tola is very active gaming & chatting: 9am - 1am
        online = (hour >= 9 || hour <= 1);
        minutesAgo = 12;
        break;
      case 'chidi':
        // Chidi: late night dev, 11am - 3am
        online = (hour >= 11 || hour <= 3);
        minutesAgo = 8;
        break;
      case 'mum':
        // Mum: 6am - 10pm
        online = (hour >= 6 && hour <= 22);
        minutesAgo = 30;
        break;
      case 'amaka':
        // Amaka: 8am - 11pm
        online = (hour >= 8 && hour <= 23);
        minutesAgo = 18;
        break;
      case 'dami':
        // Dami: 10am - 7pm
        online = (hour >= 10 && hour <= 19);
        minutesAgo = 45;
        break;
      case 'seyi':
        // Seyi: 7am - 11pm
        online = (hour >= 7 && hour <= 23);
        minutesAgo = 25;
        break;
      case 'jide':
        // Jide: 6am-9am, 5pm-9pm
        online = (hour >= 6 && hour <= 9) || (hour >= 17 && hour <= 21);
        minutesAgo = 60;
        break;
      case 'kemi':
        // Kemi: 12pm - 12am
        online = (hour >= 12 || hour === 0);
        minutesAgo = 40;
        break;
      case 'sade':
        // Sade: 9am - 10pm
        online = (hour >= 9 && hour <= 22);
        minutesAgo = 35;
        break;
      default:
        online = (hour >= 9 && hour <= 22);
        minutesAgo = 20;
    }

    const lastSeenDate = new Date(now.getTime() - minutesAgo * 60 * 1000);
    return {
      online,
      lastSeenAt: lastSeenDate.toISOString(),
    };
  }

  /**
   * Ensure all bots have active stories so the story tray never shows half empty or missing bots
   */
  public async ensureActiveStories() {
    try {
      const botsRes = await query('SELECT id, username, display_name FROM users WHERE is_bot = true');
      if (botsRes.rows.length === 0) return;

      const templates: Record<string, Array<{ type: string; text?: string; background: string; audience?: string; data?: any }>> = {
        tola: [
          {
            type: 'poll',
            background: 'linear-gradient(135deg, #1A1F35, #0F6B58)',
            audience: 'public',
            data: {
              poll: {
                q: 'Matchday prediction: Arsenal vs City! Who takes it? ⚽',
                opts: [
                  { t: 'Arsenal win 🔴', v: [] },
                  { t: 'City win 🔵', v: [] },
                  { t: 'Draw & drama', v: [] },
                ]
              }
            }
          },
          {
            type: 'text',
            text: 'Just finished 5 straight rounds of Tic-Tac-Toe. Who dares challenge me in Connect 4 next? 🎮💥',
            background: 'linear-gradient(135deg, #10B981, #064E3B)',
            audience: 'public',
          },
        ],
        chidi: [
          {
            type: 'qa',
            background: 'linear-gradient(135deg, #2D1B69, #1D2A44)',
            audience: 'public',
            data: {
              qa: {
                q: 'Ask me anything about backend architecture & shipping fast 🚀',
                answers: [
                  { by: 'Dami', text: 'How do you handle zero-downtime DB migrations?', t: Date.now() - 3600000 }
                ]
              }
            }
          },
          {
            type: 'text',
            text: 'Coffee is 90% of my git commits. Deployed the new presence service with 0 downtime ☕💻',
            background: 'linear-gradient(135deg, #1E293B, #0F172A)',
            audience: 'public',
          }
        ],
        sade: [
          {
            type: 'text',
            text: 'Golden hour from the Lekki-Ikoyi link bridge never gets old 🌇✨',
            background: 'linear-gradient(135deg, #FF5E62, #FF9966)',
            audience: 'friends',
          },
          {
            type: 'text',
            text: 'Developing 35mm film from Tarkwa Bay 📷🌊 The colors turned out magical!',
            background: 'linear-gradient(135deg, #EC4899, #8B5CF6)',
            audience: 'public',
          }
        ],
        amaka: [
          {
            type: 'text',
            text: 'Library until midnight. Past questions survivor! 📚✨ Final year will not defeat me.',
            background: 'linear-gradient(135deg, #0BA360, #3CBA92)',
            audience: 'friends',
          },
          {
            type: 'poll',
            background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
            audience: 'friends',
            data: {
              poll: {
                q: 'Study fuel: Coffee or Green Tea? 🍵☕',
                opts: [
                  { t: 'Iced Coffee ☕', v: [] },
                  { t: 'Matcha / Green Tea 🍵', v: [] },
                  { t: 'Cold water & pure panic 😭', v: [] },
                ]
              }
            }
          }
        ],
        kemi: [
          {
            type: 'text',
            text: 'Birthday week recap: Thank you everyone for the endless love and prayers! 🎂🥰',
            background: 'linear-gradient(135deg, #D4145A, #FBB03B)',
            audience: 'friends',
          },
          {
            type: 'text',
            text: 'Friday brunch mood unlocked 🥂 Good food, good friends, no stress.',
            background: 'linear-gradient(135deg, #F43F5E, #FB7185)',
            audience: 'public',
          }
        ],
        seyi: [
          {
            type: 'text',
            text: 'Lagos traffic tested me today, but patience + good Afrobeats playlist saved the day 🚗🎶',
            background: 'linear-gradient(135deg, #4F46E5, #06B6D4)',
            audience: 'public',
          }
        ],
        dami: [
          {
            type: 'text',
            text: 'Polishing design tokens and micro-interactions ✨ The devil is truly in the details.',
            background: 'linear-gradient(135deg, #8B5CF6, #3B82F6)',
            audience: 'public',
          }
        ],
        mum: [
          {
            type: 'text',
            text: 'Good morning my children! Hope you are drinking enough water and resting well today ❤️🙏',
            background: 'linear-gradient(135deg, #F59E0B, #D97706)',
            audience: 'friends',
          }
        ]
      };

      for (const bot of botsRes.rows) {
        const u = bot.username.toLowerCase();
        // Check active story
        const activeRes = await query(
          'SELECT id FROM stories WHERE author_id = $1 AND expires_at > NOW() LIMIT 1',
          [bot.id]
        );
        if (activeRes.rowCount === 0) {
          const tList = templates[u] || [
            {
              type: 'text',
              text: `Checking in! Wishing everyone a productive day ahead ✨`,
              background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              audience: 'public',
            }
          ];
          const chosen = tList[Math.floor(Math.random() * tList.length)];
          await query(
            `INSERT INTO stories (author_id, type, text, background, audience, data, expires_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW() + INTERVAL '24 hours')`,
            [
              bot.id,
              chosen.type,
              chosen.text || null,
              chosen.background,
              chosen.audience || 'public',
              chosen.data ? JSON.stringify(chosen.data) : null,
            ]
          );
          console.log(`[BotService] Refreshed active story for bot @${u}`);
        }
      }
    } catch (err) {
      console.error('[BotService] Error in ensureActiveStories:', err);
    }
  }
}

export const botService = new BotService();

// Periodically keep stories active
botService.ensureActiveStories();
setInterval(() => {
  botService.ensureActiveStories();
}, 30 * 60 * 1000);
