# Deployment and Infrastructure

## Principles

- Spend nothing until we must. Use free tiers of managed services, keep the application portable (containers, standard Postgres and Redis, S3-compatible storage), and avoid lock-in.
- **Free-tier limits and prices change. Verify the current terms of every provider before committing, and record the result in `DECISIONS.md`.**
- Live video is the one feature that can create a surprise bill: it is capped and ships last.

## Environments

| Environment | Purpose | Notes |
|---|---|---|
| **local** | Development | Docker Compose: Postgres, Redis, optional local LiveKit; seed data |
| **staging** | Pre-production checks | Same shape as production at tiny scale; every merge to `main` deploys here automatically |
| **production** | Real users | Deployed from tagged releases only |

Each environment has its own database, Redis, storage bucket, secrets and payment/test keys. Production secrets are never available in local or staging.

## Components and hosting (to verify)

| Component | Approach | Constraint |
|---|---|---|
| Web app and admin | Static hosting on a CDN | Free tiers usually cover this |
| API and WebSocket server | One container on an always-on host | WebSockets cannot sleep, so "free" hosts that stop idle apps are not suitable; options to evaluate include always-free virtual machines and low-cost container hosts |
| PostgreSQL | Managed instance on a free tier | Watch storage, connection and inactivity limits |
| Redis | Managed free tier or a container beside the API | Used for presence, pub/sub, queues; data is rebuildable |
| Object storage and CDN | S3-compatible storage with a CDN | Pick a provider without egress fees |
| Live video | LiveKit hosted free tier, or self-hosted later | Capped session length and audience; friends-only first |
| Email | Transactional email free tier | Verification and security mail only at first |
| Push | FCM and Web Push | Free |
| Payments | Paystack | Business registration may be required; start early |
| Monitoring | Free-tier error tracking, uptime checks, log search | Alert to a shared channel |

## CI/CD

1. Pull request: install, lint, typecheck, unit and integration tests (Postgres and Redis in containers), dependency and secret scan, build.
2. Merge to `main`: build container images, run database migrations on staging, deploy staging, run smoke tests.
3. Tag a release: deploy to production after manual approval, run migrations first, then roll out the app; keep the previous image ready for fast rollback.

**Migrations are backward-compatible** (expand, deploy, contract) so the running version keeps working while a new one starts.

## Configuration

Typed environment configuration; the server refuses to start if required values are missing. `infrastructure/env/.env.example` lists every variable without secrets. Feature flags control exposure by user, wave and country.

## Backups and recovery

- Automated nightly database backups with point-in-time recovery where available.
- Object storage versioning or lifecycle rules for media.
- **A full restore is rehearsed before Wave 1 and every quarter.** A backup that has never been restored is not a backup.
- Target for the early waves: recovery within a few hours with at most one day of data loss; tighten this as the product grows.

## Observability

Structured logs with request IDs, error tracking, uptime checks on the API and WebSocket endpoint, dashboards for connections, event latency, queue depth, error rate, signups and reports. Alerts for: server down, database near limits, job backlog, spike in failed logins, spike in reports.

## Capacity and cost control

- Wave targets: Wave 1 about 1,000 users, Wave 2 about 10,000, architecture for 100,000.
- Load tests (k6) before each wave: hundreds, then thousands of WebSocket connections.
- Cost guards: upload size caps, live session limits, media retention rules, per-user rate limits, a monthly spend alert on every paid service.
- When free limits are approached, the order of response is: tighten caps, add caching, then pay for the specific component, never a blanket upgrade.

## Release plan

1. Staging with real flows and test users.
2. Wave 1: waitlist-based open sign-ups, around 1,000 users, with moderation tools live.
3. Review costs, moderation load and reliability.
4. Wave 2 (about 10,000), then the global release.
5. Mobile apps (Capacitor) once the web app is stable, then store payments.

## Disaster basics

Keep infrastructure defined in `infrastructure/` so a new environment can be rebuilt from the repository, a documented rollback procedure, and a contact list for providers.
