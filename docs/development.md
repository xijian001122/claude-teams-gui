# Claude Chat 开发文档

## 架构设计

### 整体架构

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           系统架构图                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌──────────────────┐                                                  │
│   │     前端层        │                                                  │
│   │   (Preact SPA)   │                                                  │
│   │                  │                                                  │
│   │  ┌──────────┐   │     WebSocket         ┌──────────────────────┐   │
│   │  │  Chat UI │◄──┼──────────────────────►│     服务端层          │   │
│   │  └──────────┘   │                       │   (Node.js/Fastify)  │   │
│   │  ┌──────────┐   │                       │                      │   │
│   │  │ Settings │◄──┼─────── HTTP ─────────►│  ┌────────────────┐  │   │
│   │  └──────────┘   │                       │  │ REST API       │  │   │
│   │  ┌──────────┐   │                       │  ├────────────────┤  │   │
│   │  │ Archive  │◄──┼──────────────────────►│  │ WebSocket      │  │   │
│   │  └──────────┘   │                       │  ├────────────────┤  │   │
│   │                 │                       │  │ File Watcher   │  │   │
│   └─────────────────┘                       │  ├────────────────┤  │   │
│                                             │  │ Cleanup Job    │  │   │
│                                             │  └────────────────┘  │   │
│                                             └──────────┬───────────┘   │
│                                                        │               │
│   ┌──────────────────┐                                 │               │
│   │   数据存储层      │◄────────────────────────────────┘               │
│   │                  │                                                  │
│   │  ┌──────────┐   │                                                  │
│   │  │ SQLite   │   │   持久化存储                                      │
│   │  │ (msgs)   │   │                                                  │
│   │  └──────────┘   │                                                  │
│   │  ┌──────────┐   │                                                  │
│   │  │ JSON     │   │   配置/元数据                                     │
│   │  │ Config   │   │                                                  │
│   │  └──────────┘   │                                                  │
│   │  ┌──────────┐   │                                                  │
│   │  │ Files    │   │   附件文件                                        │
│   │  │ (img)    │   │                                                  │
│   │  └──────────┘   │                                                  │
│   │                 │                                                  │
│   └─────────────────┘                                                  │
│                                                                         │
│   ┌──────────────────┐                                                  │
│   │   外部集成层      │                                                  │
│   │                  │                                                  │
│   │  ┌──────────┐   │   双向同步                                        │
│   │  │ Claude   │◄──┼───────────────────────────────────────┐          │
│   │  │ Teams FS │   │                                       │          │
│   │  └──────────┘   │                                       │          │
│   │       ▲         │                                       │          │
│   │       │ File    │   File Watcher                        │          │
│   │       │ Watch   │                                       │          │
│   └───────┼─────────┘                                       │          │
│           └───────────────────────────────────────────────────┘          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 数据流

```
用户发送消息
      │
      ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  前端输入框  │────►│  WebSocket  │────►│  服务端处理  │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
              ┌────────────────────────────────┼────────────────┐
              │                                │                │
              ▼                                ▼                ▼
       ┌─────────────┐              ┌─────────────┐    ┌─────────────┐
       │ SQLite DB   │              │ Claude FS   │    │ Broadcast   │
       │ (persist)   │              │ (sync)      │    │ (notify)    │
       └─────────────┘              └─────────────┘    └──────┬──────┘
                                                               │
              ┌────────────────────────────────────────────────┘
              │
              ▼
       ┌─────────────┐
       │  Web Push   │
       │  Desktop    │
       │  Notif      │
       └─────────────┘
```

---

## 技术栈

### 后端

| 技术 | 版本 | 用途 |
|------|------|------|
| Node.js | 18+ | 运行时 |
| Fastify | 4.x | HTTP 服务器 |
| ws | 8.x | WebSocket 服务器 |
| better-sqlite3 | 9.x | SQLite 数据库 |
| chokidar | 3.x | 文件监听 |
| node-cron | 3.x | 定时任务 |

### 前端

| 技术 | 版本 | 用途 |
|------|------|------|
| Preact | 10.x | UI 框架 |
| TypeScript | 5.x | 类型系统 |
| TailwindCSS | 3.x | 样式 |
| shadcn/ui | latest | 组件库 |
| Vite | 5.x | 构建工具 |
| Socket.io-client | 4.x | WebSocket 客户端 |

---

## 项目结构

