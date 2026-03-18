# 任务管理

## 概述

本文档详细说明如何在 Agent Teams 中创建、分配和跟踪任务。

## 创建任务

### 使用 TaskCreate 工具

```javascript
TaskCreate({
  subject: "实现司机管理的CRUD功能",   // 任务标题（必需）
  description: "详细的任务描述...",    // 任务描述（必需）
  activeForm: "实现司机管理CRUD"       // 进行中时显示的文字（可选）
})
```

**参数说明**:
- `subject`: 任务标题，使用祈使句（如"实现功能"、"修复Bug"）
- `description`: 详细描述，包含需求、验收标准、注意事项
- `activeForm`: 任务进行中时显示的文字（现在分词形式）

**返回结果**:
```json
{
  "taskId": "1",
  "subject": "实现司机管理的CRUD功能",
  "status": "pending"
}
```

### 任务描述规范

好的任务描述应包含：

```
需要实现以下功能：
1. 创建 Driver Entity/Bo/Vo 对象
2. 实现 DriverController（包含 CRUD 接口）
3. 实现 DriverService 和 DriverServiceImpl
4. 实现 DriverMapper
5. 添加权限注解 @SaCheckPermission

验收标准：
- 所有接口正常工作
- 代码符合项目规范
- 通过单元测试

注意事项：
- 遵循分库分表规范，禁止使用 JOIN
- 使用 @author zhangjiazheng 注解
```

## 分配任务

### 使用 TaskUpdate 分配

```javascript
// 分配给开发者
TaskUpdate({
  taskId: "1",
  owner: "developer",    // 成员名称
  status: "in_progress"  // 同时标记为进行中
})
```

**参数说明**:
- `taskId`: 任务 ID
- `owner`: 成员名称（必须与 spawn 时的 name 一致）
- `status`: 任务状态

### 通知成员

分配任务后，发送消息通知成员：

```javascript
SendMessage({
  type: "message",
  recipient: "developer",
  content: `请实现任务 #1：司机管理的CRUD功能

需求：
- 创建 Driver Entity/Bo/Vo
- 实现 Controller/Service/Mapper
- 添加权限注解

参考：fhd-modules/fhd-parking-lot 模块的实现方式`,
  summary: "分配开发任务 #1"
})
```

## 跟踪任务

### 查看任务列表

```javascript
TaskList()
```

**返回结果**:
```
ID  Subject                    Status      Owner      BlockedBy
1   实现司机管理的CRUD功能      in_progress developer  -
2   测试司机管理CRUD功能        pending     -          1
```

### 获取任务详情

```javascript
TaskGet({
  taskId: "1"
})
```

**返回结果**:
```json
{
  "id": "1",
  "subject": "实现司机管理的CRUD功能",
  "description": "详细描述...",
  "status": "in_progress",
  "owner": "developer",
  "blocks": ["2"],
  "blockedBy": []
}
```

## 任务状态管理

### 状态流转

```
pending → in_progress → completed
   ↓
deleted（如果不需要）
```

### 更新状态

```javascript
// 开始任务
TaskUpdate({
  taskId: "1",
  status: "in_progress"
})

// 完成任务
TaskUpdate({
  taskId: "1",
  status: "completed"
})

// 删除任务
TaskUpdate({
  taskId: "1",
  status: "deleted"
})
```

## 任务依赖关系

### 设置依赖

```javascript
// 任务2 依赖任务1（任务1完成后才能开始任务2）
TaskUpdate({
  taskId: "2",
  addBlockedBy: ["1"]
})

// 任务1 阻塞任务2
TaskUpdate({
  taskId: "1",
  addBlocks: ["2"]
})
```

### 依赖关系示例

```
任务1：实现CRUD功能（developer）
  ↓ 完成后解锁
任务2：测试CRUD功能（tester）
  ↓ 完成后解锁
任务3：修复发现的Bug（developer）
  ↓ 完成后解锁
任务4：验证修复（tester）
```

## 完整任务管理示例

### 示例：开发测试流程

```javascript
// 1. 创建开发任务
TaskCreate({
  subject: "实现司机管理的CRUD功能",
  description: `需要实现：
1. Driver Entity/Bo/Vo
2. DriverController
3. DriverService
4. DriverMapper`,
  activeForm: "实现司机管理CRUD"
})
// 返回 taskId: "1"

// 2. 创建测试任务（依赖开发任务）
TaskCreate({
  subject: "测试司机管理CRUD功能",
  description: `测试以下接口：
1. POST /driver/add
2. GET /driver/list
3. PUT /driver/edit
4. DELETE /driver/{id}`,
  activeForm: "测试司机管理CRUD"
})
// 返回 taskId: "2"

// 3. 设置依赖关系
TaskUpdate({
  taskId: "2",
  addBlockedBy: ["1"]
})

// 4. 分配开发任务
TaskUpdate({
  taskId: "1",
  owner: "developer",
  status: "in_progress"
})

// 5. 通知开发者
SendMessage({
  type: "message",
  recipient: "developer",
  content: "请实现任务 #1：司机管理的CRUD功能",
  summary: "分配开发任务"
})

// 6. 等待开发完成...

// 7. 开发完成后，分配测试任务
TaskUpdate({
  taskId: "2",
  owner: "tester",
  status: "in_progress"
})

// 8. 通知测试者
SendMessage({
  type: "message",
  recipient: "tester",
  content: "开发已完成，请测试任务 #2：司机管理CRUD功能",
  summary: "分配测试任务"
})
```

## 最佳实践

### 1. 任务粒度

- 每个任务应该是独立可完成的
- 避免任务过大（超过一天的工作量）
- 避免任务过小（几分钟就能完成）

### 2. 任务描述

- 清晰说明需求
- 提供验收标准
- 注明注意事项
- 提供参考资料

### 3. 任务分配

- 根据成员职责分配
- 一次只分配一个任务给一个成员
- 分配后发送消息通知

### 4. 任务跟踪

- 定期使用 TaskList 查看进度
- 及时更新任务状态
- 发现阻塞时及时处理

### 5. 任务依赖

- 明确设置依赖关系
- 避免循环依赖
- 优先完成阻塞其他任务的任务

## 常见问题

### 问题1：任务没有被成员接收

**症状**: 分配任务后成员没有响应

**解决方案**:
1. 使用 SendMessage 发送消息通知成员
2. 确认成员名称正确
3. 检查成员是否处于 idle 状态（正常）

### 问题2：任务状态没有更新

**症状**: 成员完成任务但状态仍为 in_progress

**解决方案**:
1. 成员需要使用 TaskUpdate 更新状态
2. 在成员的 prompt 中明确说明完成任务后需要更新状态

### 问题3：依赖任务没有解锁

**症状**: 前置任务完成后，后续任务仍然被阻塞

**解决方案**:
1. 确认前置任务状态已更新为 completed
2. 使用 TaskList 查看依赖关系
3. 手动分配后续任务

## 相关文档

- [团队创建](team-creation.md)
- [成员协作](member-collaboration.md)
- [消息通信](messaging.md)
- [完整工作流程](workflow.md)
