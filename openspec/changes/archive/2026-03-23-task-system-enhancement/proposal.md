## Why

当前任务系统存在持久化问题：通过 TaskCreate 创建的任务没有保存到文件系统（`~/.claude/tasks/<team-name>/` 目录为空），导致任务列表只能通过内存 API 查询，无法在 Web UI 中展示完整历史。此外，用户希望能够：

1. 查看所有团队的全局任务视图
2. 保留任务状态变更的历史记录
3. 在团队会话结束时生成任务摘要报告

## What Changes

- **任务持久化 API**: 新增 POST/PUT/DELETE 端点，确保任务创建时写入文件系统
- **全局任务视图**: 新增 `GET /api/tasks` 端点，支持按状态过滤，返回所有团队的任务
- **任务历史记录**: 扩展 Task 数据结构，增加 `history` 字段记录状态变更
- **会话任务摘要**: 团队关闭时自动生成 Markdown 格式的任务执行报告

## Capabilities

### New Capabilities

- `task-persistence`: 任务 CRUD API 和文件系统持久化机制
- `global-task-view`: 全局任务视图 API，支持跨团队查询和状态过滤
- `task-history`: 任务历史记录，追踪状态变更和负责人变化
- `session-summary`: 团队会话任务摘要报告生成

### Modified Capabilities

- `task-list-ui`: 扩展现有任务列表 UI，支持全局视图和历史记录展示

## Impact

**后端影响**:
- `src/server/routes/tasks.ts` - 扩展任务路由，新增 POST/PUT/DELETE 和全局查询
- `src/server/services/task-storage.ts` - 新增任务文件存储服务
- `src/shared/types.ts` - 扩展 Task 类型，增加 history 字段

**前端影响**:
- `src/client/components/TaskPanel.tsx` - 增加全局视图切换和历史记录展示
- `src/client/app.tsx` - 增加全局任务状态管理

**文件系统**:
- `~/.claude/tasks/<team-name>/<task-id>.json` - 任务文件格式更新
- `~/.claude/teams/<team-name>/session-summary.md` - 会话摘要文件位置
