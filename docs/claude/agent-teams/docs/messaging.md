# 消息通信

## 概述

本文档详细说明 Agent Teams 中的消息通信规范。

## 消息类型

### 1. message（直接消息）

发送给单个成员的消息。

```javascript
SendMessage({
  type: "message",
  recipient: "developer",    // 成员名称（必需）
  content: "消息内容",        // 消息内容（必需）
  summary: "消息摘要"         // 5-10 词摘要（必需）
})
```

**使用场景**:
- 分配任务
- 提供反馈
- 请求状态更新
- 日常协作沟通

### 2. broadcast（广播消息）

发送给所有成员的消息。**慎用，成本高。**

```javascript
SendMessage({
  type: "broadcast",
  content: "广播内容",   // 消息内容（必需）
  summary: "广播摘要"    // 5-10 词摘要（必需）
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
  type: "shutdown_request",
  recipient: "developer",   // 成员名称（必需）
  content: "任务完成，准备关闭"  // 关闭原因（可选）
})
```

**使用场景**:
- 所有任务完成后关闭成员
- 需要重新配置成员时

### 4. shutdown_response（关闭响应）

成员响应关闭请求。

```javascript
// 批准关闭
SendMessage({
  type: "shutdown_response",
  request_id: "abc-123",  // 请求 ID（必需）
  approve: true
})

// 拒绝关闭
SendMessage({
  type: "shutdown_response",
  request_id: "abc-123",
  approve: false,
  content: "还有任务未完成"  // 拒绝原因
})
```

### 5. plan_approval_response（计划批准响应）

批准或拒绝成员的计划。

```javascript
// 批准计划
SendMessage({
  type: "plan_approval_response",
  request_id: "abc-123",
  recipient: "developer",
  approve: true
})

// 拒绝计划
SendMessage({
  type: "plan_approval_response",
  request_id: "abc-123",
  recipient: "developer",
  approve: false,
  content: "请添加错误处理逻辑"  // 拒绝原因
})
```

## 消息规范

### 消息内容规范

**好的消息**:
```
请实现任务 #1：司机管理的CRUD功能

需求：
- 创建 Driver Entity/Bo/Vo
- 实现 DriverController（包含 CRUD 接口）
- 实现 DriverService 和 DriverServiceImpl
- 实现 DriverMapper
- 添加权限注解 @SaCheckPermission

参考：fhd-modules/fhd-parking-lot 模块的实现方式
注意：遵循分库分表规范，禁止使用 JOIN
```

**不好的消息**:
```
去实现司机管理
```

### 摘要规范

- 5-10 词
- 简洁描述消息内容
- 使用动词开头

**好的摘要**:
- "分配开发任务 #1"
- "测试任务完成，发现3个Bug"
- "请求修复登录验证Bug"

**不好的摘要**:
- "消息"
- "任务"
- "这是一个关于司机管理功能开发的消息，需要实现CRUD"

## 消息接收

### 自动接收

消息会自动发送给目标成员，不需要手动检查。

### Idle 通知

成员完成工作后会进入 idle 状态，并发送 idle 通知：

```json
{
  "type": "idle_notification",
  "from": "developer",
  "timestamp": "2026-03-13T05:49:38.304Z",
  "idleReason": "available"
}
```

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
  owner: "developer",
  status: "in_progress"
})

// 3. 发送通知
SendMessage({
  type: "message",
  recipient: "developer",
  content: "请处理任务 #1：...",
  summary: "分配任务 #1"
})
```

### 模式2：任务完成通知

成员完成任务后，应该：
1. 使用 TaskUpdate 更新任务状态为 completed
2. 发送消息通知团队领导

```javascript
// 成员完成任务后
TaskUpdate({
  taskId: "1",
  status: "completed"
})

SendMessage({
  type: "message",
  recipient: "team-lead",
  content: "任务 #1 已完成：司机管理CRUD功能已实现",
  summary: "任务 #1 完成"
})
```

### 模式3：问题报告

测试者发现问题时：

```javascript
SendMessage({
  type: "message",
  recipient: "team-lead",
  content: `任务 #2 测试完成，发现以下问题：

1. POST /driver/add 接口缺少参数验证
2. GET /driver/list 分页不生效
3. DELETE /driver/{id} 没有权限检查

需要开发者修复。`,
  summary: "测试发现3个Bug"
})
```

### 模式4：协作请求

成员需要帮助时：

```javascript
SendMessage({
  type: "message",
  recipient: "team-lead",
  content: "实现过程中遇到问题：不确定如何处理分库分表的关联查询，请提供指导",
  summary: "请求技术指导"
})
```

## 关闭团队流程

### 标准关闭流程

```javascript
// 1. 确认所有任务完成
TaskList()

// 2. 向所有成员发送关闭请求
SendMessage({
  type: "shutdown_request",
  recipient: "developer",
  content: "所有任务已完成，准备关闭团队"
})

SendMessage({
  type: "shutdown_request",
  recipient: "tester",
  content: "所有任务已完成，准备关闭团队"
})

// 3. 等待成员响应...

// 4. 删除团队
TeamDelete()
```

### 成员响应关闭请求

当成员收到关闭请求时，必须使用 SendMessage 响应：

```javascript
// 批准关闭
SendMessage({
  type: "shutdown_response",
  request_id: "从请求消息中提取的ID",
  approve: true
})
```

**重要**: 不能只在文字中说"我同意关闭"，必须调用 SendMessage 工具。

## 最佳实践

### 1. 优先使用 message 而非 broadcast

- message 只发给一个人，成本低
- broadcast 发给所有人，成本高
- 只有真正需要所有人知道的信息才用 broadcast

### 2. 消息要具体

- 包含任务 ID
- 说明具体需求
- 提供必要的上下文

### 3. 及时响应

- 收到消息后及时处理
- 完成任务后及时通知
- 遇到问题及时报告

### 4. 不要重复发送

- 避免发送重复消息
- 一次消息包含所有必要信息

## 常见问题

### 问题1：成员没有收到消息

**症状**: 发送消息后成员没有响应

**可能原因**:
- recipient 名称错误
- 成员已关闭

**解决方案**:
1. 检查成员名称是否正确
2. 使用 TaskList 确认成员状态

### 问题2：收到 JSON 格式的 idle 通知

**症状**: 收到类似 `{"type":"idle_notification",...}` 的消息

**解释**: 这是正常的 idle 通知，不需要回应。

### 问题3：关闭请求没有响应

**症状**: 发送 shutdown_request 后没有收到 shutdown_response

**解决方案**:
1. 等待成员处理完当前任务
2. 重新发送关闭请求
3. 如果成员已经完成工作，可以直接调用 TeamDelete

## 相关文档

- [团队创建](team-creation.md)
- [任务管理](task-management.md)
- [成员协作](member-collaboration.md)
- [完整工作流程](workflow.md)
