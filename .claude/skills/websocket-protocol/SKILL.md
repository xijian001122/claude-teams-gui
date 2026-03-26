---
name: websocket-protocol
description: WebSocket 通信协议规范 - 定义客户端和服务端之间的消息格式和事件类型。用于实现实时通信、消息同步、状态更新等功能。
---

# WebSocket 通信协议

**用途**: 定义 Claude Agent GUI 客户端和服务端之间的实时通信协议

**触发关键词**: WebSocket、WS、实时通信、消息同步、广播、连接

## 协议概览

```
┌─────────────────┐     WebSocket      ┌─────────────────┐
│   Browser UI    │ ◄────────────────► │  Node.js Server │
│  (Preact + WS)  │                    │  (Fastify + WS) │
└─────────────────┘                    └─────────────────┘
```

## 核心规范速查

| 规范 | 说明 | 详细文档 |
|------|------|---------|
| 客户端事件 | 客户端发送的消息类型 | [docs/client-events.md](docs/client-events.md) |
| 服务端事件 | 服务端推送的消息类型 | [docs/server-events.md](docs/server-events.md) |
| 消息格式 | JSON 消息结构定义 | [docs/message-format.md](docs/message-format.md) |

## 快速检查清单

### 发送消息时
- [ ] 消息必须是有效的 JSON 字符串
- [ ] 包含 `type` 字段标识消息类型
- [ ] 包含必要的业务字段（如 `team`、`message`）
- [ ] 时间戳使用 ISO 8601 格式

### 接收消息时
- [ ] 解析 JSON 前验证数据完整性
- [ ] 根据 `type` 字段分发处理逻辑
- [ ] 处理解析错误和无效消息

## 客户端事件 (Client → Server)

### join_team
加入团队房间，接收该团队的消息
```typescript
{
  type: 'join_team',
  team: string
}
```

### leave_team
离开团队房间
```typescript
{
  type: 'leave_team',
  team: string
}
```

### typing
通知正在输入
```typescript
{
  type: 'typing',
  team: string,
  to?: string  // 可选：定向输入提示
}
```

### mark_read
标记消息已读
```typescript
{
  type: 'mark_read',
  team: string,
  messageId: string
}
```

### send_cross_team_message
发送跨团队消息
```typescript
{
  type: 'send_cross_team_message',
  fromTeam: string,
  toTeam: string,
  content: string,
  contentType?: 'text' | 'code' | 'markdown'
}
```

## 服务端事件 (Server → Client)

### new_message
新消息通知
```typescript
{
  type: 'new_message',
  team: string,
  message: Message
}
```

### new_messages
批量新消息（初始加载）
```typescript
{
  type: 'new_messages',
  team: string,
  messages: Message[]
}
```

### message_updated
消息更新通知
```typescript
{
  type: 'message_updated',
  team: string,
  messageId: string,
  updates: Partial<Message>
}
```

### member_online / member_offline
成员上下线通知
```typescript
{
  type: 'member_online' | 'member_offline',
  team: string,
  member: string
}
```

### team_deleted / team_archived
团队删除/归档通知
```typescript
{
  type: 'team_deleted' | 'team_archived',
  team: string
}
```

### cross_team_message
收到跨团队消息
```typescript
{
  type: 'cross_team_message',
  team: string,          // 接收团队
  message: Message,
  originalTeam: string   // 发送来源团队
}
```

### cross_team_message_sent
跨团队消息发送确认
```typescript
{
  type: 'cross_team_message_sent',
  team: string,          // 发送团队
  message: Message,
  targetTeam: string     // 目标团队
}
```

## 前端使用示例

```typescript
// hooks/useWebSocket.ts
import { useEffect, useRef, useState, useCallback } from 'preact/hooks';

export function useWebSocket() {
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => setConnected(true);
    ws.onclose = () => {
      setConnected(false);
      // 自动重连
      setTimeout(connect, 2000);
    };
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setLastMessage({ ...data, timestamp: Date.now() });
    };

    wsRef.current = ws;
  }, []);

  const sendMessage = useCallback((type: string, data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, ...data }));
    }
  }, []);

  useEffect(() => {
    connect();
    return () => wsRef.current?.close();
  }, [connect]);

  return { connected, lastMessage, sendMessage };
}
```

## 后端处理示例

```typescript
// server.ts
fastify.register(require('@fastify/websocket'));

fastify.get('/ws', { websocket: true }, (connection, req) => {
  const { socket } = connection;

  socket.on('message', (rawMessage) => {
    try {
      const message = JSON.parse(rawMessage.toString());

      switch (message.type) {
        case 'join_team':
          // 加入团队房间
          socket.join(message.team);
          break;

        case 'typing':
          // 广播输入状态
          broadcast(message.team, {
            type: 'typing',
            team: message.team,
            user: message.user
          });
          break;

        case 'send_cross_team_message':
          // 处理跨团队消息
          handleCrossTeamMessage(message);
          break;
      }
    } catch (error) {
      console.error('[WebSocket] Parse error:', error);
    }
  });

  socket.on('close', () => {
    // 清理连接状态
  });
});

function broadcast(team: string, data: any) {
  const wsServer = fastify.websocketServer;
  if (!wsServer?.clients) return;

  const message = JSON.stringify(data);
  wsServer.clients.forEach((client: any) => {
    if (client.readyState === 1) {
      client.send(message);
    }
  });
}
```

## 连接状态管理

```typescript
// 状态码
WebSocket.CONNECTING = 0
WebSocket.OPEN = 1
WebSocket.CLOSING = 2
WebSocket.CLOSED = 3

// 检查连接状态
if (ws.readyState === WebSocket.OPEN) {
  ws.send(message);
}
```

## 错误处理

### 前端
```typescript
ws.onerror = (error) => {
  console.error('[WebSocket] Error:', error);
  // 尝试重连
  setTimeout(connect, 2000);
};
```

### 后端
```typescript
socket.on('error', (error) => {
  console.error('[WebSocket] Client error:', error);
  // 清理资源
});
```

## 详细文档索引

- [客户端事件详情](docs/client-events.md) - 客户端发送的所有事件
- [服务端事件详情](docs/server-events.md) - 服务端推送的所有事件
- [消息格式规范](docs/message-format.md) - 完整的消息结构定义
- [连接管理](docs/connection-management.md) - 连接生命周期管理

## 相关技能

- **frontend-dev**: 前端开发，useWebSocket Hook 使用
- **backend-dev**: 后端开发，WebSocket 服务器配置
- **project-arch**: 项目整体架构

---

**最后更新**: 2026-03-17 (v1.0.0)
