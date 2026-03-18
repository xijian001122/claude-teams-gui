## Why

当团队成员发送消息时，团队的 `lastActivity` 时间没有被更新，导致团队列表显示的时间不准确。需要确保每次消息发送都同步更新团队最后活动时间。

## What Changes

- 消息发送时更新团队的 `lastActivity` 字段
- 确保跨团队消息也更新源团队和目标团队的 `lastActivity`
- 持久化 `lastActivity` 更新到数据库

## Capabilities

### New Capabilities

- `team-activity-sync`: 团队活动时间同步机制，确保消息发送时更新团队最后活动时间

### Modified Capabilities

- `team-list-display`: 扩展要求 - 团队活动时间必须随消息发送实时更新

## Impact

- `src/server/services/data-sync.ts` - sendMessage 和 sendCrossTeamMessage 方法
- `src/server/db/index.ts` - 可能需要添加 updateTeamActivity 方法
