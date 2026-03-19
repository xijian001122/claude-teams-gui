## Context

Claude Chat 通过 `FileWatcherService` 监听 `~/.claude/teams/` 目录变化。当 Claude Code 删除团队目录时，`unlinkDir` 事件触发 `DataSyncService.handleTeamDeleted()`，将团队状态更新为 `archived`，并通过 WebSocket 广播 `team_archived` 事件。

**当前状态**：
- 后端完整实现：数据库持久化（`teams.status = 'archived'`）、`GET /api/archive` API、WebSocket `team_archived` 事件
- 前端缺失：侧边栏归档区域为占位符（硬编码"2 个团队"），无实际 API 调用，无归档查看模式

## Goals / Non-Goals

**Goals:**
- 前端侧边栏展示真实的已归档团队列表（名称 + 归档日期）
- 点击归档团队可进入只读模式查看历史消息
- 实时响应 `team_archived` WebSocket 事件，自动更新归档列表

**Non-Goals:**
- 不实现团队恢复（restore）功能
- 不实现归档团队的永久删除（已有后端 API 但不在本次范围）
- 不修改后端代码（后端已完整）

## Decisions

### 决策 1：状态管理放在 `app.tsx`

在 `app.tsx` 中新增 `archivedTeams: Team[]` 状态，与现有 `teams: Team[]` 并列管理。

**理由**：与现有模式一致；`Sidebar` 和 `ChatArea` 均为纯展示组件，状态向下传递。不引入新状态管理库，维持最小改动原则。

**备选**：在 `Sidebar` 内部管理——否决，因为 `ChatArea` 也需要知道当前选中团队是否为归档状态。

### 决策 2：归档团队复用 `selectedTeam` 状态

选中归档团队时，使用现有的 `selectedTeam` 状态存储团队名，通过检查 `archivedTeams` 中是否存在该团队来判断是否为只读模式。

**理由**：不引入新的选中状态字段，`ChatArea` 已接收 `selectedTeam` 和 `teams`，只需额外传入 `archivedTeams` 即可判断只读模式。

### 决策 3：只读模式在 `ChatArea` 顶部添加横幅

归档团队的消息历史通过现有 `GET /api/teams/:name/messages` 加载（该 API 不过滤 status），`ChatArea` 顶部显示黄色只读提示横幅，底部 `InputBox` 禁用。

**理由**：消息加载逻辑无需修改，只需在 UI 层添加只读标识。

## Risks / Trade-offs

- **归档列表不分页**：若归档团队数量极多，一次性加载可能稍慢。当前场景中团队数量有限，暂不处理分页。→ 可接受

- **`team_archived` 事件时序**：事件到达时数据库可能尚未写入完成（极小概率）。→ 事件触发后重新调用 `GET /api/archive` 而非直接使用事件数据，保证一致性。
