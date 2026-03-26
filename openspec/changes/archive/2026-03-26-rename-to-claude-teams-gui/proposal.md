## Why

当前项目名为 `claude-chat`，但项目的实际功能是管理 Claude Code Teams 的消息界面，更名为 `claude-teams-gui` 能更准确反映项目用途，便于用户和贡献者理解项目定位。

## What Changes

- 项目根目录重命名：`claude-chat` → `claude-teams-gui`
- `package.json` 中的 `name` 字段更新
- `package.json` 中的 `bin.claude-chat` 更新为 `bin.claude-teams-gui`
- 所有文档中的项目名称引用更新
- GitHub 仓库重命名（如果适用）
- npm 全局安装命令更新
- 所有内部路径和配置中的引用更新

## Capabilities

### New Capabilities

- 无（新名称不涉及新功能）

### Modified Capabilities

- 无（仅为名称变更，不影响功能规格）

## Impact

- `package.json`: name, bin 字段
- `README.md`, `README-zh_CN.md`: 项目名称引用
- `docs/`: 文档中的名称引用
- GitHub 仓库设置（需手动在 GitHub 操作）
- npm 包名称（发布时需要）
- 用户安装命令变更：`npm install -g claude-chat` → `npm install -g claude-teams-gui`
