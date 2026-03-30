## Why

团队归档功能（`archiveTeamData`）只创建了空目录，没有实际保存任何数据。`~/.claude-chat/archive/` 下有 30 个空目录，每个都只包含 `.` 和 `..`。用户归档团队后期望能恢复或查看历史数据，但目前什么都没保存。

## What Changes

- 实现归档数据导出：将团队消息、成员信息、团队配置写入归档目录
- 归档格式为 JSON 文件（`team.json` + `messages.json`），便于读取和恢复
- 在归档 API 中增加摘要信息（消息数、成员数、时间范围）
- 清理现有的 30 个空归档目录

## Capabilities

### New Capabilities
- `team-archive-export`: 团队归档数据导出功能，将 SQLite 中的消息和团队元信息持久化到文件系统

### Modified Capabilities
<!-- 无现有 spec 需要修改 -->

## Impact

- **代码**: `src/server/services/data-sync.ts` 中的 `archiveTeamData` 方法
- **数据**: `~/.claude-chat/archive/<team>-<timestamp>/` 目录将包含实际数据文件
- **API**: `GET /api/archive` 可扩展返回归档摘要
