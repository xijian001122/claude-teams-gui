## context
当前成员在线状态只在文件监听器触发时更新，没有实时推送到前端。需要添加 WebSocket 广播机制。

## goals / non-goals
**goals:**
- 成员状态变更时实时广播到所有客户端
- 前端自动更新成员列表显示
**non-goals:**
- 不修改数据库结构
- 不修改现有 WebSocket 协议格式
## decisions
### 1. 广播时机
- **decision**: 在 File watcher 检测到 config 变更时广播
- **rationale**: config.json 包含 isActive 字段，可以在这里触发广播
### 2. 事件类型
- **decision**: 使用现有的 `member_online` 和 `member_offline` 事件类型
- **rationale**: 已在 WebSocket 协议中定义，保持一致性
