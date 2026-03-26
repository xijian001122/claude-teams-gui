# Git 工作流快速参考

本文档提供常用 Git 命令模板和速查表。

## 分支操作模板

### 1. 开始新功能

```bash
# 1. 确保本地 main 最新
git checkout main
git pull origin main

# 2. 创建功能分支
git checkout -b feature/description

# 3. 开始开发...
```

👉 [详细说明](docs/branch-strategy.md)

### 2. 开始 Bug 修复

```bash
# 1. 基于 main 创建修复分支
git checkout main
git pull origin main
git checkout -b fix/bug-description

# 2. 修复 Bug...
```

### 3. 紧急热修复

```bash
# 1. 基于 main 创建热修复分支
git checkout main
git pull origin main
git checkout -b hotfix/critical-fix

# 2. 修复并立即合并
```

## 提交信息模板

### 格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 常用类型

```bash
feat:     新功能
fix:      Bug 修复
docs:     文档更新
style:    代码格式（不影响功能）
refactor: 重构（既不修复 bug 也不添加功能）
perf:     性能优化
test:     测试相关
chore:    构建过程或辅助工具的变动
```

### 示例

```bash
# 新功能
git commit -m "feat(auth): 添加用户登录功能

实现 JWT 认证流程，包括：
- 登录接口
- Token 生成
- 过期处理

Closes #123"

# Bug 修复
git commit -m "fix(api): 修复空指针异常

当用户未登录时访问 /api/user 会抛出 NPE，
现已添加空值检查。

Fixes #456"

# 文档更新
git commit -m "docs(readme): 更新安装说明"
```

👉 [详细说明](docs/commit-convention.md)

## 回滚操作模板

### 1. 撤销工作区修改（未 add）

```bash
# 撤销特定文件
git checkout -- filename

# 撤销所有修改
git checkout -- .
```

### 2. 撤销暂存区修改（已 add 未 commit）

```bash
# 取消暂存特定文件
git reset HEAD filename

# 取消暂存所有文件
git reset HEAD
```

### 3. 撤销最后一次提交（保留修改）

```bash
# 撤销 commit，但保留修改到工作区
git reset --soft HEAD~1

# 撤销 commit，保留修改到暂存区
git reset --mixed HEAD~1

# 彻底丢弃最后一次提交和修改（危险！）
git reset --hard HEAD~1
```

### 4. 修改最后一次提交

```bash
# 修改提交信息
git commit --amend -m "新的提交信息"

# 添加遗漏的文件到最后一次提交
git add forgotten-file
git commit --amend --no-edit
```

### 5. 废弃整个功能分支

```bash
# 切换回 main
git checkout main

# 删除本地分支
git branch -D feature/abandoned

# 删除远程分支（如果已推送）
git push origin --delete feature/abandoned
```

👉 [详细说明](docs/rollback-strategies.md)

## 常用命令速查表

| 命令 | 说明 |
|------|------|
| `git status` | 查看工作区状态 |
| `git log --oneline -10` | 简洁显示最近 10 条提交 |
| `git log --graph --decorate` | 图形化显示分支历史 |
| `git diff` | 查看未暂存的修改 |
| `git diff --cached` | 查看已暂存的修改 |
| `git add -p` | 逐个确认修改 |
| `git stash` | 临时保存修改 |
| `git stash pop` | 恢复暂存的修改 |
| `git branch -a` | 列出所有分支 |
| `git remote -v` | 查看远程仓库 |

## 工作流检查清单（快速版）

```bash
# 提交前自问：
# 1. 这个修改解决什么问题？
# 2. 提交信息是否清晰描述了变更？
# 3. 是否有不应该提交的临时文件？
# 4. 测试是否通过？

# PR 前检查：
# 1. 分支是否基于最新的 main？
# 2. 是否有合并冲突？
# 3. 代码是否自测通过？
# 4. PR 描述是否完整？
```

👉 [详细说明](docs/workflow-checks.md)

## 版本管理模板

### 版本递增

```bash
# 确保在 main 分支
git checkout main
git pull origin main

# 运行 standard-version（自动更新版本号和 CHANGELOG）
npm run release

# 推送代码和 tag
git push --follow-tags origin main
```

### 版本号规则

| 提交类型 | 版本递增 | 示例 |
|---------|---------|------|
| `feat:` | minor | 0.1.0 → 0.2.0 |
| `fix:` | patch | 0.1.0 → 0.1.1 |
| `BREAKING CHANGE:` | major | 0.1.0 → 1.0.0 |

## Release 发布模板

### 创建 Release

```bash
# 方式一：gh CLI（推荐）
gh release create v0.1.0 --title "v0.1.0" --generate-notes

# 方式二：编辑添加双语说明
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

### gh CLI 安装和登录

```bash
# 安装 gh
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | \
  dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] \
  https://cli.github.com/packages stable main" | \
  tee /etc/apt/sources.list.d/github-cli-packages > /dev/null
apt update && apt install gh

# 登录
gh auth login
```

## 相关文档

- [分支策略](docs/branch-strategy.md)
- [提交规范](docs/commit-convention.md)
- [回滚策略](docs/rollback-strategies.md)
- [代码审查](docs/code-review.md)
- [常见问题](docs/troubleshooting.md)
