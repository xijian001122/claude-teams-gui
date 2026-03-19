---
name: git-workflow
description: Git 工作流规范 - 分支管理、提交规范、版本控制和代码审查流程
---

# Git 工作流规范

**作用**: 规范本项目的 Git 使用流程，确保代码变更可追溯、可回滚、可审查

**触发关键词**: git、分支、提交、commit、PR、合并、回滚、历史

## 核心规范速查

| 规范 | 说明 | 详细文档 |
|------|------|---------|
| 分支策略 | 主分支保护、功能分支开发 | [docs/branch-strategy.md](docs/branch-strategy.md) |
| 提交规范 | Conventional Commits 标准 | [docs/commit-convention.md](docs/commit-convention.md) |
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
