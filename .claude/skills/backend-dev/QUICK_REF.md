# 快速参考 - 后端开发

## 路由模板

### 基础 CRUD 路由
```typescript
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { ApiResponse, Team, Message } from '@shared/types';

export async function resourceRoutes(fastify: FastifyInstance) {
  const db = fastify.db;

  // GET /api/resources - 列表
  fastify.get('/resources', async (request, reply): Promise<ApiResponse<Resource[]>> => {
    try {
      const items = await db.getResources();
      return { success: true, data: items };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // GET /api/resources/:id - 详情
  fastify.get<{ Params: { id: string } }>(
    '/resources/:id',
    async (request, reply): Promise<ApiResponse<Resource>> => {
      const { id } = request.params;
      const item = await db.getResourceById(id);
      if (!item) {
        reply.code(404);
        return { success: false, error: 'Resource not found' };
      }
      return { success: true, data: item };
    }
  );

  // POST /api/resources - 创建
  fastify.post<{ Body: CreateResourceDto }>(
    '/resources',
    async (request, reply): Promise<ApiResponse<Resource>> => {
      const data = request.body;
      const item = await db.createResource(data);
      reply.code(201);
      return { success: true, data: item };
    }
  );

  // PUT /api/resources/:id - 更新
  fastify.put<{ Params: { id: string }; Body: UpdateResourceDto }>(
    '/resources/:id',
    async (request, reply): Promise<ApiResponse<Resource>> => {
      const { id } = request.params;
      const data = request.body;
      const item = await db.updateResource(id, data);
      return { success: true, data: item };
    }
  );

  // DELETE /api/resources/:id - 删除
  fastify.delete<{ Params: { id: string } }>(
    '/resources/:id',
    async (request, reply): Promise<ApiResponse<void>> => {
      const { id } = request.params;
      await db.deleteResource(id);
      return { success: true };
    }
  );
}
```

## 数据库操作

### 查询示例
```typescript
// 简单查询
const teams = await db.query<Team[]>('SELECT * FROM teams WHERE status = ?', ['active']);

// 单条查询
const team = await db.queryOne<Team>('SELECT * FROM teams WHERE name = ?', [teamName]);

// 插入
const result = await db.run(
  'INSERT INTO messages (id, team, content, timestamp) VALUES (?, ?, ?, ?)',
  [id, team, content, timestamp]
);

// 更新
await db.run(
  'UPDATE teams SET lastActivity = ? WHERE name = ?',
  [new Date().toISOString(), teamName]
);

// 删除
await db.run('DELETE FROM messages WHERE id = ?', [messageId]);
```

### 事务操作
```typescript
await db.transaction(() => {
  db.run('INSERT INTO messages ...', [...]);
  db.run('UPDATE teams SET messageCount = messageCount + 1 ...', [...]);
});
```

## WebSocket 处理

### 广播消息
```typescript
function broadcast(fastify: FastifyInstance, type: string, data: any) {
  const wsServer = fastify.websocketServer;
  if (!wsServer?.clients) return;

  const message = JSON.stringify({ type, ...data });
  let sentCount = 0;

  wsServer.clients.forEach((client: any) => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(message);
      sentCount++;
    }
  });

  console.log(`[WebSocket] Broadcasted ${type} to ${sentCount} clients`);
}

// 使用
broadcast(fastify, 'new_message', { team: teamName, message });
```

### 发送给特定客户端
```typescript
// 在 WebSocket 连接处理中
fastify.register(require('@fastify/websocket'));

fastify.get('/ws', { websocket: true }, (connection, req) => {
  connection.socket.on('message', (message) => {
    const data = JSON.parse(message.toString());

    switch (data.type) {
      case 'join_team':
        // 处理加入团队
        connection.socket.send(JSON.stringify({
          type: 'joined',
          team: data.team
        }));
        break;

      case 'send_message':
        // 处理发送消息
        broadcast(fastify, 'new_message', {
          team: data.team,
          message: newMessage
        });
        break;
    }
  });
});
```

## 服务类模板

```typescript
// services/my-service.ts
import type { FastifyInstance } from 'fastify';
import { DatabaseService } from '../db';

export interface MyServiceOptions {
  db: DatabaseService;
  fastify: FastifyInstance;
}

export class MyService {
  private db: DatabaseService;
  private fastify: FastifyInstance;

  constructor(options: MyServiceOptions) {
    this.db = options.db;
    this.fastify = options.fastify;
  }

  async initialize(): Promise<void> {
    // 初始化逻辑
    console.log('[MyService] Initialized');
  }

  async doSomething(param: string): Promise<Result> {
    // 业务逻辑
    const data = await this.db.getData(param);
    return this.processData(data);
  }

  private processData(data: any): Result {
    // 私有方法
    return { success: true, data };
  }
}

export default MyService;
```

## 错误处理

### 统一错误格式
```typescript
// 成功响应
return { success: true, data: result };

// 错误响应
return { success: false, error: 'Error message' };

// 带状态码
reply.code(404);
return { success: false, error: 'Resource not found' };

// try-catch 模式
try {
  const result = await doSomething();
  return { success: true, data: result };
} catch (error) {
  console.error('[API] Error:', error);
  return { success: false, error: error.message };
}
```

## 文件操作

### 读取 JSON 文件
```typescript
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readJsonFile<T>(filePath: string): T | null {
  if (!existsSync(filePath)) {
    return null;
  }
  try {
    const content = readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`[File] Error reading ${filePath}:`, error);
    return null;
  }
}
```

### 写入 JSON 文件
```typescript
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname } from 'path';

function writeJsonFile(filePath: string, data: any): boolean {
  try {
    const dir = dirname(filePath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`[File] Error writing ${filePath}:`, error);
    return false;
  }
}
```

## 定时任务

### 使用 node-cron
```typescript
import cron from 'node-cron';

export class CleanupService {
  start(): void {
    // 每天凌晨 2 点执行
    cron.schedule('0 2 * * *', () => {
      this.cleanup();
    });

    // 每小时执行
    cron.schedule('0 * * * *', () => {
      this.hourlyTask();
    });
  }

  private async cleanup(): Promise<void> {
    console.log('[Cleanup] Starting cleanup...');
    // 清理逻辑
  }
}
```

## 常见问题解决

### SQLite 数据库锁定
```typescript
// 使用 WAL 模式
db.pragma('journal_mode = WAL');

// 限制并发
import pLimit from 'p-limit';
const limit = pLimit(1);
await limit(() => db.run('INSERT INTO ...'));
```

### WebSocket 连接管理
```typescript
// 跟踪连接状态
const clients = new Map<WebSocket, { teams: string[] }>();

ws.on('close', () => {
  clients.delete(ws);
});

ws.on('message', (msg) => {
  const data = JSON.parse(msg.toString());
  if (data.type === 'join_team') {
    const client = clients.get(ws);
    if (client) {
      client.teams.push(data.team);
    }
  }
});
```

### 内存泄漏检查
```typescript
// 定期检查内存使用
setInterval(() => {
  const used = process.memoryUsage();
  console.log({
    heapUsed: Math.round(used.heapUsed / 1024 / 1024) + ' MB',
    heapTotal: Math.round(used.heapTotal / 1024 / 1024) + ' MB',
  });
}, 60000); // 每分钟
```
