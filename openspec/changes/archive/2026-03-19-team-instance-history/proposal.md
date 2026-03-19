## Why

当 Claude Code 删除并重建同名团队时（如 `claude-teams-gui`），Claude Chat 前端一直在运行但不会自动刷新团队状态和消息。数据库会保留旧团队的历史消息，导致新团队的消息与旧消息混在一起显示，用户看到的是过期或错误的消息记录。

需要一种机制来区分同一团队名的不同"生命周期实例"，保留历史记录供查看，同时确保新实例的消息独立显示。

## What Changes

- **新增团队实例标识**：为每个团队目录创建时生成唯一实例 ID（基于目录 Birth time），存储在数据库中
- **新增来源项目识别**：从团队成员的 `cwd` 字段提取项目名称（如 `claude-chat`），用于识别团队是否来自当前项目
- **消息按实例分组**：前端按团队实例分组显示消息，不同实例之间插入视觉分隔线
- **历史实例折叠**：默认只显示最新实例的消息，历史实例可展开查看

## Capabilities

### New Capabilities

- **team-lifecycle**: 团队生命周期管理能力
  - 团队实例创建/销毁检测
  - 目录 Birth time 作为实例唯一标识
  - 团队来源项目识别（从 cwd 提取项目名）
  - 实例状态管理（active/archived）

### Modified Capabilities

- **cross-team-messaging**: 消息同步能力
  - 消息按 teamInstance 分组而非仅按 teamName
  - 新增 teamInstance 字段到消息模型

## Impact

- **Database**: messages 表需增加 `team_instance_id` 和 `source_project` 字段
- **Backend**: DataSyncService.syncTeam() 需要获取目录 Birth time
- **Frontend**: 消息显示逻辑需按实例分组，增加视觉分隔
- **FileWatcher**: 团队目录删除/创建时发送 WebSocket 事件通知前端
