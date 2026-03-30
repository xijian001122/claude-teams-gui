# Proposal: 修复 team_added 事件未触发团队列表刷新

## Problem

用户反馈：当 Claude Code 创建新团队时，Web 界面无论如何刷新都无法显示新团队信息。

## Root Cause

在 `useWebSocket.ts` 的 `ws.onmessage` 中，没有处理 `team_added` 事件类型。

虽然 `app.tsx` 中有处理 `team_added` 的逻辑：
```typescript
if (lastMessage.type === 'team_added' && lastMessage.team) {
  loadTeams();
}
```

但 `useWebSocket.ts` 从未将 `team_added` 事件设置到 `lastMessage`，导致 `app.tsx` 永远收不到通知。

## Data Flow

```
后端 FileWatcherService
    │
    │ 检测到新团队目录
    ▼
DataSyncService.syncTeam()
    │
    │ 同步成功
    ▼
broadcastTeamAdded(team)
    │
    │ WebSocket 广播 { type: 'team_added', team }
    ▼
前端 useWebSocket.ts onmessage
    │
    │ ❌ 没有处理 team_added 类型
    ▼
setLastMessage() 未被调用
    │
    │
    ▼
app.tsx 收不到 lastMessage
    │
    │ 团队列表不刷新
    ▼
用户看不到新团队
```

## Proposed Solution

在 `src/client/hooks/useWebSocket.ts` 的 `ws.onmessage` 中添加 `team_added` 事件处理：

```typescript
if (data.type === 'team_added' && data.team) {
  setLastMessage({
    timestamp: Date.now(),
    type: data.type,
    team: data.team.name,
    // 传递完整 team 对象供 app.tsx 使用
  });
}
```

## Scope

- **In Scope**: 修复 `useWebSocket.ts` 添加 `team_added` 事件处理
- **Out of Scope**: 其他事件类型（`team_archived`, `team_instance_changed` 等可能也有同样问题）

## Impact

- 修复新团队创建后 Web 界面不更新的问题
- 改善用户体验

## Estimate

1 个文件修改，预计 5 分钟。
