# 快速参考

## 创建 Logger 模板

### 基础服务层

```typescript
import { createLogger } from '../log-factory';

const log = createLogger({
  module: 'DataSync',
  shorthand: 's.s.data-sync'
});

export class DataSyncService {
  async syncData() {
    log.info('开始同步数据');
    try {
      // ...
      log.info({ count: results.length }, '同步完成');
    } catch (err) {
      log.error({ err }, '同步失败');
    }
  }
}
```

### 路由层

```typescript
import { createLogger } from '../services/log-factory';

const log = createLogger({
  module: 'TeamsRoute',
  shorthand: 's.r.teams'
});

export default async function teamsRoutes(fastify: FastifyInstance) {
  fastify.get('/', async () => {
    log.debug('获取团队列表');
    // ...
  });
}
```

### 主服务入口

```typescript
import { createLogger, initLogFactory, closeLogFactory } from './services/log-factory';

const log = createLogger({
  module: 'Server',
  shorthand: 's.server'
});

// 初始化日志系统
initLogFactory({
  enabled: config.logConfig.enabled,
  level: config.logConfig.level,
  maxSize: config.logConfig.maxSize,
  maxDays: config.logConfig.maxDays,
  logDir: join(dataDir, 'logs'),
  colorize: false
});

// 使用
log.info('Database initialized');

// 关闭
closeLogFactory();
```

## Shorthand 速查表

| 目录 | 缩写 | 完整 shorthand |
|------|------|----------------|
| `server.ts` | `s.` | `s.server` |
| `services/data-sync.ts` | `s.s.` | `s.s.data-sync` |
| `services/file-watcher.ts` | `s.s.` | `s.s.file-watcher` |
| `services/cleanup.ts` | `s.s.` | `s.s.cleanup` |
| `services/config.ts` | `s.s.` | `s.s.config` |
| `db/index.ts` | `s.` | `s.db` |
| `routes/teams.ts` | `s.r.` | `s.r.teams` |
| `routes/messages.ts` | `s.r.` | `s.r.messages` |

## 日志调用示例

```typescript
// 简单消息
log.info('操作完成');

// 带对象
log.info({ teamId, count }, '团队消息同步');

// 错误日志
log.error({ err, teamId }, '同步失败');

// 多行内容（自动格式化）
log.info(`处理结果:
- 成功: ${success}
- 失败: ${failed}`);
```

## 输出格式

```
2026-03-30 14:07:37 [DataSync] INFO  s.s.data-sync
- Synced 15/20 messages from member-1
```

👉 [详细格式说明](docs/log-format.md)
