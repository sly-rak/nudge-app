# API

REST over HTTPS, JSON bodies, versioned under `/v1`. Real-time events are documented in `REALTIME.md`. Request and response shapes are defined in `packages/shared`; this file is the human summary and must be updated with every endpoint change.

## Conventions

- **Auth:** `Authorization: Bearer <access token>` (short-lived). Refresh token is an httpOnly cookie used only by `/v1/auth/refresh`.
- **Content type:** `application/json`; uploads go directly to storage using signed URLs.
- **IDs:** UUIDv7 strings. **Times:** ISO 8601 in UTC.
- **Pagination:** cursor based: `?limit=50&cursor=<opaque>`; responses contain `items` and `nextCursor`.
- **Idempotency:** mutating calls that can be retried accept a client-generated ID (`clientMsgId`, `Idempotency-Key`).
- **Rate limits:** returned as `429` with `Retry-After`; auth and friend-request endpoints are the strictest.

## Error format

```json
{ "error": { "code": "FORBIDDEN", "message": "You can't do that.", "requestId": "…", "details": {} } }
```

| HTTP | code | Meaning |
|---|---|---|
| 400 | `VALIDATION_FAILED` | Body or query failed schema validation (`details` lists fields) |
| 401 | `UNAUTHENTICATED` | Missing, expired or revoked token |
| 403 | `FORBIDDEN` | Authenticated but not allowed (blocked, not a member, under-age rule, not admin) |
| 404 | `NOT_FOUND` | Resource missing or hidden from you |
| 409 | `CONFLICT` | Duplicate or version conflict (username taken, game move out of turn) |
| 410 | `EXPIRED` | Story, token or link has expired |
| 413 | `TOO_LARGE` | Upload or message beyond limits |
| 422 | `RULE_VIOLATION` | Rule broken (edit window passed, group full, username changed too recently) |
| 429 | `RATE_LIMITED` | Too many requests |
| 5xx | `INTERNAL` | Unexpected; includes `requestId` for support |

## Endpoints (v1)

### Auth
- `POST /auth/register` email, password, username, dateOfBirth (age gate ≥ 13)
- `POST /auth/login`, `POST /auth/google`
- `POST /auth/refresh`, `POST /auth/logout`
- `POST /auth/verify-email`, `POST /auth/resend-verification`
- `POST /auth/forgot-password`, `POST /auth/reset-password`
- `POST /auth/phone/start`, `POST /auth/phone/verify` (optional phone verification)
- `GET /auth/sessions`, `DELETE /auth/sessions/:id`

### Users and profile
- `GET /me`, `PATCH /me` (name, bio, birthday visibility, avatar)
- `POST /me/username` (once per 6 months; notifies friends)
- `GET /users/:username`, `GET /users/search?q=`
- `PUT /me/status` (Down for chip), `DELETE /me/status`
- `GET /me/settings`, `PATCH /me/settings`
- `DELETE /me` (delete account), `POST /me/deactivate`, `POST /me/export`

### Friends and graph
- `GET /friends`, `POST /friends/requests`, `POST /friends/requests/:id/accept|decline`, `DELETE /friends/:userId`
- `POST /follows/:userId`, `DELETE /follows/:userId`
- `POST /blocks/:userId`, `DELETE /blocks/:userId`, `GET /blocks`; same pattern for `/mutes`, `/restricts`, `/close-friends`
- `POST /contacts/match` (opt-in only; sends hashes), `GET /contacts/on-nudge`
- `GET /suggestions/friends`

### Conversations and messages
- `GET /conversations` (with pins, archived, unread), `POST /conversations` (direct or group)
- `PATCH /conversations/:id/me` (mute, archive, pin, disappearing timer)
- `POST /conversations/:id/clear`, `DELETE /conversations/:id`
- `GET /conversations/:id/messages?cursor=` (history by `seq`)
- `POST /conversations/:id/messages` (also available over WebSocket)
- `PATCH /messages/:id` (edit, within window), `DELETE /messages/:id?scope=me|everyone`
- `PUT /messages/:id/reaction`, `DELETE /messages/:id/reaction`
- `POST /messages/:id/forward` (up to 5 targets), `PUT /messages/:id/star`
- `GET /conversations/:id/search?q=`, `GET /conversations/:id/media?kind=photos|links|docs`
- `POST /conversations/:id/read` (advance read counter)

### Groups
- `PATCH /groups/:id` (name, avatar, permissions)
- `POST /groups/:id/members`, `DELETE /groups/:id/members/:userId`, `PATCH /groups/:id/members/:userId` (role)
- `POST /groups/:id/leave`
- `POST /groups/:id/rooms`, `PATCH /groups/:id/rooms/:roomId`

### Media
- `POST /media/upload-slots` returns a signed URL and a `mediaId`
- `GET /media/:id` returns a signed download URL (or a CDN URL for public media)

### Stories and live
- `GET /stories/feed`, `POST /stories`, `DELETE /stories/:id`
- `POST /stories/:id/view`, `PUT /stories/:id/reaction`, `POST /stories/:id/reply`, `POST /stories/:id/poll-vote`
- `GET /stories/:id/viewers` (author only)
- `GET /highlights?userId=`, `POST /highlights`, `PATCH /highlights/:id`
- `POST /live` (start), `POST /live/:id/end`, `GET /live/:id/token`, `GET /live/active`

### Games
- `GET /games`, `POST /games/sessions`, `GET /games/sessions/:id`, `POST /games/sessions/:id/moves`
- `GET /games/leaderboard?gameKey=` (friends only), `GET /me/badges`, `PUT /me/badges/equipped`
- `POST /lfg`, `GET /lfg`, `POST /lfg/:id/join`

### Notifications
- `GET /notifications`, `POST /notifications/read`
- `PUT /devices/push-token`, `DELETE /devices/:id`

### Nearby
- `PUT /nearby/presence` (opt-in, coarse cell), `DELETE /nearby/presence`, `GET /nearby/people`

### Premium
- `GET /plans`, `POST /subscriptions/checkout`, `GET /subscriptions/me`, `POST /subscriptions/cancel`
- `POST /webhooks/paystack` (signature verified, idempotent)

### Moderation and support
- `POST /reports`, `POST /appeals`

### Admin API (separate token scope and role checks)
- `GET /admin/reports`, `POST /admin/reports/:id/action`
- `GET /admin/users?q=`, `POST /admin/users/:id/suspend|ban|restore`
- `GET /admin/appeals`, `POST /admin/appeals/:id/decide` (reviewer ≠ original moderator)
- `GET /admin/audit-log`, `GET /admin/metrics`

## Versioning and deprecation

Breaking changes create `/v2` routes; `/v1` stays alive for at least one release cycle after announcement. Additive changes (new optional fields) do not bump the version.
