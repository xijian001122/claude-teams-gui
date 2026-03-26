## Why

当使用 Agent Teams 协作开发时，任务状态更新只能在终端中查看，用户无法在 Web UI 中直观地了解任务进度。这导致用户需要频繁切换到终端才能了解团队协作进度，降低了使用体验。

**解决问题**：在 Web UI 中展示团队任务列表，让用户可以直观地查看任务状态、负责人和依赖关系。

## What Changes

- 添加后端 API 端点 `GET /api/teams/:name/tasks` 读取团队任务列表
- 添加前端组件 `TaskPanel.tsx` 展示任务列表
- 在 Sidebar 或 ChatArea 中集成任务面板入口
- 显示任务状态：pending / in_progress / completed / blocked
- 显示任务依赖关系（blocked by）
- 实时刷新：任务状态变更时通过 WebSocket 推送更新

## Capabilities

### New Capabilities

- `task-list-api`: 后端 API 端点，读取 `~/.claude/tasks/<team-name>/` 目录中的任务数据并返回 JSON 格式
- `task-list-ui`: 前端 UI 组件，以表格形式展示任务列表，支持状态图标、负责人显示、依赖关系提示

### Modified Capabilities

无（这是新功能，不修改现有规格）

## Impact

### 受影响的文件

| 文件 | 变更类型 |
|------|----------|
| `src/server/routes/tasks.ts` | 新增 - 任务 API 路由 |
| `src/server/server.ts` | 修改 - 注册任务路由 |
| `src/client/components/TaskPanel.tsx` | 新增 - 任务面板组件 |
| `src/client/components/Sidebar.tsx` | 修改 - 添加任务面板入口 |
| `src/client/app.tsx` | 修改 - 添加任务状态管理 |
| `src/shared/types.ts` | 修改 - 添加 Task 类型定义 |

### 数据依赖

- 读取 `~/.claude/tasks/<team-name>/task-*.json` 文件
- 无需修改现有数据库结构

### WebSocket 事件

- 新增 `task_updated` 事件类型（可选，后续扩展）
