## Context

当前头像系统在 `src/shared/constants.ts` 中硬编码了颜色和字母映射：

```typescript
// 当前实现（硬编码）
export const AVATAR_COLORS: Record<string, string> = {
  developer: '#3B82F6',
  tester: '#10B981',
  'team-lead': '#8B5CF6',
  user: '#F59E0B',
  default: '#6B7280'
};

export const AVATAR_LETTERS: Record<string, string> = {
  developer: 'D',
  tester: 'T',
  'team-lead': 'L',
  user: 'U',
  default: '?'
};
```

当成员名称不在映射表中时（如 `frontend-dev`、`backend-dev`、`bug-fixer`），会 fallback 到灰色默认值，影响视觉区分度。

## Goals / Non-Goals

**Goals:**
- 任何成员名称都能自动生成唯一、美观的颜色
- 同名成员始终获得相同颜色（跨团队一致、重启后一致）
- 字母从成员名称智能提取
- 保持 Avatar 组件接口不变

**Non-Goals:**
- 不支持自定义颜色（无需用户设置界面）
- 不支持头像图片（仅字母头像）
- 不存储颜色到数据库（纯算法生成）

## Decisions

### Decision 1: 颜色生成算法

**选择**: 基于 HSL 色相环的 hash 算法

```typescript
function generateAvatarColor(name: string): string {
  // 1. 计算名称的 hash 值
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash; // Convert to 32bit integer
  }

  // 2. 将 hash 映射到色相环 (0-360)
  const hue = Math.abs(hash) % 360;

  // 3. 使用固定的饱和度和亮度，确保颜色鲜艳且可读
  const saturation = 65;  // 65% 饱和度
  const lightness = 50;   // 50% 亮度

  // 4. 转换为 hex 格式
  return hslToHex(hue, saturation, lightness);
}
```

**Rationale:**
- HSL 比 RGB 更容易控制颜色质量（固定饱和度/亮度，只变色相）
- Hash 算法简单高效，同名始终同色
- 色相环确保颜色分布均匀，视觉区分度高

**Alternatives Considered:**
- **随机颜色存库**: 需要数据库迁移，增加复杂度
- **MD5 hash**: 过度设计，简单字符串 hash 足够

### Decision 2: 字母提取算法

**选择**: 从第一个词提取首字母

```typescript
function extractAvatarLetter(name: string): string {
  // 1. 按连字符分割
  const parts = name.split('-');

  // 2. 取第一个词的首字母
  const firstWord = parts[0];
  return firstWord[0].toUpperCase();
}
```

**Examples:**
- `frontend-dev` → `F`
- `backend-dev` → `B`
- `bug-fixer` → `B`
- `team-lead` → `T`
- `tester` → `T`
- `user` → `U`

**Rationale:**
- 简单一致，易于理解
- 大多数角色名第一个词就是关键标识

### Decision 3: 代码位置

**选择**: 放在 `src/shared/utils/avatar.ts`

**Rationale:**
- 前后端共享（DataSyncService 在后端，Avatar 组件在前端）
- 与 constants.ts 分离，职责清晰

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| 不同名称可能生成相似颜色 | Hash 算法使颜色分布均匀，碰撞概率低 |
| 字母可能重复（B 来自 backend-dev 和 bug-fixer） | 颜色不同可区分，字母重复可接受 |
| 深色背景上颜色可能不够对比 | 使用 50% 亮度确保与白色文字对比度足够 |

## Migration Plan

1. **Phase 1**: 创建新的工具函数（无破坏性）
2. **Phase 2**: 修改 `DataSyncService.extractMembers()` 使用新函数
3. **Phase 3**: 移除 `constants.ts` 中的旧映射（保留 user 和 default 作为兜底）

**Rollback**: 如有问题，可立即回退到使用 constants.ts 映射

## Open Questions

None - 设计已明确。
