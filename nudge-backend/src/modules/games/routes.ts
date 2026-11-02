import { FastifyPluginAsync } from 'fastify';
import { query } from '../../db/index.js';
import { realtimeGateway } from '../../realtime/gateway.js';
import { botService } from '../bot/service.js';
import {
  GM,
  GORDER,
  normalizeGameKey,
  tttEngine,
  tl,
  c4Engine,
  checkersEngine,
  chessEngine,
  initTriviaRound,
  initWordRound,
  rpsBeats,
  rpsTally,
  TQ,
  WL,
  oth,
} from '@nudge/shared';

export const gameRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('onRequest', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.status(401).send({ error: { code: 'UNAUTHENTICATED', message: 'Unauthorized' } });
    }
  });

  // 1. Game Catalog (All 7 games matching nudge-standalone GM registry)
  fastify.get('/', async () => {
    const games = GORDER.map((k) => ({
      key: k,
      name: GM[k].n,
      icon: GM[k].e,
      description: GM[k].d,
      isParty: Boolean(GM[k].par),
      players: GM[k].par ? 4 : 2,
    }));
    return { games };
  });

  // 2. Create Game Session
  fastify.post('/sessions', async (request) => {
    const decoded = request.user as { id: string };
    const { gameKey = 'ttt', conversationId, opponentId } = request.body as any;
    const gid = normalizeGameKey(gameKey);

    let targetOpponentId = opponentId;

    if (!targetOpponentId && conversationId) {
      const otherRes = await query(
        'SELECT user_id FROM conversation_members WHERE conversation_id = $1 AND user_id != $2 LIMIT 1',
        [conversationId, decoded.id]
      );
      if (otherRes.rowCount && otherRes.rowCount > 0) {
        targetOpponentId = otherRes.rows[0].user_id;
      }
    }

    if (!targetOpponentId) {
      const defaultBot = await query(
        `SELECT id FROM users WHERE (username = 'tola' OR is_bot = true) AND id != $1 ORDER BY (username = 'tola') DESC LIMIT 1`,
        [decoded.id]
      );
      if (defaultBot.rowCount && defaultBot.rowCount > 0) {
        targetOpponentId = defaultBot.rows[0].id;
      }
    }

    // Initialize board state according to game engine
    let initialState: Record<string, any> = {};
    if (gid === 'ttt') {
      const b = Array(9).fill('');
      initialState = {
        b,
        board: b,
        turn: 'X',
        playerX: decoded.id,
        playerO: targetOpponentId || null,
        playerMe: decoded.id,
        playerThem: targetOpponentId || null,
      };
    } else if (gid === 'c4') {
      const b = Array(42).fill('');
      initialState = {
        b,
        board: b,
        last: -1,
        turn: 'me',
        playerMe: decoded.id,
        playerThem: targetOpponentId || null,
      };
    } else if (gid === 'checkers') {
      const s = checkersEngine.init();
      initialState = {
        ...s,
        turn: 'me',
        playerMe: decoded.id,
        playerThem: targetOpponentId || null,
      };
    } else if (gid === 'chess') {
      const s = chessEngine.init('w');
      initialState = {
        ...s,
        turn: 'me',
        first: 'me',
        playerMe: decoded.id,
        playerThem: targetOpponentId || null,
      };
    } else if (gid === 'rps') {
      initialState = {
        rd: [],
        playerMe: decoded.id,
        playerThem: targetOpponentId || null,
      };
    } else if (gid === 'trivia') {
      initialState = {
        ...initTriviaRound(),
        playerMe: decoded.id,
        playerThem: targetOpponentId || null,
      };
    } else if (gid === 'word') {
      initialState = {
        ...initWordRound(),
        playerMe: decoded.id,
        playerThem: targetOpponentId || null,
      };
    }

    const res = await query(
      `INSERT INTO game_sessions (game_key, conversation_id, state, created_by, status)
       VALUES ($1, $2, $3, $4, 'in_progress')
       RETURNING id, game_key as "gameKey", conversation_id as "conversationId", state, status,
                 created_by as "createdBy", created_at as "createdAt"`,
      [gid, conversationId || null, JSON.stringify(initialState), decoded.id]
    );

    const session = res.rows[0];

    // Fetch opponent info
    let opponent = null;
    if (targetOpponentId) {
      const oppRes = await query(
        `SELECT id, username, display_name as "displayName", bio,
                avatar_url as "avatarUrl", avatar_kind as "avatarKind",
                is_bot as "isBot", bot_persona as "botPersona"
         FROM users WHERE id = $1`,
        [targetOpponentId]
      );
      if (oppRes.rowCount && oppRes.rowCount > 0) {
        opponent = oppRes.rows[0];
      }
    }

    // Broadcast or create in-chat message if conversationId provided
    if (conversationId) {
      const seqRes = await query(
        'UPDATE conversations SET last_seq = last_seq + 1, last_message_at = NOW() WHERE id = $1 RETURNING last_seq',
        [conversationId]
      );
      const nextSeq = seqRes.rows[0].last_seq;

      const gMeta = GM[gid] || { n: 'Game', e: '🎮' };
      const gameCard = {
        gid,
        st: 'playing' as const,
        by: 'me',
        turn: 'me',
        t0: Date.now(),
        who: ['You', opponent?.displayName || 'Opponent'],
        nm: opponent?.displayName || 'Opponent',
        sessionId: session.id,
      };

      const gameMsg = await query(
        `INSERT INTO messages (conversation_id, seq, sender_id, type, body, media_metadata, created_at)
         VALUES ($1, $2, $3, 'game', $4, $5, NOW())
         RETURNING *`,
        [
          conversationId,
          nextSeq,
          decoded.id,
          `Started a duel in ${gMeta.n}! ${gMeta.e}`,
          JSON.stringify({ game: gameCard }),
        ]
      );

      const senderRes = await query('SELECT display_name as "displayName" FROM users WHERE id = $1', [decoded.id]);
      const row = gameMsg.rows[0];
      await realtimeGateway.broadcastToConversation(conversationId, {
        t: 'message.new',
        d: {
          conversationId,
          message: {
            id: row.id,
            conversationId: row.conversation_id,
            roomId: row.room_id,
            seq: row.seq,
            senderId: row.sender_id,
            type: row.type,
            body: row.body,
            mediaMetadata: { game: gameCard },
            createdAt: row.created_at,
            sender: { id: decoded.id, displayName: senderRes.rows[0]?.displayName || 'Player' },
            reactions: [],
          },
        },
      });
    }

    return { session, opponent };
  });

  // 3. Get Game Session
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

    const session = res.rows[0];
    let opponent = null;
    const oppId = session.state?.playerThem || session.state?.playerO || session.state?.playerYellow || session.state?.playerOpp;
    if (oppId) {
      const oppRes = await query(
        `SELECT id, username, display_name as "displayName", bio,
                avatar_url as "avatarUrl", avatar_kind as "avatarKind",
                is_bot as "isBot", bot_persona as "botPersona"
         FROM users WHERE id = $1`,
        [oppId]
      );
      if (oppRes.rowCount && oppRes.rowCount > 0) {
        opponent = oppRes.rows[0];
      }
    }

    return { session, opponent };
  });

  // 4. Make Move in Game Session
  fastify.post('/sessions/:id/move', async (request, reply) => {
    const decoded = request.user as { id: string };
    const { id } = request.params as { id: string };
    const { move, action, who = 'me' } = request.body as any;

    const sessionRes = await query('SELECT * FROM game_sessions WHERE id = $1', [id]);
    if (sessionRes.rowCount === 0) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Game session not found' } });
    }
    const session = sessionRes.rows[0];
    const gid = normalizeGameKey(session.game_key);

    let updatedState = { ...session.state };
    let winnerId = session.winner_id;
    let status = session.status;
    const actArg = action !== undefined ? action : move?.action !== undefined ? move.action : move?.index;

    // Execute Move across the 7 engines
    if (gid === 'ttt') {
      const b = [...(updatedState.b || updatedState.board || Array(9).fill(''))];
      const i = +actArg;
      if (!b[i]) {
        const mark = updatedState.turn === 'O' ? 'O' : 'X';
        b[i] = mark;
        updatedState.b = b;
        updatedState.board = b;
        const normalizedForTl = b.map((c: string) => c === 'X' ? 'me' : c === 'O' ? 'them' : c);
        const r = tl(normalizedForTl);
        const nextTurn = mark === 'X' ? 'O' : 'X';
        updatedState.turn = nextTurn;
        if (r) {
          status = 'completed';
          winnerId = r === 'draw' ? null : r === 'me' ? session.created_by : (updatedState.playerThem || updatedState.playerO);
        }
      }
    } else if (gid === 'c4') {
      const b = [...(updatedState.b || updatedState.board || Array(42).fill(''))];
      const res = c4Engine.act(b, who, actArg);
      if (res) {
        updatedState.b = b;
        updatedState.board = b;
        updatedState.last = res.last;
        updatedState.turn = oth(who);
        if (res.end) {
          status = 'completed';
          winnerId = res.end === 'draw' ? null : res.end === 'me' ? session.created_by : updatedState.playerThem;
        }
      }
    } else if (gid === 'checkers') {
      const res = checkersEngine.act(updatedState, who, String(actArg));
      if (res) {
        if (!updatedState.cont) {
          updatedState.turn = oth(who);
        }
        if (res.end) {
          status = 'completed';
          winnerId = res.end === 'draw' ? null : res.end === 'me' ? session.created_by : updatedState.playerThem;
        }
      }
    } else if (gid === 'chess') {
      const whoCol = who === updatedState.first ? (updatedState.w || 'w') : ((updatedState.w || 'w') === 'w' ? 'b' : 'w');
      const res = chessEngine.act(updatedState, whoCol, String(actArg));
      if (res) {
        updatedState.turn = oth(who);
        if (res.end) {
          status = 'completed';
          winnerId = res.end === 'draw' ? null : res.end === whoCol ? session.created_by : updatedState.playerThem;
        }
      }
    } else if (gid === 'rps') {
      const userChoice = String(actArg).toLowerCase();
      const oppChoices = ['r', 'p', 's'];
      const oppChoice = oppChoices[Math.floor(Math.random() * 3)];
      updatedState.rd = updatedState.rd || [];
      updatedState.rd.push({ me: userChoice, them: oppChoice });
      const tally = rpsTally(updatedState.rd);
      if (tally.me >= 2) {
        status = 'completed';
        winnerId = session.created_by;
      } else if (tally.them >= 2) {
        status = 'completed';
        winnerId = updatedState.playerThem;
      } else if (updatedState.rd.length >= 5) {
        status = 'completed';
        winnerId = tally.me > tally.them ? session.created_by : tally.me < tally.them ? updatedState.playerThem : null;
      }
    } else if (gid === 'trivia') {
      if (actArg === 'next') {
        updatedState.fb = null;
        updatedState.i++;
        if (updatedState.i >= 5) {
          status = 'completed';
          winnerId = updatedState.score >= 3 ? session.created_by : updatedState.playerThem;
        }
      } else if (updatedState.fb == null) {
        const p = +actArg;
        const q = updatedState.qs[updatedState.i];
        if (q && p >= 0 && p < 4) {
          updatedState.fb = { p };
          if (p === q.a) {
            updatedState.score++;
          }
        }
      }
    } else if (gid === 'word') {
      const w = updatedState.ws[updatedState.i];
      if (actArg === 'skip') {
        updatedState.i++;
        updatedState.msg = 'Skipped';
      } else if (String(actArg).startsWith('g:')) {
        const g = String(actArg).slice(2).trim().toUpperCase();
        if (w && g === w.w) {
          updatedState.solved++;
          updatedState.i++;
          updatedState.msg = 'Correct!';
        } else {
          updatedState.msg = 'Not quite, try again';
        }
      }
      if (updatedState.i >= 5) {
        status = 'completed';
        winnerId = updatedState.solved >= 3 ? session.created_by : updatedState.playerThem;
      }
    }

    await query(
      `UPDATE game_sessions
       SET state = $2, winner_id = $3, status = $4, updated_at = NOW()
       WHERE id = $1`,
      [id, JSON.stringify(updatedState), winnerId, status]
    );

    const eventPayload = {
      t: 'game.state' as const,
      d: {
        sessionId: id,
        state: updatedState,
        winnerId,
        status,
      },
    };

    if (session.conversation_id) {
      await realtimeGateway.broadcastToConversation(session.conversation_id, eventPayload);
    }

    // Trigger Bot AI move if game is still in progress and it's their turn
    if (status === 'in_progress' && (updatedState.turn === 'them' || updatedState.turn === 'O' || updatedState.turn === 'yellow')) {
      botService.handleGameMove(id, decoded.id);
    }

    return { session: { ...session, state: updatedState, winnerId, status } };
  });

  // 5. In-Chat Invites: Create challenge in conversation
  fastify.post('/invites', async (request, reply) => {
    const decoded = request.user as { id: string };
    const { conversationId, gameKey } = request.body as { conversationId: string; gameKey: string };
    const gid = normalizeGameKey(gameKey);

    // Verify conversation membership
    const memberCheck = await query(
      'SELECT conversation_id FROM conversation_members WHERE conversation_id = $1 AND user_id = $2',
      [conversationId, decoded.id]
    );
    if (memberCheck.rowCount === 0) {
      return reply.status(403).send({ error: { code: 'FORBIDDEN', message: 'Not a member of this chat' } });
    }

    // Get opponent info
    const otherMember = await query(
      `SELECT u.id, u.display_name as "displayName", u.is_bot as "isBot"
       FROM conversation_members cm
       JOIN users u ON cm.user_id = u.id
       WHERE cm.conversation_id = $1 AND u.id != $2 LIMIT 1`,
      [conversationId, decoded.id]
    );

    const oppName = otherMember.rows[0]?.displayName || 'Opponent';
    const isBot = Boolean(otherMember.rows[0]?.isBot);
    const oppId = otherMember.rows[0]?.id;

    const g = GM[gid] || { n: 'Game', e: '🎮' };
    const cardData = {
      gid,
      st: 'invite' as const,
      by: 'me',
      turn: 'me',
      t0: Date.now(),
      who: ['You', oppName],
      nm: oppName,
    };

    const seqRes = await query(
      'UPDATE conversations SET last_seq = last_seq + 1, last_message_at = NOW() WHERE id = $1 RETURNING last_seq',
      [conversationId]
    );
    const nextSeq = seqRes.rows[0].last_seq;

    const insertMsg = await query(
      `INSERT INTO messages (conversation_id, seq, sender_id, type, body, media_metadata, created_at)
       VALUES ($1, $2, $3, 'game', $4, $5, NOW())
       RETURNING *`,
      [
        conversationId,
        nextSeq,
        decoded.id,
        `Challenged to ${g.n}! ${g.e}`,
        JSON.stringify({ game: cardData }),
      ]
    );

    const msgRow = insertMsg.rows[0];
    const senderRes = await query('SELECT display_name as "displayName" FROM users WHERE id = $1', [decoded.id]);

    const createdMsg = {
      id: msgRow.id,
      conversationId: msgRow.conversation_id,
      seq: msgRow.seq,
      senderId: msgRow.sender_id,
      type: 'game' as const,
      body: msgRow.body,
      mediaMetadata: { game: cardData },
      createdAt: msgRow.created_at,
      sender: { id: decoded.id, displayName: senderRes.rows[0]?.displayName || 'Player' },
      reactions: [],
    };

    await realtimeGateway.broadcastToConversation(conversationId, {
      t: 'message.new',
      d: { conversationId, message: createdMsg },
    });

    // If opponent is a bot, auto-accept challenge after 2.5-4s matching standalone Lines 4416-4423!
    if (isBot && oppId) {
      setTimeout(async () => {
        try {
          // Initialize game session
          let initialState: Record<string, any> = {};
          if (gid === 'ttt') {
            initialState = { b: ['', '', '', '', '', '', '', '', ''], turn: 'me', playerMe: decoded.id, playerThem: oppId };
          } else if (gid === 'c4') {
            initialState = { b: Array(42).fill(''), last: -1, turn: 'me', playerMe: decoded.id, playerThem: oppId };
          } else if (gid === 'checkers') {
            initialState = { ...checkersEngine.init(), turn: 'me', playerMe: decoded.id, playerThem: oppId };
          } else if (gid === 'chess') {
            initialState = { ...chessEngine.init('w'), turn: 'me', first: 'me', playerMe: decoded.id, playerThem: oppId };
          } else if (gid === 'rps') {
            initialState = { rd: [], playerMe: decoded.id, playerThem: oppId };
          } else if (gid === 'trivia') {
            initialState = { ...initTriviaRound(), playerMe: decoded.id, playerThem: oppId };
          } else if (gid === 'word') {
            initialState = { ...initWordRound(), playerMe: decoded.id, playerThem: oppId };
          }

          const sessRes = await query(
            `INSERT INTO game_sessions (game_key, conversation_id, state, created_by, status)
             VALUES ($1, $2, $3, $4, 'in_progress')
             RETURNING id`,
            [gid, conversationId, JSON.stringify(initialState), decoded.id]
          );

          const updatedCard = {
            ...cardData,
            st: 'playing' as const,
            sessionId: sessRes.rows[0].id,
          };

          const updMsg = await query(
            `UPDATE messages SET media_metadata = $1 WHERE id = $2 RETURNING *`,
            [JSON.stringify({ game: updatedCard }), msgRow.id]
          );

          const updRow = updMsg.rows[0];
          await realtimeGateway.broadcastToConversation(conversationId, {
            t: 'message.updated',
            d: {
              conversationId,
              message: {
                id: updRow.id,
                conversationId: updRow.conversation_id,
                seq: updRow.seq,
                senderId: updRow.sender_id,
                type: 'game' as const,
                body: updRow.body,
                mediaMetadata: { game: updatedCard },
                createdAt: updRow.created_at,
                reactions: [],
              },
            },
          });
        } catch (err) {
          console.error('[GameInvite] Auto-accept bot error:', err);
        }
      }, 2500 + Math.random() * 1500);
    }

    return { message: createdMsg };
  });

  // 6. In-Chat Invites: Accept or Decline
  fastify.post('/invites/:messageId/respond', async (request, reply) => {
    const decoded = request.user as { id: string };
    const { messageId } = request.params as { messageId: string };
    const { action } = request.body as { action: 'accept' | 'decline' | 'cancel' };

    const msgRes = await query('SELECT * FROM messages WHERE id = $1', [messageId]);
    if (msgRes.rowCount === 0) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Message not found' } });
    }
    const msg = msgRes.rows[0];
    const cardData = msg.media_metadata?.game;
    if (!cardData) {
      return reply.status(400).send({ error: { code: 'BAD_REQUEST', message: 'Not a game challenge message' } });
    }

    const gid = normalizeGameKey(cardData.gid);

    if (action === 'accept') {
      let initialState: Record<string, any> = {};
      if (gid === 'ttt') {
        initialState = { b: ['', '', '', '', '', '', '', '', ''], turn: 'me', playerMe: msg.sender_id, playerThem: decoded.id };
      } else if (gid === 'c4') {
        initialState = { b: Array(42).fill(''), last: -1, turn: 'me', playerMe: msg.sender_id, playerThem: decoded.id };
      } else if (gid === 'checkers') {
        initialState = { ...checkersEngine.init(), turn: 'me', playerMe: msg.sender_id, playerThem: decoded.id };
      } else if (gid === 'chess') {
        initialState = { ...chessEngine.init('w'), turn: 'me', first: 'me', playerMe: msg.sender_id, playerThem: decoded.id };
      } else if (gid === 'rps') {
        initialState = { rd: [], playerMe: msg.sender_id, playerThem: decoded.id };
      } else if (gid === 'trivia') {
        initialState = { ...initTriviaRound(), playerMe: msg.sender_id, playerThem: decoded.id };
      } else if (gid === 'word') {
        initialState = { ...initWordRound(), playerMe: msg.sender_id, playerThem: decoded.id };
      }

      const sessRes = await query(
        `INSERT INTO game_sessions (game_key, conversation_id, state, created_by, status)
         VALUES ($1, $2, $3, $4, 'in_progress')
         RETURNING id`,
        [gid, msg.conversation_id, JSON.stringify(initialState), msg.sender_id]
      );

      const updatedCard = {
        ...cardData,
        st: 'playing' as const,
        sessionId: sessRes.rows[0].id,
      };

      const updMsg = await query(
        `UPDATE messages SET media_metadata = $1 WHERE id = $2 RETURNING *`,
        [JSON.stringify({ game: updatedCard }), messageId]
      );
      const updRow = updMsg.rows[0];

      await realtimeGateway.broadcastToConversation(msg.conversation_id, {
        t: 'message.updated',
        d: {
          conversationId: msg.conversation_id,
          message: {
            id: updRow.id,
            conversationId: updRow.conversation_id,
            seq: updRow.seq,
            senderId: updRow.sender_id,
            type: 'game' as const,
            body: updRow.body,
            mediaMetadata: { game: updatedCard },
            createdAt: updRow.created_at,
            reactions: [],
          },
        },
      });

      return { success: true, sessionId: sessRes.rows[0].id };
    } else {
      const updatedCard = {
        ...cardData,
        st: action === 'cancel' ? ('cancelled' as const) : ('declined' as const),
      };

      const updMsg = await query(
        `UPDATE messages SET media_metadata = $1 WHERE id = $2 RETURNING *`,
        [JSON.stringify({ game: updatedCard }), messageId]
      );
      const updRow = updMsg.rows[0];

      await realtimeGateway.broadcastToConversation(msg.conversation_id, {
        t: 'message.updated',
        d: {
          conversationId: msg.conversation_id,
          message: {
            id: updRow.id,
            conversationId: updRow.conversation_id,
            seq: updRow.seq,
            senderId: updRow.sender_id,
            type: 'game' as const,
            body: updRow.body,
            mediaMetadata: { game: updatedCard },
            createdAt: updRow.created_at,
            reactions: [],
          },
        },
      });

      return { success: true };
    }
  });

  // 7. LFG Posts: Get Open & Mine
  fastify.get('/lfg', async (request) => {
    const decoded = request.user as { id: string };

    const res = await query(
      `SELECT p.id, p.by_user_id as "by", p.game_key as "gameKey", p.mode,
              p.players_needed as "playersNeeded", p.joined, p.note, p.status,
              p.match_session_id as "matchSessionId", p.conversation_id as "conversationId",
              p.message_id as "messageId", p.created_at as "createdAt",
              u.username, u.display_name as "displayName", u.avatar_url as "avatarUrl",
              u.avatar_kind as "avatarKind"
       FROM lfg_posts p
       JOIN users u ON p.by_user_id = u.id
       WHERE p.status = 'open' OR (p.by_user_id = $1 AND p.created_at > NOW() - INTERVAL '24 hours')
       ORDER BY p.created_at DESC`,
      [decoded.id]
    );

    const posts = res.rows.map((row) => ({
      id: row.id,
      by: row.by,
      gameKey: row.gameKey,
      mode: row.mode,
      playersNeeded: row.playersNeeded,
      joined: row.joined || [],
      note: row.note,
      status: row.status,
      matchSessionId: row.matchSessionId,
      conversationId: row.conversationId,
      messageId: row.messageId,
      createdAt: row.createdAt,
      byUser: {
        id: row.by,
        username: row.username,
        displayName: row.displayName,
        avatarUrl: row.avatarUrl,
        avatarKind: row.avatarKind,
      },
    }));

    return { posts };
  });

  // 8. LFG Posts: Create Post
  fastify.post('/lfg', async (request) => {
    const decoded = request.user as { id: string };
    const { gameKey = 'chess', mode = '1v1', playersNeeded = 1, note } = request.body as any;
    const gid = normalizeGameKey(gameKey);

    const res = await query(
      `INSERT INTO lfg_posts (by_user_id, game_key, mode, players_needed, joined, note, status)
       VALUES ($1, $2, $3, $4, '[]'::jsonb, $5, 'open')
       RETURNING id, by_user_id as "by", game_key as "gameKey", mode, players_needed as "playersNeeded",
                 joined, note, status, created_at as "createdAt"`,
      [decoded.id, gid, mode, mode === '1v1' ? 1 : Math.max(2, playersNeeded), note ? String(note).trim() : null]
    );

    const post = res.rows[0];
    return { post };
  });

  // 9. LFG Posts: Join Post
  fastify.post('/lfg/:id/join', async (request, reply) => {
    const decoded = request.user as { id: string };
    const { id } = request.params as { id: string };

    const postRes = await query('SELECT * FROM lfg_posts WHERE id = $1', [id]);
    if (postRes.rowCount === 0) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'LFG post not found' } });
    }
    const post = postRes.rows[0];
    if (post.status !== 'open') {
      return reply.status(400).send({ error: { code: 'BAD_REQUEST', message: 'Post is no longer open' } });
    }

    const userRes = await query('SELECT display_name as "displayName" FROM users WHERE id = $1', [decoded.id]);
    const userName = userRes.rows[0]?.displayName || 'Player';

    const currentJoined = post.joined || [];
    if (currentJoined.some((j: any) => j.id === decoded.id)) {
      return { success: true, message: 'Already joined', post };
    }

    const updatedJoined = [...currentJoined, { id: decoded.id, name: userName }];
    const gid = normalizeGameKey(post.game_key);
    let newStatus = post.status;
    let matchSessionId = post.match_session_id;

    // If needed players met, launch match session!
    if (updatedJoined.length >= post.players_needed) {
      newStatus = 'matched';

      let initialState: Record<string, any> = {};
      if (gid === 'ttt') {
        initialState = { b: ['', '', '', '', '', '', '', '', ''], turn: 'me', playerMe: post.by_user_id, playerThem: decoded.id };
      } else if (gid === 'c4') {
        initialState = { b: Array(42).fill(''), last: -1, turn: 'me', playerMe: post.by_user_id, playerThem: decoded.id };
      } else if (gid === 'checkers') {
        initialState = { ...checkersEngine.init(), turn: 'me', playerMe: post.by_user_id, playerThem: decoded.id };
      } else if (gid === 'chess') {
        initialState = { ...chessEngine.init('w'), turn: 'me', first: 'me', playerMe: post.by_user_id, playerThem: decoded.id };
      } else if (gid === 'rps') {
        initialState = { rd: [], playerMe: post.by_user_id, playerThem: decoded.id };
      } else if (gid === 'trivia') {
        initialState = { ...initTriviaRound(), playerMe: post.by_user_id, playerThem: decoded.id };
      } else if (gid === 'word') {
        initialState = { ...initWordRound(), playerMe: post.by_user_id, playerThem: decoded.id };
      }

      const sessRes = await query(
        `INSERT INTO game_sessions (game_key, state, created_by, status)
         VALUES ($1, $2, $3, 'in_progress')
         RETURNING id`,
        [gid, JSON.stringify(initialState), post.by_user_id]
      );
      matchSessionId = sessRes.rows[0].id;
    }

    await query(
      `UPDATE lfg_posts
       SET joined = $2, status = $3, match_session_id = $4, updated_at = NOW()
       WHERE id = $1`,
      [id, JSON.stringify(updatedJoined), newStatus, matchSessionId]
    );

    return {
      success: true,
      post: {
        ...post,
        joined: updatedJoined,
        status: newStatus,
        matchSessionId,
      },
    };
  });

  // 10. LFG Posts: Close Post
  fastify.post('/lfg/:id/close', async (request, reply) => {
    const decoded = request.user as { id: string };
    const { id } = request.params as { id: string };

    const updateRes = await query(
      `UPDATE lfg_posts SET status = 'closed', updated_at = NOW()
       WHERE id = $1 AND by_user_id = $2
       RETURNING id`,
      [id, decoded.id]
    );

    if (updateRes.rowCount === 0) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Post not found or not owner' } });
    }

    return { success: true };
  });
};