```
claude-teams-gui/
├── src/
│   ├── server/                 # 服务端代码
│   │   ├── index.ts            # 入口
│   │   ├── server.ts           # Fastify 服务
│   │   ├── websocket.ts        # WebSocket 处理
│   │   ├── routes/             # API 路由
│   │   │   ├── messages.ts
│   │   │   ├── teams.ts
│   │   │   └── settings.ts
│   │   ├── services/           # 业务逻辑
│   │   │   ├── data-sync.ts    # 数据同步服务
│   │   │   ├── file-watcher.ts # 文件监听
│   │   │   ├── cleanup.ts      # 清理任务
│   │   │   └── notification.ts # 通知服务
│   │   └── db/                 # 数据库
│   │       ├── schema.sql
│   │       └── migrations/
│   │
│   ├── client/                 # 前端代码
│   │   ├── index.tsx           # 入口
│   │   ├── app.tsx             # 根组件
│   │   ├── components/         # 组件
│   │   │   ├── Chat/           # 聊天相关
│   │   │   │   ├── MessageBubble.tsx
│   │   │   │   ├── MessageList.tsx
│   │   │   │   ├── InputBox.tsx
│   │   │   │   └── Avatar.tsx
│   │   │   ├── Sidebar/        # 侧边栏
│   │   │   │   ├── TeamList.tsx
│   │   │   │   └── ArchiveList.tsx
│   │   │   └── Common/         # 通用
│   │   │       ├── ThemeToggle.tsx
│   │   │       └── Notification.tsx
│   │   ├── hooks/              # 自定义 Hooks
│   │   │   ├── useWebSocket.ts
│   │   │   ├── useMessages.ts
│   │   │   └── useTeams.ts
│   │   ├── stores/             # 状态管理
│   │   │   └── app-store.ts
│   │   ├── styles/             # 样式
│   │   │   └── globals.css
│   │   └── utils/              # 工具函数
│   │       ├── api.ts
│   │       └── format.ts
│   │
│   └── shared/                 # 共享代码
│       ├── types.ts            # TypeScript 类型
│       └── constants.ts        # 常量
│
├── docs/                       # 文档
│   ├── requirements.md
│   ├── development.md
│   └── quickstart.md
│
├── config/                     # 配置
│   └── default-config.json
│
├── assets/                     # 静态资源
│   └── logo.svg
│
├── scripts/                    # 脚本
│   ├── build.js
│   └── dev.js
│
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 数据模型

### Message Schema

```typescript
// src/shared/types.ts

export type MessageType =
  | 'text'
  | 'code'
  | 'markdown'
  | 'image'
  | 'file'
  | 'task'
  | 'system';

export type MemberType = 'agent' | 'user' | 'system';

export interface Message {
  // 核心字段
  id: string;                    // UUID v4
  localId: string;               // 设备本地ID

  // 发送信息
  from: string;                  // 发送者名称
  fromType: MemberType;          // 发送者类型
  to: string | null;             // 接收者（null=群聊）
  content: string;               // 消息内容
  contentType: MessageType;      // 消息类型

  // Claude 追溯
  claudeRef?: {
    team: string;
    inboxFile: string;           // e.g., "developer.json"
    messageIndex: number;
    timestamp: string;
  };

  // 时间戳
  timestamp: string;             // ISO 8601
  editedAt?: string;
  deletedAt?: string;            // 软删除标记

  // 扩展数据
  metadata?: MessageMetadata;
}

export interface MessageMetadata {
  codeLanguage?: string;         // 代码语言
  fileName?: string;             // 文件名
  fileSize?: number;             // 文件大小（字节）
  filePath?: string;             // 文件存储路径
  thumbPath?: string;            // 缩略图路径
  imageWidth?: number;           // 图片尺寸
  imageHeight?: number;
  taskId?: string;               // 关联任务ID
}
```

### Team Schema

```typescript
export interface Team {
  name: string;                  // 唯一标识
  displayName: string;           // 显示名称
  status: 'active' | 'archived'; // 状态
  createdAt: string;
  archivedAt?: string;
  lastActivity: string;
  messageCount: number;
  unreadCount: number;           // 未读消息数（客户端计算）
  members: TeamMember[];
  config: TeamConfig;
}

export interface TeamMember {
  name: string;
  displayName: string;
  role: 'developer' | 'tester' | 'team-lead' | 'user' | string;
  color: string;                 // 头像背景色
  avatarLetter: string;          // 头像字母
  isOnline?: boolean;
}

