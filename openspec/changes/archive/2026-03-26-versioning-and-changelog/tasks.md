## 1. Setup

- [x] 1.1 安装 standard-version 依赖 (`npm install --save-dev standard-version`)
- [x] 1.2 在 package.json 中添加 version 字段（初始值 0.1.0）
- [x] 1.3 在 package.json scripts 中添加 `"release": "standard-version"`

## 2. Create release script

- [x] 2.1 创建 `scripts/release.sh` 脚本
- [x] 2.2 添加首次发布初始化逻辑
- [x] 2.3 添加 Git tag 推送功能

## 3. Configure Git hooks

- [x] 3.1 确保 commit-msg hook 验证 conventional commits 格式（已有 husky/commitlint 配置则跳过）
- [ ] 3.2 添加 pre-push hook 自动检查（可选）

## 4. Create CHANGELOG.md

- [x] 4.1 创建初始 CHANGELOG.md 文件
- [x] 4.2 添加项目信息和使用说明
- [x] 4.3 执行首次发布 `npm run release -- --first-release`

## 5. Documentation

- [x] 5.1 更新 CLAUDE.md 中的版本规范说明
- [x] 5.2 在 docs 或 README 中说明版本号更新规则
