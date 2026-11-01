# Nudge Monorepo

Nudge is a messaging and social app for talking, organising, sharing, and playing with friends.

This monorepo separates the project cleanly into **Backend** and **Frontend**, linked through a **Shared** package defining contracts, types, and real-time events.

---

## 📁 Repository Structure

```
.
├── packages/
│   └── shared/          # Single source of truth: types, limits, WebSocket events
├── nudge-backend/       # Fastify + TypeScript + WebSockets + Neon PostgreSQL
├── nudge-frontend/      # React 18 + TypeScript + Vite PWA + Design System
└── docs/                # Architectural, database, API, and real-time specifications
    └── design-reference/ # Standalone interactive prototype
```

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Seed Database (Neon PostgreSQL)
All 18 tables and extensions have been migrated to Neon PostgreSQL. To seed or re-seed demo data:
```bash
pnpm db:seed
```

### 3. Start Development Servers
Runs both the backend (`http://localhost:3001`) and frontend (`http://localhost:5173`) concurrently:
```bash
pnpm dev
```

Or run them individually:
```bash
# Backend only
pnpm dev:backend

# Frontend only
pnpm dev:frontend
```

---

## ⚡ Features Implemented & Linked

- **Real-Time Messaging**: Fastify WebSocket gateway (`/v1/ws`) with real-time delivery, sequence numbers, delivery ticks (`✓✓`), reply-to quote box, and emoji reactions.
- **Typing Indicators & Presence**: Ephemeral typing events and online status broadcasted across tabs.
- **Demo Account Switcher**: Built-in 1-click account switching (Dayo, Amara, Tobi, Claude) to test real-time chatting and multiplayer games across browser tabs.
- **"Down for..." Status**: Distinctive status chips (`Down to talk`, `Down to play`, `Down to hang`, `Heads down`) synced with the database.
- **24-Hour Stories**: Stories tray with gradient rings, story viewer modal with progress bars, and story composer.
- **Interactive Games Hub**: Real-time turn-based Tic-Tac-Toe synced over WebSockets and Word Guess puzzle.
- **Nearby Radar**: Siri-style animated orb with radar waves and nearby peers list.
- **Calls Simulation**: Encrypted voice & video call modal with duration counter, mute, and video toggles.
- **Neon PostgreSQL**: 18 tables with UUIDv7 primary keys, citext extensions, and relational constraints.
