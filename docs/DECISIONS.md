# Decisions Log

Every product and technical decision, with the reasoning. When a decision changes, edit the entry, add the date, and keep the old value in "Changed from". Status: **Decided**, **Delegated** (chosen by the technical lead on the product owner's behalf, revisable), or **Open**.

Product owner: Dayo. Technical lead: Claude.

## Product

| # | Decision | Status | Reasoning |
|---|---|---|---|
| P1 | Nudge is a real business, not just a project | Decided | Shapes compliance, payments and quality bar |
| P2 | Chats are the heart; everything connects to talking, organising, sharing, playing | Decided | Keeps the product coherent, avoids a feature pile |
| P3 | Audience: youths and older people, Nigeria first, global soon | Decided | Test locally, design for global from day one |
| P4 | Web first (installable PWA), then mobile apps | Decided | Fastest to real users; Capacitor reuses the code |
| P5 | Open pre-release in waves (about 1,000, then 10,000), then global | Decided and refined | Open access gains traction; waves control cost and moderation load |
| P6 | Team: Dayo, a backend developer friend, Claude | Decided | |

## Accounts and profiles

| # | Decision | Status | Reasoning |
|---|---|---|---|
| A1 | Email or Google sign-in; optional phone verification | Decided | No SMS cost at launch; phone adds trust and contact discovery |
| A2 | Unique usernames; find people by name and username | Decided | Add people without sharing numbers |
| A3 | Contacts page shows phone contacts on Nudge; opt-in, off by default; numbers hashed | Decided | Growth feature with privacy and legal safety |
| A4 | Password reset by email link only | Decided | Simple for launch; two-factor later |
| A5 | 30-day sessions, unlimited devices, viewable and revocable | Delegated | Matches user expectations; rotating tokens for safety |
| A6 | Email verification and rate limits | Delegated | Prevents impersonation and abuse |
| A7 | Minimum age 13; extra protections under 18; DOB private and required | Decided and refined | Legal baseline and child safety; birthday display (month and day only) is optional |
| A8 | Username change once per 6 months; friends notified; old names reserved 90 days | Decided and delegated | Limits impersonation |
| A9 | Profile photo or short video avatar; default 2D user icon | Decided | |
| A10 | "Down for…" status chip plus optional text, with expiry | Decided | Distinctive, ties to games and availability |
| A11 | Premium badges separate from game badges | Decided | Paid status never mistaken for achievement or verification |
| A12 | No verified or business accounts for now | Decided | |
| A13 | Online status optional and can be turned off | Decided | |
| A14 | Account deletion keeps messages as "Deleted user"; option to delete own messages first | Decided and refined | Keeps other people's chats readable |

## Messaging and media

| # | Decision | Status | Reasoning |
|---|---|---|---|
| M1 | Server-stored history now, E2EE designed in, later for one-to-one chats | Delegated | E2EE from day one costs months and hurts sync, search and groups; claim only what is true |
| M2 | Groups up to 250 members; rooms and temporary groups | Decided | |
| M3 | Edit 15 minutes (premium 1 day); delete for everyone 48 hours; "edited" label | Decided and delegated | WhatsApp-like norms; premium perk |
| M4 | Disappearing timers: off, 24 h, 7 d, 30 d; plus vanish-after-read | Delegated | Keeps Nudge's signature mode |
| M5 | Delivery states, read receipts and typing indicators, user-controllable | Delegated | Standard expectations; privacy by choice |
| M6 | 4,000 character limit; forward to 5 chats max; any-emoji reactions | Delegated | Anti-spam and misinformation |
| M7 | Photos: Standard or Original; videos WhatsApp-style (about 64 MB free, 500 MB premium); voice notes unlimited in the UI with a 60-minute technical ceiling; documents 25 MB free, 250 MB premium | Decided and delegated | Fit slow data and cost limits; numbers live in config |
| M8 | Share friends' usernames as profile cards | Decided | |
| M9 | Malware scan; block executables and APK; allow ZIP | Delegated | |
| M10 | Media kept while the chat exists; disappearing media deleted with the message; orphan cleanup | Delegated | Revisit when storage costs grow |

## Stories, live, social

| # | Decision | Status | Reasoning |
|---|---|---|---|
| S1 | Stories last 24 h plus permanent Highlights | Decided | |
| S2 | Public stories visible to non-friends (following layer); friends are private | Decided and delegated | |
| S3 | Under-18s cannot post publicly | Delegated | Child-safety hard rule |
| S4 | Live is phased: friends-only live (16+) first; public live later, premium, 18+ hosts | Delegated | Cost and real-time moderation risk |
| S5 | Live replays kept 30 days by default; premium longer | Delegated | |
| S6 | No post feed in the first release | Decided | Keeps Chats central; schema allows adding later |
| S7 | Nearby included; opt-in, location must be on to be found, adults only, coarse distance, after core features | Decided and delegated | Distinctive but high safety burden |
| S8 | Friend suggestions from mutual friends and shared groups only; 50 requests per day | Decided and delegated | |

## Notifications, games, premium

| # | Decision | Status | Reasoning |
|---|---|---|---|
| N1 | Push, in-app and email; SMS only for verification; sender-only previews by default | Delegated | |
| N2 | "Heads-down" status mutes everything except close friends' calls | Delegated | Distinctive feature |
| G1 | Real-money staking removed for now | Decided | Gambling licensing, store and payment-provider risks, minors |
| G2 | No coins or in-app currency for now | Decided | Simpler, honest; reopenable via a new decision |
| G3 | Turn-based and live games, server-authoritative; two-player and group games; game badges; friends leaderboards | Decided | |
| G4 | Premium never gives a gameplay advantage | Delegated | |
| R1 | Premium perks: badges and collections, 1-day edits, bigger uploads, public live, longer replays, themes | Delegated, more later | Core communication is never paywalled |
| R2 | Paystack on web first; weekly and monthly plans; 7-day trial; store payments with mobile apps | Delegated | Practical for Nigeria |
| R3 | Ads only in the Story tab for free users; premium is ad-free; none in private chats; none at launch | Decided and refined | |
| R4 | Gift premium to friends | Delegated, Phase 7 | |

## Safety and administration

| # | Decision | Status | Reasoning |
|---|---|---|---|
| X1 | Block, mute and restrict; report everywhere | Delegated | |
| X2 | Automation-first moderation; waves; admin tools before open sign-up | Delegated | Small team |
| X3 | Roles: Admin, Moderator, Support | Decided | |
| X4 | Dashboard at launch: reports queue, user lookup, warn/suspend/ban, audit log, simple metrics | Decided | |
| X5 | Banned users can appeal; a different person reviews | Decided | Fairness and legal protection |
| X6 | Privacy-friendly analytics; no selling data | Decided | |
| X7 | Hash-list matching for known illegal images; lawyer-reviewed policies before launch | Delegated | Legal duty |
| X8 | Data hosted in an African or European region | Delegated | No Nigerian hyperscale region |
| X9 | Language picker defaulting to device language; English and Pidgin first | Decided and delegated | |

## Technical

| # | Decision | Status | Reasoning |
|---|---|---|---|
| T1 | Modular monolith | Delegated | Three people cannot run microservices |
| T2 | React, TypeScript, Vite, PWA | Delegated | |
| T3 | Node.js, TypeScript, Fastify | Delegated; assumption | Assumes the backend developer is comfortable with TypeScript; revisit if not |
| T4 | PostgreSQL, Redis | Delegated | |
| T5 | Own backend, not an all-in-one service | Delegated | Authoritative games, custom real-time, future E2EE |
| T6 | LiveKit for live video | Delegated | Do not build video infrastructure |
| T7 | S3-compatible storage with CDN | Delegated | Cheap, global |
| T8 | pnpm monorepo with shared schemas | Delegated | One source of truth for contracts |
| T9 | Free-tier managed services, verified before use | Decided | No infrastructure budget |

## Open

- Backend developer's language comfort (T3).
- Weekly hours and any budget.
- Business registration status.
- Launch language set beyond English and Pidgin.
- Premium pricing and extra premium features.
- Which games ship first.
