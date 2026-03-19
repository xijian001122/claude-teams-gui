# 回滚策略

## 概述

本文档提供各种场景下的代码回滚和废弃方法。

## 场景速查表

| 场景 | 命令 | 风险 |
|------|------|------|
| 撤销工作区修改 | `git checkout -- .` | 低 |
| 取消暂存 | `git reset HEAD` | 低 |
| 修改最后一次提交 | `git commit --amend` | 中 |
| 撤销本地提交 | `git reset HEAD~1` | 中 |
| 废弃整个分支 | `git branch -D xxx` | 低 |
| 强制回退远程 | `git push --force` | **高** |

## 详细操作

### 1. 撤销工作区修改（未 add）

**场景**: 修改了文件但还没添加到暂存区

```bash
# 撤销特定文件
git checkout -- filename.js

# 撤销所有文件
git checkout -- .

# 确认撤销
git status  # 应该显示 "nothing to commit, working tree clean"
```

**恢复方法**: 如果撤销错了，无法直接恢复（除非有 IDE 本地历史）

### 2. 取消暂存（已 add 未 commit）

**场景**: 文件已添加到暂存区，但还没提交

```bash
# 取消特定文件的暂存
git reset HEAD filename.js

# 取消所有文件的暂存
git reset HEAD

# 确认状态
git status  # 文件回到 "Changes not staged"
```

**恢复方法**: 重新 `git add` 即可

### 3. 修改最后一次提交

**场景**: 刚提交完发现提交信息写错了或漏了文件

```bash
# 修改提交信息
git commit --amend -m "feat: 正确的提交信息"

# 添加漏掉的文件到最后一次提交
git add forgotten.js
git commit --amend --no-edit
```

**注意事项**:
- 如果已推送到远程，修改后需要强制推送 `git push --force-with-lease`
- 强制推送会影响其他协作者

### 4. 撤销本地提交（保留修改）

**场景**: 提交了代码但想重新组织提交

```bash
# 撤销最后一次提交，修改保留在工作区
git reset HEAD~1

# 撤销最近 3 次提交
git reset HEAD~3

# 然后重新 add 和 commit
git add -p
git commit -m "feat: 重新组织的提交"
```

### 5. 撤销本地提交（丢弃修改）

**⚠️ 危险操作，会丢失代码**

```bash
# 彻底丢弃最后一次提交和修改
git reset --hard HEAD~1

# 丢弃最近 3 次提交
git reset --hard HEAD~3
```

**恢复方法**（如果知道 commit hash）:
```bash
git reflog  # 查找之前的 commit hash
git reset --hard <commit-hash>
```

### 6. 废弃整个功能分支

**场景**: 功能开发到一半，决定放弃

```bash
# 1. 切换回 main
git checkout main

# 2. 删除本地分支
git branch -D feature/abandoned

# 3. 删除远程分支（如果已推送）
git push origin --delete feature/abandoned
```

**保留历史但标记废弃**:
```bash
# 打标签保留历史
git tag abandoned/feature-xxx feature/abandoned
git push origin abandoned/feature-xxx

# 然后删除分支
git branch -D feature/abandoned
```

### 7. 撤销已推送的提交

**场景**: 代码已推送到远程，需要撤销

**方案 A：使用 revert（推荐）**
```bash
# 创建一个新的提交来撤销指定提交
git revert <commit-hash>
git push origin main
```

**方案 B：使用 reset + force push（危险！）**
```bash
# 本地回退
git reset --hard HEAD~1

# 强制推送（会覆盖远程历史！）
git push --force-with-lease origin main
```

**⚠️ 警告**: 强制推送会丢失远程的提交，影响其他协作者

## 高级技巧

### 使用 reflog 恢复

Git 会记录所有操作历史，即使 reset --hard 也能恢复：

```bash
# 查看所有操作历史
git reflog

# 找到操作前的 commit hash
git reset --hard <commit-hash>
```

### 使用 stash 临时保存

不确定是否要保留的修改：

```bash
# 暂存所有修改（包括未跟踪文件）
git stash push -u -m "实验性修改"

# 查看 stash 列表
git stash list

# 恢复特定 stash
git stash pop stash@{0}

# 删除特定 stash
git stash drop stash@{0}
```

### 选择性撤销

只撤销某个文件的某个提交：

```bash
# 撤销特定提交对特定文件的修改
git checkout <commit-hash>^ -- filename.js

# 这会创建一个新的修改，需要 add 和 commit
git add filename.js
git commit -m "revert: 撤销对 filename.js 的修改"
```

## 预防措施

1. **定期推送**: 将代码推送到远程，作为备份
2. **使用分支**: 不确定的修改在分支上进行
3. **频繁提交**: 小步提交，容易回滚到某个点
4. **打标签**: 重要节点打标签，方便回退
5. **使用 reflog**: 记住 `git reflog` 可以救命

## 常见问题

### Q: 误删了分支怎么办？

```bash
# 使用 reflog 查找分支的最后一个 commit
git reflog | grep "branch-name"

# 基于该 commit 重建分支
git checkout -b branch-name <commit-hash>
```

### Q: 误用了 reset --hard 怎么办？

```bash
# 立即使用 reflog
git reflog

# 找到 reset 前的 commit hash
git reset --hard <commit-hash>
```

### Q: 如何撤销 merge？

```bash
# 如果是 fast-forward merge，用 reset
# 如果是非 fast-forward，用 revert
git revert -m 1 <merge-commit-hash>
```

## 相关文档

- [分支策略](branch-strategy.md)
- [工作流检查](workflow-checks.md)
- [提交规范](commit-convention.md)
