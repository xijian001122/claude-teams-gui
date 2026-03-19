# Tasks: 实时成员状态

## 1. 类型定义

- [x] 1.1 在 `src/shared/types.ts` 添加 `MemberStatusInfo` 接口
- [x] 1.2 添加 `statusChangedAt` 字段到 `MemberStatusInfo`
- [x] 1.3 扩展 `WebSocketMessage` 类型添加 `member_status` 事件

## 2. 后端服务

- [x] 2.1 创建 `src/server/services/member-status.ts` 实现四态状态机
- [x] 2.2 实现状态转换逻辑：busy→occupied (5min), occupied→idle (30sec), idle/occupied→offline (30min)
- [x] 2.3 实现 `markBusy()`, `markIdle()`, `initMemberOffline()` 方法
- [x] 2.4 实现 `tick()` 周期性状态重算
- [x] 2.5 添加初始化保护机制（不覆盖已有状态）

## 3. FileWatcher 集成

- [x] 3.1 在 `file-watcher.ts` 添加 `onMemberActivity` 回调接口
- [x] 3.2 解析 inbox JSON 检测 `idle_notification` 消息类型
- [x] 3.3 调用对应的 `markBusy()` 或 `markIdle()` 方法

## 4. WebSocket 协议

- [x] 4.1 在 `server.ts` 集成 `onMemberActivity` 回调
- [x] 4.2 `join_team` 时初始化团队成员为离线（仅首次）
- [x] 4.3 活动状态变化时广播 `member_status` 到所有客户端
- [x] 4.4 `cli.ts` 每 5 秒调用 `tick()` 广播状态

## 5. 前端状态管理

- [x] 5.1 在 `app.tsx` 添加 `memberStatuses` 状态 (Map<teamName, MemberStatusInfo[]>)
- [x] 5.2 在 `useWebSocket` hook 添加 `member_status` 事件处理
- [x] 5.3 `join_team` 消息发送（当前用户加入团队时）

## 6. UI 组件开发

- [x] 6.1 `OnlineMembersTrigger.tsx` - 显示忙碌/空闲/繁忙计数
- [x] 6.2 `OnlineMembersPanel.tsx` - 按状态分组显示所有成员
- [x] 6.3 `MemberStatusIndicator.tsx` - 头像状态点组件
- [x] 6.4 集成组件到 `ChatArea` header 区域

## 7. 样式实现

- [x] 7.1 状态颜色变量 (busy: #ef4444, idle: #22c55e, occupied: #eab308, offline: #9ca3af)
- [x] 7.2 触发器样式（圆角按钮、状态点图标、计数显示）
- [x] 7.3 下拉面板样式（定位、分组、成员项）
- [x] 7.4 头像状态点样式

## 8. 测试

- [ ] 8.1 添加成员状态服务单元测试
- [ ] 8.2 添加 WebSocket `member_status` 事件测试
- [ ] 8.3 添加前端组件渲染测试
- [ ] 8.4 E2E 测试验证实时状态更新

## 9. 文档更新

- [x] 9.1 更新 design.md（四态系统设计）
- [x] 9.2 更新 tasks.md（实现状态）
- [ ] 9.3 更新 README.md

---

## 实现状态

| 组件 | 状态 | 说明 |
|------|------|------|
| 四态状态机 | ✅ 完成 | busy/idle/occupied/offline |
| FileWatcher 集成 | ✅ 完成 | idle_notification 检测 |
| WebSocket 广播 | ✅ 完成 | 实时状态推送 |
| 前端状态管理 | ✅ 完成 | app.tsx + useWebSocket |
| UI 组件 | ✅ 完成 | Trigger + Panel + Indicator |
| 单元测试 | ⏳ 待添加 | 可选改进 |

**代码审查**: 通过 ✅

## 四态系统说明

| Status | Color | Condition | Timeout |
|--------|-------|-----------|---------|
| busy | 红色 | 发送消息后立即 | → occupied (5分钟) |
| occupied | 黄色 | busy 持续 5 分钟 | → idle (30秒) |
| idle | 绿色 | idle_notification 或 occupied 30秒 | → offline (30分钟) |
| offline | 灰色 | 30 分钟无状态变化 | - |

## 关键实现点

1. **idle_notification 检测**: FileWatcher 解析 inbox JSON 判断消息类型
2. **状态转换自动化**: tick() 每 5 秒重算并广播状态
3. **初始化保护**: initMemberOffline() 不覆盖已有成员状态
4. **无持久化**: 状态仅存储在内存中，服务器重启后重新初始化
5. **不显示自己**: 面板中不包含当前用户自己的状态
