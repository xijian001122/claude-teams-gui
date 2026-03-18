# 快速参考 - 前端开发

## 组件模板

### 基础组件
```tsx
import { FunctionalComponent } from 'preact';
import { useState } from 'preact/hooks';

interface MyComponentProps {
  title: string;
  onAction?: () => void;
}

export const MyComponent: FunctionalComponent<MyComponentProps> = ({
  title,
  onAction
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
        {title}
      </h2>
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          onAction?.();
        }}
        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        {isOpen ? 'Close' : 'Open'}
      </button>
    </div>
  );
};
```

### 消息气泡组件
```tsx
import { FunctionalComponent } from 'preact';
import type { Message } from '@shared/types';

interface MessageBubbleProps {
  message: Message;
  isOwn?: boolean;
}

export const MessageBubble: FunctionalComponent<MessageBubbleProps> = ({
  message,
  isOwn = false
}) => {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}>
      <div
        className={`max-w-[70%] px-4 py-2 rounded-lg ${
          isOwn
            ? 'bg-blue-500 text-white'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
        }`}
      >
        <p className="text-sm">{message.content}</p>
        <span className="text-xs opacity-70">
          {new Date(message.timestamp).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
};
```

## TailwindCSS 常用类

### 布局
```css
/* Flexbox */
flex flex-col flex-row items-center justify-between gap-4

/* Grid */
grid grid-cols-2 grid-cols-3 gap-4

/* 容器 */
container mx-auto px-4 max-w-lg
```

### 颜色（支持深色模式）
```css
/* 背景 */
bg-white dark:bg-gray-800
bg-gray-100 dark:bg-gray-700

/* 文字 */
text-gray-900 dark:text-white
text-gray-500 dark:text-gray-400

/* 强调色 */
bg-blue-500 hover:bg-blue-600
text-blue-500
```

### 间距
```css
/* 内边距 */
p-4 px-4 py-2 pt-4 pb-8

/* 外边距 */
m-4 mx-auto mt-2 mb-4

/* 间隙 */
gap-2 gap-4 space-x-2 space-y-4
```

### 圆角和阴影
```css
/* 圆角 */
rounded rounded-lg rounded-full rounded-xl

/* 阴影 */
shadow shadow-sm shadow-md shadow-lg
```

## Hooks 使用

### useState
```tsx
const [value, setValue] = useState<string>('');
const [items, setItems] = useState<Item[]>([]);
const [map, setMap] = useState<Map<string, Item[]>>(new Map());
```

### useEffect
```tsx
// 组件挂载时
useEffect(() => {
  fetchData();
}, []);

// 依赖变化时
useEffect(() => {
  if (teamId) {
    loadMessages(teamId);
  }
}, [teamId]);

// 清理函数
useEffect(() => {
  const timer = setInterval(tick, 1000);
  return () => clearInterval(timer);
}, []);
```

### useCallback / useMemo
```tsx
const handleSubmit = useCallback((content: string) => {
  sendMessage(team, content);
}, [team, sendMessage]);

const sortedMessages = useMemo(() => {
  return messages.sort((a, b) =>
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
}, [messages]);
```

## WebSocket 使用

```tsx
import { useWebSocket } from '../hooks/useWebSocket';

function ChatComponent() {
  const { connected, lastMessage, sendMessage } = useWebSocket();

  useEffect(() => {
    if (lastMessage) {
      // 处理新消息
      console.log('New message:', lastMessage);
    }
  }, [lastMessage]);

  const handleSend = (content: string) => {
    sendMessage('send_message', {
      team: currentTeam,
      content,
      to: targetMember
    });
  };

  return (
    <div>
      <span className={connected ? 'text-green-500' : 'text-red-500'}>
        {connected ? 'Connected' : 'Disconnected'}
      </span>
    </div>
  );
}
```

## API 调用

```tsx
// utils/api.ts 的使用
import { api } from '../utils/api';

// 获取团队列表
const teams = await api.getTeams();

// 获取消息
const messages = await api.getMessages(teamName, {
  limit: 50,
  before: lastMessageId
});

// 发送消息
await api.sendMessage(teamName, {
  content: 'Hello!',
  to: 'agent-1'
});

// 获取设置
const settings = await api.getSettings();
```

## 常见问题解决

### 状态更新不触发重渲染
```tsx
// ❌ 错误：直接修改 Map
messages.get(team).push(newMessage);

// ✅ 正确：创建新 Map
setMessages(prev => {
  const newMap = new Map(prev);
  const teamMessages = newMap.get(team) || [];
  newMap.set(team, [...teamMessages, newMessage]);
  return newMap;
});
```

### 条件渲染闪烁
```tsx
// ❌ 可能在数据加载时闪烁
{data && <Component data={data} />}

// ✅ 使用加载状态
{loading ? <Skeleton /> : data ? <Component data={data} /> : <Empty />}
```

### 事件处理 this 绑定
```tsx
// ✅ 使用箭头函数
const handleClick = () => { /* ... */ };

// ✅ 或在 JSX 中绑定
<button onClick={() => handleClick(id)}>Click</button>
```
