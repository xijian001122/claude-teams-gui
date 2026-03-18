## Why

团队列表 UI 存在三个不一致问题：1) 头像使用硬编码蓝色而非已实现的 hash 颜色生成算法，与聊天区域头像风格不统一；2) 时间显示为相对时间（"5分钟前"），在团队数量多时可读性差；3) 在线人数计算逻辑需要优化以更准确反映成员状态。

## What Changes

- **团队列表头像颜色**: 使用 `generateAvatarColor(team.name)` 替代硬编码的 `#3b82f6`
- **时间格式改进**: 将相对时间改为智能历史时间格式
  - 今天: "今天 14:30"
  - 昨天: "昨天 18:45"
  - 更早: "3月15日 09:00"
- **在线人数逻辑优化**: 调整 `isOnline` 计算方式，更准确反映实际在线状态

## Capabilities

### New Capabilities

- `team-list-display`: 团队列表显示规范，包括头像颜色、时间格式、在线状态展示

### Modified Capabilities

- `avatar-generation`: 扩展应用范围至团队列表（原仅用于消息区成员头像）

## Impact

- `src/client/components/Sidebar.tsx` - 头像颜色、时间格式
- `src/server/services/data-sync.ts` - 在线状态计算逻辑
