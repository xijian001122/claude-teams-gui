# 服务层开发

## 概述

服务层封装了业务逻辑，提供清晰的接口给路由层使用。每个服务类负责特定的业务领域。

## 服务目录结构

```
src/server/services/
├── index.ts           # 服务导出
├── data-sync.ts       # 数据同步服务
├── file-watcher.ts    # 文件监听服务
└── cleanup.ts         # 清理服务
```

## 服务类模板

```typescript
// services/my-service.ts
import type { FastifyInstance } from 'fastify';
import { DatabaseService } from '../db';

/**
 * 服务配置选项
 */
export interface MyServiceOptions {
  db: DatabaseService;
  fastify: FastifyInstance;
  /** 其他配置项 */
  someOption?: string;
}

/**
 * 我的服务
 * 负责处理特定业务逻辑
 */
export class MyService {
  private db: DatabaseService;
  private fastify: FastifyInstance;
  private someOption: string;

  constructor(options: MyServiceOptions) {
    this.db = options.db;
    this.fastify = options.fastify;
    this.someOption = options.someOption || 'default';
  }

  /**
   * 初始化服务
   */
  async init(): Promise<void> {
    console.log('[MyService] Initializing...');
    // 初始化逻辑
    console.log('[MyService] Initialized');
  }

  /**
   * 执行业务操作
   */
  async doSomething(param: string): Promise<SomeResult> {
    // 1. 验证输入
    this.validateInput(param);

    // 2. 执行数据库操作
    const data = await this.db.getData(param);

    // 3. 处理业务逻辑
    const result = this.processData(data);

    // 4. 广播更新（如果需要）
    this.broadcastUpdate(result);

    return result;
  }

  /**
   * 验证输入
   */
  private validateInput(param: string): void {
    if (!param || param.length === 0) {
      throw new Error('Parameter is required');
    }
  }

  /**
   * 处理数据
   */
  private processData(data: any): SomeResult {
    // 业务逻辑处理
    return {
      success: true,
      data
    };
  }

  /**
   * 广播更新到 WebSocket 客户端
   */
  private broadcastUpdate(result: SomeResult): void {
    const wsServer = this.fastify?.websocketServer;
    if (!wsServer?.clients) return;

    const message = JSON.stringify({
      type: 'update',
      data: result
    });

    wsServer.clients.forEach((client: any) => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(message);
      }
    });
  }
}

export default MyService;
```

## DataSyncService

负责同步 Claude Teams 文件系统与 SQLite 数据库。

### 主要方法

```typescript
class DataSyncService {
  /**
   * 初始化同步，扫描现有团队
   */
  async init(): Promise<void>;

  /**
   * 同步单个团队
   */
  async syncTeam(teamName: string): Promise<Team | null>;

  /**
   * 发送消息
   */
  async sendMessage(
    teamName: string,
    to: string | null,
    content: string,
    contentType?: string
  ): Promise<Message>;

  /**
   * 发送跨团队消息
   */
  async sendCrossTeamMessage(
    fromTeam: string,
    toTeam: string,
    content: string,
    contentType?: string
  ): Promise<{ success: boolean; message?: Message; error?: string }>;

  /**
   * 处理团队删除/归档
   */
  async handleTeamDeleted(teamName: string): Promise<void>;
}
```

### 使用示例

```typescript
// 在路由中使用
fastify.post<{ Body: SendMessageBody }>(
  '/teams/:name/messages',
  async (request, reply) => {
    const { name } = request.params;
    const { content, to, contentType } = request.body;

    const message = await dataSync.sendMessage(name, to || null, content, contentType);
    return { success: true, data: message };
  }
);
```

## FileWatcherService

监听 Claude Teams 文件变化，触发数据同步。

### 实现原理

