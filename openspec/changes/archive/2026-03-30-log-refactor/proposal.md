## Why

当前日志系统使用自定义的 `LoggerService` 拦截 `console.log`，格式简单且缺乏结构化信息。日志难以追踪问题来源、过滤特定模块、或进行日志分析。需要重构为类似 Java Logback 的格式化风格，提供更好的可读性和可维护性。

## What Changes

- **移除** `LoggerService` 的 console 拦截机制
- **新增** 基于 Pino 的日志工厂 `log-factory.ts`
- **新增** 自定义 Transport 实现文件写入和日志轮转
- **统一** 所有后端服务的日志调用方式
- **格式化** 日志输出为 Logback 风格：
  ```
  2026-03-28 15:56:52 [DataSync] INFO  s.s.data-sync
  - 日志内容
  ```

## Capabilities

### New Capabilities

- `structured-logging`: 结构化日志系统，支持模块标识、多行格式化、文件轮转

### Modified Capabilities

- 无（这是内部基础设施变更，不影响外部 API）

## Impact

### 新增文件
- `src/server/services/log-factory.ts` - Logger 工厂
- `src/server/services/log-transport.ts` - 自定义 Transport

### 删除文件
- `src/server/services/logger.ts` - 旧的 LoggerService

### 修改文件 (~12 个)
- `src/server/server.ts` - 主服务入口
- `src/server/cli.ts` - 命令行入口
- `src/server/services/data-sync.ts` - ~30 处 console.log
- `src/server/services/file-watcher.ts` - ~20 处 console.log
- `src/server/services/cleanup.ts` - ~10 处 console.log
- `src/server/services/config.ts` - ~5 处 console.log
- `src/server/services/task-storage.ts` - ~5 处 console.log
- `src/server/services/session-summary.ts` - ~2 处 console.log
- `src/server/db/index.ts` - ~5 处 console.log
- `src/server/routes/*.ts` - ~10 处 console.log

### 依赖
- Pino (已作为 Fastify 依赖安装)
- 无需新增依赖
