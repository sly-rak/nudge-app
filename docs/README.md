# Nudge

Nudge is a messaging and social app for talking, organising, sharing and playing with friends. Chats are the heart of the product; everything else (stories, live, games, Nearby) connects back to communication and relationships.

- **Status:** pre-build. The interactive prototype in `docs/design-reference/` is the visual and behavioural reference. This repository is the production codebase that replaces it.
- **Launch plan:** an open pre-release in waves (about 1,000 users, then about 10,000) before a global release. Nigeria is the first market, the product is built to be global.
- **Team:** Dayo (product owner), a backend developer, and Claude as technical lead.

## Product pillars

1. **Chats first.** One-to-one and group chats (up to 250 members), delivery states, replies, edits, forwarding, disappearing messages, rooms inside groups.
2. **Moments.** 24-hour stories, permanent Highlights, public stories for followers, friends-only live.
3. **Play.** Turn-based and live games, group games, game badges and friends leaderboards. No real-money staking and no coins (see `ROADMAP.md`).
4. **Premium.** Cosmetic and convenience perks. Core communication is never paywalled.
5. **Control.** Strong privacy settings, blocking, muting, restricting, reporting, and a safety-first moderation system.

## Repository layout

```
apps/web        React + TypeScript PWA
apps/server     Fastify + TypeScript backend (modular monolith)
apps/admin      Admin and moderation dashboard
packages/shared Schemas, event types, constants (single source of truth)
packages/ui     Design-system components
packages/config Shared tsconfig / eslint / prettier presets
docs            Documentation and decisions log
infrastructure  Docker, deployment config, environment templates
scripts         Setup, migrations, seeding, load tests
```

## Prerequisites

- Node.js (current LTS) and pnpm
- Docker (for local PostgreSQL and Redis)
- Git

## Getting started (once the scaffold exists)

```bash
pnpm install
cp infrastructure/env/.env.example .env     # fill in local values
docker compose -f infrastructure/docker-compose.dev.yml up -d   # postgres + redis
pnpm db:migrate && pnpm db:seed
pnpm dev                                    # web + server + admin
```

Useful commands: `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm build`.

## Development rules (short version)

- TypeScript strict mode everywhere; lint and tests must pass before merging.
- All request, response and event shapes live in `packages/shared`. Never duplicate them.
- Limits (message length, group size, edit windows, upload sizes) live in one config file and are never hard-coded elsewhere.
- Routes handle HTTP only, services hold rules, repositories hold SQL.
- Every new endpoint ships with a shared schema, tests and an entry in `API.md`.
- Documentation and code must agree. Changing a decision means updating `docs/DECISIONS.md` in the same pull request.

## Documentation map

| File | Contents |
|---|---|
| `ARCHITECTURE.md` | System overview, technology choices and reasoning, data flow |
| `FRONTEND.md` | Web app structure, routing, state, conventions |
| `BACKEND.md` | Server modules, business rules, conventions |
| `DATABASE.md` | Schema, relationships, indexes, data lifecycle |
| `API.md` | REST endpoints, formats, errors |
| `REALTIME.md` | WebSocket protocol, events, presence |
| `SECURITY.md` | Authentication, authorisation, privacy, child safety, encryption plan |
| `DEPLOYMENT.md` | Environments, hosting, CI/CD, backups, costs |
| `ROADMAP.md` | Phases, dependencies, MVP versus later |
| `DECISIONS.md` | Every product and technical decision with its reasoning |