```typescript
import chokidar from 'chokidar';
import type { FastifyInstance } from 'fastify';

export class FileWatcherService {
  private watcher: chokidar.FSWatcher | null = null;
  private dataSync: DataSyncService;
  private claudeTeamsPath: string;

  constructor(dataSync: DataSyncService, claudeTeamsPath: string) {
    this.dataSync = dataSync;
    this.claudeTeamsPath = claudeTeamsPath;
  }

  /**
   * 启动文件监听
   */
  start(): void {
    const inboxesPath = join(this.claudeTeamsPath, '*', 'inboxes', '*.json');

    this.watcher = chokidar.watch(inboxesPath, {
      ignored: /(^|[\/\\])\../, // 忽略隐藏文件
      persistent: true,
      ignoreInitial: true, // 忽略初始扫描
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 10
      }
    });

    this.watcher
      .on('add', (path) => this.handleChange(path, 'add'))
      .on('change', (path) => this.handleChange(path, 'change'))
      .on('error', (error) => console.error('[FileWatcher] Error:', error));

    console.log('[FileWatcher] Started watching:', inboxesPath);
  }

  /**
   * 停止文件监听
   */
  stop(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
      console.log('[FileWatcher] Stopped');
    }
  }

  /**
   * 处理文件变化
   */
  private async handleChange(path: string, event: string): Promise<void> {
    console.log(`[FileWatcher] ${event}: ${path}`);

    // 解析团队名和成员名
    const match = path.match(/\/([^/]+)\/inboxes\/([^/]+)\.json$/);
    if (!match) return;

    const [, teamName, member] = match;

    // 触发数据同步
    await this.dataSync.syncInbox(teamName, member);
  }
}
```

## CleanupService

定时清理过期数据。

### 实现原理

```typescript
import cron from 'node-cron';
import type { DatabaseService } from '../db';

export class CleanupService {
  private db: DatabaseService;
  private retentionDays: number;
  private task: cron.ScheduledTask | null = null;

  constructor(db: DatabaseService, retentionDays: number) {
    this.db = db;
    this.retentionDays = retentionDays;
  }

  /**
   * 启动定时清理任务
   */
  start(): void {
    // 每天凌晨 2 点执行
    this.task = cron.schedule('0 2 * * *', () => {
      this.runCleanup();
    });

    console.log(`[Cleanup] Scheduled cleanup (retention: ${this.retentionDays} days)`);
  }

  /**
   * 停止定时任务
   */
  stop(): void {
    if (this.task) {
      this.task.stop();
      this.task = null;
      console.log('[Cleanup] Stopped');
    }
  }

  /**
   * 执行清理
   */
  async runCleanup(): Promise<void> {
    console.log('[Cleanup] Starting cleanup...');

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);

    try {
      const result = await this.db.deleteOldMessages(cutoffDate.toISOString());
      console.log(`[Cleanup] Deleted ${result.changes} old messages`);
    } catch (error) {
      console.error('[Cleanup] Error:', error);
    }
  }
}
```

## 服务注册

在 `server.ts` 中注册服务：

```typescript
// server.ts
import { DatabaseService } from './db';
import { DataSyncService, FileWatcherService, CleanupService } from './services';

export async function createServer(options: ServerOptions) {
  const fastify = Fastify();

  // 初始化数据库
  const db = new DatabaseService(options.dataDir);
  await db.init();

  // 初始化服务
  const dataSync = new DataSyncService({
    db,
    fastify,
    claudeTeamsPath: options.teamsPath,
    dataDir: options.dataDir
  });
  await dataSync.init();

  const fileWatcher = new FileWatcherService(dataSync, options.teamsPath);
  fileWatcher.start();

  const cleanup = new CleanupService(db, options.retentionDays);
  if (options.cleanupEnabled) {
    cleanup.start();
  }

  // 注册关闭钩子
  fastify.addHook('onClose', async () => {
    fileWatcher.stop();
    cleanup.stop();
  });

  // 装饰 fastify 实例
  fastify.decorate('db', db);
  fastify.decorate('dataSync', dataSync);

  return fastify;
}
```

## 最佳实践

### 1. 依赖注入
```typescript
// ✅ 通过构造函数注入依赖
class MyService {
  constructor(private db: DatabaseService, private fastify: FastifyInstance) {}
}

// ❌ 直接导入实例（难以测试）
import { db } from '../db';
```

### 2. 错误处理
```typescript
async function doSomething(): Promise<Result> {
  try {
    const result = await this.riskyOperation();
    return { success: true, data: result };
  } catch (error) {
    console.error('[MyService] Error:', error);
    return { success: false, error: error.message };
  }
}
```

### 3. 日志记录
```typescript
// 使用统一的前缀格式
console.log('[MyService] Starting operation...');
console.log('[MyService] Operation completed:', result);
console.error('[MyService] Error:', error);
```

### 4. 资源清理
```typescript
class MyService {
  private intervals: NodeJS.Timeout[] = [];

  start(): void {
    const interval = setInterval(() => this.tick(), 1000);
    this.intervals.push(interval);
  }

  stop(): void {
    this.intervals.forEach(i => clearInterval(i));
    this.intervals = [];
  }
}
```
