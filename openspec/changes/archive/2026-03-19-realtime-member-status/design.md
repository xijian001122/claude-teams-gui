# Design: 实时成员状态

## Overview

实现成员状态实时同步功能，在 ChatArea Header 提供在线成员下拉面板，显示四种成员状态（执行中、空闲、繁忙、离线）。

## State Types (四态系统)

| Status | Color | Condition | Display |
|--------|-------|-----------|---------|
| `busy` | #ef4444 (红色) | 发送消息后立即状态 | "正在处理任务" |
| `idle` | #22c55e (绿色) | 发送 idle_notification | "等待任务中" |
| `occupied` | #eab308 (黄色) | busy 状态持续 5 分钟 | "长时间工作中" |
| `offline` | #9ca3af (灰色) | 30 分钟无状态变化 | "已离线" |

## State Transitions (状态转换)

```
                    ┌─────────────────────────────────────────┐
                    │                                         │
                    ▼                                         │
┌──────┐  消息活动   ┌──────────┐  5分钟    ┌───────────┐  30秒   ┌───────┐  30分钟   ┌────────┐
│ busy │────────────▶│ occupied │─────────▶│   idle    │────────▶│ offline│──────────▶│ offline │
└──────┘             └──────────┘           └───────────┘         └───────┘           └────────┘
     │                                       ▲
     │                                       │
     │         idle_notification             │
     └───────────────────────────────────────┘
```

**时间阈值**：
- `busy → occupied`: 5 分钟（BUSY_TIMEOUT_MS）
- `occupied → idle`: 30 秒
- `idle/occupied → offline`: 30 分钟（IDLE_TIMEOUT_MS）

## Data Structures

### MemberStatusInfo
```typescript
interface MemberStatusInfo {
  memberName: string;
  status: 'busy' | 'idle' | 'occupied' | 'offline';
  lastActivityAt: number;   // Unix timestamp ms
  statusChangedAt: number; // Unix timestamp ms
}
```

### MemberState (内部使用)
```typescript
interface MemberState {
  lastActivityAt: number;   // Time of last activity
  statusChangedAt: number;   // Time when current status was set
  currentStatus: MemberStatus;
  initializedAt: number;    // Time when member was initialized (for grace period)
}
```

## Architecture

### Backend Components
```
server.ts
├── MemberStatusService (内存状态机)
│   ├── markBusy() - 标记成员为忙碌
│   ├── markIdle() - 标记成员为空闲
│   ├── initMemberOffline() - 初始化成员为离线（仅首次）
│   ├── tick() - 周期性重算状态
│   └── getMemberStatuses() - 获取成员状态列表
│
FileWatcherService
└── onMemberActivity() 回调
    ├── idle_notification → markIdle()
    └── 其他消息 → markBusy()

cli.ts
└── setInterval(5000) → tick() 广播状态
```

### Frontend Components
```
app.tsx
├── memberStatuses: Map<teamName, MemberStatusInfo[]>
│
useWebSocket hook
├── 收到 member_status 事件 → 更新 memberStatuses
│
ChatArea.tsx (Header)
├── OnlineMembersTrigger ──→ OnlineMembersPanel
```

## Key Implementation Details

### 1. idle_notification 识别
FileWatcher 检测 inbox 文件变化时，解析 JSON 内容判断消息类型：
```typescript
if (messageType === 'idle_notification') {
  memberStatusService.markIdle(teamName, memberName);
} else {
  memberStatusService.markBusy(teamName, memberName);
}
```

### 2. 初始化保护机制
`initMemberOffline()` 只在成员**首次**被追踪时初始化，已存在的成员不会被覆盖：
```typescript
if (teamMap.has(memberName)) {
  return;  // 不覆盖已有状态
}
```

### 3. 初始化宽限期
添加 2 秒宽限期（INIT_GRACE_PERIOD_MS），防止 tick() 在初始化后立即重算状态：
```typescript
if (timeSinceInit < INIT_GRACE_PERIOD_MS) {
  return state.currentStatus;  // 保持初始化状态
}
```

### 4. 状态显示时间
`lastActivityAt` 使用真实时间（不是假的时间戳），确保 UI 显示正确的相对时间。

## Files Modified

| File | Change |
|------|--------|
| `src/shared/types.ts` | MemberStatusInfo 添加 statusChangedAt 字段 |
| `src/server/services/member-status.ts` | 四态状态机实现 |
| `src/server/services/file-watcher.ts` | 添加 onMemberActivity 回调 |
| `src/server/server.ts` | 集成 FileWatcher 和 MemberStatus |
| `src/client/app.tsx` | join_team 消息发送 |
| `src/client/components/OnlineMembersTrigger.tsx` | 四态计数显示 |
| `src/client/components/OnlineMembersPanel.tsx` | 四态分组面板 |
| `src/client/components/MemberStatusIndicator.tsx` | 四态颜色支持 |

## Non-Goals

- 不持久化状态到数据库（纯内存状态）
- 不实现用户自己的状态显示
- 不实现手动设置状态功能
