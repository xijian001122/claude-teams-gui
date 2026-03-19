# 工作流检查

## 概述

本文档定义开发过程中的强制检查点，防止跳过关键步骤。

## 核心问题与解决方案

### 问题 1：提案前生成代码

**症状**: 还没创建提案/设计文档就开始写代码

**后果**:
- 代码方向可能偏离需求
- 缺乏设计文档，后续难以维护
- 代码评审困难

**解决方案**:

```bash
# 1. 强制检查：是否有提案文档
# 在写入代码文件前，先检查是否存在以下文件之一：
# - docs/proposals/*.md
# - PRD.md
# - design.md
# - tasks.md

# 2. 检查清单（写代码前必须完成）
- [ ] 需求是否明确？
- [ ] 是否有设计文档？
- [ ] 技术方案是否评审？
```

### 问题 2：修改无法废弃

**症状**: 写了一堆代码后发现方向错了，但已经污染了工作目录

**后果**:
- 难以回滚到干净状态
- 可能误删有用代码
- 历史记录混乱

**解决方案**:

```bash
# 1. 使用分支隔离变更
git checkout -b experiment/xxx

# 2. 定期提交里程碑（即使功能未完成）
git commit -m "WIP: 实验性方案 A"

# 3. 废弃整个实验分支
git checkout main
git branch -D experiment/xxx
```

## 强制检查流程

### 检查点 1：开始工作前

```markdown
## 开始工作前检查清单

- [ ] 从最新 main 分支创建
  ```bash
  git checkout main
  git pull origin main
  git checkout -b feature/xxx
  ```

- [ ] 确认需求文档存在
  - 如果是新功能：是否有 PRD/设计文档？
  - 如果是修复：是否有关联 Issue？

- [ ] 预估工作量和风险
  - 小改动（< 2 小时）：可直接开发
  - 大改动（> 2 小时）：需要技术方案评审
```

### 检查点 2：编写代码时

```markdown
## 代码编写检查清单

- [ ] 是否遵循项目编码规范？
- [ ] 是否添加了必要的注释？
- [ ] 是否包含测试代码？
- [ ] 是否处理了边界情况？

### 每完成一个子功能，提交一次
```bash
git add -p  # 逐个确认改动
git commit -m "feat: 完成子功能 X"
```
```

### 检查点 3：提交前

```markdown
## 提交前最终检查

- [ ] 代码自测通过
  ```bash
  npm run test        # 运行测试
  npm run type-check  # 类型检查
  npm run lint        # 代码检查
  ```

- [ ] 提交信息符合规范
  - 类型正确（feat/fix/docs 等）
  - 描述清晰
  - 关联 Issue（如有）

- [ ] 检查敏感信息
  - 无 API Key、密码等
  - 无调试用的 console.log
  - 无临时文件
```

## 实验性工作流

当需要尝试不确定的方案时：

```bash
# 1. 创建实验分支
git checkout -b experiment/feature-name

# 2. 定期提交（即使代码不完整）
git commit -m "WIP: 尝试方案 A"

# 3. 如果方案可行
git checkout feature/feature-name
git merge experiment/feature-name

# 4. 如果方案废弃
git checkout feature/feature-name
git branch -D experiment/feature-name
```

## 常见场景处理

### 场景 1：写到一半发现方向错了

```bash
# 方案 A：废弃当前工作（未提交）
git checkout -- .           # 撤销所有修改
git clean -fd               # 删除未跟踪文件

# 方案 B：保留部分修改
git add -p                  # 选择性暂存需要的修改
git stash -u                # 暂存其余修改
git checkout -- .           # 丢弃不要的修改
git stash pop               # 恢复暂存的修改
```

### 场景 2：已经提交了才发现问题

```bash
# 方案 A：修改最后一次提交
git commit --amend -m "fix: 修正提交"

# 方案 B：撤销最后一次提交（保留修改）
git reset --soft HEAD~1

# 方案 C：彻底回退（危险！）
git reset --hard HEAD~1
```

### 场景 3：需要保留历史但废弃功能

```bash
# 标记分支为废弃但保留历史
git tag abandoned/feature-xxx
git push origin abandoned/feature-xxx

# 然后删除分支
git branch -D feature-xxx
```

## 最佳实践

1. **小步提交**: 每个提交只做一件事
2. **频繁提交**: 不要等到功能完成才提交
3. **清晰描述**: 提交信息要说明为什么做
4. **分支隔离**: 不确定的方案用分支隔离
5. **及时清理**: 废弃的分支及时删除

## 相关文档

- [分支策略](branch-strategy.md)
- [回滚策略](rollback-strategies.md)
- [提交规范](commit-convention.md)
