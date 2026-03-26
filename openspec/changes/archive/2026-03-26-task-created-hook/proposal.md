## Why

当前 Web UI 需要轮询才能获取新任务状态，用户体验不佳。任务创建后前端无实时感知，导致用户需要手动刷新页面才能看到新任务。

利用 Claude Code 2.1.84 新增的 `TaskCreated hook`，可以在任务创建时实时通知前端，提供更好的用户体验。

## What Changes

- 新增 `.claude/hooks/task-created.js` Hook 脚本
- 后端添加 WebSocket 事件 `task_created` 广播
- 前端添加 `task_created` 事件监听和任务列表自动更新
- 新增 API 端点 `POST /api/hooks/task-created` 接收 Hook 回调

## Capabilities

### New Capabilities

- `task-realtime-notification`: 任务创建实时通知能力，通过 WebSocket 推送任务变更事件到前端

### Modified Capabilities

- 无（这是新增功能，不修改现有规格）

## Impact

**前端影响**:
- `src/client/app.tsx` - 添加 WebSocket `task_created` 事件处理
- `src/client/components/TaskPanel.tsx` - 任务列表自动刷新

**后端影响**:
- `src/server/server.ts` - 添加 WebSocket 广播逻辑
- `src/server/routes/` - 新增 Hook 接收端点

**配置影响**:
- `.claude/hooks/task-created.js` - 新增 Hook 脚本
