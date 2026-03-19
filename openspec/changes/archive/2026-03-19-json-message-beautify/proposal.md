## Why

当前 Claude Chat 中的 JSON 消息（如 `permission_request`、`task_assignment`）以纯文本形式展示，缺乏结构化呈现和视觉层级，难以快速识别关键信息。纯展示方案将消息卡片化，提升可读性和信息获取效率，无需后端改动即可实施。

## What Changes

- **新增 JSON 消息卡片组件**：为不同类型的 JSON 消息创建结构化卡片展示
- **移除交互按钮**：删除需要后端 API 支持的批准/拒绝/分配等按钮
- **保留查看原始 JSON 功能**：可折叠展开，带语法高亮（纯前端实现）
- **支持 8 种消息类型**：
  - `idle_notification` - 空闲通知
  - `permission_request` - 权限请求
  - `task_assignment` - 任务分配
  - `task_completed` - 任务完成
  - `shutdown_request` - 关闭请求
  - `shutdown_response` - 关闭响应
  - `plan_approval_request` - 计划审批请求
  - `plan_approval_response` - 计划审批响应

## Capabilities

### New Capabilities
- `json-message-display`: JSON 消息结构化展示能力，包括卡片化布局、类型识别、状态徽章、原始 JSON 折叠查看

### Modified Capabilities
- 无（纯前端展示改动，不涉及现有功能需求变更）

## Impact

- **前端组件**：修改 `MessageBubble.tsx`，新增 JSON 消息卡片子组件
- **样式**：新增 CSS 样式（或 Tailwind 类）用于卡片、语法高亮
- **无后端改动**：纯展示方案，不涉及 API、数据库或 WebSocket 变更
- **无破坏性变更**：现有文本消息展示保持不变
