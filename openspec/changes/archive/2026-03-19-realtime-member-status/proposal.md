## Why

当前在线人数功能仅显示静态数字，用户需要刷新页面才能获取最新的成员状态。在团队协作场景中，用户需要实时了解哪些 Agent 正在执行任务、哪些处于空闲状态，以便做出更好的协作决策。

## What Changes

- **实时状态更新**：通过 WebSocket 实时推送成员状态变更，无需刷新页面
- **Header 下拉面板**：在 ChatArea Header 添加可展开的在线成员列表面板
- **状态指示增强**：显示三种成员状态（执行中、空闲、离线）及其可视化
- **状态定义明确**：
  - **执行中**（红色）：Agent 正在处理任务
  - **空闲**（绿色）：Agent 没有在执行任务
  - **离线**（浅灰）：Agent 进程未运行（不显示在列表中）

## Capabilities

### New Capabilities

- `member-status-sync`: 成员状态实时同步能力，通过 WebSocket 实现状态更新推送
- `online-members-panel`: 在线成员下拉面板组件，包含点击展开、成员列表、状态分组等 UI 交互功能
- `member-status-indicator`: 成员状态指示器，支持执行中/空闲/离线三种状态及其可视化

### Modified Capabilities

- `team-list-display`: 扩展现有团队列表显示能力，在 header 区域添加在线状态下拉面板入口

## Impact

**前端影响**：
- `src/client/components/ChatArea.tsx` - 在 header 添加下拉面板入口
- 新增 `src/client/components/OnlineMembersPanel.tsx` - 下拉面板组件
- 新增 `src/client/components/OnlineMembersTrigger.tsx` - 触发器组件
- `src/client/hooks/useWebSocket.ts` - 扩展处理成员状态消息
- `src/client/app.tsx` - 添加成员状态状态管理

**后端影响**：
- `src/server/server.ts` - 添加成员状态变更的 WebSocket 广播
- `src/server/services/data-sync.ts` - 扩展状态检测逻辑

**数据模型**：
- `TeamMember` 类型扩展 - 添加 `status` 和 `lastActivityAt` 字段

**WebSocket 事件**：
- 新增 `member_status` 事件类型
