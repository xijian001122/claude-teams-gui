---
name: logging-standards
description: 日志管理规范 - Logback风格格式化、模块日志、日志级别、文件轮转
---

# 日志管理规范

**作用**: 规范后端日志系统的使用，确保日志格式统一、可追踪、易维护

**触发关键词**: 日志、log、logging、logger、createLogger

## 核心规范速查

| 规范 | 说明 | 详细文档 |
|------|------|---------|
| 日志格式 | Logback 风格格式化 | [docs/log-format.md](docs/log-format.md) |
| 模块标识 | module/shorthand 命名 | [docs/module-naming.md](docs/module-naming.md) |
| 日志级别 | DEBUG/INFO/WARN/ERROR 使用 | [docs/log-levels.md](docs/log-levels.md) |
| 文件轮转 | 按日期/大小轮转 | [docs/rotation.md](docs/rotation.md) |

## 快速检查清单

- [ ] 使用 `createLogger()` 创建模块日志
- [ ] module 使用 PascalCase（如 `DataSync`）
- [ ] shorthand 使用缩写路径（如 `s.s.data-sync`）
- [ ] 选择正确的日志级别
- [ ] 避免在日志中包含敏感信息

## 日志格式

```
YYYY-MM-DD HH:mm:ss [Module] LEVEL  shorthand
- 内容
```

**示例**:
```
2026-03-30 14:07:37 [DataSync] INFO  s.s.data-sync
- Synced 15/20 messages from member-1
```

## 常用模式

### 创建模块 Logger

```typescript
import { createLogger } from './services/log-factory';

const log = createLogger({
  module: 'DataSync',        // 功能区名称
  shorthand: 's.s.data-sync' // 路径缩写
});

// 使用
log.info('消息同步完成');
log.error({ err }, '连接失败');
```

### Shorthand 缩写规则

| 路径前缀 | 缩写 | 示例 |
|---------|------|------|
| `server/` | `s.` | `s.server` |
| `server/services/` | `s.s.` | `s.s.data-sync` |
| `server/routes/` | `s.r.` | `s.r.teams` |
| `server/db/` | `s.db` | `s.db` |

## 日志级别使用

| 级别 | 使用场景 |
|------|---------|
| DEBUG | 详细调试信息（开发环境） |
| INFO | 正常业务流程 |
| WARN | 潜在问题、降级处理 |
| ERROR | 错误、异常、失败 |

## 文件输出

```
~/.claude-chat/logs/
├── console.log      # 所有级别
├── info.log         # INFO+
└── error.log        # ERROR only
```

## 详细文档索引

- [日志格式规范](docs/log-format.md) - Logback 风格详细说明
- [模块命名规范](docs/module-naming.md) - module/shorthand 命名规则
- [日志级别使用](docs/log-levels.md) - 各级别使用场景
- [文件轮转机制](docs/rotation.md) - 日期/大小轮转逻辑

## 相关技能

- **backend-dev**: 后端开发规范
- **project-arch**: 项目架构

---

**最后更新**: 2026-03-30 (v1.0.0)
