import { WebSocket } from 'ws';
import { query } from '../db/index.js';
import { RealtimeServerEvent, RealtimeClientEvent } from '@nudge/shared';

interface ConnectedClient {
  userId: string;
  ws: WebSocket;
  lastActive: number;
}

class RealtimeGateway {
  private clients = new Map<string, Set<WebSocket>>();
  private socketToUser = new Map<WebSocket, string>();

  public register(userId: string, ws: WebSocket) {
    if (!this.clients.has(userId)) {
      this.clients.set(userId, new Set());
    }
    this.clients.get(userId)!.add(ws);
    this.socketToUser.set(ws, userId);

    console.log(`[Realtime] User ${userId} connected. Total active users: ${this.clients.size}`);

    // Send authenticated confirmation
    this.sendToSocket(ws, {
      t: 'authenticated',
      d: { userId },
    });

    // Broadcast presence online to user's conversation peers
    this.broadcastPresence(userId, true);

    ws.on('message', async (data) => {
      try {
        const payload = JSON.parse(data.toString()) as RealtimeClientEvent;
        await this.handleClientEvent(userId, ws, payload);
      } catch (err) {
        console.error('[Realtime] Failed to parse/handle client message:', err);
      }
    });

    ws.on('close', () => {
      this.unregister(userId, ws);
    });

    ws.on('error', (err) => {
      console.error(`[Realtime] Socket error for user ${userId}:`, err);
      this.unregister(userId, ws);
    });
  }

  public unregister(userId: string, ws: WebSocket) {
    const userSockets = this.clients.get(userId);
    if (userSockets) {
      userSockets.delete(ws);
      if (userSockets.size === 0) {
        this.clients.delete(userId);
        this.broadcastPresence(userId, false);
      }
    }
    this.socketToUser.delete(ws);
    console.log(`[Realtime] User ${userId} disconnected. Total active users: ${this.clients.size}`);
  }

