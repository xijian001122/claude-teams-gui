## Why

权限请求（permission_request）的批准和拒绝功能当前不生效。用户点击"批准"或"拒绝"按钮后，API 请求发送失败，原因是前端发送请求时缺少必需的 `agent_id` 字段，导致后端返回 400 错误。这个问题阻止了用户与 Claude Agent 之间的权限交互流程。

## What Changes

- **修复前端 API 调用**：在 `handlePermissionResponse` 函数中添加缺失的 `agent_id` 字段
- **验证后端逻辑**：确保后端正确将权限响应写入请求 agent 的 inbox
- **确保数据流完整**：从 UI 按钮点击到 agent inbox 写入的完整流程

## Capabilities

### New Capabilities
无（此变更为 bug 修复，不引入新能力）

### Modified Capabilities
无（不修改现有需求规格，仅修复实现缺陷）

## Impact

**受影响的代码文件**：
- `src/client/app.tsx` - `handlePermissionResponse` 函数缺少 `agent_id` 参数
- `src/server/routes/permission-response.ts` - 后端路由已正确实现，但收到不完整的请求

**API 端点**：
- `POST /api/teams/:name/permission-response` - 需要 `request_id`, `approve`, `agent_id` 三个字段

**数据流**：
1. 用户在 UI 点击批准/拒绝按钮
2. 前端调用 `handlePermissionResponse(requestId, approve)`
3. 前端发送 POST 请求到后端（当前缺少 `agent_id`）
4. 后端验证并写入 agent inbox（当前因缺少 `agent_id` 而失败）
5. Agent 收到响应并采取相应行动
