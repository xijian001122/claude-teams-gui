# 组件结构规范

## 基本原则

1. **函数组件优先**：使用 Preact 函数组件 + Hooks
2. **TypeScript 类型**：为 Props 定义明确的接口
3. **单一职责**：每个组件只做一件事
4. **可复用性**：组件应该独立、可测试、可复用

## 组件结构

### 文件组织
```
src/client/components/
├── index.ts           # 统一导出
├── MessageBubble.tsx  # 消息气泡组件
├── InputBox.tsx       # 输入框组件
├── ChatArea.tsx       # 聊天区域组件
├── Sidebar.tsx        # 侧边栏组件
└── Avatar.tsx         # 头像组件
```

### 组件模板

```tsx
// MyComponent.tsx
import { FunctionalComponent } from 'preact';
import { useState, useEffect, useCallback } from 'preact/hooks';

/**
 * 组件属性接口
 */
interface MyComponentProps {
  /** 必需属性 */
  title: string;
  /** 可选属性 */
  className?: string;
  /** 事件回调 */
  onClick?: (value: string) => void;
}

/**
 * 组件说明
 * @param props - 组件属性
 */
export const MyComponent: FunctionalComponent<MyComponentProps> = ({
  title,
  className = '',
  onClick
}) => {
  // 1. 状态声明
  const [isOpen, setIsOpen] = useState(false);

  // 2. 副作用
  useEffect(() => {
    // 初始化逻辑
    return () => {
      // 清理逻辑
    };
  }, []);

  // 3. 回调函数
  const handleClick = useCallback(() => {
    setIsOpen(prev => !prev);
    onClick?.(title);
  }, [title, onClick]);

  // 4. 渲染
  return (
    <div className={`my-component ${className}`}>
      <h2>{title}</h2>
      <button onClick={handleClick}>
        {isOpen ? 'Close' : 'Open'}
      </button>
    </div>
  );
};

export default MyComponent;
```

## 组件分类

### 展示组件 (Presentational)
- 只负责 UI 渲染
- 不包含业务逻辑
- 通过 props 接收数据

```tsx
interface AvatarProps {
  name: string;
  color: string;
  letter: string;
  isOnline?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const Avatar: FunctionalComponent<AvatarProps> = ({
  name,
  color,
  letter,
  isOnline = false,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg'
  };

  return (
    <div className={`relative ${sizeClasses[size]}`}>
      <div
        className="rounded-full flex items-center justify-center text-white font-medium"
        style={{ backgroundColor: color }}
      >
        {letter}
      </div>
      {isOnline && (
        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
      )}
    </div>
  );
};
```

### 容器组件 (Container)
- 包含业务逻辑
- 管理状态
- 处理数据获取

```tsx
interface ChatAreaProps {
  teamName: string;
}

export const ChatArea: FunctionalComponent<ChatAreaProps> = ({ teamName }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMessages(teamName);
  }, [teamName]);

  const loadMessages = async (team: string) => {
    setLoading(true);
    try {
      const data = await api.getMessages(team);
      setMessages(data);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex flex-col h-full">
      <MessageList messages={messages} />
      <InputBox teamName={teamName} />
    </div>
  );
};
```

## 组件通信

### Props 向下传递
```tsx
// 父组件
<ChildComponent
  data={data}
  onUpdate={handleUpdate}
/>

// 子组件
interface ChildProps {
  data: DataType;
  onUpdate: (newData: DataType) => void;
}
```

### 回调向上传递
```tsx
// 父组件
const handleAction = useCallback((value: string) => {
  console.log('Action:', value);
}, []);

<ChildComponent onAction={handleAction} />

// 子组件
interface ChildProps {
  onAction: (value: string) => void;
}
```

### Context 共享状态（慎用）
```tsx
// 仅在必要时使用 Context
import { createContext } from 'preact';
import { useContext } from 'preact/hooks';

const ThemeContext = createContext<'light' | 'dark'>('light');

// 提供者
<ThemeContext.Provider value={theme}>
  <App />
</ThemeContext.Provider>

// 消费者
const theme = useContext(ThemeContext);
```

## 最佳实践

### 1. Props 解构
```tsx
// ✅ 推荐：解构并设置默认值
const Component: FunctionalComponent<Props> = ({
  title,
  disabled = false,
  onClick
}) => {
  // ...
};

// ❌ 避免：直接使用 props
const Component: FunctionalComponent<Props> = (props) => {
  return <div>{props.title}</div>;
};
```

### 2. 条件渲染
```tsx
// ✅ 推荐：提前返回
if (loading) {
  return <Loading />;
}

if (!data) {
  return <Empty />;
}

return <Content data={data} />;

// ✅ 推荐：三元表达式
{isLoading ? <Skeleton /> : <Content />}
```

### 3. 列表渲染
```tsx
// ✅ 使用稳定的 key
{messages.map((msg) => (
  <MessageBubble key={msg.id} message={msg} />
))}

// ❌ 避免使用 index 作为 key
{messages.map((msg, index) => (
  <MessageBubble key={index} message={msg} />
))}
```

### 4. 避免过度组件化
```tsx
// ❌ 过度拆分
<OuterWrapper>
  <InnerWrapper>
    <ContentContainer>
      <Text>{text}</Text>
    </ContentContainer>
  </InnerWrapper>
</OuterWrapper>

// ✅ 适度组织
<div className="outer inner content">
  <p>{text}</p>
</div>
```
