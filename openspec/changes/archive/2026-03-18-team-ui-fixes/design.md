## Context

当前团队列表 (Sidebar.tsx) 存在三个 UI 一致性问题：
1. 头像颜色硬编码为 `#3b82f6`，与已实现的 hash 颜色生成系统不一致
2. 时间格式使用相对时间（"5分钟前"），团队多时可读性差
3. 在线人数计算基于 `isActive !== false`，需要更准确的逻辑

## Goals / Non-Goals

**Goals:**
- 团队列表头像颜色与聊天区域保持一致
- 时间格式更易读，支持今天/昨天/历史日期
- 在线人数更准确反映成员实际状态

**Non-Goals:**
- 不修改数据库结构
- 不修改 WebSocket 协议
- 不修改聊天区域的显示逻辑

## Decisions

### 1. 头像颜色生成
- **Decision**: 复用现有 `generateAvatarColor(team.name)` 函数
- **Rationale**: 已有成熟的 hash 颜色生成算法，保证一致性
- **Location**: `Sidebar.tsx` 导入 `@shared/utils/avatar`

### 2. 时间格式化
- **Decision**: 使用智能历史时间格式
  - 今天: "今天 HH:mm"
  - 昨天: "昨天 HH:mm"
  - 更早: "M月D日 HH:mm"
- **Rationale**: 比"X天前"更直观，用户能快速定位具体时间
- **Alternative**: 完整日期 "YYYY-MM-DD HH:mm" - 信息冗余

### 3. 在线状态计算
- **Decision**: 保持现有逻辑 `isActive !== false`，但需确认 user 默认在线
- **Rationale**: 当前逻辑已正确区分 active/inactive 成员
- **Verification**: 确保 `data-sync.ts` 中 user 成员正确设置为 `isOnline: true`

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| 时间格式变化用户不习惯 | 格式直观，过渡成本低 |
| 头像颜色变化视觉差异 | 使用 hash 保证稳定性，同一团队颜色不变 |
