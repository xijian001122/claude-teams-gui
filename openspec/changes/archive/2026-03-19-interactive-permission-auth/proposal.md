## Why

当前 Claude Chat 中，当 Agent 请求权限时（如编辑文件、执行命令），用户只能在消息气泡中查看权限请求内容，无法直接在气泡中进行批准或拒绝操作。用户需要通过其他方式（如命令行或外部工具）来响应权限请求，这破坏了聊天体验的完整性。

本变更将支持在消息气泡中直接渲染批准/拒绝按钮，使用户能够在聊天界面内完成整个权限授权流程，提升用户体验和工作效率。

## What Changes

- **前端**: 在 `JsonMessageCard` 组件中为 `permission_request` 类型添加交互式按钮（批准/拒绝）
- **前端**: 添加本地状态管理，记录权限请求的响应状态（pending/approved/rejected）
- **前端**: 响应后更新 UI，显示已批准/已拒绝状态，并禁用按钮防止重复操作
- **后端**: 新增 API 端点 `/teams/:name/permission-response`，接收用户的权限响应
- **后端**: 将 `permission_response` 消息写入请求 Agent 的 inbox JSON 文件
- **协议**: 定义 `permission_response` 消息格式，包含 `request_id`、`approve`、`timestamp` 字段
- **样式**: 添加授权按钮和状态徽章的 CSS 样式

## Capabilities

### New Capabilities
- `interactive-permission`: 在聊天界面中直接处理权限请求的能力，包括按钮渲染、状态管理和响应发送

### Modified Capabilities
- `json-message-display`: 扩展 `permission_request` 类型支持交互式按钮和状态展示（非破坏性修改，向后兼容）

## Impact

- **前端组件**: `JsonMessageCard.tsx`, `MessageBubble.tsx`, `ChatArea.tsx`, `app.tsx`
- **后端 API**: 新增 `/teams/:name/permission-response` POST 端点
- **服务端逻辑**: 需要处理权限响应并写入 agent inbox
- **消息格式**: `permission_request` 消息可包含可选的 `status` 和 `response` 字段
- **无破坏性变更**: 现有功能保持兼容，新功能为可选增强
