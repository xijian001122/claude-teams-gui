# 分支策略

## 概述

本文档定义本项目的 Git 分支管理策略，确保开发流程规范、代码质量可控。

## 分支类型

### 1. 主分支（main）

**作用**: 生产环境代码，始终保持可发布状态

**保护规则**:
- 禁止直接推送
- 必须通过 PR 合并
- 需要代码审查
- CI 检查必须通过

### 2. 功能分支（feature/*）

**命名格式**: `feature/简短描述`

**使用场景**: 开发新功能

**生命周期**:
```bash
# 1. 从 main 创建
git checkout main
git pull origin main
git checkout -b feature/user-auth

# 2. 开发完成，推送并创建 PR
git push -u origin feature/user-auth
# 在 GitHub/GitLab 创建 PR

# 3. 合并后删除分支
git branch -d feature/user-auth
git push origin --delete feature/user-auth
```

### 3. 修复分支（fix/*）

**命名格式**: `fix/bug-描述` 或 `fix/issue-编号`

**使用场景**: 修复 Bug

**示例**:
- `fix/login-error`
- `fix/issue-123`
- `fix/null-pointer-exception`

### 4. 热修复分支（hotfix/*）

**命名格式**: `hotfix/紧急问题描述`

**使用场景**: 生产环境紧急修复

**特点**:
- 优先级最高
- 简化审查流程
- 修复后立即合并并发布

### 5. 文档分支（docs/*）

**命名格式**: `docs/文档主题`

**使用场景**: 仅修改文档，不涉及代码

**示例**:
- `docs/api-reference`
- `docs/readme-update`

### 6. 重构分支（refactor/*）

**命名格式**: `refactor/重构内容`

**使用场景**: 代码重构，不改变功能

## 工作流程

### 标准开发流程

```
main
 |
 |-- feature/A  --> PR --> Merge
 |
 |-- feature/B  --> PR --> Merge
 |
 |-- fix/C      --> PR --> Merge
```

### 详细步骤

1. **开始开发**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/xxx
   ```

2. **定期同步主分支**
   ```bash
   # 获取最新 main 变更
   git fetch origin main

   # 方式1: rebase（推荐用于功能分支）
   git rebase origin/main

   # 方式2: merge（如果需要保留合并历史）
   git merge origin/main
   ```

3. **提交代码**
   ```bash
   git add .
   git commit -m "feat: 描述"
   git push origin feature/xxx
   ```

4. **创建 PR**
   - 描述清楚变更内容
   - 关联相关 Issue
   - 添加审查者

5. **合并后清理**
   ```bash
   git checkout main
   git pull origin main
   git branch -d feature/xxx
   ```

## 最佳实践

### Do

- ✅ 分支名简洁明了
- ✅ 一个分支只做一个功能/修复
- ✅ 定期同步 main 分支
- ✅ 及时删除已合并分支
- ✅ 写清楚 PR 描述

### Don't

- ❌ 在 main 分支直接开发
- ❌ 一个分支做多件事
- ❌ 长期不合并的功能分支
- ❌ 包含敏感信息的分支名

## 分支命名参考

| 类型 | 示例 |
|------|------|
| 功能 | `feature/user-login`, `feature/api-integration` |
| 修复 | `fix/validation-error`, `fix/memory-leak` |
| 热修复 | `hotfix/security-patch`, `hotfix/critical-bug` |
| 文档 | `docs/readme`, `docs/api-docs` |
| 重构 | `refactor/auth-service`, `refactor/db-layer` |
| 测试 | `test/unit-tests`, `test/e2e-coverage` |

## 相关文档

- [提交规范](commit-convention.md)
- [回滚策略](rollback-strategies.md)
- [代码审查](code-review.md)
