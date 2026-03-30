## ADDED Requirements

### Requirement: Logger 工厂创建模块日志

系统 SHALL 提供 `createLogger(options)` 工厂函数，允许每个模块创建独立 logger。

`options` 参数 SHALL 包含：
- `module`: string - 模块名称，显示在功能区字段 `[module]`
- `shorthand`: string - 模块路径缩写，如 `s.s.data-sync`

#### Scenario: 创建模块 logger
- **WHEN** 调用 `createLogger({ module: 'DataSync', shorthand: 's.s.data-sync' })`
- **THEN** 返回 Pino logger 实例，日志输出包含 `[DataSync]` 和 `s.s.data-sync`

### Requirement: 日志格式为 Logback 风格

系统 SHALL 输出以下格式的日志：
```
YYYY-MM-DD HH:mm:ss [module] LEVEL  shorthand
- 内容
```

#### Scenario: 单行日志
- **WHEN** 调用 `log.info('消息同步完成')`
- **THEN** 输出：
  ```
  2026-03-28 15:56:52 [DataSync] INFO  s.s.data-sync
  - 消息同步完成
  ```

#### Scenario: 多行日志
- **WHEN** 调用 `log.error('连接失败\nError: ECONNREFUSED\nat TCPConnectWrap...')`
- **THEN** 输出：
  ```
  2026-03-28 15:56:52 [DataSync] ERROR  s.s.data-sync
  - 连接失败
  - Error: ECONNREFUSED
  - at TCPConnectWrap...
  ```

### Requirement: 日志文件轮转

系统 SHALL 支持日志文件轮转：
- 按日期轮转：每天创建新文件
- 按大小轮转：超过 `maxSize` MB 时轮转
- 过期清理：超过 `maxDays` 天的日志自动删除

#### Scenario: 日期轮转
- **WHEN** 日期从 2026-03-28 变为 2026-03-29
- **THEN** 旧日志移动到 `~/.claude-chat/logs/2026-03-28/console-001.log`

#### Scenario: 大小轮转
- **WHEN** console.log 超过 maxSize MB
- **THEN** 当前日志轮转到带序号的文件

#### Scenario: 过期清理
- **WHEN** 日志目录超过 maxDays 天
- **THEN** 删除最旧的日志目录

### Requirement: 配置支持

系统 SHALL 支持以下日志配置：
```typescript
interface LogConfig {
  enabled: boolean;      // 是否启用日志
  level: LogLevel;       // 日志级别
  maxSize: number;       // 最大文件大小 (MB)
  maxDays: number;       // 保留天数
}
```

#### Scenario: 禁用日志
- **WHEN** `logConfig.enabled` 为 `false`
- **THEN** 日志仅输出到终端，不写入文件

#### Scenario: 日志级别过滤
- **WHEN** `logConfig.level` 为 `error`
- **THEN** 仅写入 ERROR 级别日志到文件

### Requirement: 多文件输出

系统 SHALL 将日志写入多个文件：
- `console.log` - 所有级别日志
- `info.log` - INFO 级别日志
- `error.log` - ERROR 级别日志

#### Scenario: 错误日志分离
- **WHEN** 调用 `log.error('发生错误')`
- **THEN** 日志同时写入 `console.log` 和 `error.log`
