# 任务管理

## 概述

本文档详细说明如何创建、分配和跟踪任务。

## 创建任务

### 使用 TaskCreate 工具

```javascript
TaskCreate({
  subject: "实现消息气泡组件",       // 任务标题（必需）
  description: "详细描述...",        // 详细描述（必需）
  activeForm: "实现消息气泡组件"     // 进行中显示的文字（可选）
})
```

**参数说明**:
- `subject`: 简短的任务标题，使用祈使语气
- `description`: 详细的需求描述、验收标准等
- `activeForm`: 进行中时显示的文字（如"实现消息气泡组件"）

### 任务描述模板

```javascript
TaskCreate({
  subject: "实现消息气泡组件",
  description: `## 任务需求

需要实现以下功能：
1. 创建 MessageBubble 组件
2. 显示消息内容、发送者、时间戳
3. 支持 @ 提及高亮
4. 响应式布局

## 验收标准

- 组件正常渲染
- 样式符合设计
- 支持 WebSocket 实时更新

## 参考

- src/client/components/ 目录下的现有组件
- /frontend-dev 技能文档`,
  activeForm: "实现消息气泡组件"
})
```

## 分配任务

### 使用 TaskUpdate 工具

```javascript
// 分配任务给成员
TaskUpdate({
  taskId: "1",
  owner: "frontend-dev",       // 成员名称
  status: "in_progress"        // 状态
})
```

### 通知成员

分配任务后，应该发送消息通知成员：

```javascript
SendMessage({
  to: "frontend-dev",
  message: `任务 #1 已分配给你：实现消息气泡组件

🔧 开始前请：
1. 激活技能：/frontend-dev
2. 阅读组件规范

完成后 TaskUpdate 标记完成并通知我。`,
  summary: "分配任务 #1"
})
```

## 设置任务依赖

```javascript
// 创建测试任务（依赖开发任务）
TaskCreate({
  subject: "测试消息气泡组件",
  description: "测试以下功能...",
  activeForm: "测试消息气泡组件"
})
// taskId: "2"

// 设置依赖
TaskUpdate({
  taskId: "2",
  addBlockedBy: ["1"]          // 任务2依赖任务1
})
```

## 跟踪任务

### 查看所有任务

```javascript
TaskList()
```

### 查看任务详情

```javascript
TaskGet({
  taskId: "1"
})
```

### 更新任务状态

```javascript
// 标记完成
TaskUpdate({
  taskId: "1",
  status: "completed"
})

// 标记进行中
TaskUpdate({
  taskId: "2",
  status: "in_progress"
})

// 删除任务
TaskUpdate({
  taskId: "3",
  status: "deleted"
})
```

## 任务状态

| 状态 | 说明 | 何时使用 |
|------|------|---------|
| pending | 待处理 | TaskCreate 创建时的默认状态 |
| in_progress | 进行中 | 成员开始工作时设置 |
| completed | 已完成 | 成员完成任务时设置 |
| deleted | 已删除 | 任务不再需要时删除 |

**工作流程**:
```
pending → in_progress → completed
   ↓
deleted（如果不需要）
```

## 最佳实践

### 1. 任务大小适中

- 不要太大（难以跟踪）
- 不要太小（管理开销大）
- 每个任务应该是一个可独立完成的单元

### 2. 清晰的验收标准

- 明确定义完成条件
- 包含具体的测试点
- 避免模糊的描述

### 3. 合理的依赖关系

- 避免循环依赖
- 明确任务执行顺序
- 并行任务不设置依赖

### 4. 及时更新状态

- 开始工作时立即更新为 in_progress
- 完成时立即更新为 completed
- 保持任务列表的最新状态
