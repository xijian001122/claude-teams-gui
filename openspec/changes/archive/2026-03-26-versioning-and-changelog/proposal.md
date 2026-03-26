## Why

项目缺乏版本管理和变更追踪机制。当前所有变更都是无差别的提交，无法清晰追踪每个版本引入了哪些功能或修复。需要建立语义化版本控制和自动化的变更日志生成机制。

## What Changes

- 新增 `CHANGELOG.md` 文件，记录每个版本的变更内容
- 在 `package.json` 中添加 `version` 字段管理当前版本
- 每次 Git 提交根据提交类型自动递增版本号：
  - `feat:` 提交 → 递增 minor 版本
  - `fix:` 提交 → 递增 patch 版本
  - `BREAKING CHANGE` 或 `!:` 提交 → 递增 major 版本
- 提供 `npm run release` 命令用于打标签发布
- 提交规范增加 `TAG_VERSION` 环境变量支持手动版本指定
- 版本号格式：`v{major}.{minor}.{patch}`（如 `v1.2.3`）

## Capabilities

### New Capabilities

- `semantic-versioning`: 语义化版本控制规范
  - 支持自动递增 minor.patch
  - 支持 major 版本大更新
  - Git tag 与版本号绑定
- `changelog-management`: 变更日志管理
  - 自动生成 CHANGELOG.md
  - 按版本组织变更内容
  - 支持 feat、fix、docs、refactor、test、chore 等提交类型

### Modified Capabilities

- `git-workflow`: 修改 Git 提交规范
  - 增加版本标签相关规则
  - 集成 changelog 生成到发布流程

## Impact

- 修改 `.git/hooks/commit-msg` 验证提交格式
- 修改 `package.json` 添加 version 字段
- 新增 `CHANGELOG.md` 文件
- 新增 `scripts/release.sh` 发布脚本
- 需要安装 `standard-version` 或 `release-it` 工具
