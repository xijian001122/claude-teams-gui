# 成员会话上下文获取流程

本文档描述如何通过 Hook 自动注册成员会话信息，以及让 GUI 能够展示成员的实时上下文。

## 可用的 Hook 事件

| 事件 | 触发时机 | 数据 | 推荐度 |
|------|---------|------|--------|
| **SubagentStart** | 子 agent 启动时 | `agent_id`, `agent_type`, `session_id` | ⭐⭐⭐ 推荐 |
| SessionStart | 主会话开始时 | `session_id`, `cwd` | ⭐⭐ 备选 |
| SessionEnd | 会话结束时 | `reason` | 用于清理 |

### SubagentStart vs SessionStart

| 对比项 | SubagentStart | SessionStart |
|--------|---------------|--------------|
| **触发时机** | 子 agent 启动时 | 主会话启动时 |
| **数据完整性** | 直接提供 `session_id` | 需要从 cwd 匹配 |
| **适用场景** | Agent Teams 成员 | 主 Claude 实例 |
| **agent_type** | 有 (builder/validator/等) | 无 |

## 目录结构

```
~/.claude/
├── sessions/                        # Claude Code 全局 session 信息
│   ├── xxx.json              # { sessionId, cwd, startedAt, pid }
│   └── yyy.json
│
├── teams/<team>/                  # 团队目录
│   ├── config.json              # 团队配置（成员 cwd、 prompt 等）
│   ├── inboxes/               # 成员收到的消息
│   │   ├── team-lead.json
│   │   └── developer.json
│   └── sessions/               # 【新增】 Session 注册目录
│       ├── team-lead.json      # 每个成员的 session 信息
│       └── developer.json
│
└── projects/<project-hash>/   # 对话历史存储
    ├── <session-id>.jsonl       # 主对话历史
    └── <session-id>/subagents/   # 子 agent 对话
        └── agent-*.jsonl
```

## 数据流

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│  Session   │      │   Hook      │      │   teams/    │
│  Start     │─────▶│  Script    │─────▶│  sessions/  │
└─────────────┘      └─────────────┘      └─────────────┘
      │                                             │
      │                                             ▼
      │                                        ┌─────────────┐
      │                                        │     GUI     │
      │                                        │   后端      │
      │                                        └─────────────┘
      │                                             │
      ▼                                             ▼
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   读取     │      │  读取       │      │  读取       │
│  sessions/  │─────▶│  projects/  │─────▶│  解析对话   │
│  <member>   │      │  <session>  │      │  展示上下文 │
└─────────────┘      └─────────────┘      └─────────────┘
```

---

## 文件格式

### 1. 全局 Session 文件 (~/.claude/sessions/*.json)

```json
{
  "pid": 12345,
  "sessionId": "0d9b5a7d-d446-4209-bdca-374b81e98029",
  "cwd": "/mnt/e/work/Project/fhd-cloud-plus",
  "startedAt": 1743123456789,
  "kind": "interactive",
  "entrypoint": "cli"
}
```

### 2. 团队成员 Session 注册 (~/.claude/teams/<team>/sessions/<member>.json)

```json
{
  "memberName": "developer",
  "teamName": "fhd-app-team",
  "sessionId": "0d9b5a7d-d446-4209-bdca-374b81e98029",
  "cwd": "/mnt/e/work/Project/fhd-cloud-plus",
  "startedAt": 1743123456789,
  "registeredAt": "2026-03-28T16:30:10.000Z"
}
```

### 3. 对话历史文件 (~/.claude/projects/<project-hash>/<session-id>.jsonl)

每行是一个 JSON 对象：

```jsonl
{"type":"user","message":{"role":"user","content":"修复登录功能"},"timestamp":"...","sessionId":"xxx"}
{"type":"assistant","message":{"role":"assistant","content":[...]},"timestamp":"...","sessionId":"xxx"}
{"type":"tool_use","toolName":"Bash","input":{...},"timestamp":"...","sessionId":"xxx"}
```

---

## Hook 脚本

### 方式 1：使用 SubagentStart Hook（推荐）

**优点**：
- Hook 直接提供 `session_id`，无需从 cwd 匹配
- 自动获取 `agent_type` (builder/validator/general-purpose/Explore/Plan)
- 无需修改成员 prompt

**Hook 数据结构**：
```typescript
{
  agent_id: string,          // 子 agent 的唯一标识
  agent_type: "builder" | "validator" | "general-purpose" | "Explore" | "Plan",
  session_id: string         // 子 agent 的 session ID
}
```

**hooks/hooks.json 配置**：
```json
{
  "hooks": {
    "SubagentStart": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "node ${CLAUDE_PLUGIN_ROOT}/hooks/subagent-register.js",
            "timeout": 10
          }
        ]
      }
    ]
  }
}
```

**hooks/subagent-register.js**：
```javascript
#!/usr/bin/env node
const os = require('os');
const fs = require('fs');
const path = require('path');

