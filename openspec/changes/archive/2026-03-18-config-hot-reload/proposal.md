## Why

当前配置系统存在两个主要问题：
1. **Web 修改不持久化**：通过 `/api/settings` 修改的配置只保存在内存中，服务重启后丢失
2. **手动修改文件不生效**：直接编辑 `config.json` 后，需要手动重启服务才能生效，无法热加载

这导致用户无法灵活地管理配置，影响了开发和使用体验。

## What Changes

- **新增 ConfigService**：统一管理配置的读取、写入和热加载
- **文件监听**：使用 chokidar 监听 `config.json` 文件变化，自动加载新配置
- **双向同步**：Web API 修改配置后自动写回文件，保持一致性
- **WebSocket 通知**：配置变更时通过 WebSocket 推送给所有客户端
- **前端 UI 更新**：
  - 侧边栏设置标签显示"需重启"红点徽章
  - 设置页面顶部显示变更提示条
  - 需重启的配置项旁显示 `(需重启)` 标签
  - 变更确认弹窗显示配置对比

## Capabilities

### New Capabilities

- `config-hot-reload`: 配置热加载能力 - 支持配置文件的实时监听、双向同步和 WebSocket 通知

### Modified Capabilities

- `settings-api`: 扩展现有设置 API，支持配置持久化和重启状态查询

## Impact

**后端影响**：
- 新增 `src/server/services/config.ts` - ConfigService
- 修改 `src/server/server.ts` - 集成 ConfigService
- 修改 `src/server/routes/settings.ts` - 持久化保存配置
- 扩展 WebSocket 协议 - 新增 `config_updated` 事件

**前端影响**：
- 修改侧边栏组件 - 添加重启指示器徽章
- 新增/修改设置页面 - 配置表单、提示条、变更弹窗
- 新增 WebSocket 事件处理 - 监听配置变更

**配置项分类**：
- 需重启生效：`port`, `host`, `dataDir`, `teamsPath`
- 立即生效：`retentionDays`, `theme`, `desktopNotifications`, `soundEnabled`, `cleanupEnabled`, `cleanupTime`
