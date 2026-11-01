# Real-time

One authenticated WebSocket per device carries messages, receipts, typing, presence, stories, games and notifications. It complements the REST API; history and state changes that must be reliable also exist as REST calls.

## Connection

- `wss://…/v1/ws?token=<access token>`; the server validates the token and the session (revoked sessions are disconnected).
- A heartbeat ping/pong every 25 seconds. Missed pongs close the connection; the client reconnects with exponential backoff and jitter.
- On reconnect the client sends its last seen `seq` per conversation; the server replays what it missed. If the gap is too large, the client refetches via REST.
- Each connection is rate-limited (events per second, payload size, subscribe count).

## Message envelope

```json
{ "t": "message.new", "id": "evt_…", "ts": "2026-11-01T12:00:00Z", "d": { … } }
```

Client-to-server events that expect an answer carry a `ref`; the server replies with `ack` or `nack` (error code from `API.md`).

## Events

### Server to client
| Event | Purpose |
|---|---|
| `message.new` | A message arrived (includes `conversationId`, `seq`) |
| `message.updated` | Edited, reaction changed, or deleted for everyone |
| `message.status` | Delivery and read counters changed (`last_delivered_seq`, `last_read_seq`) |
| `conversation.updated` | Members, permissions, name, pin, archive, disappearing timer |
| `typing` | Someone is typing (ephemeral; never stored) |
| `presence` | Online, away, last seen (respecting each user's privacy settings) |
| `story.new`, `story.reaction`, `story.reply` | Story activity |
| `live.started`, `live.ended`, `live.viewers` | Live status and counts |
| `game.invite`, `game.state`, `game.move`, `game.ended` | Game flow |
| `friend.request`, `friend.accepted`, `username.changed` | Social changes |
| `notification.new` | An in-app notification was created |
| `session.revoked` | This session was signed out; client must log out |
| `limit.warning` | Rate limit or quota notice |

### Client to server
| Event | Purpose |
|---|---|
| `message.send` | Send a message (carries `clientMsgId`) |
| `message.delivered`, `conversation.read` | Advance delivery and read counters |
| `typing.start`, `typing.stop` | Typing indicator (auto-expires after about 6 seconds) |
| `presence.set` | Foreground or background |
| `game.move` | A move in a live game session |
| `subscribe`, `unsubscribe` | Join or leave a live or game channel |

## Delivery guarantees

- **At least once with de-duplication:** the server may resend; clients dedupe by `id`, and message inserts are idempotent on `clientMsgId`.
- **Ordering:** within a conversation, order is the database `seq`, not arrival time.
- **No silent loss:** if the socket is down, messages are held in the client outbox and sent on reconnect; recipients without a connection get push via the notification outbox.

## Fan-out across servers

Each server instance subscribes to Redis channels for the users and conversations it holds connections for. Events are published after the database transaction commits (via the outbox), so a client never sees something that did not persist.

## Presence and typing

- Presence is held in Redis with a short TTL refreshed by heartbeats.
- A user's presence is **only sent to people allowed to see it** (privacy settings, blocks). Hiding your last seen hides others' from you, as in the settings.
- Typing is broadcast only to the conversation, throttled, and not persisted. If either side turned typing indicators off, nothing is sent.

## Read receipts

Receipts are two counters per member, not a row per message. If either person has receipts off, "read" is not shown for that pair. Groups show read information only when enabled by both sides and the group setting.

## Live video

Real-time video does not go through this socket. The server issues a LiveKit token (`GET /live/:id/token`), and the client connects to LiveKit directly. This socket carries only live status, viewer counts, comments and reactions metadata.

## Games

`game.move` goes to the server, which validates against the game rules and current `version`; on success it stores the move, updates the state and broadcasts `game.state`. Illegal or out-of-turn moves get a `nack` and no state change. Turn-based games also work with no connection; moves arrive when players return.

## Notifications

If the recipient has an active, foregrounded connection, the event is delivered in-app and no push is sent. Otherwise the outbox worker sends push, subject to quiet hours, "Heads-down", mute and preview settings.

## Observability

Connection count, reconnect rate, event latency (send to delivered), dropped events and queue depth are tracked and alerted on. Load tests with k6 run before each launch wave.
