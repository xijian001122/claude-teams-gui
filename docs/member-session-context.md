# 成员会话上下文获取流程

本文档描述如何注册和获取团队成员的会话信息，以及让 GUI 能够展示成员的实时上下文。

## Session 发现机制（核心）

### JSONL 文件匹配规则

Claude Code 将每个会话的对话历史存储在 JSONL 文件中，**文件名即 session ID**，首行包含团队和成员标识：

```
~/.claude/projects/<project-hash>/<session-id>.jsonl
```

**首行格式**：
```json
{
  "teamName": "hook-test",
  "agentName": "dev-1",
  "type": "user",
  "message": { "role": "user", "content": "..." },
  ...
}
```

**project-hash 计算规则**：
```javascript
// cwd: "/root/claude-chat" → hash: "-root-claude-chat"
const hash = '-' + cwd.replace(/[/\\]/g, '-').replace(/^-/, '');
```

### 匹配流程

```
1. 根据 cwd 计算 project-hash
2. 扫描 ~/.claude/projects/<hash>/*.jsonl
3. 读取每个文件首行，解析 teamName 和 agentName
4. 匹配目标 team + member → 文件名即为 sessionId
5. 取最新（mtime 最大）的匹配结果
```

### 优势

| 特性 | 说明 |
|------|------|
| **精确匹配** | jsonl 首行包含 `teamName` + `agentName`，无需猜测 |
| **无并发问题** | 每个成员有独立的 jsonl 文件，不会串 |
| **不依赖 Hook** | 直接扫描文件系统，Hook 触发与否不影响 |
| **不依赖 tmux** | 纯文件系统操作，跨平台可用 |

### 示例

```bash
# 查找 hook-test 团队的 dev-2 成员的 session
ls ~/.claude/projects/-root-claude-chat/*.jsonl
# → 3633ad49-2404-42b2-9be1-449e140094da.jsonl

head -1 3633ad49-...jsonl | jq '{teamName, agentName}'
# → {"teamName":"hook-test","agentName":"dev-2"}
```

---

## Session 注册方式

### 方式 1：SessionStart Hook（推荐）

每个 Claude Code 子进程启动时自动触发 SessionStart Hook，在 Hook 中通过 JSONL 文件匹配注册 session：

**流程**：
```
成员子进程启动
    ↓
SessionStart Hook 自动触发
    ↓
根据 cwd 计算 project-hash → 扫描 jsonl 文件
    ↓
按 teamName + agentName 精确匹配 → 获取 sessionId
    ↓
写入 ~/.claude/teams/<team>/sessions/<member>.json
```

**注意**：SessionStart 在 prompt 处理之前触发，此时 jsonl 文件可能尚未创建。
Hook 脚本需要轮询等待 jsonl 文件出现（通常 1-3 秒）。

**配置**（`.claude/settings.local.json`）：
```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "node ./hooks/subagent-register.cjs",
            "timeout": 15
          }
        ]
      }
    ]
  }
}
```

### 方式 2：派生后异步注册（备选）

派生成员的同时，启动后台进程扫描 jsonl 文件并注册：

```bash
# 并行执行：派生成员 + 后台注册
Agent(name="dev-2", team_name="hook-test")           # 派生成员
node hooks/subagent-register.cjs \
  --member dev-2 --team hook-test \
  --cwd /root/claude-chat --wait 8000                 # 后台等待 jsonl 出现并注册
```

注册脚本 `hooks/subagent-register.cjs` 支持：
- `--member <name>` 和 `--team <name>`：指定成员
- `--cwd <dir>`：项目目录（默认 process.cwd()）
- `--wait <ms>`：最大等待时间（默认 5000ms）

---

## 注册结果文件

```json
// ~/.claude/teams/<team>/sessions/<member>.json
{
  "memberName": "dev-2",
  "teamName": "hook-test",
  "agentId": "dev-2@hook-test",
  "agentType": "general-purpose",
  "sessionId": "3633ad49-2404-42b2-9be1-449e140094da",
  "cwd": "/root/claude-chat",
  "registeredAt": "2026-03-30T09:02:40.434Z"
}
```