export interface TeamConfig {
  theme?: 'light' | 'dark';
  notificationEnabled: boolean;
}
```

---

## 数据库设计

### SQLite Schema

```sql
-- messages 表
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  local_id TEXT NOT NULL,
  team TEXT NOT NULL,
  from_member TEXT NOT NULL,
  from_type TEXT NOT NULL CHECK(from_type IN ('agent', 'user', 'system')),
  to_member TEXT,                    -- NULL 表示群聊
  content TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK(content_type IN ('text', 'code', 'markdown', 'image', 'file', 'task', 'system')),
  timestamp TEXT NOT NULL,
  edited_at TEXT,
  deleted_at TEXT,                   -- 软删除

  -- Claude 追溯字段
  claude_team TEXT,
  claude_inbox TEXT,
  claude_index INTEGER,
  claude_timestamp TEXT,

  -- 扩展 JSON 字段
  metadata TEXT                      -- JSON 字符串
);

-- 索引
CREATE INDEX idx_messages_team_time ON messages(team, timestamp DESC);
CREATE INDEX idx_messages_from ON messages(from_member);
CREATE INDEX idx_messages_to ON messages(to_member) WHERE to_member IS NOT NULL;
CREATE INDEX idx_messages_claude_ref ON messages(claude_team, claude_inbox);

-- teams 表
CREATE TABLE teams (
  name TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('active', 'archived')),
  created_at TEXT NOT NULL,
  archived_at TEXT,
  last_activity TEXT NOT NULL,
  message_count INTEGER DEFAULT 0,
  members TEXT NOT NULL,             -- JSON 数组
  config TEXT                        -- JSON 对象
);

-- 索引
CREATE INDEX idx_teams_status ON teams(status);
CREATE INDEX idx_teams_activity ON teams(last_activity DESC);

-- attachments 表（可选，用于附件管理）
CREATE TABLE attachments (
  id TEXT PRIMARY KEY,
  team TEXT NOT NULL,
  message_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_path TEXT NOT NULL,
  thumb_path TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
);

CREATE INDEX idx_attachments_team ON attachments(team);
```

---

## 核心服务

### 1. 数据同步服务 (DataSync)

```typescript
// src/server/services/data-sync.ts

class DataSyncService {
  private db: Database;
  private watcher: FSWatcher;
  private io: Server;

  // 初始化监听
  async init(claudeTeamsPath: string) {
    // 1. 扫描现有团队
    const teams = await this.scanTeams(claudeTeamsPath);

    // 2. 初始化数据库
    for (const team of teams) {
      await this.syncTeam(team);
    }

    // 3. 启动文件监听
    this.startWatching(claudeTeamsPath);
  }

  // 监听 Claude Teams 变化
  private startWatching(path: string) {
    this.watcher = chokidar.watch(`${path}/*/inboxes/*.json`, {
      persistent: true,
      ignoreInitial: true
    });

    this.watcher.on('change', async (filePath) => {
      const { team, member } = this.parsePath(filePath);
      const messages = JSON.parse(fs.readFileSync(filePath, 'utf8'));

      // 获取新消息
      const lastIndex = await this.getLastSyncIndex(team, member);
      const newMessages = messages.slice(lastIndex);

      // 写入本地数据库
      for (const msg of newMessages) {
        await this.persistMessage(team, member, msg);
      }

      // 广播给所有客户端
      this.io.emit('new_messages', { team, member, messages: newMessages });

      // 发送桌面通知
      if (newMessages.length > 0) {
        this.sendNotification(team, newMessages[newMessages.length - 1]);
      }
    });
  }

  // 用户发送消息
  async sendMessage(team: string, to: string | null, content: string) {
    const message: Message = {
      id: uuid(),
      localId: uuid(),
      from: 'user',
      fromType: 'user',
      to,
      content,
      contentType: 'text',
      timestamp: new Date().toISOString()
    };

    // 1. 写入本地数据库
    await this.persistMessage(team, 'user', message);

    // 2. 如果 Claude Team 存在，同步到其 inbox
    if (await this.teamExists(team)) {
      await this.writeToClaudeInbox(team, to || 'team-lead', message);
    }

    // 3. 广播
    this.io.emit('new_message', { team, message });

    return message;
  }
}
```

### 2. 文件监听服务 (FileWatcher)

```typescript
// src/server/services/file-watcher.ts

class FileWatcherService {
  private watchers: Map<string, FSWatcher> = new Map();

