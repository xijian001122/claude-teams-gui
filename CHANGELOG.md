# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.3.28](https://github.com/xijian001122/claude-teams-gui/compare/v0.3.27...v0.3.28) (2026-03-28)


### Bug Fixes

* **发送消息到新成员**: 当成员的 inbox 文件不存在时自动创建，确保消息能正确发送

### [0.3.27](https://github.com/xijian001122/claude-teams-gui/compare/v0.3.26...v0.3.27) (2026-03-28)


### Bug Fixes

* **成员更新广播**: 修复成员更新广播条件，比较数据库中的成员数量而非 config 中的数量

### [0.3.26](https://github.com/xijian001122/claude-teams-gui/compare/v0.3.25...v0.3.26) (2026-03-28)


### Features

* **成员发现**: 自动从 inboxes 目录发现新成员
* **成员更新广播**: 当发现新成员时广播 `members_updated` WebSocket 事件

### [0.3.25](https://github.com/xijian001122/claude-teams-gui/compare/v0.3.24...v0.3.25) (2026-03-28)


### Bug Fixes

* **FileWatcher**: 新团队 inboxes 目录不存在时监听团队目录等待创建
* **config.json 解析**: 移除 BOM 字符防止 JSON 解析失败

### [0.3.24](https://github.com/xijian001122/claude-teams-gui/compare/v0.3.23...v0.3.24) (2026-03-28)


### Bug Fixes

* **config.json 解析**: 添加错误处理防止损坏的配置文件导致服务崩溃
* 添加调试日志输出 config 路径

### [0.3.23](https://github.com/xijian001122/claude-teams-gui/compare/v0.3.22...v0.3.23) (2026-03-28)


### Bug Fixes

* **FileWatcher 路径解析**: 使用 `path.basename()` 替代 `split('/')` 修复 Windows 消息同步问题

### [0.3.22](https://github.com/xijian001122/claude-teams-gui/compare/v0.3.20...v0.3.22) (2026-03-28)


### Bug Fixes

* **schema.sql 路径**: 修复 TypeScript 编译后 schema.sql 路径不匹配问题

### [0.3.20](https://github.com/xijian001122/claude-teams-gui/compare/v0.3.19...v0.3.20) (2026-03-28)


### Bug Fixes

* **构建脚本**: 添加 schema.sql 复制到 dist 目录

### [0.3.19](https://github.com/xijian001122/claude-teams-gui/compare/v0.3.17...v0.3.19) (2026-03-28)


### Bug Fixes

* **Windows 路径解析**: 使用 `path.basename()` 替代 `split('/')` 修复 Windows 兼容性
* **时区显示**: `/health` 端点返回本地时间
* **数据库初始化**: 添加 `ensureReady()` 检查防止未初始化访问
* **静默崩溃**: 添加全局错误处理器
* **FileWatcher**: 改进 `addDir` 错误处理和延迟
* **消息同步**: 删除错误的 `msg.from === 'user'` 过滤逻辑
* **team_added 事件**: 添加 WebSocket 事件处理

### [0.3.17](https://github.com/xijian001122/claude-teams-gui/compare/v0.3.15...v0.3.17) (2026-03-27)


### Bug Fixes

