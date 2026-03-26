## Why

项目当前只能手动配置和用户需要手动将项目克隆到本地才能使用 hooks 功能。通过支持 Claude 插件规范，用户可以直接使用 `claude plugin install github:xijian001122/claude-teams-gui` 一键安装，获得自动启动 GUI 服务、实时任务通知等 hook 功能。

## What Changes

- 创建符合 Claude 插件规范的目录结构
- 添加 `.claude-plugin/plugin.json` 插件元信息文件
- 重构 `hooks/hooks.json` 为标准 Claude hook 格式
- 添加 hook 脚本支持 `${CLAUDE_PLUGIN_ROOT}` 环境变量
- 创建 README 文档说明插件安装方法

## Capabilities

### New Capabilities

- `claude-plugin-integration`: Claude 插件集成规范
  - 标准目录结构
  - 插件元信息格式
  - Hook 配置格式

### Modified Capabilities

- 无（新增功能，不修改现有规格）

## Impact

- 新增 `.claude-plugin/` 目录
- 修改 `hooks/hooks.json` 格式
- 更新 `README.md` 添加插件安装说明
- 无代码逻辑变更，仅结构调整
