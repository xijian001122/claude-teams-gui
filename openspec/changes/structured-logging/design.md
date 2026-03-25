## Context

当前项目有 60+ 处 console.log 分散在 10+ 文件中，无统一日志管理。日志直接输出到 stdout，无法追溯历史，也无法按级别过滤。

## Goals / Non-Goals

**Goals:**
- 统一日志入口，拦截 console.* 输出
- 按级别分流存储（console.log = 全部，info.log = INFO，error.log = ERROR）
- 实现基于大小（10MB）和日期的日志轮转
- 自动清理过期日志（默认 7 天）
- 支持 config.json 和 Web UI 配置
- 提供 `/log-fix` 命令分析错误

**Non-Goals:**
- 不替换 Fastify 自身的日志系统（pino）
- 不支持远程日志推送
- 客户端（浏览器）日志暂不捕获

## Decisions

### 1. 日志拦截方案

**选择：覆盖 console 方法**
```
理由：改动最小，不需要修改所有 console.log 调用点
实现：全局替换 console.log/error/warn/info
```

**替代方案考虑：**
- 中间件拦截 Fastify 日志 → 仅覆盖服务端日志，console.log 仍会输出
- 统一日志库（如 pino）→ 改动较大

### 2. 日志轮转库

**选择：bree 轮转算法（自实现）**
```
理由：
- 避免引入大型依赖
- 轮转逻辑简单：检测文件大小 + 跨日期
- 使用 fs.rename + 序号实现轮转
```

**替代方案考虑：**
- logrotate (Linux 系统工具) → 依赖平台，需要 cron
- log4j-better-sqlite3 → 引入外部依赖

### 3. 日志文件结构

```
~/.claude-chat/logs/
├── console.log      # 当天所有级别
├── info.log         # 当天 INFO
├── error.log        # 当天 ERROR
│
└── 2026-03-23/    # 历史目录
    ├── console-001.log
    ├── console-002.log
    ├── info-001.log
    └── error-001.log
```

### 4. 配置 schema

```typescript
interface LogConfig {
  enabled: boolean;           // 启用日志
  levels: 'error' | 'info' | 'console';  // 输出级别
  maxSize: number;           // MB，默认 10
  maxDays: number;           // 天，默认 7
}
```

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| console 覆盖影响第三方库 | 仅在服务初始化时覆盖，不影响 Worker 进程 |
| 磁盘写满 | maxSize + maxDays 自动清理旧文件 |
| 轮转丢失日志 | 轮转前先 flush，确保写入 |
| Web UI 修改配置生效 | 配置变更触发服务重载 |

## Migration Plan

1. 新增 LoggerService，保留原有 console.log
2. 配置默认关闭，渐进式启用
3. 上线后逐步替换所有 console.* 为 Logger.*
4. 稳定后移除原始 console.log

## Open Questions

1. **日志格式**：每行 JSON 还是纯文本？
2. **启动时清理**：是否在服务启动时清理过期日志？
3. **多实例**：多个 Claude Chat 实例写入同一文件？
