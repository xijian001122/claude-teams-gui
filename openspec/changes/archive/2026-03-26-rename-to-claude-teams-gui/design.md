## Context

项目重命名是简单的文本替换，但涉及多个文件和配置。项目当前名称 `claude-chat` 需要统一变更为 `claude-teams-gui`。

## Goals / Non-Goals

**Goals:**
- 所有文件和配置中的项目名称一致
- 不影响功能，只影响名称
- 便于用户和贡献者理解项目

**Non-Goals:**
- 不修改代码逻辑
- 不迁移数据
- GitHub 仓库重命名（需手动在 GitHub UI 操作）

## Decisions

### 替换范围

**决定**: 全面替换，确保一致性

需要替换的位置：
1. `package.json` - name, bin 字段
2. `README.md`, `README-zh_CN.md` - 标题和正文
3. `docs/` - 各文档中的引用
4. 根目录文件夹名称（需单独处理）

### 目录重命名

**决定**: 暂不重命名根目录，仅修改文件内容

**理由**:
- 根目录重命名会导致当前工作目录失效
- 用户 clone 后目录名由 GitHub 仓库决定
- 文件内容中的名称更为重要

## Risks / Trade-Offs

- [Risk] 遗漏某些文件中的旧名称
  - **Mitigation**: 使用 grep 全面搜索验证
- [Risk] 已安装 npm 包的用户需要重新安装
  - **Mitigation**: 在 CHANGELOG 和 Release Notes 中说明

## Migration Plan

1. 修改所有文件中的项目名称
2. 使用 grep 验证无遗漏
3. 提交更改
4. GitHub 上重命名仓库
5. 发布新版本 `npm run release`
6. 通知用户更新安装命令
