# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Current Version: v0.3.30

**最新修复** (2026-03-28):
- schema.sql 未复制到 dist 目录导致数据库初始化失败
- Windows 路径解析 bug (使用 `path.basename()`)
- 时区显示 (`/health` 返回本地时间)
- 数据库初始化 (`ensureReady()` 检查)
- 全局错误处理 (防止静默崩溃)
- `team_added` WebSocket 事件处理
- FileWatcher 错误处理和延迟
- 消息同步过滤逻辑

## 版本发布检查清单

**⚠️ 发布新版本时必须按顺序完成以下所有步骤**:

### 1. 更新版本号 (4个文件)

| 文件 | 字段 | 命令/操作 |
|------|------|---------|
| `package.json` | `version` | `npm version patch --no-git-tag-version` |
| `.claude-plugin/plugin.json` | `version` | 自动同步 |
| `.claude-plugin/marketplace.json` | `plugins[0].version` | 自动同步 |
| `CLAUDE.md` | `Current Version` | **手动更新** |

### 2. 更新变更日志

**CHANGELOG.md** - 在文件开头添加新版本条目:
```markdown
### [X.Y.Z](https://github.com/xijian001122/claude-teams-gui/compare/v0.3.19...vX.Y.Z) (2026-MM-DD)

### Bug Fixes / Features
- 具体改动描述
```

### 3. Git 提交和标签

```bash
git add -A
git commit -m "release: vX.Y.Z"
git tag vX.Y.Z
git push origin main --tags
```

### 4. 创建 GitHub Release ⚠️ 必须执行

```bash
gh release create vX.Y.Z \
  --title "vX.Y.Z - 简短描述" \
  --notes "## vX.Y.Z - 类型

### Fixed / Added / Changed
- 具体改动列表
"
```

### 5. 打包 (可选)

```bash
npm pack
```

---

**检查清单 (发布前逐项确认)**:
- [ ] `package.json` 版本已更新
- [ ] `CLAUDE.md` Current Version 已更新
- [ ] `CHANGELOG.md` 已添加新版本条目
- [ ] Git 已提交 (`git commit -m "release: vX.Y.Z"`)
- [ ] Git 标签已创建 (`git tag vX.Y.Z`)
- [ ] 已推送到 GitHub (`git push origin main --tags`)
- [ ] **GitHub Release 已创建** (`gh release create ...`)

## Project Overview

Claude Agent GUI is a visual chat interface for Claude Code Teams - a WeChat-like messaging experience for AI agent collaboration. It provides real-time chat, team management, @ mentions, and desktop notifications.

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

## Version Management

项目使用语义化版本控制 (SemVer) 和 Conventional Commits 规范。

### 版本号规则

| 提交类型 | 版本递增 | 示例 |
|---------|---------|------|
| `feat:` | minor +1 | `feat: add new login` → v0.**2**.0 |
| `fix:` | patch +1 | `fix: resolve bug` → v0.1.**2** |
| `BREAKING CHANGE:` | major +1 | `feat!: change API` → v**1**.0.0 |

### 发布命令

```bash
# 标准发布（自动递增版本）
npm run release

# 首次发布初始化
npm run release -- --first-release

# 推送标签到远程
git push --follow-tags origin <branch>
```

### CHANGELOG.md

每次发布自动更新 `CHANGELOG.md`，记录所有 feat、fix、docs 等类型的提交。

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
# ║                Claude Agent GUI 配置                              ║
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

## Agent Teams 职责规范

### Team-lead (@main) 职责边界

| 可以做 | 不能做 |
|--------|--------|
| ✅ 创建团队和成员 | ❌ 直接修改代码文件 |
| ✅ 创建和分配任务 | ❌ 自己实施任务（应该分配给成员） |
| ✅ 读取 OpenSpec 文档 | ❌ 绕过成员直接修复 Bug |
| ✅ 审查成员提交的代码 | ❌ 绕过 OpenSpec 流程直接开发 |
| ✅ 更新任务描述 | ❌ 修改团队成员的代码 |

### 重要规则

**没我允许不可自行关闭团队**

- Team-lead 在任务未完成前不得自行关闭团队
- 团队成员完成任务后必须等待我的确认
- 我需要审查所有完成的工作后才能决定关闭团队
- 如果需要关闭团队，必须先询问我获得许可

