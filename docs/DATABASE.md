# Database

PostgreSQL. Managed instance on a free tier at first (verify terms; see `DEPLOYMENT.md`).

## Conventions

- Primary keys are **UUIDv7** (time-ordered, index-friendly).
- Timestamps are `timestamptz` in UTC. Every table has `created_at`; mutable tables have `updated_at`.
- Usernames and emails use case-insensitive text (`citext`).
- Content is tombstoned with `deleted_at`; account deletion anonymises the user row.
- All schema changes are versioned migrations, backward-compatible (add, deploy, then remove).
- Business rules are enforced with constraints wherever possible, not only in code.

## Tables by domain

### Identity
- **users**: id, email (unique), email_verified_at, username (unique), username_changed_at, display_name, bio, dob (private), birthday_visible, avatar_media_id, avatar_kind, phone_hash, phone_verified_at, age_tier (`13_17` or `18_plus`), deactivated_at, deleted_at.
- **auth_identities**: user_id, provider (`password` or `google`), subject, password_hash (nullable). Unique (provider, subject).
- **sessions**: id, user_id, family_id, refresh_token_hash, device_name, ip, user_agent, last_used_at, revoked_at. Token reuse revokes the whole family.
- **email_tokens**: user_id, purpose (`verify`, `reset`), token_hash, expires_at, used_at.
- **username_history**: user_id, username, released_at. A name stays reserved for 90 days after release.
- **user_settings**: user_id (PK); privacy columns (`last_seen_visibility`, `online_visibility`, `photo_visibility`, `message_requests`, `group_adds`, `read_receipts`, `typing_indicators`, `contacts_discoverable` default false, `story_audience_default`); `preferences` (versioned JSONB for non-queried settings).
- **user_status**: user_id (PK), down_for (`talk`, `play`, `hang`, `heads_down`), text, expires_at.
- **devices**: id, user_id, session_id, platform, push_token, public_identity_key (reserved for E2EE), last_seen_at.

### Social graph
- **friendships**: user_a, user_b (CHECK user_a < user_b), requester_id, status (`pending`, `accepted`), responded_at. PK (user_a, user_b).
- **follows**: follower_id, followee_id. PK both. CHECK different.
- **blocks**, **mutes**, **restricts**: owner_id, target_id. PK both.
- **close_friends**: owner_id, friend_id. PK both.
- **contact_hashes**: user_id, hash. Only for users who opted in; unique (user_id, hash). No raw numbers stored.

### Messaging
- **conversations**: id, type (`direct`, `group`), direct_key (unique for direct, sorted pair), last_seq, last_message_at.
- **conversation_members**: conversation_id, user_id, role (`owner`, `admin`, `member`), joined_at, left_at, muted_until, archived_at, pinned_at, last_delivered_seq, last_read_seq, disappearing_seconds. PK (conversation_id, user_id).
- **groups**: conversation_id (PK), name, avatar_media_id, description, created_by, max_members (CHECK ≤ 250), info_admin_only, send_admin_only, add_admin_only, ends_at, archived_at.
- **rooms**: id, conversation_id, name, admin_only, archived_at (rooms inside groups; one default `general`).
- **messages**: id, conversation_id, room_id, seq, sender_id, client_msg_id, type (`text`, `image`, `video`, `voice`, `document`, `gif`, `sticker`, `location`, `profile_card`, `game`, `system`), body (CHECK length ≤ 4000), reply_to_id, forwarded_from_id, forward_count, edited_at, deleted_at, expires_at, vanish_after_read, ciphertext (nullable, reserved), enc_version (nullable, reserved).
- **message_edits**: message_id, previous_body, edited_at.
- **message_reactions**: message_id, user_id, emoji. PK (message_id, user_id).
- **starred_messages**: user_id, message_id.
- **message_media**: message_id, media_id, position.
- **media**: id, owner_id, kind, storage_key, mime, size_bytes, width, height, duration_ms, blurhash, scan_status (`pending`, `clean`, `blocked`), deleted_at.

