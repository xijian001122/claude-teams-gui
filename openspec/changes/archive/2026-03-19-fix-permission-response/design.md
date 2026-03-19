## Context

当前权限响应流程存在问题：

```
┌──────────────┐         POST /teams/xxx/permission-response         ┌──────────────┐
│   前端 UI     │ ───────────────────────────────────────────────────▶ │   后端 API   │
│              │    { request_id, approve }  ❌ 缺少 agent_id        │              │
│ JsonMessage  │                                                      │ permission-  │
│   Card       │ ◀─────────────────────────────────────────────────── │ response.ts  │
│              │              400: agent_id is required               │              │
└──────────────┘                                                      └──────────────┘
```

**问题分析**：
1. `JsonMessageCard` 组件从 `permission_request` 消息中获取 `request_id`
2. 调用 `onPermissionResponse(requestId, approve)` 回调
3. `app.tsx` 中的 `handlePermissionResponse` 发送 API 请求，但缺少 `agent_id`
4. 后端验证失败，返回 400 错误

**相关代码位置**：
- 前端入口：`src/client/app.tsx:192-232` (`handlePermissionResponse`)
- 前端组件：`src/client/components/JsonMessageCard.tsx:177-254` (`PermissionRequestCard`)
- 后端路由：`src/server/routes/permission-response.ts`
- 类型定义：`src/shared/types.ts:143-152` (`PermissionResponseBody`)

## Goals / Non-Goals

**Goals:**
- 修复前端 `handlePermissionResponse` 函数，添加 `agent_id` 字段
- 确保权限响应能够正确写入 agent inbox
- 保证 UI 状态与实际后端处理结果一致

**Non-Goals:**
- 不修改现有的权限请求/响应协议格式
- 不添加新的权限类型或功能
- 不改变后端验证逻辑（已正确实现）

## Decisions

### Decision 1: 从 permission_request 消息中提取 agent_id

**选项 A（采用）**: 从 `permission_request` 消息中获取 `agent_id` 并传递给 `handlePermissionResponse`

- `permission_request` 消息包含 `agent_id` 字段（请求权限的 agent）
- 需要修改 `JsonMessageCard` 调用 `onPermissionResponse` 时传递 `agent_id`
- 优点：数据流清晰，`agent_id` 天然存在于消息中

**选项 B**: 修改 `PermissionRequestCard` 组件状态，存储 `agent_id`

- 在组件内部从 `prData.agent_id` 提取
- 需要修改组件接口

### Decision 2: agent_id 传递路径

```
permission_request 消息
    │
    ▼
JsonMessageCard 组件
    │ 解析 JSON 获取 agent_id
    ▼
onPermissionResponse(requestId, approve, agent_id)
    │
    ▼
handlePermissionResponse(requestId, approve, agent_id)
    │
    ▼
API POST { request_id, approve, agent_id }
```

**修改点**：
1. `JsonMessageCard.tsx`: `onPermissionResponse` 回调签名添加 `agentId` 参数
2. `JsonMessageCard.tsx`: 调用时传递 `prData.agent_id`
3. `app.tsx`: `handlePermissionResponse` 签名添加 `agentId` 参数
4. `app.tsx`: API 请求体添加 `agent_id: agentId`

## Risks / Trade-offs

| 风险 |  Mitigation |
|------|-------------|
| 如果 `permission_request` 消息中 `agent_id` 为空，API 调用仍会失败 | 后端已有验证，前端应确保消息有效时才能显示按钮 |
| UI 乐观更新可能与实际结果不一致 | catch 错误时回滚 UI 状态或显示错误提示 |

## Open Questions

- 无
