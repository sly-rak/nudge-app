import { query } from '../../db/index.js';
import { realtimeGateway } from '../../realtime/gateway.js';

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

    // Extract likes/interests
    const likeMatch = lower.match(/(?:i love|i really like|i like|i enjoy)\s+([^.!?,\n]{3,35})/i);
    if (likeMatch && likeMatch[1]) {
      extracted.push({ key: 'interest', value: likeMatch[1].trim() });
    }

    // Extract work/project
    const workMatch = lower.match(/(?:i am building|i'm building|working on|studying|building)\s+([^.!?,\n]{3,35})/i);
    if (workMatch && workMatch[1]) {
      extracted.push({ key: 'project', value: workMatch[1].trim() });
    }

    // Extract food / meal
    const foodMatch = lower.match(/(?:i ate|eating|had some|cooked|eating)\s+([^.!?,\n]{3,30})/i);
    if (foodMatch && foodMatch[1]) {
      extracted.push({ key: 'recent_food', value: foodMatch[1].trim() });
    }

    // Extract mood
    const moodMatch = lower.match(/(?:i am feeling|i'm feeling|feeling|i feel)\s+([a-zA-Z\s]{3,20})/i);
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
    const text = messageText.toLowerCase();
    const username = bot.username.toLowerCase();

    // Check if user is asking what the bot remembers/knows
    if (text.includes('what do you know about me') || text.includes('who am i') || text.includes('do you remember')) {
      const memKeys = Object.keys(memories);
      if (memKeys.length === 0) {
        return `I remember every conversation with you, ${userDisplayName}! Tell me more about what you're up to today.`;
      }
      const facts = [];
      if (memories.name) facts.push(`your name is ${memories.name}`);
      if (memories.project) facts.push(`you're working on ${memories.project}`);
      if (memories.interest) facts.push(`you love ${memories.interest}`);
      if (memories.recent_food) facts.push(`you recently had ${memories.recent_food}`);
      return `Of course I remember! I know ${facts.join(', and ')}. You can't slip anything past me! 😄`;
    }

    // Persona-specific replies
    if (username === 'tola') {
      if (text.includes('fifa') || text.includes('match') || text.includes('game') || text.includes('play')) {
        return `Haha you know I'm ready! Saturday rematch is on. Have you been practicing or am I winning 3-0 again? ⚽🎮`;
      }
      if (text.includes('food') || text.includes('eat') || text.includes('jollof')) {
        return `Say less. Lagos jollof with extra plantain or we're not talking! When are we getting lunch? 🍛`;
      }
      if (memories.project && (text.includes('code') || text.includes('work') || text.includes('app'))) {
        return `How's ${memories.project} coming along? Make sure you take a break before your screen burns your eyes bro 😂`;
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

    if (username === 'mum') {
      if (text.includes('eat') || text.includes('food') || text.includes('hungry')) {
        return `Make sure you eat proper food, my dear. Not just snacks and coffee! Health is wealth. ❤️`;
      }
      if (text.includes('tired') || text.includes('stress') || text.includes('work')) {
        return `Ehya, sorry dear. Please don't overwork yourself. Sleep early tonight and remember to drink lots of water. God bless you. 🙏`;
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

    if (username === 'chidi') {
      if (text.includes('bug') || text.includes('error') || text.includes('code') || text.includes('pr')) {
        return `Can you share the stack trace or open a PR? I can review it right after lunch. TypeScript is your best friend here! 💻`;
      }
      if (text.includes('deploy') || text.includes('release') || text.includes('shipping')) {
        return `Tests are passing and Neon migrations are clean. Go ahead and ship it! 🚀`;
      }
      if (memories.project) {
        return `How are the modules in ${memories.project} structured? Let me know if you want to pair on the architecture.`;
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

    if (username === 'amaka') {
      if (text.includes('exam') || text.includes('study') || text.includes('test') || text.includes('read')) {
        return `Past questions survivor here! Let me know if you need week 6 lecture notes or study past questions together. 📚`;
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

    if (username === 'seyi') {
      if (text.includes('traffic') || text.includes('bridge') || text.includes('lekki') || text.includes('road')) {
        return `Third Mainland is a gamble as always! If you're leaving, leave before 4pm or you'll sleep on the bridge 😅`;
      }
      const seyiPool = [
        "Ha! Don't tell Mum I said so, but you're right 😂",
        'I will pick you up at the junction, just ping me when you are close.',
        'Bring me something nice from the city 😄',
        'Okay okay, weekend it is. Drive safe!',
      ];
      return seyiPool[Math.floor(Math.random() * seyiPool.length)];
    }

    if (username === 'dami') {
      const damiPool = [
        'Thanks! I will review the design tokens and forward to the client.',
        'Can we sync at 3pm? Just a 10 min standup.',
        'Great, that layout looks so crisp! What font size did you use?',
        'Let me check Figma and get back to you shortly.',
      ];
      return damiPool[Math.floor(Math.random() * damiPool.length)];
    }

    if (username === 'jide') {
      if (text.includes('gym') || text.includes('workout') || text.includes('fitness')) {
        return `Pull-ups first, no excuses! Be at the gym by 5:55am sharp. Bring your water bottle 🏋️‍♂️`;
      }
      const jidePool = [
        'Pull-ups first, no excuses.',
        'Be there by 5:55 sharp tomorrow!',
        'Skipping leg day again? 😂 Not on my watch.',
        'Drink your protein shake and get some rest.',
      ];
      return jidePool[Math.floor(Math.random() * jidePool.length)];
    }

    if (username === 'kemi') {
      const kemiPool = [
        'Aww, you are the best! 🥰 Dinner next week?',
        'Dinner is on me this time! Let me know what day works.',
        'Haha, exactly! So excited for the weekend 🎉',
      ];
      return kemiPool[Math.floor(Math.random() * kemiPool.length)];
    }

    if (username === 'femi') {
      const femiPool = [
        'That is very good. Keep it up, young man.',
        'Small small, the work will grow. Consistency is key.',
        'Greet your parents for me. I am very proud of your progress.',
        'Hard work never fails. Stay focused.',
      ];
      return femiPool[Math.floor(Math.random() * femiPool.length)];
    }

    // Default bot reply
    return `Hey ${userDisplayName}! Got your message: "${messageText}". Let's connect soon! 🚀`;
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
        const delay = bot.botPersona?.replyDelayMs || 1200;
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

            const botMsg = {
              ...newMsgRes.rows[0],
              sender: {
                id: bot.id,
                username: bot.username,
                displayName: bot.displayName,
                avatarUrl: bot.avatarUrl,
                avatarKind: bot.avatarKind,
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

                const botMsg = {
                  ...newMsgRes.rows[0],
                  sender: {
                    id: bot.id,
                    username: bot.username,
                    displayName: bot.displayName,
                    avatarUrl: bot.avatarUrl,
                    avatarKind: bot.avatarKind,
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
   * Automatically play AI turn in Tic-Tac-Toe or other games
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

      // Find the other player (the bot)
      let botUserId: string | null = null;
      if (session.game_key === 'tictactoe') {
        const state = session.state;
        const playerX = state.playerX;
        const playerO = state.playerO;

        // Check if current turn belongs to a bot
        const currentTurn = state.turn; // 'X' or 'O'
        const expectedTurnUserId = currentTurn === 'X' ? playerX : playerO;

        // Verify if expectedTurnUserId is a bot
        const botCheck = await query(
          'SELECT id, username, display_name FROM users WHERE id = $1 AND is_bot = true',
          [expectedTurnUserId]
        );
        if (botCheck.rowCount === 0) return; // not bot's turn

        botUserId = botCheck.rows[0].id;
        const botName = botCheck.rows[0].display_name;

        // AI Logic for Tic-Tac-Toe
        const board: (string | null)[] = [...state.board];
        const botSymbol = currentTurn;
        const oppSymbol = botSymbol === 'X' ? 'O' : 'X';

        const winningLines = [
          [0, 1, 2], [3, 4, 5], [6, 7, 8],
          [0, 3, 6], [1, 4, 7], [2, 5, 8],
          [0, 4, 8], [2, 4, 6]
        ];

        // 1. Try to win
        let chosenMove = -1;
        for (let i = 0; i < 9; i++) {
          if (!board[i]) {
            board[i] = botSymbol;
            if (this.checkWin(board, botSymbol)) {
              chosenMove = i;
              board[i] = null;
              break;
            }
            board[i] = null;
          }
        }

        // 2. Block opponent
        if (chosenMove < 0) {
          for (let i = 0; i < 9; i++) {
            if (!board[i]) {
              board[i] = oppSymbol;
              if (this.checkWin(board, oppSymbol)) {
                chosenMove = i;
                board[i] = null;
                break;
              }
              board[i] = null;
            }
          }
        }

        // 3. Take center
        if (chosenMove < 0 && !board[4]) {
          chosenMove = 4;
        }

        // 4. Take corners
        if (chosenMove < 0) {
          const corners = [0, 2, 6, 8].filter((idx) => !board[idx]);
          if (corners.length > 0) {
            chosenMove = corners[Math.floor(Math.random() * corners.length)];
          }
        }

        // 5. Take any remaining
        if (chosenMove < 0) {
          const remaining = [1, 3, 5, 7].filter((idx) => !board[idx]);
          if (remaining.length > 0) {
            chosenMove = remaining[0];
          }
        }

        if (chosenMove >= 0) {
          // Play with 750ms delay for realism
          setTimeout(async () => {
            try {
              board[chosenMove] = botSymbol;
              let winnerId = null;
              let status = 'in_progress';

              if (this.checkWin(board, botSymbol)) {
                winnerId = botUserId;
                status = 'completed';
              } else if (board.every((cell) => cell !== null)) {
                status = 'completed'; // draw
              }

              const nextTurn = botSymbol === 'X' ? 'O' : 'X';
              const updatedState = { ...state, board, turn: nextTurn };

              await query(
                `UPDATE game_sessions
                 SET state = $2, winner_id = $3, status = $4, updated_at = NOW()
                 WHERE id = $1`,
                [sessionId, JSON.stringify(updatedState), winnerId, status]
              );

              const eventPayload = {
                t: 'game.state' as const,
                d: {
                  sessionId,
                  state: updatedState,
                  winnerId: winnerId || undefined,
                  status,
                },
              };

              if (session.conversation_id) {
                await realtimeGateway.broadcastToConversation(session.conversation_id, eventPayload);

                // If game ended, bot sends fun ending reaction message
                if (status === 'completed') {
                  const endText =
                    winnerId === botUserId
                      ? `GG! That was a close one! Rematch anytime 😎`
                      : winnerId === humanUserId
                      ? `Well played!! You got me this time 👏`
                      : `A draw! We are evenly matched 🤝`;

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

                  await realtimeGateway.broadcastToConversation(session.conversation_id, {
                    t: 'message.new',
                    d: {
                      conversationId: session.conversation_id,
                      message: {
                        ...endMsg.rows[0],
                        sender: { id: botUserId, displayName: botName },
                        reactions: [],
                      },
                    },
                  });
                }
              }
            } catch (err) {
              console.error('[BotService] Error in bot game move:', err);
            }
          }, 700);
        }
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

          await realtimeGateway.broadcastToConversation(conversationId, {
            t: 'message.new',
            d: {
              conversationId,
              roomId,
              message: {
                ...msgRes.rows[0],
                sender: { id: bot.id, displayName: bot.display_name },
                reactions: [],
              },
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
}

export const botService = new BotService();
