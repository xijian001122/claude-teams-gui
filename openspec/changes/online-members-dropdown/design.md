## Context

当前 ChatArea 组件的 header 区域显示简单的在线人数（如 "3 人在线"），但没有交互功能。用户需要了解具体谁在线、谁可用，但无法通过点击获取详细信息。

现有技术栈：
- 前端：Preact + TailwindCSS + TypeScript
- 实时通信：WebSocket（已有 useWebSocket hook）
- 状态管理：useState + Map 结构

已有参考：`demo/online-members-comparison.html` 提供了 5 种 UI 方案的对比演示，其中"下拉面板"方案被推荐为首选。

## Goals / Non-Goals

**Goals:**
- 在 header 点击在线人数时展开成员列表下拉面板
- 实时更新成员在线/离线状态，无需刷新页面
- 显示成员详细状态（在线、离开、忙碌、离线）和最后活动时间
- 优化大量成员时的渲染性能
- 支持浅色/深色主题切换

**Non-Goals:**
- 不实现成员状态的手动设置功能（由后端根据活动自动判断）
- 不实现成员搜索和筛选功能
- 不实现成员列表的分页加载

## Decisions

### 1. UI 组件设计

**决定**：创建独立的 `OnlineMembersPanel` 组件，在 ChatArea header 中引用。

**理由**：
- 组件职责分离，便于维护和测试
- 可复用性高，未来可用于其他位置
- 与现有 Sidebar、MessageBubble 等组件保持一致的设计模式

**替代方案**：
- 在 ChatArea 中直接实现：代码耦合度高，不利于复用
- 在 Sidebar 中实现：与 header 位置不符，用户预期不一致

### 2. 实时状态同步机制

**决定**：扩展现有 WebSocket 协议，添加成员状态相关事件。

**新增事件类型**：
```
Server → Client:
- member_online: { team, member }
- member_offline: { team, memberId }
- member_status_change: { team, memberId, status, lastActivityAt }
```

**理由**：
- 复用现有 WebSocket 连接，无需额外轮询
- 实时性好，状态变更立即推送
- 与现有消息推送机制一致

**替代方案**：
- HTTP 轮询：增加服务器负载，实时性差
- Server-Sent Events：需要额外连接，与现有架构不一致

### 3. 状态数据结构

**决定**：扩展 TeamMember 类型，添加 status 和 lastActivityAt 字段。

```typescript
interface TeamMember {
  name: string;
  displayName: string;
  role: string;
  color: string;
  avatarLetter: string;
  status: 'online' | 'away' | 'busy' | 'offline';  // 新增
  lastActivityAt?: string;  // 新增：ISO 时间戳
}
```

**理由**：
- 类型安全，TypeScript 编译时检查
- 与现有类型系统一致
- 便于后续扩展（如添加更多状态属性）

### 4. 性能优化策略

**决定**：使用 React.memo + 虚拟化列表优化大量成员渲染。

**策略**：
- 成员列表项使用 React.memo 避免不必要的重渲染
- 成员数量 > 50 时启用虚拟化列表（固定高度容器 + 滚动）
- 状态更新时只更新变化的成员，不重新渲染整个列表

**理由**：
- 大团队可能有 50+ 成员，全量渲染影响性能
- 状态更新频繁，需要优化渲染开销
- 与现有消息列表虚拟化策略一致

**替代方案**：
- 分页加载：用户需要额外操作，体验不流畅
- 限制显示数量：用户无法看到所有成员

## Risks / Trade-offs

**风险 1：状态更新频繁导致性能问题**
- 缓解：使用防抖（300ms）合并批量状态更新
- 缓解：只有当前团队的状态更新才会触发重渲染

**风险 2：WebSocket 连接断开时状态不准确**
- 缓解：重连时重新获取完整的成员状态列表
- 缓解：显示连接状态指示器，让用户知道状态可能不准确

**风险 3：下拉面板遮挡聊天内容**
- 缓解：面板设计为紧凑型，最大高度不超过视口 50%
- 缓解：点击外部自动关闭面板

## Migration Plan

**阶段 1：后端准备**
1. 扩展 TeamMember 类型定义
2. 添加成员状态追踪逻辑
3. 实现 WebSocket 事件广播

**阶段 2：前端实现**
1. 创建 OnlineMembersPanel 组件
2. 扩展 useWebSocket 处理成员状态消息
3. 在 ChatArea header 中集成下拉面板

**阶段 3：测试和优化**
1. 测试各种团队规模的渲染性能
2. 测试 WebSocket 断线重连场景
3. 验证浅色/深色主题显示

**回滚策略**：
- 后端事件向后兼容，旧客户端忽略新事件
- 前端可快速移除 OnlineMembersPanel 组件，恢复原有简单显示

## Open Questions

1. **状态判断逻辑**：后端如何判断成员状态（在线/离开/忙碌）？
   - 建议：根据最后消息发送时间和 WebSocket 心跳判断
   - 需要与后端开发确认具体实现

2. **状态变更延迟**：多久没有活动判断为"离开"？
   - 建议：5 分钟无活动标记为"离开"，15 分钟标记为"离线"
   - 需要根据实际使用情况调整

3. **面板默认展开还是收起**？
   - 建议：默认收起，用户主动点击展开
   - 避免遮挡聊天内容
