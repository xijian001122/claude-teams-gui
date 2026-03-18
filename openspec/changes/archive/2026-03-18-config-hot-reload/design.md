## Context

当前配置系统在 `cli.ts` 启动时加载 `~/.claude-chat/config.json`，传递给 `server.ts` 使用。`settingsRoutes` 提供了修改配置的 API，但只更新内存中的对象，不持久化到文件。

```
┌─────────────────────────────────────────────────────────────────┐
│                    当前架构                                      │
├─────────────────────────────────────────────────────────────────┤
│  cli.ts                                                         │
│  └── 启动时读取 config.json → AppConfig (内存)                  │
│       └── 传递给 createServer()                                 │
│            └── settingsRoutes.saveConfig() → 只更新内存          │
│                                                                 │
│  问题: 无文件监听，无持久化，无法热加载                           │
└─────────────────────────────────────────────────────────────────┘
```

## Goals / Non-Goals

**Goals:**
- 配置文件修改后自动检测并热加载
- Web API 修改配置后自动持久化到文件
- 通过 WebSocket 通知客户端配置变更
- 前端显示配置变更状态和重启提示
- 区分需要重启和立即生效的配置项

**Non-Goals:**
- 自动重启服务（需要用户手动确认）
- 配置版本控制或回滚
- 多实例配置同步（超出单实例范围）

## Decisions

### 1. ConfigService 架构

**决定**: 创建独立的 `ConfigService` 类管理配置生命周期

```
┌─────────────────────────────────────────────────────────────────┐
│                    ConfigService 架构                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────────┐      ┌─────────────────────────────────┐  │
│   │  chokidar       │      │  内存 config 对象               │  │
│   │  文件监听器      │─────▶│  + pendingRestart: boolean      │  │
│   │                 │      │  + lastModified: timestamp       │  │
│   └─────────────────┘      └─────────────────────────────────┘  │
│           │                            │                        │
│           │ 文件变化                    │ API 修改               │
│           ▼                            ▼                        │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                    配置处理逻辑                          │   │
│   │                                                         │   │
│   │   1. 验证配置格式                                        │   │
│   │   2. 检测哪些字段变化                                    │   │
│   │   3. 判断是否需要重启                                    │   │
│   │   4. 写回文件 (如果来源是 API)                          │   │
│   │   5. 通知依赖服务 (cleanup)                             │   │
│   │   6. WebSocket 广播                                     │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**替代方案**:
- 在现有 `settingsRoutes` 中添加文件操作 ❌ 职责不清晰
- 使用全局配置对象 ❌ 难以管理生命周期和监听

### 2. 配置分类策略

**决定**: 定义两组配置，区分重启需求

```typescript
const RESTART_REQUIRED_KEYS = ['port', 'host', 'dataDir', 'teamsPath'] as const;
const HOT_RELOAD_KEYS = ['retentionDays', 'theme', 'desktopNotifications',
                         'soundEnabled', 'cleanupEnabled', 'cleanupTime'] as const;
```

**理由**: 端口、主机、路径等配置在服务启动后无法动态更改，而主题、通知等可以立即生效。

### 3. 文件写入策略

**决定**: 使用防抖写入（300ms delay）

```typescript
private writeDebounced = debounce(() => {
  writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
}, 300);
```

**理由**: 避免短时间内多次 API 调用导致频繁写入磁盘。

### 4. WebSocket 事件设计

**决定**: 新增 `config_updated` 事件

```typescript
interface ConfigUpdatedEvent {
  type: 'config_updated';
  changes: {
    key: string;
    oldValue: any;
    newValue: any;
    requiresRestart: boolean;
  }[];
  pendingRestart: boolean;
}
```

### 5. 前端状态管理

**决定**: 在 App 组件中维护 `pendingConfigRestart` 状态

```typescript
// app.tsx
const [pendingConfigRestart, setPendingConfigRestart] = useState(false);

// WebSocket 处理
case 'config_updated':
  setPendingConfigRestart(data.pendingRestart);
  // 如果有需要重启的变更，显示提示
```

## Risks / Trade-offs

### 风险 1: 文件写入冲突
**场景**: 同时通过 API 和手动编辑修改配置
**缓解**: 使用 `lastModified` 时间戳，文件加载时检查是否比内存新

### 风险 2: 配置文件损坏
**场景**: 手动编辑导致 JSON 格式错误
**缓解**: 加载时 try-catch，解析失败时使用默认配置并记录警告日志

### 风险 3: 服务重启丢失未保存的内存状态
**场景**: 用户修改了需要重启的配置但未重启，服务意外停止
**缓解**: 配置已写入文件，重启后会加载新配置

## Migration Plan

1. **Phase 1**: 创建 ConfigService，集成到 server.ts
2. **Phase 2**: 修改 settingsRoutes 使用 ConfigService
3. **Phase 3**: 添加 WebSocket 事件和前端处理
4. **Phase 4**: 完善前端 UI（指示器、提示条、弹窗）

无需数据迁移，向后兼容现有配置文件格式。

## Open Questions

1. **重启 API 设计**: 是否需要 `POST /api/settings/restart` 端点？还是只在前端提示用户手动重启？
   - 当前决定: 先只做提示，重启 API 后续迭代

2. **多配置源优先级**: 命令行参数 vs 配置文件的优先级如何处理？
   - 当前决定: 命令行参数优先，热加载时忽略这些字段的变更