* 默认监听 0.0.0.0 支持 WSL/远程访问 ([e162f9e](https://github.com/xijian001122/claude-teams-gui/commit/e162f9e97026445ca6bb48dd606d50f5d10f5e84))

### [0.3.16](https://github.com/xijian001122/claude-teams-gui/compare/v0.3.15...v0.3.16) (2026-03-27)

### [0.3.15](https://github.com/xijian001122/claude-teams-gui/compare/v0.3.9...v0.3.15) (2026-03-27)


### Features

* 添加详细耗时日志用于排查性能问题 ([d4ee20d](https://github.com/xijian001122/claude-teams-gui/commit/d4ee20d097579f18a3027a326dced86564334f41))
* 添加钩子调试信息显示在 Claude 界面 ([8e70c1d](https://github.com/xijian001122/claude-teams-gui/commit/8e70c1dd9d27149e345aa6cdc2d99e306b73a67b))


### Bug Fixes

* 修复 smart-install.js dist 路径检查和优化 Bun 检测 ([80dbfa6](https://github.com/xijian001122/claude-teams-gui/commit/80dbfa684c1cdcc19c777cb3c0e44b27766420b8))
* 在 npm pack 前生成 .install-version 文件 ([fc7eaf5](https://github.com/xijian001122/claude-teams-gui/commit/fc7eaf58a04b16733f7f545e4163dc4d2011e3d9))

### [0.3.14](https://github.com/xijian001122/claude-teams-gui/compare/v0.3.9...v0.3.14) (2026-03-27)


### Features

* 添加详细耗时日志用于排查性能问题 ([d4ee20d](https://github.com/xijian001122/claude-teams-gui/commit/d4ee20d097579f18a3027a326dced86564334f41))
* 添加钩子调试信息显示在 Claude 界面 ([8e70c1d](https://github.com/xijian001122/claude-teams-gui/commit/8e70c1dd9d27149e345aa6cdc2d99e306b73a67b))


### Bug Fixes

* 修复 smart-install.js dist 路径检查和优化 Bun 检测 ([80dbfa6](https://github.com/xijian001122/claude-teams-gui/commit/80dbfa684c1cdcc19c777cb3c0e44b27766420b8))

### [0.3.13](https://github.com/xijian001122/claude-teams-gui/compare/v0.3.9...v0.3.13) (2026-03-27)


### Features

* 添加钩子调试信息显示在 Claude 界面 ([8e70c1d](https://github.com/xijian001122/claude-teams-gui/commit/8e70c1dd9d27149e345aa6cdc2d99e306b73a67b))


### Bug Fixes

* 修复 smart-install.js dist 路径检查和优化 Bun 检测 ([80dbfa6](https://github.com/xijian001122/claude-teams-gui/commit/80dbfa684c1cdcc19c777cb3c0e44b27766420b8))

### [0.3.12](https://github.com/xijian001122/claude-teams-gui/compare/v0.3.9...v0.3.12) (2026-03-27)


### Bug Fixes

* 修复 smart-install.js dist 路径检查和优化 Bun 检测 ([80dbfa6](https://github.com/xijian001122/claude-teams-gui/commit/80dbfa684c1cdcc19c777cb3c0e44b27766420b8))

### [0.3.11](https://github.com/xijian001122/claude-teams-gui/compare/v0.3.9...v0.3.11) (2026-03-27)


### Bug Fixes

* 修复 smart-install.js dist 路径检查和优化 Bun 检测 ([80dbfa6](https://github.com/xijian001122/claude-teams-gui/commit/80dbfa684c1cdcc19c777cb3c0e44b27766420b8))

### [0.3.10](https://github.com/xijian001122/claude-teams-gui/compare/v0.3.9...v0.3.10) (2026-03-27)


### Bug Fixes

* 修复 smart-install.js dist 路径检查和优化 Bun 检测 ([80dbfa6](https://github.com/xijian001122/claude-teams-gui/commit/80dbfa684c1cdcc19c777cb3c0e44b27766420b8))

### [0.1.5](https://github.com/xijian001122/claude-teams-gui/compare/v0.1.4...v0.1.5) (2026-03-27)


### Bug Fixes

* 将脚本转换为 ES 模块语法 ([92b5eaf](https://github.com/xijian001122/claude-teams-gui/commit/92b5eaf198f42155feaed6232abe3c1538ef6299))
* 更新 marketplace 指向 GitHub URL ([eee9e70](https://github.com/xijian001122/claude-teams-gui/commit/eee9e701ffac0ceb2a073175a98062904f754b72))
* 添加 type: module 到 package.json ([a3b689b](https://github.com/xijian001122/claude-teams-gui/commit/a3b689b231b351bd09ddb70c6813f817717fdc23))

### [0.1.4](https://github.com/xijian001122/claude-teams-gui/compare/v0.1.3...v0.1.4) (2026-03-27)


### Features

* 实现插件自启动功能 ([518d3c8](https://github.com/xijian001122/claude-teams-gui/commit/518d3c8672c44235f593b902ed2336d350245b30))

### [0.1.3](https://github.com/xijian001122/claude-teams-gui/compare/v0.1.2...v0.1.3) (2026-03-26)


### Features

* 添加 Claude Code 插件 marketplace 支持 ([1c27978](https://github.com/xijian001122/claude-teams-gui/commit/1c27978e8517608156779cac2806c65d88cf7754))

### [0.1.2](https://github.com/xijian001122/claude-teams-gui/compare/v0.1.1...v0.1.2) (2026-03-26)


### Features

* 添加 Claude 插件支持 ([b61ff9f](https://github.com/xijian001122/claude-teams-gui/commit/b61ff9f20c39024084dff8860b056cd1da7cef84))

### [0.1.1](https://github.com/xijian001122/claude-teams-gui/compare/v0.1.0...v0.1.1) (2026-03-26)


### Features

* 项目重命名为 claude-teams-gui 并添加双语 README ([87c4464](https://github.com/xijian001122/claude-teams-gui/commit/87c4464259d96048fa3af4f8eebdeadbb710d120))

## 0.1.0 (2026-03-26)


### Features

* **websocket:** 添加 team_added 实时广播功能 ([1003a64](https://github.com/xijian001122/claude-teams-gui/commit/1003a643e3fea4ef27745b5e3aa0b978f100bf58))
* 增加未提交的 ([77cf436](https://github.com/xijian001122/claude-teams-gui/commit/77cf4369b9f27b0a55e9921412e74240c2a4ef21))
* 实现 task-created-hook 和 structured-logging 功能 ([7599074](https://github.com/xijian001122/claude-teams-gui/commit/7599074194e7fd36fd9347336334052ed42b0e31))
* 实现结构化日志系统 ([5623056](https://github.com/xijian001122/claude-teams-gui/commit/5623056fcd21f858e371e856cdad1bdbf1dfd8a5))


### Bug Fixes

* 修复消息 teamInstance 和权限状态持久化问题 ([5297e4d](https://github.com/xijian001122/claude-teams-gui/commit/5297e4d9cd13aa765c3dc128113df85fde53ad15))

## [0.1.0] - 2026-03-26

### Added
- Claude Agent GUI 核心功能
- WebSocket 实时通信
- SQLite 数据库消息存储
- Claude Teams 文件系统同步
- 消息清理定时任务
