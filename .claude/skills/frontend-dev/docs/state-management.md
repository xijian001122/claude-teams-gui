# 状态管理

## 概述

Claude Agent GUI 使用 Preact hooks 直接管理状态，不依赖外部状态管理库。核心状态集中在 `app.tsx` 中管理。

## 全局状态结构

```typescript
// app.tsx 中的核心状态
import { useState, useEffect, useCallback } from 'preact/hooks';
import { useWebSocket } from './hooks/useWebSocket';
import type { Team, Message } from '@shared/types';

export function App() {
  // 团队列表
  const [teams, setTeams] = useState<Team[]>([]);

  // 消息存储 - 使用 Map 结构按团队分组
  const [messages, setMessages] = useState<Map<string, Message[]>>(new Map());

  // 当前选中的团队
  const [currentTeam, setCurrentTeam] = useState<string | null>(null);

  // WebSocket 连接状态
  const [connected, setConnected] = useState(false);

  // WebSocket Hook
  const { lastMessage, sendMessage, connected: wsConnected } = useWebSocket();

  // ... 组件逻辑
}
```

## 状态更新模式

### 更新数组状态
```typescript
// 添加团队
setTeams(prev => [...prev, newTeam]);

// 更新团队
setTeams(prev => prev.map(t =>
  t.name === teamName ? { ...t, ...updates } : t
));

// 删除团队
setTeams(prev => prev.filter(t => t.name !== teamName));
```

### 更新 Map 状态
```typescript
// 添加消息到团队
setMessages(prev => {
  const newMap = new Map(prev);
  const teamMessages = newMap.get(teamName) || [];
  newMap.set(teamName, [...teamMessages, newMessage]);
  return newMap;
});

// 批量添加消息
setMessages(prev => {
  const newMap = new Map(prev);
  newMap.set(teamName, messages);
  return newMap;
});

// 更新单条消息
setMessages(prev => {
  const newMap = new Map(prev);
  const teamMessages = newMap.get(teamName) || [];
  newMap.set(teamName, teamMessages.map(m =>
    m.id === messageId ? { ...m, ...updates } : m
  ));
  return newMap;
});
```

## WebSocket 消息处理

### 处理新消息
```typescript
useEffect(() => {
  if (!lastMessage) return;

  const { type, team, message } = lastMessage;

  switch (type) {
    case 'new_message':
    case 'cross_team_message':
    case 'cross_team_message_sent':
      // 添加新消息到对应团队
      setMessages(prev => {
        const newMap = new Map(prev);
        const teamMessages = newMap.get(team) || [];
        // 避免重复
        if (!teamMessages.some(m => m.id === message.id)) {
          newMap.set(team, [...teamMessages, message]);
        }
        return newMap;
      });

      // 更新团队最后活动时间
      setTeams(prev => prev.map(t =>
        t.name === team ? { ...t, lastActivity: message.timestamp } : t
      ));
      break;

    case 'message_updated':
      // 更新消息
      setMessages(prev => {
        const newMap = new Map(prev);
        const teamMessages = newMap.get(team) || [];
        newMap.set(team, teamMessages.map(m =>
          m.id === lastMessage.messageId ? { ...m, ...lastMessage.updates } : m
        ));
        return newMap;
      });
      break;

    case 'team_archived':
    case 'team_deleted':
      setTeams(prev => prev.filter(t => t.name !== team));
      if (currentTeam === team) {
        setCurrentTeam(null);
      }
      break;
  }
}, [lastMessage]);
```

## 初始数据加载

```typescript
useEffect(() => {
  async function loadInitialData() {
    try {
      // 加载团队列表
      const teamsData = await api.getTeams();
      setTeams(teamsData);

      // 如果有团队，加载第一个团队的消息
      if (teamsData.length > 0) {
        const firstTeam = teamsData[0].name;
        setCurrentTeam(firstTeam);
        const messagesData = await api.getMessages(firstTeam);
        setMessages(prev => {
          const newMap = new Map(prev);
          newMap.set(firstTeam, messagesData);
          return newMap;
        });
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  }

  loadInitialData();
}, []);
```

## 事件处理回调

```typescript
// 发送消息
const handleSendMessage = useCallback(async (content: string, to?: string) => {
  if (!currentTeam) return;

  try {
    await api.sendMessage(currentTeam, { content, to });
  } catch (error) {
    console.error('Failed to send message:', error);
  }
}, [currentTeam]);

// 切换团队
const handleSelectTeam = useCallback(async (teamName: string) => {
  setCurrentTeam(teamName);

  // 如果消息未加载，加载消息
  if (!messages.has(teamName)) {
    try {
      const messagesData = await api.getMessages(teamName);
      setMessages(prev => {
        const newMap = new Map(prev);
        newMap.set(teamName, messagesData);
        return newMap;
      });
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  }
}, [messages]);
```

## 状态传递模式

### Props 向下传递
```tsx
// app.tsx
<ChatArea
  teamName={currentTeam}
  messages={currentTeam ? messages.get(currentTeam) || [] : []}
  onSendMessage={handleSendMessage}
/>

// ChatArea.tsx
interface ChatAreaProps {
  teamName: string | null;
  messages: Message[];
  onSendMessage: (content: string, to?: string) => void;
}
```

### 回调向上传递
```tsx
// Sidebar.tsx
interface SidebarProps {
  teams: Team[];
  currentTeam: string | null;
  onSelectTeam: (teamName: string) => void;
}

export function Sidebar({ teams, currentTeam, onSelectTeam }: SidebarProps) {
  return (
    <div className="sidebar">
      {teams.map(team => (
        <div
          key={team.name}
          className={team.name === currentTeam ? 'active' : ''}
          onClick={() => onSelectTeam(team.name)}
        >
          {team.displayName}
        </div>
      ))}
    </div>
  );
}
```

## 性能优化

### 使用 useCallback
```typescript
const handleSendMessage = useCallback(async (content: string, to?: string) => {
  // ... 发送逻辑
}, [currentTeam, api]);
```

### 使用 useMemo
```typescript
const sortedMessages = useMemo(() => {
  if (!currentTeamMessages) return [];
  return [...currentTeamMessages].sort((a, b) =>
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
}, [currentTeamMessages]);
```

### 避免不必要的渲染
```typescript
// 使用 React.memo (Preact 中是 memo)
import { memo } from 'preact/compat';

const MessageBubble = memo(({ message }: { message: Message }) => {
  return <div>{message.content}</div>;
});
```

## 常见问题

### 状态更新不触发重渲染
```typescript
// ❌ 错误：直接修改
messages.get(team).push(newMessage);

// ✅ 正确：创建新引用
setMessages(prev => {
  const newMap = new Map(prev);
  const teamMessages = newMap.get(team) || [];
  newMap.set(team, [...teamMessages, newMessage]);
  return newMap;
});
```

### 闭包陷阱
```typescript
// ❌ 错误：使用过时的状态值
useEffect(() => {
  const timer = setInterval(() => {
    console.log(messages); // 可能是旧值
  }, 1000);
  return () => clearInterval(timer);
}, []); // 缺少依赖

// ✅ 正确：添加依赖或使用 ref
useEffect(() => {
  const timer = setInterval(() => {
    console.log(messages);
  }, 1000);
  return () => clearInterval(timer);
}, [messages]); // 添加依赖
```

### 状态同步问题
```typescript
// 使用 useEffect 同步相关状态
useEffect(() => {
  // 当 currentTeam 变化时，重置相关状态
  setInputValue('');
  setReplyTo(null);
}, [currentTeam]);
```