  public sendToUser(userId: string, event: RealtimeServerEvent) {
    const userSockets = this.clients.get(userId);
    if (userSockets) {
      const dataStr = JSON.stringify(event);
      for (const ws of userSockets) {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(dataStr);
        }
      }
    }
  }

  public sendToSocket(ws: WebSocket, event: RealtimeServerEvent) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(event));
    }
  }

  public async broadcastToConversation(conversationId: string, event: RealtimeServerEvent, excludeUserId?: string) {
    try {
      const result = await query<{ user_id: string }>(
        'SELECT user_id FROM conversation_members WHERE conversation_id = $1',
        [conversationId]
      );

      for (const row of result.rows) {
        if (excludeUserId && row.user_id === excludeUserId) continue;
        this.sendToUser(row.user_id, event);
      }
    } catch (err) {
      console.error(`[Realtime] Failed to broadcast to conversation ${conversationId}:`, err);
    }
  }

  public async broadcastPresence(userId: string, isOnline: boolean) {
    try {
      const peers = await query<{ peer_id: string }>(
        `SELECT DISTINCT cm2.user_id as peer_id
         FROM conversation_members cm1
         JOIN conversation_members cm2 ON cm1.conversation_id = cm2.conversation_id
         WHERE cm1.user_id = $1 AND cm2.user_id != $1`,
        [userId]
      );

      const event: RealtimeServerEvent = {
        t: 'presence',
        d: { userId, isOnline, lastSeenAt: new Date().toISOString() },
      };

      for (const row of peers.rows) {
        this.sendToUser(row.peer_id, event);
      }
    } catch (err) {
      console.error('[Realtime] Failed to broadcast presence:', err);
    }
  }

  private async handleClientEvent(userId: string, ws: WebSocket, event: RealtimeClientEvent) {
    switch (event.t) {
      case 'typing.start':
      case 'typing.stop': {
        const isTyping = event.t === 'typing.start';
        await this.broadcastToConversation(
          event.d.conversationId,
          {
            t: 'typing',
            d: {
              conversationId: event.d.conversationId,
              userId,
              isTyping,
            },
          },
          userId
        );
        break;
      }

      case 'message.send': {
        const { conversationId, body, type = 'text', mediaUrl, replyToId, clientMsgId } = event.d;

        // Verify membership
        const memberCheck = await query(
          'SELECT 1 FROM conversation_members WHERE conversation_id = $1 AND user_id = $2',
          [conversationId, userId]
        );
        if (memberCheck.rowCount === 0) {
          this.sendToSocket(ws, {
            t: 'error',
            d: { code: 'FORBIDDEN', message: 'You are not a member of this conversation' },
          });
          return;
        }

        // Increment seq and insert
        const convResult = await query(
          'UPDATE conversations SET last_seq = last_seq + 1, last_message_at = NOW() WHERE id = $1 RETURNING last_seq',
          [conversationId]
        );
        const nextSeq = convResult.rows[0].last_seq;

        const msgResult = await query(
          `INSERT INTO messages (conversation_id, seq, sender_id, client_msg_id, type, body, media_url, reply_to_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING *`,
          [conversationId, nextSeq, userId, clientMsgId, type, body, mediaUrl || null, replyToId || null]
        );

        // Fetch sender info
        const userResult = await query(
          'SELECT id, username, display_name as "displayName", avatar_url as "avatarUrl", avatar_kind as "avatarKind" FROM users WHERE id = $1',
          [userId]
        );

        const newMsg = {
          ...msgResult.rows[0],
          sender: userResult.rows[0],
          reactions: [],
        };

        // Broadcast to all participants including sender
        await this.broadcastToConversation(conversationId, {
          t: 'message.new',
          d: {
            conversationId,
            message: newMsg,
          },
        });
        break;
      }

      case 'conversation.read': {
        const { conversationId, seq } = event.d;
        await query(
          `UPDATE conversation_members
           SET last_read_seq = GREATEST(last_read_seq, $3)
           WHERE conversation_id = $1 AND user_id = $2`,
          [conversationId, userId, seq]
        );

        await this.broadcastToConversation(conversationId, {
          t: 'message.status',
          d: {
            conversationId,
            lastDeliveredSeq: seq,
            lastReadSeq: seq,
          },
        });
        break;
      }

      case 'game.move': {
        const { sessionId, move } = event.d;
        const sessionRes = await query(
          'SELECT * FROM game_sessions WHERE id = $1',
          [sessionId]
        );
        if (sessionRes.rowCount === 0) return;
        const session = sessionRes.rows[0];

        // Process TicTacToe or generic game move
        let updatedState = { ...session.state, ...move };
        let winnerId = session.winner_id;
        let status = session.status;

        // If tictactoe move: { index: number, symbol: 'X' | 'O' }
        if (session.game_key === 'tictactoe' && typeof move.index === 'number') {
          const board: (string | null)[] = session.state.board || Array(9).fill(null);
          const currentTurn = session.state.turn || 'X';
          if (!board[move.index]) {
            board[move.index] = currentTurn;
            // Check win
            const winningLines = [
              [0, 1, 2], [3, 4, 5], [6, 7, 8],
              [0, 3, 6], [1, 4, 7], [2, 5, 8],
              [0, 4, 8], [2, 4, 6]
            ];
            let hasWon = false;
            for (const [a, b, c] of winningLines) {
              if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                hasWon = true;
                break;
              }
            }
            if (hasWon) {
              winnerId = userId;
              status = 'completed';
            } else if (board.every(cell => cell !== null)) {
              status = 'completed'; // draw
            }

            const nextTurn = currentTurn === 'X' ? 'O' : 'X';
            updatedState = { board, turn: nextTurn };
          }
        }

        await query(
          `UPDATE game_sessions
           SET state = $2, winner_id = $3, status = $4, updated_at = NOW()
           WHERE id = $1`,
          [sessionId, JSON.stringify(updatedState), winnerId, status]
        );

        const eventPayload: RealtimeServerEvent = {
          t: 'game.state',
          d: {
            sessionId,
            state: updatedState,
            winnerId,
            status,
          },
        };

        if (session.conversation_id) {
          await this.broadcastToConversation(session.conversation_id, eventPayload);
        } else {
          this.sendToUser(session.created_by, eventPayload);
        }
        break;
      }
    }
  }
}

export const realtimeGateway = new RealtimeGateway();
