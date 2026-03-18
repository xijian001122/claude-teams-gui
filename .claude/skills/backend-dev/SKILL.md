---
name: backend-dev
description: 后端开发技能 - 处理 Fastify 路由、SQLite 数据库、WebSocket 服务和文件同步。用于开发 API、数据库操作、服务层逻辑等。
---

# 后端开发技能

**技术栈**: Fastify + SQLite + WebSocket + TypeScript

**触发关键词**: 后端、API、路由、数据库、SQLite、WebSocket、服务、Service

## 核心规范速查

| 规范 | 说明 | 详细文档 |
|------|------|---------|
| 路由结构 | Fastify 路由注册和定义 | [docs/routes.md](docs/routes.md) |
| 数据库操作 | SQLite 查询和事务 | [docs/database.md](docs/database.md) |
| 服务层 | 业务逻辑封装 | [docs/services.md](docs/services.md) |
| WebSocket | 实时通信处理 | [docs/websocket.md](docs/websocket.md) |

## 目录结构

```
src/server/
├── index.ts            # 入口文件
├── server.ts           # Fastify 服务器配置
├── cli.ts              # 命令行入口
├── routes/             # API 路由
│   ├── index.ts        # 路由注册
│   ├── teams.ts        # 团队相关 API
│   ├── messages.ts     # 消息相关 API
│   ├── archive.ts      # 归档 API
│   └── settings.ts     # 设置 API
├── services/           # 业务服务
│   ├── index.ts        # 服务导出
│   ├── data-sync.ts    # 数据同步服务
│   ├── file-watcher.ts # 文件监听服务
│   └── cleanup.ts      # 清理服务
└── db/
    └── index.ts        # 数据库服务
```

## 快速检查清单

### 新增 API 时
- [ ] 路由文件放在 `src/server/routes/` 目录
- [ ] 使用 Fastify 类型定义请求和响应
- [ ] 统一返回格式 `{ success, data?, error? }`
- [ ] 导出路由到 `index.ts`

### 数据库操作时
- [ ] 使用 DatabaseService 的方法
- [ ] 使用参数化查询防止 SQL 注入
- [ ] 事务操作使用 `transaction()` 方法

### 服务层开发时
- [ ] 服务类放在 `src/server/services/` 目录
- [ ] 依赖注入通过构造函数
- [ ] 异步方法返回 Promise

## 关键模式

### API 路由定义
```typescript
// routes/messages.ts
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export async function messagesRoutes(fastify: FastifyInstance) {
  // GET /api/teams/:name/messages
  fastify.get('/teams/:name/messages', {
    schema: {
      params: { type: 'object', properties: { name: { type: 'string' } } },
      querystring: { type: 'object', properties: { limit: { type: 'number' } } }
    }
  }, async (request: FastifyRequest<{ Params: { name: string }, Querystring: { limit?: number } }>, reply: FastifyReply) => {
    const { name } = request.params;
    const { limit = 50 } = request.query;
    // 处理逻辑
    return { success: true, data: messages };
  });
}
```

### 数据库服务
```typescript
// db/index.ts
export class DatabaseService {
  private db: any;

  async getMessages(teamName: string, options?: { limit?: number, before?: string }): Promise<Message[]> {
    const sql = `
      SELECT * FROM messages
      WHERE team = ?
      ${options?.before ? 'AND timestamp < ?' : ''}
      ORDER BY timestamp DESC
      LIMIT ?
    `;
    const params = [teamName];
    if (options?.before) params.push(options.before);
    params.push(String(options?.limit || 50));

    return this.db.query(sql, params);
  }
}
```

### WebSocket 广播
```typescript
// 在服务中广播消息
const wsServer = fastify.websocketServer;
if (wsServer && wsServer.clients) {
  const broadcastData = JSON.stringify({
    type: 'new_message',
    team: teamName,
    message
  });
  wsServer.clients.forEach((client: any) => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(broadcastData);
    }
  });
}
```

## 详细文档索引

### 核心组件
- [路由开发](docs/routes.md) - Fastify 路由规范
- [数据库操作](docs/database.md) - SQLite 使用指南
- [服务层](docs/services.md) - 业务逻辑封装
- [WebSocket 处理](docs/websocket.md) - 实时通信

### 数据模型
- [消息模型](docs/message-model.md) - Message 结构和处理
- [团队模型](docs/team-model.md) - Team 结构和配置

### 集成
- [Claude FS 集成](docs/claude-integration.md) - 与 Claude Teams 文件系统同步
- [文件监听](docs/file-watcher.md) - chokidar 文件监听

## 相关技能

- **frontend-dev**: 前端开发，UI 和状态管理
- **websocket-protocol**: WebSocket 通信协议规范
- **project-arch**: 项目整体架构

---

**最后更新**: 2026-03-17 (v1.0.0)
