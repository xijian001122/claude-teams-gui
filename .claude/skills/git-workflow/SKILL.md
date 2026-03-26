---
name: git-workflow
description: Git 工作流规范 - 分支管理、提交规范、版本控制、Release 发布流程
---

# Git 工作流规范

**作用**: 规范本项目的 Git 使用流程，确保代码变更可追溯、可回滚、可审查

**触发关键词**: git、分支、提交、commit、PR、合并、回滚、历史、release、发布、版本

## 核心规范速查

| 规范 | 说明 | 详细文档 |
|------|------|---------|
| 分支策略 | 主分支保护、功能分支开发 | [docs/branch-strategy.md](docs/branch-strategy.md) |
| 提交规范 | Conventional Commits 标准 | [docs/commit-convention.md](docs/commit-convention.md) |
| 版本管理 | SemVer + standard-version | 见下方 |
| Release | GitHub Releases + 双语说明 | 见下方 |
| 工作流检查 | 强制检查清单，防止跳过步骤 | [docs/workflow-checks.md](docs/workflow-checks.md) |
| 回滚机制 | 废弃修改、版本回退方法 | [docs/rollback-strategies.md](docs/rollback-strategies.md) |
| 代码审查 | PR 创建、审查清单 | [docs/code-review.md](docs/code-review.md) |
| 归档提交 | 归档时自动触发 Git 提交 | [docs/archive-commit.md](docs/archive-commit.md) |

## 快速检查清单

### 开始工作前
- [ ] 确认基于最新 main 分支
- [ ] 创建功能分支（`feature/xxx` 或 `fix/xxx`）
- [ ] 阅读相关技能文档
- [ ] 理解需求后再写代码

### 提交代码前
- [ ] 代码自测通过
- [ ] 提交信息符合规范
- [ ] 相关文档已更新
- [ ] 无敏感信息泄露

### 创建 PR 前
- [ ] 功能完整可演示
- [ ] 所有检查通过
- [ ] PR 描述清晰完整
- [ ] 关联相关 Issue

### 归档时
- [ ] 所有变更已保存到归档目录
- [ ] 提交信息包含归档变更名称
- [ ] 推送到远程仓库

## 版本管理

本项目使用 [Semantic Versioning 2.0.0](https://semver.org/) 配合 [standard-version](https://github.com/conventional-changelog/standard-version)。

### 版本号规则

| 提交类型 | 版本递增 | 示例 |
|---------|---------|------|
| `feat:` | minor +1 | 0.1.0 → 0.2.0 |
| `fix:` | patch +1 | 0.1.0 → 0.1.1 |
| `BREAKING CHANGE:` 或 `!:` | major +1 | 0.1.0 → 1.0.0 |

### 版本递增流程

```bash
# 1. 确保在 main 分支
git checkout main
git pull origin main

# 2. 运行 standard-version（自动更新 CHANGELOG.md 和版本号）
npm run release

# 3. 推送代码和 tag 到远程
git push --follow-tags origin main
```

## Release 发布流程

### 方式一：使用 gh CLI（推荐）

```bash
# 1. 登录 GitHub（首次）
gh auth login

# 2. 创建 Release
gh release create v0.1.0 --title "v0.1.0" --generate-notes

# 3. 编辑 Release（添加双语说明）
gh release edit v0.1.0 --notes "$(cat <<'EOF'
# What's Changed / 更新内容

## English
- Feature description...

## 中文
- 功能描述...

**Full Changelog**: https://github.com/xijian001122/claude-teams-gui/compare/v0.0.1...v0.1.0
EOF
)"
```

### 方式二：GitHub 网页

1. 访问 https://github.com/xijian001122/claude-teams-gui/releases/new
2. 选择已推送的 tag
3. 填写双语 Release 标题和说明
4. 点击 "Publish release"

### Release 说明模板（双语）

```markdown
# What's Changed / 更新内容

## English

### Features
- Feature description

### Bug Fixes
- Fix description

### Installation
\`\`\`bash
npm install -g claude-teams-gui
\`\`\`

---

## 中文

### 新功能
- 功能描述

### Bug 修复
- 修复描述

### 安装
\`\`\`bash
npm install -g claude-teams-gui
\`\`\`

---

**Full Changelog**: https://github.com/xijian001122/claude-teams-gui/compare/v0.0.1...v0.1.0
```

## 详细文档索引

### 核心流程
- [分支策略](docs/branch-strategy.md) - 分支命名、保护规则、生命周期
- [提交规范](docs/commit-convention.md) - 提交信息格式、类型说明
- [工作流检查](docs/workflow-checks.md) - 强制执行的工作流检查点

### 进阶操作
- [回滚策略](docs/rollback-strategies.md) - 废弃修改、版本回退、历史清理
- [代码审查](docs/code-review.md) - PR 规范、审查清单、合并策略
- [归档提交](docs/archive-commit.md) - 归档时自动触发 Git 提交规范
- [常见问题](docs/troubleshooting.md) - 冲突解决、误操作恢复

## 常用命令速查

```bash
# 创建并切换功能分支
git checkout -b feature/xxx origin/main

# 查看工作区状态
git status

# 提交更改
git add -p  # 逐个确认改动
git commit -m "feat: 添加新功能"

# 推送分支
git push -u origin feature/xxx

# 查看提交历史（图形化）
git log --oneline --graph --decorate
```

## 相关技能

- **skill-evolution**: 技能系统的 Git 管理
- **frontend-dev**: 前端开发工作流
- **backend-dev**: 后端开发工作流

---

**最后更新**: 2026-03-19 (v1.1.0)
**维护者**: 开发团队
