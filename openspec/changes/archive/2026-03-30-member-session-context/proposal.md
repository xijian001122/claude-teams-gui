## Why

当前 GUI 只能展示成员之间的消息通知，无法看到成员的实时上下文（正在做什么、思考过程、对话历史）。这导致用户需要切换到各个成员的终端才能了解工作进度，效率低下。

通过 SubagentStart hook 自动注册成员 session，让 GUI 能够直接读取并展示成员的完整对话历史。

## What Changes

- 新增 SubagentStart hook 脚本，在子 agent 启动时自动注册 session 信息
- 新增 session 注册文件存储 (`~/.claude/teams/<team>/sessions/<member>.json`)
- 新增后端 API 读取成员 session 和对话历史
- 新增前端组件展示成员的实时对话上下文

## Capabilities

### New Capabilities

- `subagent-session-register`: 通过 SubagentStart hook 自动注册子 agent 的 session 信息到团队目录
- `member-conversation-api`: 后端 API 读取成员的 session 注册和对话历史
- `member-context-panel`: 前端组件展示成员的实时对话上下文（user/assistant 消息列表）

### Modified Capabilities

<!-- 无现有 spec 需要修改 -->

## Impact

- **Hook 系统**: 新增 `hooks/subagent-register.js` 脚本
- **数据存储**: 新增 `~/.claude/teams/<team>/sessions/` 目录
- **后端 API**:
  - `GET /api/teams/:team/members/:member/session`
  - `GET /api/teams/:team/members/:member/conversation`
- **前端组件**: 新增 `MemberConversationPanel` 组件
- **依赖**: 读取 `~/.claude/projects/<hash>/<session>.jsonl` 文件
