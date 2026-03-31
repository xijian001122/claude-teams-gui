# 模块命名规范

## Module 命名

Module 是日志的功能区标识，使用 **PascalCase** 命名。

### 命名规则

1. **使用功能名称**，而非文件名
2. **简短有意义**，2-3 个单词
3. **保持一致性**，同类型模块使用相同后缀

### 命名示例

| 文件 | Module | 说明 |
|------|--------|------|
| `server.ts` | `Server` | 主服务 |
| `cli.ts` | `CLI` | 命令行 |
| `services/data-sync.ts` | `DataSync` | 数据同步服务 |
| `services/file-watcher.ts` | `FileWatcher` | 文件监控服务 |
| `services/cleanup.ts` | `Cleanup` | 清理服务 |
| `services/config.ts` | `ConfigService` | 配置服务 |
| `db/index.ts` | `Database` | 数据库 |
| `routes/teams.ts` | `TeamsRoute` | 团队路由 |
| `routes/messages.ts` | `MessagesRoute` | 消息路由 |

### 常用后缀

| 后缀 | 使用场景 |
|------|---------|
| `Service` | 服务层（可选） |
| `Route` | 路由层 |
| `Factory` | 工厂类 |
| `Manager` | 管理类 |

## Shorthand 命名

Shorthand 是文件路径的缩写，用于快速定位代码位置。

### 缩写规则

| 路径前缀 | 缩写 | 示例 |
|---------|------|------|
| `server/` | `s.` | `s.server` |
| `server/services/` | `s.s.` | `s.s.data-sync` |
| `server/routes/` | `s.r.` | `s.r.teams` |
| `server/db/` | `s.` | `s.db` |
| `client/` | `c.` | `c.app` |
| `shared/` | `sh.` | `sh.types` |

### 文件名转换

1. **移除扩展名**：`.ts` → 无
2. **转为 kebab-case**：`dataSync` → `data-sync`
3. **拼接缩写**：`s.s.` + `data-sync` = `s.s.data-sync`

### 完整对照表

| 文件路径 | Module | Shorthand |
|---------|--------|-----------|
| `server.ts` | `Server` | `s.server` |
| `cli.ts` | `CLI` | `s.cli` |
| `services/data-sync.ts` | `DataSync` | `s.s.data-sync` |
| `services/file-watcher.ts` | `FileWatcher` | `s.s.file-watcher` |
| `services/cleanup.ts` | `Cleanup` | `s.s.cleanup` |
| `services/config.ts` | `ConfigService` | `s.s.config` |
| `services/task-storage.ts` | `TaskStorage` | `s.s.task-storage` |
| `services/member-status.ts` | `MemberStatus` | `s.s.member-status` |
| `db/index.ts` | `Database` | `s.db` |
| `routes/teams.ts` | `TeamsRoute` | `s.r.teams` |
| `routes/messages.ts` | `MessagesRoute` | `s.r.messages` |
| `routes/hooks.ts` | `HooksRoute` | `s.r.hooks` |
| `routes/settings.ts` | `SettingsRoute` | `s.r.settings` |

## 代码示例

```typescript
// 正确示例
const log = createLogger({
  module: 'DataSync',
  shorthand: 's.s.data-sync'
});

// 错误示例
const log = createLogger({
  module: 'data-sync',      // ❌ 应使用 PascalCase
  shorthand: 'services.data-sync'  // ❌ 应使用缩写
});
```
