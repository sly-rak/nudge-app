# Architecture

## Goals and constraints

- A serious, long-term product, built by three people with **no infrastructure budget** at the start.
- Web first (installable PWA), then Android and iOS by wrapping the same code (Capacitor).
- Designed for up to **100,000 users** without a rewrite; planned in waves of about 1,000 and 10,000.
- Global from day one: CDN, i18n, time zones, privacy law awareness (Nigeria's NDPA, GDPR).
- Safe by design: under-18 protections, moderation tools before open sign-up, no real-money gaming.

## Style: modular monolith

One backend application, split into well-bounded modules (auth, users, friends, chat, groups, media, stories, live, games, notifications, premium, moderation, admin). Modules call each other only through their public service interfaces. If a module needs to scale independently later (for example games or notifications), it can be extracted into its own service because the boundaries already exist.

Why not microservices: three people cannot operate them, and they add cost and failure modes we do not need yet.

## Components

```
 Web PWA / Admin ──HTTPS──► API (Fastify) ──► PostgreSQL (source of truth)
        │                        │  ▲
        └────WebSocket──► Realtime gateway ──► Redis (presence, pub/sub,
                                 │               rate limits, Nearby cache, queues)
                                 ├──► Object storage + CDN (media)
                                 ├──► Job workers (expiry, scans, push, email)
                                 ├──► LiveKit (live video)
                                 └──► Paystack (payments, via webhooks)
```

## Technology choices and reasoning

| Area | Choice | Reasoning |
|---|---|---|
| Frontend | React, TypeScript, Vite, PWA | Largest ecosystem and hiring pool; typed; installable; Capacitor later for mobile apps |
| Backend | Node.js, TypeScript, Fastify | Shared types with the frontend; fast; simple to run. Assumes the backend developer is comfortable with TypeScript (revisit if not) |
| Database | PostgreSQL | Relational data with strict constraints (chats, friends, payments); scales far past our target |
| Cache and fan-out | Redis | Presence, rate limits, pub/sub between server instances, short-lived Nearby data |
| Real-time | WebSockets | Messages, typing, presence and game moves are pushed, never polled |
| Files | S3-compatible object storage with a CDN (Cloudflare R2 or similar) | Cheap, no egress fees, fast worldwide |
| Live video | LiveKit | Managed or self-hostable real-time video, so we do not build video infrastructure |
| Payments | Paystack first | Local cards, bank transfer; Stripe added for international later |
| Push and email | FCM and Web Push; a transactional email service | Free at our scale |
| Jobs | Queue on Redis or Postgres | Story expiry, disappearing messages, scans, notifications |
| Monorepo | pnpm workspaces | Shared packages, one install, one CI |

**Free-tier limits and prices change. Verify current terms before committing any provider** (see `DEPLOYMENT.md`).

## Key decisions

1. **Server-stored history now, end-to-end encryption designed in.** Message tables carry nullable ciphertext and encryption-version columns, devices carry public-key columns. E2EE for one-to-one chats is a later phase. We claim only what is true: "encrypted in transit and at rest" at launch.
2. **Schema-first contracts.** `packages/shared` defines every request, response and event. A mismatch fails the build.
3. **Server-authoritative games.** The server owns game state and validates moves; clients cannot cheat by editing local state.
4. **Entitlements, not payment checks.** Features read an `entitlements` table. Payments only write to it (via verified webhooks).
5. **Friends private, following public.** Mutual friendship is the private layer; following powers public stories and public profiles.
6. **Feature flags.** New and premium features sit behind flags, controllable per user, wave or country.
7. **Read state as counters.** Per-member `last_delivered_seq` and `last_read_seq`, not a row per message per reader.

## Data flow: sending a message

1. Client writes the message locally with a client-generated ID; the UI shows "sending".
2. It travels over the WebSocket (or waits in the offline queue and retries).
3. The server checks permissions (not blocked, still a member, rate limit, group send rules), then in one transaction increments the conversation sequence, inserts the message (idempotent on client ID) and writes notification outbox rows.
4. After commit, the event is published through Redis to every server instance and to the recipients' connected devices.
5. Recipient devices acknowledge "delivered"; opening the chat advances `last_read_seq` ("read", only if both users allow receipts).
6. Offline recipients get a push from the outbox worker.

## Data flow: other operations

- **Creating a group:** one transaction checks blocks and each invitee's "who can add me" setting, creates conversation and group rows, adds members, writes a system message and queues notifications.
- **Uploading a story:** request upload slot, upload directly to storage, worker scans and thumbnails, then the story row is created with a 24-hour expiry. The feed is a query filtered by audience; no per-viewer fan-out.
- **Delivering a notification:** event, in-app row, outbox entry per device, filtered by presence, quiet hours, "Heads-down", mute and preview settings, then sent by a worker with retries.

## Scaling path (not built now)

1. Single server and managed Postgres/Redis (waves 1 and 2).
2. Multiple stateless server instances behind a load balancer, with Redis fan-out.
3. Read replicas, then time-partitioning of `messages`.
4. Extract hot modules into services (games, notifications, media processing).
5. Multi-region CDN and, if needed, regional databases.

## Out of scope for the first release

Post feed, coins and any in-app currency, real-money staking, public live, ads, end-to-end encryption, native mobile apps. All are planned in `ROADMAP.md` or deliberately parked in `DECISIONS.md`.
