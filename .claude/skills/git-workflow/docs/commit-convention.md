# 提交规范

## 概述

本文档定义提交信息的格式规范，遵循 [Conventional Commits](https://www.conventionalcommits.org/) 标准。

## 格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 结构说明

| 部分 | 必需 | 说明 |
|------|------|------|
| type | 是 | 提交类型 |
| scope | 否 | 影响范围 |
| subject | 是 | 简短描述 |
| body | 否 | 详细说明 |
| footer | 否 | 关联 Issue/Breaking Change |

## 提交类型

| 类型 | 说明 | 示例 |
|------|------|------|
| **feat** | 新功能 | `feat(auth): 添加登录功能` |
| **fix** | Bug 修复 | `fix(api): 修复空指针` |
| **docs** | 文档更新 | `docs(readme): 更新安装说明` |
| **style** | 代码格式 | `style: 格式化代码` |
| **refactor** | 重构 | `refactor(service): 优化查询逻辑` |
| **perf** | 性能优化 | `perf(db): 添加索引` |
| **test** | 测试相关 | `test: 添加单元测试` |
| **chore** | 构建/工具 | `chore: 更新依赖` |
| **revert** | 撤销提交 | `revert: 撤销 feat/auth` |

## 示例

### 新功能

```
feat(user): 实现用户注册功能

- 添加注册 API 接口
- 实现邮箱验证
- 添加密码加密

Closes #123
```

### Bug 修复

```
fix(api): 修复空指针异常

当未登录用户访问 /api/user 时会抛出 NPE，
现已添加空值检查。

Fixes #456
```

### 文档更新

```
docs(readme): 更新安装说明

添加 Docker 部署步骤和常见问题解答。
```

### 破坏性变更

```
feat(api): 修改认证接口

BREAKING CHANGE: 认证接口返回格式变更
旧格式: { token: "xxx" }
新格式: { data: { token: "xxx" }, code: 200 }
```

## 规范要点

### Subject 规范

1. 不超过 50 个字符
2. 使用祈使语气（添加、修复、更新）
3. 首字母小写（类型除外）
4. 末尾不加句号

✅ Good:
- `feat: 添加用户搜索功能`
- `fix: 修复登录超时问题`

❌ Bad:
- `feat: Added user search`（英文过去式）
- `fix: fix the bug`（重复）

### Body 规范

1. 详细说明变更原因和实现
2. 每行不超过 72 个字符
3. 使用列表说明多项变更

### Footer 规范

1. **关联 Issue**: `Closes #123`, `Fixes #456`, `Relates to #789`
2. **破坏性变更**: `BREAKING CHANGE: 说明`

## 提交前检查清单

- [ ] 提交类型正确
- [ ] 描述清晰说明做了什么
- [ ] 关联了相关 Issue（如有）
- [ ] 没有拼写错误

## 常用命令

```bash
# 使用特定类型提交
git commit -m "feat: 添加新功能"

# 多行提交信息
git commit -m "feat: 主题" -m "详细说明" -m "Closes #123"

# 修改最后一次提交
git commit --amend -m "fix: 修正提交信息"
```

## 相关文档

- [分支策略](branch-strategy.md)
- [回滚策略](rollback-strategies.md)