  // 监听团队目录
  watchTeam(teamPath: string, callbacks: {
    onMessageAdded: (member: string, message: Message) => void;
    onMessageChanged: (member: string, index: number, message: Message) => void;
    onTeamDeleted: () => void;
  }) {
    // 监听 inbox 文件
    const inboxWatcher = chokidar.watch(`${teamPath}/inboxes/*.json`, {
      persistent: true
    });

    inboxWatcher.on('change', (path) => {
      const member = path.basename(path, '.json');
      const messages = JSON.parse(fs.readFileSync(path, 'utf8'));
      // 处理变化...
    });

    // 监听团队删除
    const dirWatcher = chokidar.watch(teamPath, {
      persistent: true,
      depth: 0
    });

    dirWatcher.on('unlinkDir', () => {
      callbacks.onTeamDeleted();
    });

    this.watchers.set(teamPath, { inboxWatcher, dirWatcher });
  }

  // 停止监听
  unwatch(teamPath: string) {
    const watchers = this.watchers.get(teamPath);
    if (watchers) {
      watchers.inboxWatcher.close();
      watchers.dirWatcher.close();
      this.watchers.delete(teamPath);
    }
  }
}
```

### 3. 清理服务 (Cleanup)

```typescript
// src/server/services/cleanup.ts

class CleanupService {
  private config: CleanupConfig;

  // 执行清理任务
  async runCleanup() {
    const now = new Date();

    // 1. 清理活跃团队旧消息
    await this.cleanupActiveTeams();

    // 2. 清理归档团队
    await this.cleanupArchivedTeams();

    // 3. 清理孤立附件
    await this.cleanupOrphanAttachments();

    console.log(`[Cleanup] Completed at ${now.toISOString()}`);
  }

  private async cleanupActiveTeams() {
    const cutoff = subDays(new Date(), this.config.retention.activeTeams.days);

    const result = await this.db.run(`
      DELETE FROM messages
      WHERE timestamp < ?
      AND team IN (
        SELECT name FROM teams WHERE status = 'active'
      )
    `, cutoff.toISOString());

    console.log(`[Cleanup] Deleted ${result.changes} old messages from active teams`);
  }

  private async cleanupArchivedTeams() {
    const teams = await this.db.all(`
      SELECT name, archived_at FROM teams
      WHERE status = 'archived'
    `);

    for (const team of teams) {
      const archivedAt = parseISO(team.archived_at);
      const expireAt = addDays(archivedAt, this.config.retention.archivedTeams.days);

      if (new Date() > expireAt && this.config.retention.archivedTeams.autoDelete) {
        await this.permanentlyDeleteTeam(team.name);
      }
    }
  }

  // 启动定时任务
  schedule() {
    if (!this.config.cleanupEnabled) return;

    const [hour, minute] = this.config.cleanupTime.split(':');

    cron.schedule(`${minute} ${hour} * * *`, () => {
      this.runCleanup();
    });

    console.log(`[Cleanup] Scheduled daily at ${this.config.cleanupTime}`);
  }
}
```

---

## API 设计

### REST API

```typescript
// GET /api/teams
// 获取所有团队列表
Response: {
  teams: Team[]
}

// GET /api/teams/:name/messages
// 获取团队消息
Query: {
  before?: string;    // 时间戳，用于分页
  limit?: number;     // 默认 50
  to?: string;        // 筛选私聊消息
}
Response: {
  messages: Message[];
  hasMore: boolean;
}

// POST /api/teams/:name/messages
// 发送消息
Body: {
  content: string;
  to?: string;        // null 表示群聊
  contentType?: MessageType;
}
Response: {
  message: Message;
}

// PUT /api/teams/:name/messages/:id
// 编辑消息（仅用户自己的消息）
Body: {
  content: string;
}

// DELETE /api/teams/:name/messages/:id
// 删除消息（软删除）

// GET /api/teams/:name/members
// 获取团队成员
Response: {
  members: TeamMember[]
}

// GET /api/archive
// 获取归档团队列表
Response: {
  teams: Team[]
}

// POST /api/archive/:name/restore
// 恢复归档团队

// DELETE /api/archive/:name
// 永久删除归档团队

// GET /api/settings
// 获取用户设置
Response: Settings

