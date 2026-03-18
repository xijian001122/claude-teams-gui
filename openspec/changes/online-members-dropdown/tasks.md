## 1. 后端准备

- [ ] 1.1 扩展 TeamMember 类型定义，添加 status 和 lastActivityAt 字段
- [ ] 1.2 实现成员状态追踪逻辑（根据消息发送时间和心跳判断）
- [ ] 1.3 添加 member_online WebSocket 事件广播
- [ ] 1.4 添加 member_offline WebSocket 事件广播
- [ ] 1.5 添加 member_status_change WebSocket 事件广播
- [ ] 1.6 实现获取团队完整成员状态列表的 API

## 2. 前端类型定义

- [ ] 2.1 更新 src/shared/types.ts 中的 TeamMember 类型
- [ ] 2.2 定义 WebSocket 消息类型（MemberOnlineMessage, MemberOfflineMessage, MemberStatusChangeMessage）
- [ ] 2.3 定义成员状态枚举类型 MemberStatus

## 3. 前端状态管理

- [ ] 3.1 在 app.tsx 中添加成员状态状态管理（Map<teamName, MemberStatus[]>）
- [ ] 3.2 扩展 useWebSocket hook 处理成员状态消息
- [ ] 3.3 实现 WebSocket 重连后的完整状态同步

## 4. 成员状态指示器组件

- [ ] 4.1 创建 MemberStatusIndicator 组件，显示状态圆点
- [ ] 4.2 实现四种状态的视觉样式（在线/离开/忙碌/离线）
- [ ] 4.3 实现在线状态的脉冲动画效果
- [ ] 4.4 实现最后活动时间显示逻辑

## 5. 在线成员下拉面板组件

- [ ] 5.1 创建 OnlineMembersPanel 组件基础结构
- [ ] 5.2 实现面板展开/收起动画效果
- [ ] 5.3 实现成员列表按状态分组显示
- [ ] 5.4 实现成员列表虚拟化（> 50 成员时）
- [ ] 5.5 实现点击外部自动关闭面板
- [ ] 5.6 实现响应式布局适配

## 6. ChatArea Header 集成

- [ ] 6.1 修改 ChatArea.tsx header 区域，添加下拉面板入口
- [ ] 6.2 实现在线人数实时更新显示
- [ ] 6.3 实现入口悬停和点击视觉反馈
- [ ] 6.4 实现面板展开状态指示

## 7. 主题适配

- [ ] 7.1 确保所有组件支持浅色/深色主题切换
- [ ] 7.2 验证颜色对比度符合可访问性标准

## 8. 测试和优化

- [ ] 8.1 测试小团队（< 10 成员）渲染性能
- [ ] 8.2 测试大团队（50+ 成员）渲染性能
- [ ] 8.3 测试 WebSocket 断线重连场景
- [ ] 8.4 测试快速状态变更时的防抖效果
- [ ] 8.5 测试浅色/深色主题切换

## 9. 文档更新

- [ ] 9.1 更新 websocket-protocol 技能文档，添加新事件类型
- [ ] 9.2 更新 frontend-dev 技能文档，添加新组件说明
