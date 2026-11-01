# Roadmap

## Principle

A stable foundation before more features. The MVP is Phases 0 to 4, plus admin and safety tools before any open sign-up. Everything else is real and planned, but comes after the product is working and moderated.

## Phases and dependencies

| Phase | Scope | Depends on |
|---|---|---|
| **0. Foundation** | Monorepo, CI, Docker dev environment, database and migrations, shared schemas, design-system port from the prototype, auth and sessions, age gate | none |
| **1. Core chat** | One-to-one and group chat (250 members), delivery states, typing, replies, edits, deletes, forwarding, reactions, stars, disappearing messages, media upload, offline queue, push, blocking and reporting, settings, onboarding, language picker | 0 |
| **2. Admin and safety** | Reports queue, user lookup, warn/suspend/ban, appeals, audit log, simple metrics, automatic hiding, hash-list matching | 1 |
| **3. Social and stories** | Friends, following, close friends, optional contact discovery, suggestions, stories (24 h), Highlights, activity, "Down for" status | 1, 2 |
| **4. Games** | Two-player games (Chess, Connect Four, Tic-tac-toe, Trivia duel), then group games (Trivia party, word game, Ludo, drawing), game badges, friends leaderboards, "looking for a player" | 1 |
| **5. Premium** | Paystack, entitlements, premium badges and collections, longer edit window, bigger uploads, themes, 7-day trial | 1, 3 |
| **Wave 1** | About 1,000 users via waitlist | 0 to 5 (premium may follow shortly after) |
| **6. Live and Nearby** | Friends-only live with replays, then Nearby (opt-in, adults only, coarse distance) | 3 |
| **Wave 2** | About 10,000 users | 6, data from Wave 1 |
| **7. Growth** | Capacitor mobile apps, store payments, Story-tab ads, public live (premium, 18+ hosts), end-to-end encryption for one-to-one chats, extra languages, gift premium | Wave 2 results |
| **Global release** | Open worldwide | 7 |

## MVP versus later

**MVP (Wave 1):** accounts and safety, chats and groups, media, friends and stories, notifications, settings, a small set of games, admin and moderation tools, privacy and legal documents.

**Later:** friends-only live and Nearby (Wave 2), then public live, ads, mobile apps, end-to-end encryption, gifting, extra games and languages.

**Deliberately parked:** a post feed, coins or any in-app currency, and real-money staking. Reopening any of these requires a new decision, a feature interview and (for staking) legal advice and licensing first.

## Testing requirements

- **Unit:** all service rules, especially permissions, edit and delete windows, age rules, username rules and payment handling.
- **Integration:** every route against a real PostgreSQL; permission tests per endpoint.
- **End to end:** sign up and verify, send and receive a message, create a group, post a story, play a game, purchase premium (test mode).
- **Real-time and load:** k6 WebSocket tests before every wave.
- **Security:** dependency and secret scans in CI, a pre-launch authentication and upload review.
- **Accessibility:** automated checks plus manual keyboard and screen-reader passes on core flows.
- Auth, permissions and payments need the highest coverage. Nothing merges with failing tests.

## Frontend and backend integration

Schema-first through `packages/shared`. The frontend works against a mock API while the backend is built, then switches over. Contract tests catch mismatches. Migrations are backward-compatible.

## Git workflow

Protected `main`, short-lived branches, small pull requests with one review, conventional commits, CI must pass. Merges go to staging; production deploys are tagged releases with manual approval. Decisions that change behaviour update `DECISIONS.md` in the same pull request.

## Coding conventions

TypeScript strict, ESLint and Prettier enforced, no hard-coded limits, routes/services/repositories layering, typed errors, structured logs, every user-visible string translated, every endpoint documented.

## Technical risks and mitigations

| Risk | Mitigation |
|---|---|
| Free tiers change or run out; WebSockets need an always-on host | Verify terms early; portable containers; a documented low-cost fallback |
| Moderation load with a small team and open sign-up | Waves, waitlist, automation first, admin tools before launch |
| Child safety failures | Hard rules, tests, nightly audit, legal review |
| Payments need a registered business | Start registration early; premium may follow the first wave |
| Live video cost | Ships last, capped, friends-only first |
| Scope creep from "features later" | Feature-interview process; every new feature gets a decision record |
| Retrofitting end-to-end encryption | Columns and device keys reserved now; vetted library only |
| iOS web push limits | Installed PWA guidance, then Capacitor apps |
| Single-node WebSocket limits | Redis fan-out designed in; add instances when load tests demand |
| Team availability | Small, reviewable pull requests; clear module boundaries; documentation kept current |

## Open questions (to resolve before or during Phase 0)

- The backend developer's comfort with TypeScript (the server language is assumed).
- Weekly hours available to the team, and any infrastructure budget.
- Business registration status and provider requirements (payments, app stores).
- Final launch language set beyond English and Nigerian Pidgin.
- Exact premium feature list and pricing (not yet decided).
- Which group games ship first.
