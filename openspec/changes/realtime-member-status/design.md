# Design: 实时成员状态

## Overview

实现成员状态实时同步功能，在 ChatArea Header 提供在线成员下拉面板，显示三种成员状态（执行中、空闲、离线）。

## State Types

| Status | Color | Condition | Display |
|--------|-------|-----------|---------|
| `busy` | #ef4444 (红色) | 30秒内有消息活动 | "正在处理任务" |
| `idle` | #22c55e (绿色) | 30秒内无活动 | "空闲中" + 最后活动时间 |
| `offline` | #d1d5db (灰色) | Agent进程未运行 | 不显示在面板中 |

**状态推断逻辑**：
- 当 Agent 发送或接收消息时，更新其 `lastActivityAt` 时间戳
- 前端每5秒检查一次，计算 `now - lastActivityAt`
- 30秒内有活动 → `busy`；无活动 → `idle`
- 不检测"离线"状态（无法实时检测），离线成员直接从列表移除

## Data Structures

### MemberStatusInfo
```typescript
interface MemberStatusInfo {
  memberName: string;
  status: 'busy' | 'idle';
  lastActivityAt: number; // Unix timestamp ms
  taskDescription?: string; // 当前任务描述（可选）
}
```

### WebSocket Message
```typescript
interface MemberStatusMessage {
  type: 'member_status';
  members: MemberStatusInfo[];
}
```

## Architecture

### Frontend State Management
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

### State Update Flow
1. 前端每5秒轮询检查成员活动时间
2. 计算状态并更新本地 Map
3. UI 自动响应状态变化重新渲染

## Components

### OnlineMembersTrigger
- 位置: ChatArea Header 右侧
- 显示: 在线成员数量 + 状态点图标
- 样式: 圆角按钮，hover 时背景色变化

### OnlineMembersPanel
- 位置: Trigger 下方展开的下拉面板
- 功能:
  - 按状态分组显示成员（执行中 > 空闲）
  - 每个成员显示: 头像字母 + 名称 + 状态 + 最后活动时间
  - 点击外部区域自动关闭
- 样式: 白色背景、阴影、圆角边框

### MemberStatusIndicator
- 位置: 成员头像右下角的状态点
- 样式: 12px 直径圆形、2px 白色边框

## Implementation Sequence

### Phase 1: Backend (Tasks 1-3)
1. 添加类型定义到 `src/shared/types.ts`
2. 创建 `MemberStatusService` 服务
3. 集成到 WebSocket 处理流程

### Phase 2: Frontend State (Tasks 4-5)
1. 在 `app.tsx` 添加状态管理
2. 扩展 `useWebSocket` 处理 member_status 事件

### Phase 3: UI Components (Tasks 6-9)
1. 创建 OnlineMembersTrigger
2. 创建 OnlineMembersPanel
3. 创建 MemberStatusIndicator
4. 集成到 ChatArea Header

### Phase 4: Testing & Polish
1. 单元测试
2. E2E 测试
3. 文档更新

## Non-Goals (不会实现)

- 不实现用户自己的在线状态显示
- 不实现手动设置状态功能
- 不实现心跳检测机制
- 不持久化状态到数据库（纯内存/内存计算）

## CSS Variables

```css
--status-busy: #ef4444;
--status-idle: #22c55e;
--status-offline: #d1d5db;
```

## Files to Modify

| File | Change |
|------|--------|
| `src/shared/types.ts` | 添加 MemberStatusInfo, 扩展 WebSocketMessage |
| `src/server/server.ts` | 添加 member_status 事件处理 |
| `src/server/services/member-status.ts` | 新增 - 状态追踪服务 |
| `src/client/app.tsx` | 添加 memberStatuses 状态 |
| `src/client/hooks/useWebSocket.ts` | 添加 member_status 事件处理 |
| `src/client/components/ChatArea.tsx` | 集成触发器到 Header |
| `src/client/components/OnlineMembersTrigger.tsx` | 新增 |
| `src/client/components/OnlineMembersPanel.tsx` | 新增 |
| `src/client/components/MemberStatusIndicator.tsx` | 新增 |
| `src/client/globals.css` | 添加状态颜色变量 |
