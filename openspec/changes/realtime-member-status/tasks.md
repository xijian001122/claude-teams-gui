# Tasks: 实时成员状态

## 1. 类型定义

- [ ] 1.1 在 `src/shared/types.ts` 添加 `MemberStatusInfo` 接口 (memberName, status, lastActivityAt, taskDescription)
- [ ] 1.2 在 `src/shared/types.ts` 添加 `MemberStatusMessage` 类型
- [ ] 1.3 扩展 `WebSocketMessage` 类型添加 `member_status` 事件

## 2. 后端服务

- [ ] 2.1 创建 `src/server/services/member-status.ts` 实现状态追踪服务
- [ ] 2.2 实现状态推断逻辑：基于消息活动时间判断 (30秒内活跃 = busy)
- [ ] 2.3 在 WebSocket 连接时广播初始状态

## 3. WebSocket 协议

- [ ] 3.1 在 `src/server/server.ts` 添加 `member_status` 事件处理
- [ ] 3.2 在成员加入/离开 team 时发送状态更新
- [ ] 3.3 当收到消息时，更新发送者/接收者的 lastActivityAt

## 4. 前端状态管理

- [ ] 4.1 在 `src/client/app.tsx` 添加 `memberStatuses` 状态 (Map<teamName, MemberStatusInfo[]>)
- [ ] 4.2 在 `useWebSocket` hook 添加 `member_status` 事件处理
- [ ] 4.3 实现定时检查状态逻辑（每5秒检查一次）

## 5. UI 组件开发

- [ ] 5.1 创建 `src/client/components/OnlineMembersTrigger.tsx` 触发器组件
- [ ] 5.2 创建 `src/client/components/OnlineMembersPanel.tsx` 下拉面板组件
- [ ] 5.3 创建 `src/client/components/MemberStatusIndicator.tsx` 状态指示器组件
- [ ] 5.4 集成组件到 `ChatArea` header 区域

## 6. 样式实现

- [ ] 6.1 在 `globals.css` 添加状态颜色变量 (busy: #ef4444, idle: #22c55e, offline: #d1d5db)
- [ ] 6.2 实现触发器样式 (圆角按钮、图标、计数显示)
- [ ] 6.3 实现下拉面板样式 (定位、分组、成员项)
- [ ] 6.4 实现头像状态点样式 (12px 直径、2px 白边)

## 7. 测试

- [ ] 7.1 添加成员状态服务单元测试
- [ ] 7.2 添加 WebSocket `member_status` 事件测试
- [ ] 7.3 添加前端组件渲染测试
- [ ] 7.4 添加 E2E 测试验证实时状态更新

## 8. 文档更新

- [ ] 8.1 更新 README.md 添加实时成员状态功能说明
- [ ] 8.2 更新 WebSocket 协议文档

---

## 状态说明

| Status | Color | Condition |
|--------|-------|-----------|
| busy | #ef4444 | 30秒内有消息活动 |
| idle | #22c55e | 30秒内无活动 |
| offline | #d1d5db | 不显示在面板中 |

## 关键实现点

1. **状态推断**: 基于消息活动时间判断，不使用心跳检测
2. **无持久化**: 状态仅存储在内存中，纯计算得出
3. **不显示自己**: 面板中不包含当前用户自己的状态