// PUT /api/settings
// 更新设置
Body: Partial<Settings>
```

### WebSocket 事件

```typescript
// Client -> Server
interface ClientEvents {
  'join_team': (team: string) => void;
  'leave_team': (team: string) => void;
  'typing': (team: string, to?: string) => void;
  'mark_read': (team: string, messageId: string) => void;
}

// Server -> Client
interface ServerEvents {
  'new_message': (data: { team: string; message: Message }) => void;
  'new_messages': (data: { team: string; messages: Message[] }) => void;
  'message_updated': (data: { team: string; messageId: string; updates: Partial<Message> }) => void;
  'member_online': (data: { team: string; member: string }) => void;
  'member_offline': (data: { team: string; member: string }) => void;
  'team_deleted': (data: { team: string }) => void;
  'team_archived': (data: { team: string }) => void;
}
```

---

## 前端组件设计

### 组件层次

```
App
├── ThemeProvider (主题上下文)
├── NotificationProvider (通知上下文)
├── SocketProvider (WebSocket 上下文)
│
└── Layout
    ├── Sidebar (左侧边栏)
    │   ├── TeamList (活跃团队)
    │   │   └── TeamItem
    │   │       ├── Avatar
    │   │       └── Badge (未读数)
    │   └── ArchiveList (归档入口)
    │
    └── Main (主区域)
        ├── Header (顶部栏)
        │   ├── TeamName
        │   ├── MemberList
        │   └── ThemeToggle
        │
        ├── ChatArea (聊天区域)
        │   ├── MessageList (消息列表)
        │   │   └── MessageGroup
        │   │       ├── MessageBubble
        │   │       │   ├── Avatar (可点击 @)
        │   │       │   ├── Content
        │   │       │   │   ├── TextContent
        │   │       │   │   ├── CodeBlock
        │   │       │   │   └── ImageContent
        │   │       │   └── Timestamp
        │   │       └── DateDivider
        │   └── ScrollToBottom
        │
        └── InputArea (输入区域)
            ├── MentionPopup (@补全列表)
            ├── TextInput
            └── SendButton
```

### 关键组件实现

```typescript
// src/client/components/Chat/MessageBubble.tsx

interface MessageBubbleProps {
  message: Message;
  isSelf: boolean;
  showAvatar: boolean;
  onAvatarClick: (member: string) => void;
}

export function MessageBubble({
  message,
  isSelf,
  showAvatar,
  onAvatarClick
}: MessageBubbleProps) {
  const member = useMember(message.from);

  return (
    <div className={cn(
      "flex gap-3",
      isSelf ? "flex-row-reverse" : "flex-row"
    )}>
      {/* 头像 */}
      {showAvatar && (
        <Avatar
          letter={member.avatarLetter}
          color={member.color}
          onClick={() => onAvatarClick(message.from)}
          className="cursor-pointer hover:ring-2 hover:ring-offset-2"
        />
      )}

      {/* 气泡 */}
      <div className={cn(
        "max-w-[70%] rounded-lg px-4 py-2",
        isSelf
          ? "bg-blue-500 text-white rounded-tr-none"
          : "bg-gray-100 dark:bg-gray-800 rounded-tl-none"
      )}>
        {/* 发送者名称（群聊显示） */}
        {!isSelf && (
          <div className="text-xs text-gray-500 mb-1">
            {member.displayName}
          </div>
        )}

        {/* 内容 */}
        <MessageContent
          type={message.contentType}
          content={message.content}
          metadata={message.metadata}
        />

        {/* 时间戳 */}
        <div className={cn(
          "text-xs mt-1",
          isSelf ? "text-blue-100" : "text-gray-400"
        )}>
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
}
```

```typescript
// src/client/components/Chat/InputBox.tsx

export function InputBox({ team, onSend }: InputBoxProps) {
  const [content, setContent] = useState('');
  const [showMention, setShowMention] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const members = useTeamMembers(team);
  const filteredMembers = members.filter(m =>
    m.name.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }

    if (e.key === '@') {
      setShowMention(true);
      setMentionQuery('');
    }

    if (showMention) {
      if (e.key === 'Escape') {
        setShowMention(false);
      }
      // ↑ ↓ 选择，Enter 确认...
    }
  };

  const insertMention = (member: TeamMember) => {
    const before = content.slice(0, content.lastIndexOf('@'));
    setContent(`${before}@${member.name} `);
    setShowMention(false);
    inputRef.current?.focus();
  };

  return (
    <div className="relative border-t p-4">
      {/* @补全弹窗 */}
      {showMention && (
        <MentionPopup
          members={filteredMembers}
          onSelect={insertMention}
          onClose={() => setShowMention(false)}
        />
      )}

      <div className="flex gap-2">
        <textarea
          ref={inputRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入消息... @提及成员"
          className="flex-1 resize-none rounded-lg border p-2"
          rows={1}
        />
        <Button onClick={handleSend} disabled={!content.trim()}>
          发送
        </Button>
      </div>
    </div>
  );
}
```

---

## 状态管理

```typescript
// src/client/stores/app-store.ts

interface AppState {
  // 主题
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;

  // 当前团队
  currentTeam: string | null;
  setCurrentTeam: (team: string) => void;

  // 团队列表
  teams: Team[];
  setTeams: (teams: Team[]) => void;
  updateTeam: (team: string, updates: Partial<Team>) => void;

  // 消息
  messages: Map<string, Message[]>;  // team -> messages
  addMessage: (team: string, message: Message) => void;
  addMessages: (team: string, messages: Message[]) => void;
  updateMessage: (team: string, id: string, updates: Partial<Message>) => void;

  // 未读数
  unreadCounts: Map<string, number>;
  markAsRead: (team: string) => void;
  incrementUnread: (team: string) => void;

  // WebSocket 连接状态
  isConnected: boolean;
  setIsConnected: (connected: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // 初始状态...

      addMessage: (team, message) => {
        set((state) => {
          const msgs = state.messages.get(team) || [];
          return {
            messages: new Map(state.messages).set(team, [...msgs, message])
          };
        });

        // 如果不在当前团队，增加未读
        if (get().currentTeam !== team) {
          get().incrementUnread(team);
        }
      }
    }),
    {
      name: 'claude-teams-gui-storage',
      partialize: (state) => ({
        theme: state.theme,
        currentTeam: state.currentTeam
      })
    }
  )
);
```

---

## 开发指南

### 环境准备

```bash
# 克隆仓库
git clone https://github.com/yourname/claude-teams-gui.git
cd claude-teams-gui

