## ADDED Requirements

### Requirement: messages 表扩展字段
系统 SHALL 在 messages 表中新增以下字段以支持统一存储 inbox 和 session 消息：
- `source TEXT DEFAULT 'inbox'` — 消息来源：`inbox`（团队通信）或 `session`（JSONL 会话）
- `msg_type TEXT DEFAULT 'text'` — 消息类型：`text`、`thinking`、`tool_use`、`tool_result`、`queue_operation`
- `member_name TEXT` — agent 名称（session 来源必填）
- `tool_name TEXT` — 工具名称（tool_use 类型时填写）
- `tool_input TEXT` — 工具参数 JSON 字符串（tool_use 类型时填写）
- `session_id TEXT` — JSONL 来源的 sessionId

#### Scenario: 旧数据兼容
- **WHEN** 数据库升级后查询无新字段的消息
- **THEN** 这些消息的 source 默认为 `inbox`，msg_type 默认为 `text`，其他新字段为 NULL

#### Scenario: 插入 session 来源消息
- **WHEN** JSONL 同步服务写入一条 tool_use 类型消息
- **THEN** 消息的 source 为 `session`，msg_type 为 `tool_use`，tool_name 为工具名（如 `Read`），tool_input 为参数 JSON，member_name 为 agent 名称

### Requirement: 统一消息查询
系统 SHALL 通过现有 `GET /api/teams/:team/messages` 端点返回统一消息流，包含 inbox 和 session 来源的消息，按 timestamp 升序排列。

#### Scenario: 查询团队全部消息
- **WHEN** 前端请求 `GET /api/teams/my-team/messages`
- **THEN** 返回 inbox 通信消息和 session 会话消息的混合结果，按 timestamp 排序

#### Scenario: 按 source 过滤
- **WHEN** 前端请求 `GET /api/teams/my-team/messages?source=session`
- **THEN** 只返回 session 来源的消息（MemberConversationPanel 使用）

#### Scenario: 按 member_name 过滤
- **WHEN** 前端请求 `GET /api/teams/my-team/messages?member=frontend-dev`
- **THEN** 只返回 frontend-dev 成员的消息

### Requirement: 前端按消息类型渲染
前端 SHALL 根据消息的 `msg_type` 字段选择不同的渲染方式。

#### Scenario: 渲染 text 消息
- **WHEN** 消息 msg_type 为 `text`
- **THEN** 使用现有 MessageBubble 组件渲染普通消息气泡

#### Scenario: 渲染 thinking 消息
- **WHEN** 消息 msg_type 为 `thinking`
- **THEN** 显示 💭 图标和折叠区域，默认折叠，点击可展开查看完整思考内容

#### Scenario: 渲染 tool_use 消息
- **WHEN** 消息 msg_type 为 `tool_use`
- **THEN** 显示 🔧 + tool_name + 简要参数，默认折叠，点击可展开查看完整 tool_input

#### Scenario: 渲染 tool_result 消息
- **WHEN** 消息 msg_type 为 `tool_result`
- **THEN** 显示 📋 工具返回内容，默认折叠

#### Scenario: 渲染 queue_operation 消息
- **WHEN** 消息 msg_type 为 `queue_operation`
- **THEN** 显示 ⚙️ 后台任务通知，含任务摘要和状态

### Requirement: session 消息视觉隔离
前端 SHALL 对 `source=session` 的消息添加成员头像色的左边框，与 inbox 消息视觉区分。

#### Scenario: 显示成员上下文消息
- **WHEN** 渲染一条 source=`session` 的消息
- **THEN** 消息左侧显示该成员的头像色边框，气泡内显示成员名称

### Requirement: MemberConversationPanel 过滤
MemberConversationPanel SHALL 通过 `?member=` 参数过滤只显示指定成员的消息。

#### Scenario: 查看单一成员消息
- **WHEN** 用户在 MemberConversationPanel 中选择 frontend-dev
- **THEN** 面板只显示 frontend-dev 的 session 来源消息
