## Context

当前 `sendMessage` 和 `sendCrossTeamMessage` 方法发送消息时没有更新团队的 `lastActivity` 字段。这导致团队列表显示的最后活动时间不准确（显示的是团队创建时间或上次同步时间，而非最后一条消息的时间）。

现有代码中 `db.updateTeamActivity()` 方法已存在，只需在消息发送时调用。

## Goals / Non-Goals

**Goals:**
- 每条消息发送后更新团队 `lastActivity` 时间戳
- 跨团队消息同时更新源团队和目标团队的 `lastActivity`

**Non-Goals:**
- 不修改数据库结构
- 不修改 API 响应格式
- 不修改 WebSocket 消息格式

## Decisions

### 1. 调用时机
- **Decision**: 在 `sendMessage` 和 `sendCrossTeamMessage` 方法末尾调用 `db.updateTeamActivity()`
- **Rationale**: 确保消息保存成功后再更新时间戳，避免数据不一致

### 2. 时间戳来源
- **Decision**: 使用消息的 `timestamp` 字段作为团队 `lastActivity`
- **Rationale**: 保持时间一致性，消息时间和团队活动时间相同

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| 频繁更新数据库 | 仅在消息发送时更新，频率可控 |