---

## 目录结构

```
~/.claude/
├── teams/<team>/                  # 团队目录
│   ├── config.json              # 团队配置（成员 cwd、prompt 等）
│   ├── inboxes/               # 成员收到的消息
│   │   ├── team-lead.json
│   │   └── developer.json
│   └── sessions/               # Session 注册目录
│       └── developer.json      # 每个成员的 session 信息
│
└── projects/<project-hash>/   # 对话历史存储
    └── <session-id>.jsonl       # 对话历史（首行含 teamName + agentName）
```

---

## 数据流

```
┌─────────────┐      ┌─────────────────┐      ┌─────────────┐
│  成员子进程  │      │  SessionStart   │      │   teams/    │
│  启动       │─────▶│  Hook           │─────▶│  sessions/  │
└─────────────┘      │  + JSONL 匹配   │      └─────────────┘
                     └─────────────────┘             │
                                                     ▼
                                                ┌─────────────┐
                                                │     GUI     │
                                                │   后端      │
                                                └─────────────┘
                                                     │
                                                     ▼
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   读取     │      │  读取       │      │  解析对话   │
│  sessions/  │─────▶│  projects/  │─────▶│  展示上下文 │
│  <member>   │      │  <session>  │      │             │
└─────────────┘      └─────────────┘      └─────────────┘
```

---

## GUI 后端 API

```
GET /api/teams/:team/members/:member/session
GET /api/teams/:team/members/:member/conversation?limit=50
```

### 读取 Session 信息
```typescript
app.get('/api/teams/:team/members/:member/session', async (req, res) => {
  const { team, member } = req.params;
  const sessionFile = join(claudeDir, 'teams', team, 'sessions', `${member}.json`);

  if (!existsSync(sessionFile)) {
    return res.status(404).json({ error: 'Session not registered' });
  }

  return res.json(JSON.parse(readFileSync(sessionFile, 'utf-8')));
});
```

### 读取对话历史
```typescript
app.get('/api/teams/:team/members/:member/conversation', async (req, res) => {
  const { team, member } = req.params;
  const limit = parseInt(req.query.limit) || 50;

  // 1. 读取 session 注册信息
  const sessionFile = join(claudeDir, 'teams', team, 'sessions', `${member}.json`);
  if (!existsSync(sessionFile)) {
    return res.status(404).json({ error: 'Session not registered' });
  }

  const { sessionId, cwd } = JSON.parse(readFileSync(sessionFile, 'utf-8'));

  // 2. 计算项目 hash
  const projectHash = '-' + cwd.replace(/[/\\]/g, '-').replace(/^-/, '');

  // 3. 读取对话历史
  const convFile = join(claudeDir, 'projects', projectHash, `${sessionId}.jsonl`);
  if (!existsSync(convFile)) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  // 4. 解析 JSONL 文件
  const messages = [];
  const lines = readFileSync(convFile, 'utf-8').split('\n');

  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const entry = JSON.parse(line);

      if (entry.type === 'user') {
        const content = entry.message?.content;
        messages.push({
          role: 'user',
          content: typeof content === 'string' ? content : JSON.stringify(content),
          timestamp: entry.timestamp
        });
      } else if (entry.type === 'assistant') {
        const content = entry.message?.content;
        messages.push({
          role: 'assistant',
          content: extractTextContent(content),
          timestamp: entry.timestamp
        });
      }
    } catch {}
  }

  // 5. 返回最近的 N 条
  return res.json({
    memberName: member,
    sessionId,
    messages: messages.slice(-limit)
  });
});

function extractTextContent(content) {
  if (!content || !Array.isArray(content)) return '';
  return content
    .filter(block => block.type === 'text')
    .map(block => block.text)
    .join('\n');
}
```

---

## 查询示例

```bash
# 查看成员的 session 注册
GET /api/teams/hook-test/members/dev-2/session

# 获取成员的对话历史
GET /api/teams/hook-test/members/dev-2/conversation?limit=100
```
