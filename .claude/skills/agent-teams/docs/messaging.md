# 消息通信

## 概述

本文档详细说明 Agent Teams 中的消息通信规范。

## 消息类型

### 1. message（直接消息）

发送给单个成员的消息。

```javascript
SendMessage({
  to: "frontend-dev",           // 成员名称（必需）
  message: "消息内容",           // 消息内容（必需）
  summary: "消息摘要"            // 5-10 词摘要（必需）
})
```

**使用场景**:
- 分配任务
- 提供反馈
- 请求状态更新

### 2. broadcast（广播消息）

发送给所有成员的消息。**慎用，成本高。**

```javascript
SendMessage({
  to: "*",                       // 广播标识
  message: "广播内容",           // 消息内容（必需）
  summary: "广播摘要"            // 5-10 词摘要（必需）
})
```

**使用场景**（仅限以下情况）:
- 发现严重 Bug，需要所有人停止工作
- 重大架构变更通知
- 紧急情况通知

**注意**: 广播会向每个成员发送独立消息，N 个成员 = N 次消息发送。

### 3. shutdown_request（关闭请求）

请求成员关闭。

```javascript
SendMessage({
  to: "frontend-dev",            // 成员名称（必需）
  message: {
    type: "shutdown_request",
    reason: "任务完成，准备关闭"
  }
})
```

### 4. shutdown_response（关闭响应）

成员响应关闭请求。

```javascript
// 批准关闭
SendMessage({
  to: "team-lead",
  message: {
    type: "shutdown_response",
    request_id: "abc-123",
    approve: true
  }
})

// 拒绝关闭
SendMessage({
  to: "team-lead",
  message: {
    type: "shutdown_response",
    request_id: "abc-123",
    approve: false,
    reason: "还有任务未完成"
  }
})
```

## 消息规范

### 消息内容规范

**好的消息**:
```
请实现任务 #1：消息气泡组件

需求：
- 创建 MessageBubble 组件
- 显示消息内容、发送者、时间戳
- 支持 @ 提及高亮
- 响应式布局

参考：src/client/components/ 目录下的现有组件
```

**不好的消息**:
```
去实现消息气泡
```

### 摘要规范

- 5-10 词
- 简洁描述消息内容
- 使用动词开头

**好的摘要**:
- "分配开发任务 #1"
- "测试任务完成，发现3个Bug"
- "请求修复消息发送Bug"

## Idle 通知

成员完成工作后会进入 idle 状态，并发送 idle 通知。

**重要提示**:
- Idle 是正常状态，不需要回应
- Idle 的成员仍然可以接收消息
- 发送消息给 idle 成员会唤醒他们

## 通信模式

### 模式1：任务分配通知

```javascript
// 1. 创建任务
TaskCreate({...})

// 2. 分配任务
TaskUpdate({
  taskId: "1",
  owner: "frontend-dev",
  status: "in_progress"
})

// 3. 发送通知
SendMessage({
  to: "frontend-dev",
  message: "请处理任务 #1：...",
  summary: "分配任务 #1"
})
```

### 模式2：任务完成通知

```javascript
// 成员完成任务后
TaskUpdate({
  taskId: "1",
  status: "completed"
})

SendMessage({
  to: "team-lead",
  message: "任务 #1 已完成：消息气泡组件已实现",
  summary: "任务 #1 完成"
})
```

### 模式3：问题报告

```javascript
SendMessage({
  to: "team-lead",
  message: `任务 #2 测试完成，发现以下问题：

1. 消息发送后没有立即显示
2. @ 提及没有高亮
3. 时间戳格式不正确

需要前端开发者修复。`,
  summary: "测试发现3个Bug"
})
```

## 关闭团队流程

```javascript
// 1. 确认所有任务完成
TaskList()

// 2. 向所有成员发送关闭请求
SendMessage({
  to: "frontend-dev",
  message: {
    type: "shutdown_request",
    reason: "所有任务已完成，准备关闭团队"
  }
})

// 3. 等待成员响应...

// 4. 删除团队
TeamDelete()
```

## 最佳实践

### 1. 优先使用 message 而非 broadcast

- message 只发给一个人，成本低
- broadcast 发给所有人，成本高

### 2. 消息要具体

- 包含任务 ID
- 说明具体需求
- 提供必要的上下文

### 3. 不要重复发送

- 避免发送重复消息
- 一次消息包含所有必要信息