# 安装依赖
npm install

# 开发模式（同时启动前后端）
npm run dev

# 单独启动前端
npm run dev:client

# 单独启动后端
npm run dev:server
```

### 构建

```bash
# 开发构建
npm run build

# 生产构建
npm run build:prod

# 打包可执行文件
npm run package
```

### 测试

```bash
# 单元测试
npm run test

# E2E 测试
npm run test:e2e

# 覆盖率
npm run test:coverage
```

### 代码规范

```bash
# 代码检查
npm run lint

# 自动修复
npm run lint:fix

# 类型检查
npm run type-check

# 格式化
npm run format
```

---

## 部署

### 本地开发

```bash
# 源码运行
npm install
npm run dev

# 访问 http://localhost:3456
```

### 生产部署

```bash
# 构建
npm run build:prod

# 启动
npm start

# 或使用 pm2
pm2 start dist/server/index.js --name claude-teams-gui
```

### Docker 部署

```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3456
CMD ["node", "dist/server/index.js"]
```

```bash
# 构建镜像
docker build -t claude-teams-gui .

# 运行
docker run -d \
  -p 3456:3456 \
  -v ~/.claude-teams-gui:/app/data \
  -v $(pwd)/.claude/teams:/app/teams \
  claude-teams-gui
```

---

## 贡献指南

1. Fork 项目
2. 创建分支 (`git checkout -b feature/xxx`)
3. 提交更改 (`git commit -am 'Add xxx'`)
4. 推送分支 (`git push origin feature/xxx`)
5. 创建 Pull Request

### 提交规范

- `feat:` 新功能
- `fix:` Bug 修复
- `docs:` 文档更新
- `style:` 代码格式
- `refactor:` 重构
- `test:` 测试
- `chore:` 构建/工具

---

## 路线图

### v0.1.0 (MVP)
- [x] 基础聊天界面
- [x] WebSocket 实时同步
- [x] SQLite 持久化
- [x] 主题切换
- [x] 桌面通知

### v0.2.0
- [ ] @提及功能
- [ ] 图片/文件支持
- [ ] 消息搜索
- [ ] 快捷键

### v0.3.0
- [ ] 任务列表 Tab
- [ ] 统计面板
- [ ] 导出功能
- [ ] 多语言

### v1.0.0
- [ ] 多设备同步
- [ ] 移动端适配
- [ ] 插件系统
- [ ] 远程访问（可选）
