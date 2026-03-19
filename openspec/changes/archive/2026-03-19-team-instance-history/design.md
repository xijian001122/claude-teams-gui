## Context

### Background

Claude Chat 通过监控 `~/.claude/teams/` 目录来同步 Claude Code 团队的 messages。当 Claude Code 删除并重建同名团队时，存在以下问题：

1. **前端状态不刷新**：Claude Chat 前端一直在运行，团队列表和消息状态不会自动更新
2. **消息混淆**：数据库保留了旧团队的消息，当新团队创建时，新旧消息混在一起显示
3. **无实例区分**：消息只按 `teamName` 存储，无法区分同一团队的不同生命周期实例

### Current State

- 团队信息通过 `FileWatcherService` 监控 `~/.claude/teams/` 目录
- 消息通过 `DataSyncService.syncInbox()` 同步到 SQLite
- 消息 ID 基于 `${team}-${inbox}-${index}` 生成，可能产生冲突
- 前端 WebSocket 监听 `new_message` 事件并追加消息

### Constraints

- 不能修改 Claude Code 的行为
- 需要向后兼容现有数据
- 团队目录的 Birth time 可用于区分实例（Linux 文件系统支持）

## Goals / Non-Goals

**Goals:**
- 为每个团队目录创建唯一实例 ID（基于目录 Birth time）
- 从团队成员的 `cwd` 字段提取来源项目名称（如 `claude-chat`）
- 消息按 `(teamName, teamInstance)` 分组存储
- 前端按实例显示消息，不同实例间有视觉分隔
- 默认只显示最新实例，保留历史实例可展开查看

**Non-Goals:**
- 不修改 Claude Code 的团队创建逻辑
- 不实现跨实例的消息搜索
- 不实现实例间的消息合并

## Decisions

### Decision 1: Use Directory Birth Time as Team Instance ID

**Chosen**: `stat.birth` (directory creation time) as `teamInstance`

**Rationale**:
- 目录 Birth time 由文件系统提供，Claude Code 删除重建目录时会改变
- 不需要修改 Claude Code 行为
- 唯一性由文件系统保证

**Alternative**: Generate UUID on sync
- 缺点：需要存储映射关系，删除重建时需要检测

### Decision 2: Extract Source Project from `cwd` Field

**Chosen**: Take `cwd.split('/').pop()` from first team member's config

**Rationale**:
- Claude Code 在创建团队时自动记录成员的 `cwd`
- 提取项目名简单直接
- 无需修改 Claude Code

**Alternative**: Add `sourceProject` field to team config
- 缺点：需要修改 Claude Code

### Decision 3: Store `teamInstance` in Messages Table

**Chosen**: Add `team_instance_id` column to messages table

**Schema**:
```sql
ALTER TABLE messages ADD COLUMN team_instance_id TEXT;
ALTER TABLE messages ADD COLUMN source_project TEXT;
```

**Rationale**:
- 消息自然地按实例分组
- 查询时可以按实例过滤
- 向后兼容（现有数据 `team_instance_id` 可为空）

### Decision 4: Frontend Groups Messages by Instance

**Chosen**: Group messages by `teamInstance` in UI, show divider between instances

**UI Layout**:
```
┌─────────────────────────────────────────┐
│ Team: claude-teams-gui (Instance #2)   │
├─────────────────────────────────────────┤
│ [Messages from current instance]         │
│                                         │
│ ─────── ◆ 团队已重建 ◆ ───────          │
│ [Messages from previous instance]        │
│                                         │
└─────────────────────────────────────────┘
```

**Rationale**:
- 用户可以查看历史消息
- 当前实例消息突出显示
- 分隔线明确区分不同生命周期

### Decision 5: WebSocket Events for Team Lifecycle

**Chosen**: Send `team_instance_changed` event when team directory is recreated

**Event Payload**:
```typescript
{
  type: 'team_instance_changed',
  team: string,
  oldInstance: string | null,
  newInstance: string,
  sourceProject: string
}
```

**Rationale**:
- 前端可以主动刷新团队状态
- 支持更细粒度的 UI 更新
- 与现有 `team_deleted` / `team_created` 事件互补

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| 文件系统不支持 Birth time（如某些 NFS） | Fallback 到 `mtime` 或生成 UUID |
| 旧消息没有 `team_instance_id` | 查询时空值视为同一实例（向后兼容） |
| 前端消息 Map 缓存旧状态 | 实例变化时清空对应团队的消息缓存 |

## Open Questions

1. **实例过期策略**：历史实例消息保留多久？是否需要定期清理？
2. **跨实例消息**：如果用户在聊天中 @ 提及其他实例的成员如何处理？
3. **团队更名**：如果 Claude Code 重命名团队，是否视为新实例？
