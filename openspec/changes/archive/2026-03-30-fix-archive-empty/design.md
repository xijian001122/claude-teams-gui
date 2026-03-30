## Context

`archiveTeamData()` 方法（`src/server/services/data-sync.ts:619`）只创建了空目录，没有写入任何数据。当前归档流程：
1. `handleTeamDeleted()` 调用 `updateTeamStatus('archived')` 标记数据库状态
2. 调用 `archiveTeamData()` 创建空目录
3. 广播 WebSocket 通知

数据库中的消息和团队元信息仍然保留在 SQLite 中，归档目录没有任何实际数据。

## Goals / Non-Goals

**Goals:**
- 归档时将团队消息和元信息导出到 JSON 文件
- 归档目录包含完整可读的数据（`team.json` + `messages.json`）
- 清理现有的 30 个空归档目录
- `DELETE /api/archive/:name` 永久删除时同时删除归档目录

**Non-Goals:**
- 不实现归档数据恢复导入（恢复功能只改数据库状态，已可用）
- 不修改前端归档 UI
- 不实现归档数据的增量更新

## Decisions

### 1. 归档文件格式：JSON

**决定**: 使用 `team.json` + `messages.json` 两个文件

**理由**:
- JSON 可读性好，易于查看和调试
- 与项目现有数据格式一致
- 无需额外依赖

**替代方案**: SQLite 文件副本（过度工程化）

### 2. 归档数据内容

**决定**:
- `team.json`: 团队元信息（name, display_name, members, config, created_at, archived_at, message_count）
- `messages.json`: 该团队的所有消息记录

**理由**: 覆盖所有关键数据，足以重建团队历史

### 3. 空归档目录清理

**决定**: 在 `archiveTeamData` 中添加清理逻辑，删除空目录

**理由**: 现有 30 个空目录没有任何价值，清理避免混淆

### 4. 永久删除时清理归档文件

**决定**: `DELETE /api/archive/:name` 路由中同时删除对应的归档目录

**理由**: 永久删除应彻底清理，不留孤儿文件

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|---------|
| 大量消息导出可能耗时 | 添加日志记录，异步执行不影响响应 |
| JSON 文件可能较大 | 归档是一次性操作，可接受 |
| 清理空目录误删 | 仅删除完全为空的目录（`readdirSync` 长度为 0） |
