# Security and Privacy

Nudge treats safety as a product feature. This file states what must be true; every item should be testable.

## Principles

1. Collect the minimum data and keep it for the minimum time.
2. Enforce rules on the server and in the database, never only in the client.
3. Claim only what is true. At launch: "encrypted in transit and at rest". End-to-end encryption is a later phase.
4. Child safety rules are hard-coded and tested, not just documented.
5. Every admin action is logged and reviewable.

## Authentication

- Sign-in with email and password (argon2id hashing) or Google. Optional phone verification (used for trust and contact discovery, not as the primary login).
- Email verification is required before full use.
- **Sessions:** a short-lived access token (about 15 minutes, held in memory) and a rotating refresh token (httpOnly, secure, SameSite cookie, stored hashed on the server). Reuse of an old refresh token revokes the whole token family and signs the user out everywhere on that chain.
- Sessions last 30 days on phones and installed apps (renewing on use), 7 days for a "public computer" web option. Users can view and revoke sessions in Settings.
- New-device sign-ins trigger an email alert.
- Password recovery is by an emailed link only. Tokens are single-use, hashed, and expire quickly. Two-factor is a future option.
- Login, registration, reset, verification and friend-request endpoints have strict rate limits and lockout delays.

## Authorisation

- Role checks (`owner`, `admin`, `member` in groups; `admin`, `moderator`, `support` for staff) live in services in one place per module.
- Every endpoint has a permission test: unauthenticated, wrong user, blocked user, non-member, under-age.
- Admin routes use a separate token scope and require a staff role; moderation decisions and appeals require different people.
- Database constraints back up the most important rules (group size, self-relations, appeal reviewer, message length).

## Age and child safety

- Minimum age 13, checked from the private date of birth at sign-up.
- Under-18 accounts: no public stories or public live, no appearance in Nearby, private by default, not discoverable by strangers, limited contact discovery.
- Public live hosting (Phase 7) requires age 18 or over.
- A nightly audit query reports any under-18 public content, as a safety net on top of the creation-time check.
- Uploaded images are matched against standard hash lists of known illegal material; matches are blocked, preserved as required by law and reported through the proper channel. This process is documented and reviewed by a lawyer before launch.

## Privacy

- Phone numbers are stored only as keyed hashes. Contact matching is opt-in, off by default, and raw contact lists are never stored.
- The date of birth is private; the profile may show month and day only when the user chooses.
- Users control last seen, online status, profile photo visibility, read receipts, typing indicators, who can message them, who can add them to groups, and story audiences.
- Blocking is silent and complete: no messages, calls, stories, live, search results or group adds.
- Data rights: export, correction and deletion are available in Settings. Deleted accounts are anonymised, personal media removed, and messages remain as "Deleted user" unless the user deleted them first.
- Hosting region and processing are disclosed in the privacy policy (African or European region). Compliance targets: Nigeria Data Protection Act, GDPR for EU users.
- A privacy policy and terms, reviewed by a lawyer, are required before the first public wave.

## Encryption

- **In transit:** TLS everywhere, HSTS, modern ciphers.
- **At rest:** provider-managed disk and object encryption; secrets and tokens hashed or encrypted.
- **End-to-end (planned):** one-to-one chats first. The schema already holds device identity keys and ciphertext fields. Design intent: a vetted protocol and library (for example a Signal-protocol implementation), never custom cryptography, with encrypted backups using a user-held recovery key. Groups, search and moderation implications are reviewed before that phase starts.
- Stories, public content, live and games are not end-to-end encrypted.

## Application security

- Input validation on every route using shared schemas; output encoding for all user content.
- Content Security Policy, no inline scripts, strict CORS, secure cookie flags, CSRF protection for cookie-based routes.
- Upload safety: signed upload slots with size and type limits, malware scanning before a file becomes visible, executables and APK files blocked, ZIP allowed.
- Secrets live in environment configuration, never in the repository; rotated on suspicion.
- Dependencies scanned in CI; lockfiles committed; updates reviewed.
- Payments: Paystack webhooks verified by signature, processed idempotently, never trusted without verification; card data never touches Nudge servers.
- Logs never contain tokens, passwords, message bodies, or full emails and phone numbers.

## Abuse prevention and moderation

- Block, mute and restrict for every user. Report buttons on messages, profiles, stories and live.
- Automation first: content is hidden automatically after several independent reports; repeat offenders are slowed or limited; spam patterns are filtered; friend requests are capped (50 per day) and slowed for ignored or reported senders.
- Reports capture a snapshot of the evidence at the time, because content may later disappear or be encrypted.
- Sanctions: warn, hide, suspend, ban. Banned users can appeal; a different reviewer decides.
- The audit log is append-only and records who did what and why.

## Incident response

A written, short runbook covers: confirming and containing an incident, rotating secrets, revoking sessions, notifying affected users and the regulator within legal time limits, and a post-incident review. Alerts exist for unusual login failures, spikes in reports, and error rates.

## Security testing

Permission tests per endpoint, dependency and secret scanning in CI, a pre-launch review of authentication and uploads, and a restore test of backups. An external review is recommended before the full global release.
