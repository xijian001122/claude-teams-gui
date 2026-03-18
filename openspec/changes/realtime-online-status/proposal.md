## Why

当前在线人数只在页面刷新时才会更新，需要实时同步。这会导致用户无法及时了解团队成员的实际在线状态。需要通过 WebSocket 实时推送在线状态变更。

## What changes

- 添加 `member_online` 和 `member_offline` WebSocket 事件
- 当成员 `isActive` 状态变更时广播在线状态更新
- 巻加 `team-members-update` API 端点供前端主动更新成员列表

## capabilities
### New capabilities
- `realtime-presence`: 实时在线状态推送系统
## impact
- `src/server/services/data-sync.ts` - 监听 config 变更并广播
- `src/server/routes/` - 添加成员状态更新 API
- `src/client/app.tsx` - 监听成员状态变更事件