**核心原则**: Team-lead 只负责**分配任务**和**审查代码**，实际**代码变更由成员执行**。

### 团队成员角色配置

| 角色 | 名称 | 模型 | 核心职责 |
|------|------|------|----------|
| **前端开发者** | frontend-dev | kimi-k2.5 | Preact 组件开发、TailwindCSS 样式、WebSocket 消息处理、状态管理 |
| **后端开发者** | backend-dev | glm-5 | Fastify REST API、SQLite 数据库、WebSocket 服务、文件同步 |
| **测试者** | tester | glm-5 | 编写测试用例、执行测试、验证功能、报告问题 |
| **Bug 修复者** | bug-fixer | glm-5 | 问题调试、缺陷修复、回归测试 |

### 任务分配规则

| 任务类型 | 关键词 | 分配给 |
|---------|--------|--------|
| 前端任务 | UI、组件、样式、页面、Preact | frontend-dev |
| 后端任务 | API、路由、数据库、SQLite、服务 | backend-dev |
| 测试任务 | 测试、test、spec、验证、QA | tester |
| 修复任务 | bug、修复、fix、问题、错误 | bug-fixer |

### 项目工作流程

### 标准开发流程

```
1. 提案阶段 (Propose)
   ├── 使用 /opsx:propose <name> 创建提案
   ├── 生成 proposal.md, design.md, tasks.md
   └── 确定技术方案和任务分配

2. 开发阶段 (Develop)
   ├── 基于 main 创建功能分支
   ├── 按照 tasks.md 执行任务
   └── 定期提交代码到分支

3. 归档阶段 (Archive)
   ├── 使用 /opsx:archive <name> 归档变更
   ├── 归档文档保存到 docs/archive/<name>/
   └── 触发 Git 提交（必须）

4. 合并阶段 (Merge)
   ├── 创建 PR 到 main 分支
   ├── 代码审查
   └── 合并并删除功能分支
```

### OpenSpec 集成要求

**所有 OpenSpec 任务必须遵循以下流程**:

```
1. Team-lead 执行 openspec list 确认变更名称
2. Team-lead 创建任务，分配给成员，告知 change-name
3. 成员执行 /opsx:apply <change-name> 实现任务
   - 自动激活所需技能
   - 自动读取 proposal.md, design.md, tasks.md
4. 成员完成任务后 TaskUpdate 标记 completed
5. 成员 SendMessage 通知 team-lead
6. Team-lead 审查代码，如有问题重新分配
7. Team-lead 执行 /opsx:archive <change-name> 归档变更
8. **必须**: 提交归档到 Git（见下方归档提交规范）
```

**任务分配消息必须包含**:
- OpenSpec 变更名称
- `/opsx:continue <change-name>`（如不在提案分支）
- `/opsx:apply <change-name>`（实施命令）

### 归档提交规范（强制）

**每次执行归档后，必须立即创建 Git 提交保存本次更新的所有文件**:

```bash
# 1. 检查本次归档产生的实际变更
git status

# 2. 添加实际变更的文件（根据 git status 结果）
git add <实际变更的文件1>
git add <实际变更的文件2>
# 或者使用 git add -p 逐个确认

# 3. 创建归档提交（必须使用 archive: 类型）
git commit -m "archive: <change-name> - 完成归档

- 保存本次更新的所有文件
- 添加设计文档归档
- 添加任务执行记录
- 更新变更日志

归档路径: openspec/changes/archive/<change-name>/"

# 4. 推送到远程仓库
git push origin $(git branch --show-current)
```

**归档提交检查清单**:
- [ ] 执行 `git status` 查看本次归档产生的实际变更
- [ ] 添加实际变更的文件（不要固定写死路径）
- [ ] 提交信息使用 `archive:` 类型前缀
- [ ] 提交信息包含归档的变更名称
- [ ] 变更已推送到远程仓库

**为什么必须提交归档**:
- 归档的变更被永久保存到版本控制
- 团队成员可以同步最新的归档状态
- 可以追溯功能的历史演进
- 支持回滚到任意归档版本

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

## 相关技能

- **git-workflow**: Git 工作流规范（分支策略、提交规范、归档提交）
- **project-arch**: 项目架构规范
- **frontend-dev**: 前端开发规范
- **backend-dev**: 后端开发规范
- **websocket-protocol**: WebSocket 通信协议
