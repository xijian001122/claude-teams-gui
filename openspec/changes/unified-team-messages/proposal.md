## Why

当前团队聊天窗只显示 agent 之间的通信消息（inbox JSON），用户无法在主视图中看到每个 agent 实际在做什么（读文件、写代码、思考过程等）。这些信息被隔离在 JSONL 会话文件中，只能通过独立弹窗（MemberConversationPanel）查看，交互效率低。之前尝试前端合并的方案因前端逻辑过于复杂而失败回退，需要将合并下沉到数据库层，让前端回归纯渲染职责。

## What Changes

- **重构数据库层**：在 messages 表中新增 `source`（inbox/session）、`type`（text/thinking/tool_use/tool_result/queue_operation）、`member_name`、`tool_name`、`tool_input` 等字段，统一存储团队通信消息和 JSONL 会话消息
- **新增 JSONL 同步服务**：采用 Redis 机制（全量回填 + 增量监听），启动时全量扫描 `~/.claude/projects/` 下所有 JSONL 文件回填历史数据，运行时通过 chokidar 监听文件变更读取增量内容
- **前端纯渲染重构**：前端不再负责数据合并，只根据消息的 `source` 和 `type` 渲染不同样式，大幅简化前端逻辑
- **保留 MemberConversationPanel**：独立弹窗保留，提供单一成员视角的过滤查看

## Capabilities

### New Capabilities
- `jsonl-sync-service`: JSONL 文件全量扫描与增量监听服务，负责解析 JSONL 内容、提取 teamName/agentName 映射、将消息写入统一数据库
- `unified-message-schema`: 统一消息数据库 schema，扩展 messages 表支持 inbox 和 session 两种数据源，包含工具调用、思考过程、队列操作等类型

### Modified Capabilities

## Impact

- **数据库**: messages 表 schema 变更（ALTER TABLE 新增字段），旧数据 source 默认 `inbox`
- **后端服务**: 新增 JSONL 同步服务（全量 + 增量），复用现有 FileWatcher 架构
- **后端 API**: 现有消息查询 API 返回统一消息流，无需新增端点
- **前端组件**: ChatArea 简化为纯渲染，MessageBubble 需支持 thinking/tool_use/tool_result/queue_operation 类型渲染
- **WebSocket**: 推送统一消息，前端无需区分数据来源
- **数据目录**: 需要扫描 `~/.claude/projects/` 下的 JSONL 文件
