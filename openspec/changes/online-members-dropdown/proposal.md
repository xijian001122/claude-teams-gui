## Why

当前在线人数功能仅显示简单的数字和在线状态点，缺乏直观的交互体验和完整的成员状态信息。用户需要刷新页面才能获取最新的在线状态，无法实时感知团队成员的活动情况。这影响了协作效率，特别是在需要快速了解谁可用的场景下。

## What Changes

基于已有的下拉面板 UI 模板，优化在线人数功能：

- **UI 交互优化**：实现点击展开成员列表的下拉面板，支持平滑动画和响应式布局
- **实时状态更新**：通过 WebSocket 实时同步成员在线/离线状态，无需刷新页面
- **状态指示增强**：显示更详细的成员状态（在线、离开、忙碌、离线）和最后活动时间
- **性能优化**：使用虚拟化列表优化大量成员时的渲染性能，减少不必要的重渲染

## Capabilities

### New Capabilities

- `online-members-panel`: 在线成员下拉面板组件，包含点击展开、成员列表、状态分组等 UI 交互功能
- `member-presence-sync`: 成员在线状态实时同步能力，通过 WebSocket 实现状态更新推送
- `member-status-indicator`: 成员状态指示器，支持在线/离开/忙碌/离线四种状态及其可视化

### Modified Capabilities

- `team-list-display`: 扩展现有团队列表显示能力，在 header 区域添加在线人数下拉面板入口

## Impact

**前端影响**：
- `src/client/components/ChatArea.tsx` - 在 header 添加下拉面板入口
- 新增 `src/client/components/OnlineMembersPanel.tsx` - 下拉面板组件
- `src/client/hooks/useWebSocket.ts` - 扩展处理成员状态消息

**后端影响**：
- `src/server/server.ts` - 添加成员状态变更的 WebSocket 广播
- 新增 `member_online`/`member_offline`/`member_status_change` 事件类型

**数据模型**：
- `TeamMember` 类型扩展 - 添加 `status` 和 `lastActivityAt` 字段