// 从 stdin 读取 hook 数据
let inputData = '';
process.stdin.on('data', chunk => inputData += chunk);
process.stdin.on('end', () => {
  try {
    const hookData = JSON.parse(inputData);
    const { agent_id, agent_type, session_id } = hookData;

    // 从 agent_id 提取成员名和团队名
    // 格式: "member-name@team-name" 或 "agent-uuid"
    const parts = agent_id.split('@');
    let memberName, teamName;

    if (parts.length === 2) {
      memberName = parts[0];
      teamName = parts[1];
    } else {
      // 回退：从 cwd 推断
      memberName = getMemberName(hookData.cwd);
      teamName = getTeamName(hookData.cwd);
    }

    if (!memberName || !teamName) {
      console.log('[SubagentStart] Could not determine member/team');
      process.exit(0);
    }

    // 写入 session 注册
    const claudeDir = path.join(os.homedir(), '.claude');
    const regDir = path.join(claudeDir, 'teams', teamName, 'sessions');
    fs.mkdirSync(regDir, { recursive: true });

    const sessionFile = path.join(regDir, `${memberName}.json`);
    fs.writeFileSync(sessionFile, JSON.stringify({
      memberName,
      teamName,
      agentId: agent_id,
      agentType: agent_type,
      sessionId: session_id,
      cwd: hookData.cwd,
      registeredAt: new Date().toISOString()
    }, null, 2));

    console.log(`[SubagentStart] ✅ ${memberName} -> ${session_id}`);
    console.log(`   Agent Type: ${agent_type}`);
    console.log(`   Team: ${teamName}`);
    process.exit(0);
  } catch (err) {
    console.error('[SubagentStart] Error:', err.message);
    process.exit(0);
  }
});

function getTeamName(cwd) { /* ... 同 session-start.js ... */ }
function getMemberName(cwd, teamName) { /* ... 同 session-start.js ... */ }
```

---

### 方式 2：使用 SessionStart Hook（备选）

```javascript
#!/usr/bin/env node

const os = require('os');
const fs = require('fs');
const path = require('path');

const claudeDir = path.join(os.homedir(), '.claude');
const sessionsDir = path.join(claudeDir, 'sessions');

/**
 * 获取当前 session（根据 cwd 匹配最新的）
 */
function getCurrentSession(cwd) {
  const files = fs.readdirSync(sessionsDir)
    .filter(f => f.endsWith('.json'))
    .map(f => {
      const content = fs.readFileSync(path.join(sessionsDir, f), 'utf-8');
      try {
        return JSON.parse(content);
      } catch {
        return null;
      }
    })
    .filter(s => s && s.cwd === cwd)
    .sort((a, b) => (b.startedAt || 0) - (a.startedAt || 0));

  return files.length > 0 ? files[files.length - 1] : null;
}

