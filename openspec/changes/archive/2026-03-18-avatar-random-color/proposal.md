## Why

当前头像系统使用硬编码的颜色映射（`AVATAR_COLORS`），导致新增成员角色时需要手动修改代码。随着团队成员角色多样化（frontend-dev、backend-dev、bug-fixer 等），现有映射无法覆盖所有情况，fallback 到默认灰色，影响用户体验和视觉区分度。

## What Changes

- 移除 `src/shared/constants.ts` 中的 `AVATAR_COLORS` 和 `AVATAR_LETTERS` 硬编码映射
- 新增基于成员名称 hash 的颜色生成函数，确保同名成员始终获得相同颜色
- 新增智能头像字母提取函数，从成员名称自动提取首字母
- 修改 `DataSyncService.extractMembers()` 使用新的生成逻辑
- 颜色基于 HSL 色相环均匀分布，确保视觉区分度高

## Capabilities

### New Capabilities
- `avatar-generation`: 基于成员名称自动生成头像颜色和字母的能力

### Modified Capabilities
- None（新增能力，不影响现有 spec）

## Impact

**修改的文件：**
- `src/shared/constants.ts` - 移除硬编码颜色/字母映射，新增生成函数
- `src/server/services/data-sync.ts` - 修改 `extractMembers()` 使用新逻辑

**不影响：**
- 数据库 schema（无需新增表）
- API 接口
- 前端组件（Avatar 组件接口不变）
