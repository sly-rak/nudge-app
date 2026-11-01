# Frontend

Applies to `apps/web` (the user app) and, where relevant, `apps/admin`.

## Stack

React, TypeScript (strict), Vite, React Router, TanStack Query, a small global store for UI state, i18next, Dexie (IndexedDB), Radix primitives for accessible widgets, and a vite PWA plugin. The prototype's visual identity (colours, typography, rounded layouts, light and dark themes) becomes design tokens in `packages/ui`.

## Folder structure

```
apps/web/src
  app/          router, providers, app shell, error boundaries
  features/     auth | chats | groups | stories | live | games | profile
                settings | nearby | premium | notifications | onboarding
    each feature: screens/, components/, hooks/, api.ts, store.ts, tests/
  components/   cross-feature UI (modals, toasts, empty states, skeletons)
  lib/          api client, ws client, offline queue, i18n, analytics, storage
  styles/       tokens, themes, global styles
```

Rules: a feature never imports from another feature. Cross-feature needs go through `components`, `lib` or `packages/shared`.

## Screens

Onboarding and auth, chat list (with Archived, pins, search), chat thread (with search, media, group info), stories tray and viewer, live (host and viewer), games hub and game screens, Nearby, profile (own and others), settings (Account, Privacy, Notifications, Appearance, Storage and data, Help and support), premium, notifications/Activity, and the offline and error states.

## Routing and layout

- Phone: one screen at a time with a bottom tab bar (Chats, Story, Calls, Activity, Profile) as in the prototype.
- Desktop: list and thread side by side, settings as two panes.
- Routes are lazy-loaded per feature. Deep links exist for chats, profiles, stories and game invites.

## State management

| Kind | Tool |
|---|---|
| Server data (chats, messages, profiles, friends) | TanStack Query cache |
| Real-time updates | WebSocket events written directly into the query cache |
| Ephemeral UI state (open menus, drafts) | Component state or a small store |
| Offline data and queued sends | IndexedDB (Dexie) |
| Preferences | Server-synced settings, with device-only settings (app lock, storage, sounds) kept locally |

Never store tokens or sensitive data in `localStorage`.

## API communication

A typed client generated from `packages/shared` schemas. Every call validates responses in development. One error type is mapped to user-friendly messages. Requests are retried with backoff on network errors, never on validation errors.

## Authentication flow

Access token in memory only, rotating refresh token in a secure httpOnly cookie, silent refresh before expiry, and a forced sign-out if the server reports a reused refresh token. Age gate and email verification happen during onboarding.

## Real-time

One WebSocket per tab. It reconnects with backoff, resumes from the last seen sequence number, and queues outgoing events while offline. See `REALTIME.md`.

## Media handling

Compress and create thumbnails on the device (photos: Standard or Original choice; videos compressed, trim tool). Upload directly to storage with signed URLs, show instant previews, and cache with a size-limited policy tied to the Storage settings. Respect data saver and auto-download rules.

## Error handling and loading states

- An error boundary per feature, with a retry action.
- Skeletons for lists, spinners for short actions, toasts with Undo for reversible actions (archive, clear, delete).
- A global offline bar and a slow-connection notice; messages sent offline wait in an outbox and send on reconnect.
- Destructive actions always ask for confirmation; reversible ones offer Undo.
- Friendly fallback messages for unexpected errors, without leaking technical details.

## Responsive design

Mobile first. Breakpoints at phone, tablet and desktop. Touch targets of at least 44 px. Pull-to-refresh on touch lists. Safe-area insets respected.

## Accessibility

Target WCAG 2.2 AA: semantic HTML, labelled controls, full keyboard navigation, visible focus, focus trapping in dialogs, screen-reader live regions for toasts, reduced-motion support, text scaling, and a high-contrast option. Every new component is checked with an automated accessibility test.

## Internationalisation

All text goes through i18next keys. The language picker defaults to the device language. English and Nigerian Pidgin ship first; Yoruba, Igbo, Hausa and others are translation files only. Dates, numbers and time zones use `Intl`.

## Frontend security

Strict Content Security Policy, sanitised user-generated text and links, no inline scripts, no secrets in the bundle, dependency auditing in CI, safe handling of external links, and no sensitive data in logs or analytics.

## Conventions

- Components are small, typed and tested. Hooks hold logic; components render.
- File names: `PascalCase.tsx` for components, `camelCase.ts` for modules.
- No raw colour values or spacing numbers in feature code; use tokens.
- Every user-visible string is a translation key.
- Every feature has unit tests for hooks and component tests for key states (loading, empty, error, success).