/**
 * 推断团队名称
 */
function getTeamName(cwd) {
  // 1. 环境变量优先
  if (process.env.TEAM_NAME) {
    return process.env.TEAM_NAME;
  }

  // 2. 从 cwd 推断
  const match = cwd.match(/\/teams\/([^/]+)\//);
  if (match) {
    return match[1];
  }

  // 3. 遍历所有团队的 config.json 查找
  const teamsDir = path.join(claudeDir, 'teams');
  const teams = fs.readdirSync(teamsDir).filter(d => {
    const stat = fs.statSync(path.join(teamsDir, d));
    return stat.isDirectory();
  });

  for (const team of teams) {
    const configPath = path.join(teamsDir, team, 'config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      if (config.members?.some(m => m.cwd === cwd)) {
        return team;
      }
    }
  }

  return null;
}

/**
 * 从团队配置获取成员名称
 */
function getMemberName(cwd, teamName) {
  const configPath = path.join(claudeDir, 'teams', teamName, 'config.json');

  if (!fs.existsSync(configPath)) {
    return null;
  }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  const member = config.members?.find(m => m.cwd === cwd);
  return member?.name || null;
}

// ========== 主逻辑 ==========

const currentCwd = process.cwd();
const session = getCurrentSession(currentCwd);

if (!session) {
  console.log('[Session-Start] No session for cwd:', currentCwd);
  process.exit(0);
}

const { sessionId, startedAt } = session;
const teamName = getTeamName(currentCwd);

if (!teamName) {
  console.log('[Session-Start] No team for cwd:', currentCwd);
  process.exit(0);
}

const memberName = getMemberName(currentCwd, teamName);

if (!memberName) {
  console.log('[Session-Start] No member for cwd:', currentCwd);
  process.exit(0);
}

// 写入注册文件
const regDir = path.join(claudeDir, 'teams', teamName, 'sessions');
fs.mkdirSync(regDir, { recursive: true });

const sessionFile = path.join(regDir, `${memberName}.json`);
const registerData = {
  memberName,
  teamName,
  sessionId,
  cwd: currentCwd,
  startedAt,
  registeredAt: new Date().toISOString()
};

fs.writeFileSync(sessionFile, JSON.stringify(registerData, null, 2));

console.log(`[Session-Start] ✅ ${memberName} -> ${sessionId}`);
console.log(`   Team: ${teamName}`);
console.log(`   File: ${sessionFile}`);
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

  // 2. 计算项目 hash（与 Claude Code 相同算法）
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

      // 只提取 user 和 assistant 消息
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
    } } catch {}
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

## 配置 Hook

### 方式 1：通过 Plugin 配置（推荐）

在 `hooks/hooks.json` 中添加 SubagentStart hook：

```json
{
  "hooks": {
    "SubagentStart": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "node ${CLAUDE_PLUGIN_ROOT}/hooks/subagent-register.js",
            "timeout": 10
          }
        ]
      }
    ]
  }
}
```

### 方式 2：全局配置 (~/.claude/settings.json)

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "node ~/.claude/hooks/session-start.js"
          }
        ]
      }
    ],
    "SubagentStart": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "node ~/.claude/hooks/subagent-register.js",
            "timeout": 10
          }
        ]
      }
    ]
  }
}
```

---

## Hook 数据对比

| 字段 | SessionStart | SubagentStart |
|------|--------------|---------------|
| session_id | ✅ | ✅ |
| cwd | ✅ | ✅ |
| agent_id | ❌ | ✅ |
| agent_type | ❌ | ✅ |
| source | ✅ | ❌ |

---

## 埥询示例
```
# 查看成员的 session 注册
GET /api/teams/fhd-app-team/members/developer/session

# 获取成员的对话历史
GET /api/teams/fhd-app-team/members/developer/conversation?limit=100
```

---

要创建这个文档吗？或者需要我帮你创建 Hook 脚本和
