# 归档提交规范

## 概述

本文档规范归档操作时的 Git 提交流程，确保每次完成归档后代码都被正确提交到版本控制。

## 核心原则

**每次完成归档时，必须创建 Git 提交保存本次更新的所有文件。**

这确保：
- 归档的变更被永久保存
- 可以追踪功能的历史演进
- 团队成员可以同步最新的归档状态
- 可以回滚到任意归档版本

## 归档提交流程

### 标准流程

```
完成归档
    |
    v
检查变更状态 (git status)
    |
    v
添加变更到暂存区 (git add)
    |
    v
创建提交 (git commit)
    |
    v
推送到远程 (git push)
```

### 详细步骤

#### 步骤 1: 确认归档完成

确保归档操作已完成：
- 所有归档文件已生成
- 归档目录结构正确
- 归档元数据已记录

#### 步骤 2: 检查 Git 状态

```bash
# 查看本次归档产生的实际变更文件
git status

# 预期输出可能包含：
# - 新增的归档文件 (docs/archive/<change-name>/)
# - 修改的变更日志 (CHANGELOG.md)
# - 其他被归档工具修改的文件
```

#### 步骤 3: 暂存变更

**必须添加实际变更的文件，不要使用固定路径：**

```bash
# 正确做法：根据 git status 结果添加实际变更的文件
git add docs/archive/change-name/proposal.md
git add docs/archive/change-name/design.md
git add docs/archive/change-name/tasks.md
git add CHANGELOG.md

# 或者使用 git add -p 逐个确认改动
git add -p

# 错误做法：不要使用固定通配路径
# git add docs/archive/  <- 可能添加未变更的文件
```

#### 步骤 4: 创建提交

**提交信息格式**:

```
archive: <变更名称> - 完成归档

- 添加设计文档归档
- 添加任务执行记录
- 更新变更日志

归档路径: docs/archive/<change-name>/
```

**示例**:

```bash
git commit -m "archive: json-message-beautify - 完成归档

- 添加 proposal.md 设计提案
- 添加 design.md 技术设计
- 添加 tasks.md 任务执行记录
- 更新 CHANGELOG.md

归档路径: docs/archive/json-message-beautify/"
```

#### 步骤 5: 推送到远程

```bash
# 推送当前分支
git push origin $(git branch --show-current)

# 或在主分支上
git push origin main
```

## 提交信息规范

### 类型标识

归档提交必须使用 `archive:` 类型前缀：

```bash
# 正确
git commit -m "archive: feature-name - 完成归档"

# 错误（不要使用 feat/fix 等类型）
git commit -m "feat: 归档完成"
```

### 提交信息模板

```
archive: <change-name> - <简短描述>

<详细说明>

归档路径: <path>
关联变更: <opsx-change-name> (可选)
```

## 自动化脚本

### 归档提交脚本

```bash
#!/bin/bash
# archive-commit.sh - 归档提交辅助脚本

CHANGE_NAME=$1

if [ -z "$CHANGE_NAME" ]; then
    echo "用法: $0 <change-name>"
    exit 1
fi

# 检查是否有变更
if git diff --quiet && git diff --staged --quiet; then
    echo "没有需要提交的变更"
    exit 0
fi

# 显示本次变更
echo "本次归档变更的文件:"
git status --short

# 提示用户确认
echo ""
echo "请确认要提交这些变更 [y/N]:"
read confirm

if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    echo "已取消提交"
    exit 1
fi

# 添加所有变更（根据实际变更）
git add -A

# 创建提交
git commit -m "archive: $CHANGE_NAME - 完成归档

- 归档设计文档和任务记录
- 更新变更日志

归档路径: docs/archive/$CHANGE_NAME/"

echo "归档提交完成: $CHANGE_NAME"
```

使用方式:
```bash
bash scripts/archive-commit.sh json-message-beautify
```

## 检查清单

归档提交前必须完成:

- [ ] 归档操作已完成，文件已生成
- [ ] `git status` 显示本次实际变更的文件
- [ ] 已添加实际变更的文件（不要使用固定路径）
- [ ] 提交信息符合 `archive:` 规范
- [ ] 提交信息包含归档的变更名称
- [ ] 变更已推送到远程仓库

## 常见问题

### Q: 归档后忘记提交怎么办?

```bash
# 1. 检查变更
git status

# 2. 正常提交（即使延迟）
git add <归档文件>
git commit -m "archive: change-name - 完成归档（延迟提交）"
```

### Q: 归档包含敏感信息怎么办?

```bash
# 1. 从暂存区移除敏感文件
git reset HEAD <敏感文件>

# 2. 添加到 .gitignore
echo "<敏感文件>" >> .gitignore

# 3. 提交不包含敏感文件的归档
git add .
git commit -m "archive: change-name - 完成归档"
```

### Q: 需要修改已归档的内容?

```bash
# 1. 修改归档文件
# ...

# 2. 创建修正提交
git add docs/archive/change-name/
git commit -m "archive: change-name - 修正归档内容

- 修正 XXX
- 更新 YYY"
```

## 最佳实践

1. **立即提交**: 归档完成后立即提交，不要延迟
2. **原子提交**: 一个归档对应一个提交
3. **清晰描述**: 提交信息说明归档的内容
4. **包含路径**: 提交信息中注明归档路径
5. **及时推送**: 提交后立即推送到远程

## 与其他流程的集成

### OpenSpec 归档集成

当使用 `opsx:archive` 完成归档时:

```bash
# 1. 执行归档
/opsx:archive change-name

# 2. 提交归档
bash scripts/archive-commit.sh change-name

# 3. 推送
git push origin main
```

### Agent Teams 归档集成

当 Agent Teams 完成变更并归档时:

```bash
# 1. 团队成员通知归档完成
# 2. Team-lead 执行归档提交
# 3. Team-lead 推送并关闭变更
```

## 相关文档

- [分支策略](branch-strategy.md)
- [提交规范](commit-convention.md)
- [工作流检查](workflow-checks.md)
