---
name: frontend-dev
description: 前端开发技能 - 处理 Preact 组件、TailwindCSS 样式、WebSocket 消息处理和状态管理。用于开发 UI 组件、添加新功能、修改样式等。
---

# 前端开发技能

**技术栈**: Preact + TailwindCSS + Vite + TypeScript

**触发关键词**: 前端、组件、UI、样式、Preact、TailwindCSS、CSS、页面、交互

## 核心规范速查

| 规范 | 说明 | 详细文档 |
|------|------|---------|
| 组件结构 | Preact 函数组件 + Hooks | [docs/components.md](docs/components.md) |
| 样式规范 | TailwindCSS 实用类优先 | [docs/styling.md](docs/styling.md) |
| 状态管理 | useState + Map 结构 | [docs/state-management.md](docs/state-management.md) |
| WebSocket | useWebSocket Hook | [docs/websocket-integration.md](docs/websocket-integration.md) |

## 目录结构

```
src/client/
├── index.tsx           # 入口文件
├── app.tsx             # 根组件，包含全局状态
├── components/         # UI 组件
│   ├── MessageBubble.tsx
│   ├── InputBox.tsx
│   ├── ChatArea.tsx
│   ├── Sidebar.tsx
│   └── Avatar.tsx
├── hooks/              # 自定义 Hooks
│   ├── useWebSocket.ts
│   └── useTheme.ts
└── utils/
    └── api.ts          # API 客户端
```

## 快速检查清单

### 新增组件时
- [ ] 组件放在 `src/client/components/` 目录
- [ ] 使用 TypeScript 类型定义 props
- [ ] 使用 TailwindCSS 进行样式
- [ ] 导出组件到 `index.ts`

### 修改样式时
- [ ] 优先使用 TailwindCSS 实用类
- [ ] 避免内联 style 属性
- [ ] 深色模式使用 `dark:` 前缀
- [ ] 响应式使用 `sm:` `md:` `lg:` 前缀

### 状态管理时
- [ ] 全局状态在 `app.tsx` 中管理
- [ ] 消息使用 `Map<teamName, Message[]>` 结构
- [ ] WebSocket 消息通过 `lastMessage` 回调处理

## 关键模式

### 消息状态结构
```typescript
// app.tsx 中的核心状态
const [teams, setTeams] = useState<Team[]>([]);
const [messages, setMessages] = useState<Map<string, Message[]>>(new Map());
const [currentTeam, setCurrentTeam] = useState<string | null>(null);
const [connected, setConnected] = useState(false);
```

### WebSocket 消息处理
```typescript
// 在 app.tsx 中处理 WebSocket 消息
const { lastMessage, sendMessage, connected } = useWebSocket();

useEffect(() => {
  if (lastMessage && lastMessage.team === currentTeam) {
    setMessages(prev => {
      const teamMessages = prev.get(lastMessage.team) || [];
      return new Map(prev).set(lastMessage.team, [...teamMessages, lastMessage.message]);
    });
  }
}, [lastMessage]);
```

### API 调用模式
```typescript
// 使用 utils/api.ts 中的 API 客户端
import { api } from '../utils/api';

// GET 请求
const messages = await api.getMessages(teamName, { limit: 50 });

// POST 请求
await api.sendMessage(teamName, { content: 'Hello', to: 'agent-1' });
```

## 详细文档索引

### 组件开发
- [组件结构规范](docs/components.md) - Preact 组件的最佳实践
- [样式指南](docs/styling.md) - TailwindCSS 使用规范
- [事件处理](docs/event-handling.md) - 用户交互处理

### 状态与通信
- [状态管理](docs/state-management.md) - 全局状态和组件状态
- [WebSocket 集成](docs/websocket-integration.md) - 实时通信
- [API 客户端](docs/api-client.md) - REST API 调用

### 高级主题
- [主题系统](docs/theming.md) - 深色/浅色模式
- [性能优化](docs/performance.md) - 渲染优化

## 相关技能

- **backend-dev**: 后端开发，API 和服务端逻辑
- **websocket-protocol**: WebSocket 通信协议规范
- **project-arch**: 项目整体架构

---

**最后更新**: 2026-03-18 (v1.1.0)
