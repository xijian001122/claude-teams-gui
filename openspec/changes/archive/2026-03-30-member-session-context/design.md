## Context

### 背景
当前 Claude Teams GUI 只能展示成员间的消息通知（inbox），无法看到成员的内部对话历史。 用户需要了解成员的实时工作状态。

### 现有数据结构
```
~/.claude/
├── sessions/*.json           # 全局 session 信息 { sessionId, cwd, startedAt, pid }
├── teams/<team>/             # 团队目录
│   ├── config.json          # 成员配置（含 cwd）
│   └── inboxes/             # 成员收到的消息
└── projects/<hash>/          # 对话历史
    └── <session-id>.jsonl    # 每行一个消息
```

### 约束
- 不能修改成员的 prompt
- 需要利用现有的 Claude Code hook 机制
- 对话历史存储在 `.jsonl` 文件中，需要解析

## Goals / Non-Goals

**Goals:**
- 通过 SubagentStart hook 自动注册成员 session
- GUI 后端能够读取成员的对话历史
- 前端展示成员的实时上下文（user/assistant 消息）

**Non-Goals:**
- 不修改成员的 prompt
- 不实现实时推送（仅按需读取）
- 不处理子 agent 的子 agent（只处理一层）

## Decisions

### 1. Hook 选择：SubagentStart vs SessionStart

**决定**: 使用 SubagentStart hook

**理由**:
- SubagentStart 直接提供 `session_id` 和 `agent_type`，无需从 cwd 匹配
- SessionStart 需要从 cwd 推断 session，可能出错
- SubagentStart 专用于子 agent，更适合团队场景

**替代方案**: SessionStart hook（需要更复杂的 cwd 匹配逻辑）

### 2. Session 注册存储位置

**决定**: `~/.claude/teams/<team>/sessions/<member>.json`

**理由**:
- 与团队数据集中存储，便于管理
- 成员名作为文件名，每次重启自动覆盖
- 不污染 inbox 文件

**替代方案**:
- 存储在 inbox 中（会污染消息列表）
- 存储在全局位置（不便于按团队管理）

### 3. 对话历史解析

**决定**: 直接读取 `.jsonl` 文件，解析 `type: user/assistant` 消息

**理由**:
- 简单直接，无需额外依赖
- `.jsonl` 格式是标准格式，相对稳定

**风险**: Claude Code 更新可能改变格式

### 4. API 设计

**决定**: 两个独立 API
- `GET /api/teams/:team/members/:member/session` - 获取 session 注册信息
- `GET /api/teams/:team/members/:member/conversation` - 获取对话历史

**理由**:
- 职责分离，session 信息和对话历史是不同数据源
- 前端可以按需获取

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|---------|
| `.jsonl` 格式变化 | 添加版本检测和容错处理 |
| 大文件读取性能 | 限制返回条数，使用流式读取 |
| Session 未注册 | 返回 404，前端显示"未注册"提示 |
| 多个 session 同 cwd | 使用最新的 session |

## Migration Plan

1. **部署 Hook 脚本**: 将 `subagent-register.js` 放入 hooks 目录
2. **更新 hooks.json**: 添加 SubagentStart hook 配置
3. **添加后端 API**: 新增两个路由
4. **添加前端组件**: MemberConversationPanel

**回滚策略**: 删除 hook 配置和新增文件即可，无数据迁移

## Open Questions

1. 是否需要支持历史 session 查询？（当前设计只保留最新）
2. 是否需要实时推送对话更新？（当前设计是按需读取）
