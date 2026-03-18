---
name: project-arch
description: 项目架构规范 - Claude Chat 的整体架构设计、技术选型、目录结构和设计模式。用于理解项目结构、添加新功能、重构代码等。
---

# 项目架构规范

**项目**: Claude Chat - WeChat-like messaging for Claude Code Teams

**触发关键词**: 架构、结构、设计、模式、技术栈、目录结构

## 架构概览

```
┌─────────────────┐     WebSocket      ┌─────────────────┐
│   Browser UI    │ ◄────────────────► │  Node.js Server │
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

## 核心规范速查

| 规范 | 说明 | 详细文档 |
|------|------|---------|
| 技术栈 | 前后端技术选型 | [docs/tech-stack.md](docs/tech-stack.md) |
| 目录结构 | 项目文件组织 | [docs/directory-structure.md](docs/directory-structure.md) |
| 数据模型 | 核心类型定义 | [docs/data-models.md](docs/data-models.md) |
| 设计模式 | 架构模式和约定 | [docs/design-patterns.md](docs/design-patterns.md) |

## 技术栈

### 前端
- **框架**: Preact (轻量 React 替代)
- **构建**: Vite
- **样式**: TailwindCSS
- **语言**: TypeScript
- **实时通信**: 原生 WebSocket

### 后端
- **框架**: Fastify
- **数据库**: SQLite (better-sqlite3)
- **实时通信**: @fastify/websocket
- **文件监听**: chokidar
- **定时任务**: node-cron
- **语言**: TypeScript

### 开发工具
- **包管理**: npm
- **类型检查**: TypeScript
- **代码规范**: ESLint + Prettier
- **测试**: Vitest (单元) + Playwright (E2E)

## 目录结构

```
claude-chat/
├── src/
│   ├── client/           # 前端代码
│   │   ├── index.tsx     # 入口
│   │   ├── app.tsx       # 根组件
│   │   ├── components/   # UI 组件
│   │   ├── hooks/        # 自定义 Hooks
│   │   └── utils/        # 工具函数
│   ├── server/           # 后端代码
│   │   ├── index.ts      # 入口
│   │   ├── server.ts     # Fastify 配置
│   │   ├── cli.ts        # CLI 入口
│   │   ├── routes/       # API 路由
│   │   ├── services/     # 业务服务
│   │   └── db/           # 数据库服务
│   └── shared/           # 共享代码
│       ├── types.ts      # 类型定义
│       └── constants.ts  # 常量
├── dist/                 # 构建输出
├── package.json
├── vite.config.ts        # Vite 配置
├── tsconfig.json         # TypeScript 配置
└── tailwind.config.js    # TailwindCSS 配置
```

## 核心数据模型

### Message
```typescript
interface Message {
  id: string;              // 唯一标识
  localId: string;         // 本地标识
  team: string;            // 所属团队
  from: string;            // 发送者
  fromType: MemberType;    // 发送者类型
  to: string | null;       // 接收者（null 表示公开）
  content: string;         // 消息内容
  contentType: MessageType; // 内容类型
  timestamp: string;       // 时间戳
  editedAt?: string;       // 编辑时间
  deletedAt?: string;      // 删除时间
  claudeRef?: ClaudeRef;   // Claude 引用
  metadata?: MessageMetadata;
  originalTeam?: string;   // 跨团队消息来源
}
```

### Team
```typescript
interface Team {
  name: string;
  displayName: string;
  status: 'active' | 'archived';
  createdAt: string;
  archivedAt?: string;
  lastActivity: string;
  messageCount: number;
  unreadCount: number;
  members: TeamMember[];
  config: TeamConfig;
  allowCrossTeamMessages: boolean;
}
```

### TeamMember
```typescript
interface TeamMember {
  name: string;
  displayName: string;
  role: string;
  color: string;
  avatarLetter: string;
  isOnline?: boolean;
}
```

## 核心服务

### DatabaseService
SQLite 数据库封装，提供消息和团队的 CRUD 操作。

```typescript
class DatabaseService {
  // 团队操作
  upsertTeam(team: Team): Promise<void>;
  getTeams(): Promise<Team[]>;
  getTeam(name: string): Promise<Team | null>;
  updateTeamStatus(name: string, status: string, archivedAt?: string): void;

  // 消息操作
  insertMessage(message: Message): void;
  insertMessageIfNew(message: Message): Promise<boolean>;
  getMessages(team: string, options?: GetMessagesQuery): Promise<Message[]>;

  // 活动更新
  updateTeamActivity(team: string, timestamp: string): void;
}
```

### DataSyncService
同步 Claude Teams 文件系统与 SQLite 数据库。

```typescript
class DataSyncService {
  init(): Promise<void>;                    // 初始化同步
  syncTeam(teamName: string): Promise<Team>; // 同步单个团队
  sendMessage(team: string, to: string | null, content: string, contentType?: string): Promise<Message>;
  sendCrossTeamMessage(fromTeam: string, toTeam: string, content: string, contentType?: string): Promise<{ success: boolean; message?: Message; error?: string }>;
  handleTeamDeleted(teamName: string): Promise<void>;
}
```

### FileWatcherService
监听 Claude Teams 文件变化。

```typescript
class FileWatcherService {
  start(): void;     // 开始监听
  stop(): void;      // 停止监听
}
```

### CleanupService
定时清理过期消息。

```typescript
class CleanupService {
  start(): void;     // 启动定时任务
  stop(): void;      // 停止定时任务
  runCleanup(): Promise<void>; // 执行清理
}
```

## 设计模式

### 前端状态管理
- 使用 Preact hooks (useState, useEffect) 直接管理状态
- 消息使用 `Map<teamName, Message[]>` 结构
- WebSocket 消息通过 `lastMessage` 回调处理

### 后端服务层
- 服务类封装业务逻辑
- 依赖注入通过构造函数
- 服务之间通过 Fastify 实例共享

### API 设计
- RESTful 风格
- 统一响应格式 `{ success, data?, error? }`
- WebSocket 用于实时更新

### 文件同步
- 监听 `~/.claude/teams/*/inboxes/*.json` 文件变化
- 增量同步到 SQLite 数据库
- 广播新消息到 WebSocket 客户端

## 开发命令

```bash
# 开发
npm run dev              # 同时启动前后端
npm run dev:server       # 仅后端
npm run dev:client       # 仅前端

# 构建
npm run build            # 构建前后端
npm run build:client     # 仅构建前端
npm run build:server     # 仅构建后端

# 质量检查
npm run type-check       # TypeScript 检查
npm run lint             # ESLint 检查
npm run format           # Prettier 格式化

# 测试
npm run test             # 单元测试
npm run test:e2e         # E2E 测试
```

## 详细文档索引

### 核心文档
- [技术栈详情](docs/tech-stack.md) - 技术选型和理由
- [目录结构](docs/directory-structure.md) - 文件组织规范
- [数据模型](docs/data-models.md) - 完整的类型定义
- [设计模式](docs/design-patterns.md) - 架构模式和最佳实践

### 集成文档
- [Claude Teams 集成](docs/claude-integration.md) - 与 Claude 文件系统的集成
- [WebSocket 协议](../websocket-protocol/SKILL.md) - 实时通信规范

## 相关技能

- **frontend-dev**: 前端开发规范
- **backend-dev**: 后端开发规范
- **websocket-protocol**: WebSocket 通信协议

---

**最后更新**: 2026-03-17 (v1.0.0)