### Stories and live
- **stories**: id, author_id, type (`text`, `photo`, `video`, `poll`, `question`), media_id, text, background, audience (`public`, `friends`, `close`, `selected`), allow_replies, allow_reactions, allow_sharing, expires_at.
- **story_audience**: story_id, user_id, mode (`include`, `exclude`).
- **story_views**: story_id, viewer_id, viewed_at. PK both.
- **story_reactions**: story_id, user_id, emoji.
- **story_polls**, **story_poll_votes**: options and one vote per user.
- **highlights**: id, owner_id, title, cover_media_id. **highlight_stories**: highlight_id, story_id, position.
- **live_sessions**: id, host_id, title, audience, provider_room, started_at, ended_at, peak_viewers, replay_media_id, replay_expires_at. Viewer lists are in Redis only.

### Games
- **game_sessions**: id, game_key, conversation_id, status, state (JSONB), version (optimistic lock), turn_user_id, created_by, ended_at, winner_id.
- **game_players**: session_id, user_id, seat, result, score.
- **game_moves**: session_id, move_seq, user_id, move (JSONB), created_at. Append-only.
- **badges**: id, key, kind (`game`, `premium`), name, rarity. **user_badges**: user_id, badge_id, earned_at, equipped.
- **game_stats**: user_id, game_key, wins, losses, draws, rating.
- **lfg_posts**: "Looking for a player" requests (author, game_key, mode, need, status, expires_at).

### Money
- **plans**: key, interval (`week`, `month`, `year`), price_minor, currency, active.
- **subscriptions**: id, user_id, plan_key, status, current_period_end, provider, provider_ref (unique).
- **payments**: id, user_id, provider, provider_ref (unique), amount_minor, currency, status.
- **webhook_events**: provider, event_id (unique), received_at, processed_at. Makes webhook handling idempotent.
- **entitlements**: user_id, feature_key, value, source, expires_at. The only table features read to decide premium access.

### Notifications
- **notifications**: id, user_id, type, actor_id, entity_type, entity_id, data (JSONB), read_at.
- **notification_outbox**: id, user_id, device_id, channel (`push`, `email`), payload, status, attempts, run_at, collapse_key.

### Moderation and admin
- **reports**: id, reporter_id, target_type, target_id, category, note, snapshot (JSONB, evidence at report time), status.
- **moderation_actions**: id, report_id, target_user_id, action (`warn`, `hide`, `suspend`, `ban`), reason, by_admin_id, expires_at.
- **appeals**: id, action_id, user_id, text, status, reviewed_by (CHECK differs from the action's admin).
- **admin_roles**: user_id, role (`admin`, `moderator`, `support`).
- **audit_log**: id, admin_id, action, target_type, target_id, before, after, ip, created_at. Append-only.
- **feature_flags**: key, enabled, rollout_percent, countries, wave.

### Not in Postgres
- **Nearby:** Redis geo set with a short expiry, coarse precision, no history.
- **Presence and typing:** Redis.

## Indexes (key ones)

- messages: `(conversation_id, seq DESC)`; UNIQUE `(conversation_id, seq)`; UNIQUE `(sender_id, client_msg_id)`; partial `(expires_at) WHERE expires_at IS NOT NULL`.
- conversation_members: `(user_id, archived_at, pinned_at)`.
- stories: `(author_id, created_at DESC)`; partial on `expires_at`.
- notifications: `(user_id, created_at DESC)`; outbox: `(status, run_at)`.
- users: trigram on `username` and `display_name`; unique on `email` and `username`.
- friendships: `(user_b)` as well as the primary key, for reverse lookups.
- reports: `(status, created_at)`.

## Data lifecycle and retention

- Expired stories and their media are removed after expiry unless inside a Highlight.
- Disappearing messages are deleted by a job at `expires_at`, with their media.
- Media with no remaining references is garbage-collected.
- Live replays are deleted at `replay_expires_at` (default 30 days; premium longer).
- Sessions revoked or expired are purged after 30 days.
- Account deletion: the user row is anonymised ("Deleted user"), avatar and personal media removed, messages remain, and the user may delete their own messages first.
- Reports and audit logs are kept according to the privacy policy.

## Backups and recovery

Nightly automated backups plus point-in-time recovery where the provider offers it. A **restore is tested** before Wave 1 and then every quarter. See `DEPLOYMENT.md`.

## Scale notes

One Postgres instance is sufficient for the 100,000-user target. If `messages` grows too large, partition by time or conversation hash. Read replicas come before partitioning. Neither is built now.
