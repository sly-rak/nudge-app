# Backend

Applies to `apps/server`. Node.js and TypeScript on Fastify, PostgreSQL, Redis.

## Layering

```
route  →  service  →  repository  →  database
 HTTP     rules       SQL only
```

- **Routes** validate input against `packages/shared` schemas, call a service, and shape the response. No business rules.
- **Services** hold all business rules and permission checks, and are the only public surface of a module.
- **Repositories** run SQL. No rules, no HTTP.
- A module may call another module's service, never its repository or tables.

## Modules and responsibilities

| Module | Responsibility |
|---|---|
| `auth` | Registration, email and Google sign-in, verification, password reset, sessions, refresh rotation, age gate |
| `users` | Profiles, usernames and history, avatar, birthday visibility, "Down for" status, settings sync |
| `friends` | Friend requests, following, close friends, blocks, mutes, restricts, contact matching (opt-in, hashed), suggestions |
| `chat` | Conversations, messages, sequence numbers, delivery and read counters, reactions, replies, edits, forwarding, stars, disappearing messages |
| `groups` | Group creation, members, roles, permissions, rooms, temporary groups, 250 member limit |
| `media` | Upload slots, scanning, thumbnails, retention, signed URLs |
| `stories` | Stories, audiences, Highlights, views, reactions, polls |
| `live` | LiveKit tokens, audiences, replays (friends-only live first) |
| `games` | Game catalogue, sessions, server-authoritative rules, badges, stats, leaderboards |
| `notifications` | In-app feed, outbox, push and email delivery, preference rules |
| `premium` | Plans, Paystack integration, entitlements, trials |
| `moderation` | Reports, automatic hiding, actions, appeals, hash-list matching |
| `admin` | Admin API for the dashboard, roles, audit log, metrics |
| `nearby` | Opt-in coarse location in Redis with short expiry |

## Business rules (summary; enforced in services and, where possible, constraints)

- **Age:** minimum 13. The date of birth is collected at sign-up and kept private. Under-18 accounts cannot post publicly, cannot appear in Nearby, cannot host live to non-friends, default to private.
- **Usernames:** unique, case-insensitive. Changeable once every 6 months. Released names are reserved for 90 days. A change notifies friends and people the user has chatted with, once per change.
- **Messages:** maximum 4,000 characters. Edit window 15 minutes (premium 1 day). Delete for everyone within 48 hours. "Edited" label always shown. Forward to at most 5 chats at once with a "Forwarded" label. One reaction per user per message, any emoji.
- **Groups:** at most 250 members. Roles: owner, admin, member. Permission flags: only admins edit info, only admins send, only admins add members. Adding someone respects their "who can add me to groups" setting and blocks.
- **Disappearing messages:** timers Off, 24 hours, 7 days, 30 days, applied to new messages only, plus the separate "vanish after read" mode.
- **Friends:** mutual friendship is private. Following is public and works one way. Maximum 50 new friend requests per day, with automatic slowdown on ignored or reported requests.
- **Blocking:** blocked users cannot message, call, see stories or live, find the user, or add them to groups; the blocker is not announced.
- **Stories:** 24 hours; audiences public, friends, close friends, selected, plus hide-from. Highlights are permanent until removed.
- **Premium:** never gates core communication. Perks read `entitlements`.
- **Games:** no real-money wagering and no coins. Rewards are badges and leaderboards.

All numbers above are read from `packages/shared/src/limits.ts`; do not write them anywhere else.

## Conventions

- **Validation:** every route has a schema in `packages/shared`; invalid input returns the standard error format.
- **Errors:** throw typed domain errors (`NotFound`, `Forbidden`, `RateLimited`, `Conflict`, `ValidationFailed`); a single handler maps them to HTTP and logs them.
- **Transactions:** a service method that changes more than one table runs in one transaction. Events publish after commit through the outbox.
- **Idempotency:** client-generated IDs make message and payment operations safe to retry.
- **Pagination:** cursor-based, never offset, for messages, notifications and feeds.
- **Config:** typed environment config loaded once; the server refuses to start with missing secrets.
- **Logging:** structured JSON with a request ID. Never log tokens, passwords, message bodies, or full phone numbers or emails.
- **Time:** all in UTC; clients convert.
- **Naming:** `snake_case` in the database, `camelCase` in code, mapping in repositories.

## Background jobs

Story expiry and media cleanup, disappearing-message deletion, upload scanning and thumbnails, push and email sending, replay expiry, session cleanup, daily metrics, nightly audit queries (for example, an under-18 public-story check). Jobs are idempotent and retry with backoff; failures go to a dead-letter list and raise an alert.

## Testing

Unit tests for every service rule, integration tests for every route against a real PostgreSQL in Docker, and permission tests ("a blocked user cannot…"). Auth, permissions and payments carry the strictest coverage. See `ROADMAP.md` for the overall testing plan.

## Adding a feature

1. Add schemas in `packages/shared` and update `API.md`.
2. Add a migration (backward-compatible).
3. Add repository, service, route and tests.
4. Put it behind a feature flag if it is new or premium.
5. Record any new decision in `DECISIONS.md`.
