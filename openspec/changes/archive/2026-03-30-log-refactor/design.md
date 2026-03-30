## Context

当前使用自定义 `LoggerService` 拦截 `console.log`，格式简单：
```
[2026-03-28T07:30:52.123Z] [INFO] [DataSync] 消息同步完成
```

目标格式（Logback 风格）：
```
2026-03-28 15:56:52 [DataSync] INFO  s.s.data-sync
- 消息同步完成
```

**约束**：
- 使用 Pino（Fastify 已依赖）
- 保持现有文件轮转逻辑
- 兼容现有 `logConfig` 配置

## Goals / Non-Goals

**Goals:**
- 实现 Logback 风格的结构化日志格式
- 每个模块使用独立 logger（带 module/shorthand 标识）
- 多行内容自动换行，每行加 `- ` 前缀
- 保持日志轮转（按日期/大小）
- 兼容现有 `logConfig` 配置结构

**Non-Goals:**
- 不修改前端代码
- 不改变日志文件存储路径（仍为 `~/.claude-chat/logs/`）
- 不添加远程日志传输（如 ELK、Sentry）

## Decisions

### 1. 日志库选择：Pino

**选择**: Pino
**原因**: Fastify 原生支持，无需新增依赖，高性能
**替代方案**:
- Winston: 功能丰富但性能较差，需额外依赖
- 自定义实现: 已有，但功能有限

### 2. 模块标识方式

**选择**: 显式传递 module/shorthand
**原因**:
- 简单可靠，无性能开销
- 从 `Error.stack` 解析调用栈开销大且不可靠
- TypeScript 文件路径在编译后会变化

**格式**:
```typescript
const log = createLogger({
  module: 'DataSync',      // [功能区]
  shorthand: 's.s.data-sync' // 文件路径缩写
});
```

**缩写规则**:
| 路径前缀 | 缩写 |
|---------|------|
| `server/` | `s.` |
| `server/services/` | `s.s.` |
| `server/routes/` | `s.r.` |
| `server/db/` | `s.db` |

### 3. 多行日志格式

**选择**: 检测 `\n` 自动换行
**格式**:
```
2026-03-28 15:56:52 [DataSync] ERROR  s.s.data-sync
- 连接失败
- Error: ECONNREFUSED
- at TCPConnectWrap.afterConnect...
```

### 4. 配置结构

**选择**: 扩展现有 `logConfig`，添加新字段
**原因**: 保持向后兼容

```typescript
interface LogConfig {
  enabled: boolean;
  level: 'debug' | 'info' | 'warn' | 'error';
  maxSize: number;   // MB - 保留
  maxDays: number;   // 天 - 保留
  format: 'json' | 'text';  // 新增：输出格式
  colorize: boolean;         // 新增：终端着色（仅开发模式）
}
```

### 5. Fastify Logger 集成

**选择**: 使用相同工厂创建 Fastify logger
**原因**: 统一日志格式，Fastify 请求日志也使用相同格式

## Risks / Trade-offs

| 风险 | 缓解措施 |
|-----|---------|
| 迁移期间日志中断 | 保留旧 LoggerService 作为降级方案，直到完全迁移 |
| 多行日志解析困难 | 文件格式保持纯文本，不需要机器解析 |
| Pino transport 在 Windows 兼容性 | 使用同步写入作为 fallback |

## Migration Plan

### 阶段 1: 基础设施 (Day 1)
1. 创建 `log-factory.ts` 和 `log-transport.ts`
2. 编写单元测试
3. 更新配置类型定义

### 阶段 2: 核心迁移 (Day 1-2)
1. 迁移 `server.ts` 和 `cli.ts`
2. 迁移 `services/*.ts`
3. 迁移 `db/index.ts`

### 阶段 3: 路由迁移 (Day 2)
1. 迁移 `routes/*.ts`
2. 删除旧 `LoggerService`

### 阶段 4: 清理 (Day 2)
1. 移除旧代码
2. 更新文档
3. 验证日志格式

**回滚策略**: 保留 `LoggerService` 直到所有迁移完成并验证通过

## Open Questions

- 是否需要支持日志级别动态调整（热加载）？ → 建议：暂不实现，后续按需添加
