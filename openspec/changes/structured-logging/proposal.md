## Why

当前项目日志散落在代码各处（60+ 处 console.log），缺乏统一管理。无法按级别分类查看，历史日志难以追溯，出现问题时缺乏系统性日志分析工具。需要建立统一的日志系统，支持分级存储、轮转归档，并通过命令快速诊断错误。

## What Changes

1. **新增日志服务 (LoggerService)**
   - 拦截 console.log/error/warn/info，统一写入文件
   - 按级别分流：console.log → 所有级别，info.log → INFO，error.log → ERROR

2. **日志轮转系统**
   - 当天日志：`~/.claude-chat/logs/{console,info,error}.log`（无后缀）
   - 历史日志：`~/.claude-chat/logs/YYYY-MM-DD/{console,info}-NNN.log`
   - 轮转条件：文件达到 10MB 或跨日期
   - 保留策略：默认 7 天，自动清理过期日志

3. **配置系统扩展**
   - config.json 支持日志配置（level, maxSize, maxDays）
   - Web UI 日志配置面板（实时调整参数）

4. **日志分析命令**
   - `/log-fix` - 分析 error.log，定位问题，提供修复建议

## Capabilities

### New Capabilities

- `structured-logging`: 统一日志服务，实现日志分级、文件分流、轮转策略
- `log-rotation`: 基于大小和日期的日志轮转与清理机制
- `log-analysis`: slash 命令分析日志错误并提供修复指导

### Modified Capabilities

- `config-management`: 扩展配置 schema 支持日志相关配置项

## Impact

- **新增文件**: `src/server/services/logger.ts`
- **修改文件**: `src/server/server.ts`, `src/server/services/index.ts`
- **新增配置**: `config.json` 日志配置节
- **新增依赖**: 可能需要日志轮转库（如 logrotate-next）
- **Web UI**: 新增日志配置面板组件
