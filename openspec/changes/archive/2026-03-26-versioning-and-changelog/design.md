## Context

项目使用 conventional commits 规范，但缺乏版本管理和变更日志。每次发布需要手动整理变更内容，容易遗漏且不一致。需要建立自动化的版本递增和变更日志生成机制。

## Goals / Non-Goals

**Goals:**
- 建立语义化版本控制（SemVer）
- 自动生成规范的 CHANGELOG.md
- 版本号与 Git tag 绑定
- 支持 minor/patch 自动递增，major 手动指定

**Non-Goals:**
- 不实现完整的 CI/CD 发布流程
- 不自动发布到 npm 或其他包管理器
- 不支持多分支版本管理（仅 main 分支）

## Decisions

### 工具选择: standard-version vs release-it

**决定**: 使用 `standard-version`

**理由**:
- `standard-version` 轻量级，配置简单
- 与 conventional-commits 规范无缝集成
- 自动生成 CHANGELOG.md
- 支持自定义版本号

**替代方案**:
- `release-it`: 功能更全但配置复杂，项目不需要那么多特性
- 手动管理: 容易出错，不符合自动化要求

### 版本文件位置

**决定**: 版本号存储在 `package.json` 的 `version` 字段

**理由**:
- npm 标准做法
- `standard-version` 默认行为
- 单一数据源，避免版本不同步

### Git Tag 格式

**决定**: `v{version}` 格式（如 `v1.2.3`）

**理由**:
- 业界通用约定
- GitHub/R Git 均使用此格式
- 避免与 npm tag 混淆

### CHANGELOG.md 位置

**决定**: 放在项目根目录

**理由**:
- 方便用户和开发者查看
- 符合 GitHub 标准
- `standard-version` 默认行为

## Risks / Trade-offs

- [Risk] 旧提交没有 conventional commits 格式
  - **Mitigation**: 首次使用 `standard-version --first-release` 初始化，后续严格提交规范
- [Risk] 版本号与 changelog 不同步
  - **Mitigation**: 使用 `standard-version` 自动处理，保证一致性
- [Trade-off] changelog 自动生成可能不够美观
  - **Mitigation**: 可配置 changelog 模板优化格式

## Migration Plan

1. 安装 `standard-version` 依赖
2. 初始化首次发布 `npm run release -- --first-release`
3. 配置 GitHub Actions 自动发布（可选）
4. 通知团队成员使用 conventional commits 规范

## Open Questions

- 是否需要集成 GitHub Actions 自动发布？
- changelog 是否需要中文？
