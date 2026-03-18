# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Claude Chat is a visual chat interface for Claude Code Teams - a WeChat-like messaging experience for AI agent collaboration. It provides real-time chat, team management, @ mentions, and desktop notifications.

## Development Commands

```bash
# 一键启动（推荐）- 从配置文件读取端口
bash scripts/start.sh

# 或分别启动
bun run dev              # Bun 运行时，并行启动前后端

# Development (individual)
bun run dev:server       # Backend only with Bun hot reload
bun run dev:client       # Frontend only with Vite

# Build
npm run build            # Build client then server
npm run build:client     # Vite build to dist/client
npm run build:server     # tsc -p src/server/tsconfig.json
npm run build:prod       # Production build

# Code Quality
npm run type-check       # TypeScript check without emit
npm run lint             # ESLint
npm run lint:fix         # ESLint with auto-fix
npm run format           # Prettier

# Testing
npm run test             # Vitest unit tests
npm run test:e2e         # Playwright E2E tests
npm run test:coverage    # Vitest with coverage

# Production
npm start                # Run from dist/server/index.js
```

## Configuration

配置文件位于 `~/.claude-chat/config.json`:

```json
{
  "port": 4558,           // 后端服务端口
  "host": "localhost",    // 后端绑定地址
  "clientPort": 4559,    // 前端开发服务器端口
  "clientHost": "localhost", // 前端绑定地址
  "dataDir": "~/.claude-chat",
  "teamsPath": "~/.claude/teams",
  "retentionDays": 90,
  "theme": "auto",
  "desktopNotifications": true,
  "soundEnabled": false,
  "cleanupEnabled": true,
  "cleanupTime": "02:00"
}
```

### 启动脚本

`scripts/start.sh` 从配置文件读取端口并启动两个服务：

```bash
bash scripts/start.sh
# 输出:
# ╔══════════════════════════════════════════════════════════════╗
# ║                Claude Chat 配置                              ║
# ╠══════════════════════════════════════════════════════════════╣
# ║  后端端口: 4558                                              ║
# ║  前端端口: 4559                                              ║
# ║  前端主机: localhost                                         ║
# ╚══════════════════════════════════════════════════════════════╝
```

### 端口发现

前端启动时自动发现后端端口（尝试 4558, 8888, 9000, 9999），无需硬编码。

## Architecture

```
┌─────────────────┐     WebSocket      ┌─────────────────┐
│   Browser UI    │ ◄────────────────► │  Bun Runtime    │
│  (Preact + WS)  │                    │  (Fastify + WS) │
└─────────────────┘                    └────────┬────────┘
                                                │
                    ┌───────────────────────────┼───────────┐
                    ▼                           ▼           ▼
            ┌──────────────┐           ┌──────────────┐ ┌──────────┐
            │   SQLite DB  │           │  Claude FS   │ │  Cleanup │
            │  (messages)  │           │  (sync)      │ │  (cron)  │
            └──────────────┘           └──────────────┘ └──────────┘
```

**Runtime**: Bun (dev), Node.js (prod)

## Directory Structure

- `src/server/` - Backend (Fastify, SQLite, WebSocket)
  - `server.ts` - Main Fastify server setup and WebSocket handler
  - `cli.ts` - Command-line entry point with commander
  - `routes/` - REST API endpoints (teams, messages, archive, settings)
  - `services/` - Business logic (DataSync, FileWatcher, Cleanup)
  - `db/` - SQLite database service
- `src/client/` - Frontend (Preact, TailwindCSS)
  - `app.tsx` - Root component with team/message state
  - `components/` - UI components (Sidebar, ChatArea, MessageBubble, InputBox)
  - `hooks/` - Custom hooks (useWebSocket, useTheme)
  - `utils/` - API client
- `src/shared/` - Shared types and constants between client/server

## Key Patterns

### Frontend State Management
- Uses Preact hooks (useState, useEffect) directly - no external state library
- Messages stored in `Map<teamName, Message[]>`
- WebSocket messages handled via `useWebSocket` hook with `lastMessage` callback

### Backend Services
- **DatabaseService**: SQLite wrapper for messages and teams
- **DataSyncService**: Syncs messages between Claude Teams filesystem and SQLite
- **FileWatcherService**: Watches `~/.claude/teams/*/inboxes/*.json` for changes using chokidar
- **CleanupService**: Scheduled cron job for message retention

### WebSocket Protocol
- Client → Server: `join_team`, `leave_team`, `typing`, `mark_read`
- Server → Client: `new_message`, `new_messages`, `message_updated`, `member_online/offline`, `team_deleted/archived`

### API Routes
- `GET /api/teams` - List teams
- `GET /api/teams/:name/messages` - Get team messages (supports `?before=&limit=&to=`)
- `POST /api/teams/:name/messages` - Send message
- `GET /api/archive` - Archived teams
- `GET /api/settings` - User settings

## Data Models

Core types defined in `src/shared/types.ts`:
- **Message**: id, from, to, content, contentType, timestamp, claudeRef (links back to Claude inbox)
- **Team**: name, status (active/archived), members, config
- **TeamMember**: name, displayName, role, color, avatarLetter

## Development Notes

- Frontend uses Vite with Preact preset; proxies `/api` and `/ws` to backend in dev
- Backend uses `tsx watch` for TypeScript execution during development
- Server port: 4558, Client dev server: 4559
- Production build serves static files from `dist/client/` via Fastify
- WebSocket uses `@fastify/websocket` (native WebSocket, not Socket.io)
