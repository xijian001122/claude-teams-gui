# 常见问题

## 概述

本文档汇总 Git 使用中的常见问题和解决方案。

## 合并冲突

### 冲突产生

```bash
# 拉取最新代码时产生冲突
git pull origin main
# Auto-merging file.js
# CONFLICT (content): Merge conflict in file.js
# Automatic merge failed; fix conflicts and commit
```

### 解决步骤

```bash
# 1. 查看冲突文件
git status

# 2. 编辑冲突文件，解决冲突
# 冲突标记格式：
# <<<<<<< HEAD
# 当前分支的内容
# =======
# 合并分支的内容
# >>>>>>> branch-name

# 3. 标记冲突已解决
git add file.js

# 4. 完成合并
git commit -m "merge: 解决合并冲突"
```

### 使用合并工具

```bash
# 配置合并工具
git config --global merge.tool vscode
git config --global mergetool.vscode.cmd "code --wait $MERGED"

# 启动合并工具
git mergetool
```

### 中止合并

```bash
# 如果冲突太复杂，可以中止合并
git merge --abort
```

## 误操作恢复

### 误删文件（未提交）

```bash
# 恢复工作区删除的文件
git checkout -- deleted-file.js
```

### 误删提交

```bash
# 使用 reflog 查找
git reflog

# 恢复到指定提交
git reset --hard <commit-hash>
```

### 误改提交

```bash
# 修改最后一次提交
git commit --amend

# 交互式 rebase 修改历史提交
git rebase -i HEAD~3
```

## 远程操作问题

### 拒绝推送

```bash
# ! [rejected]        main -> main (fetch first)
git pull origin main
# 解决冲突后再次推送
git push origin main
```

### 强制推送警告

```bash
# 使用 --force-with-lease 代替 --force
git push --force-with-lease origin main
```

### 远程分支不存在

```bash
# 获取所有远程分支
git fetch --all

# 查看远程分支
git branch -r
```

## 提交问题

### 提交到错误分支

```bash
# 1. 获取提交的 hash
git log -1

# 2. 切换到正确分支
git checkout correct-branch

# 3. 应用提交
git cherry-pick <commit-hash>

# 4. 删除错误分支的提交
git checkout wrong-branch
git reset --hard HEAD~1
```

### 提交信息错误

```bash
# 修改最后一次提交信息
git commit --amend -m "正确的提交信息"

# 如果是历史提交，使用交互式 rebase
git rebase -i HEAD~3
# 将 pick 改为 reword
```

## 大文件问题

### 意外提交了大文件

```bash
# 使用 BFG Repo-Cleaner
bfg --delete-files large-file.zip

# 或使用 git filter-branch
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch large-file.zip' \
  HEAD
```

### 忽略已跟踪的文件

```bash
# 停止跟踪但保留文件
git rm --cached large-file.zip

# 添加到 .gitignore
echo "large-file.zip" >> .gitignore
git add .gitignore
git commit -m "chore: 停止跟踪大文件"
```

## 性能优化

### 仓库太大

```bash
# 浅克隆（只克隆最近历史）
git clone --depth 1 <repository-url>

# 清理本地仓库
git gc --aggressive --prune=now
```

### 加速操作

```bash
# 启用文件系统缓存
git config --global core.fscache true

# 并行获取子模块
git config --global submodule.fetchJobs 4
```

## 子模块问题

### 更新子模块

```bash
# 初始化并更新子模块
git submodule update --init --recursive

# 拉取子模块更新
git submodule update --remote
```

### 删除子模块

```bash
# 1. 删除子模块引用
git submodule deinit path/to/submodule

# 2. 删除子模块目录
git rm path/to/submodule

# 3. 删除 .gitmodules 中的配置
# 4. 提交更改
```

## 其他问题

### 忽略文件不生效

```bash
# 清除缓存后重新添加
git rm -r --cached .
git add .
git commit -m "chore: 重新应用 .gitignore"
```

### 行尾符问题

```bash
# 统一使用 LF
git config --global core.autocrlf input

# Windows 使用 CRLF
git config --global core.autocrlf true
```

### 权限问题

```bash
# 忽略文件权限变化
git config --global core.filemode false
```

## 获取帮助

```bash
# 查看命令帮助
git help <command>

# 查看详细文档
git <command> --help

# 查看简明帮助
git <command> -h
```

## 相关文档

- [分支策略](branch-strategy.md)
- [回滚策略](rollback-strategies.md)
- [工作流检查](workflow-checks.md)
