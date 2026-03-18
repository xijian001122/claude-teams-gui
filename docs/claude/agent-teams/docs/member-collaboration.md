# 成员协作

## 概述

本文档描述 Agent Teams 中成员之间的协作模式和规范。

## 协作角色

### 团队领导（Team Lead）

**职责**:
- 创建和管理团队
- 创建和分配任务
- 协调成员工作
- 处理阻塞和问题
- 关闭团队

**工具**:
- TeamCreate / TeamDelete
- Agent（spawn 成员）
- TaskCreate / TaskUpdate / TaskList
- SendMessage

### 开发者（Developer）

**职责**:
- 实现功能代码
- 修复 Bug
- 遵循代码规范
- 完成后通知 team-lead

**工具**:
- Read / Edit / Write / Bash（所有工具）
- TaskUpdate（更新任务状态）
- SendMessage（通知 team-lead）

### 测试者（Tester）

**职责**:
- 编写测试用例
- 执行测试
- 报告 Bug
- 验证修复

**工具**:
- Read / Edit / Write / Bash（所有工具）
- TaskUpdate（更新任务状态）
- SendMessage（通知 team-lead）

## 协作流程

### 1. 任务接收

成员收到任务后：
1. 使用 TaskGet 获取任务详情
2. 使用 TaskUpdate 标记为 in_progress
3. 开始工作

```javascript
// 成员接收任务
TaskGet({ taskId: "1" })

TaskUpdate({
  taskId: "1",
  status: "in_progress"
})
```

### 2. 任务完成

成员完成任务后：
1. 使用 TaskUpdate 标记为 completed
2. 使用 SendMessage 通知 team-lead

```javascript
// 成员完成任务
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

### 3. 问题报告

成员遇到问题时：
1. 描述问题
2. 使用 SendMessage 通知 team-lead

```javascript
SendMessage({
  type: "message",
  recipient: "team-lead",
  content: `任务 #1 遇到问题：

问题：不确定如何处理分库分表的关联查询
当前状态：已实现基础CRUD，但关联查询部分卡住了

请提供指导。`,
  summary: "请求技术指导"
})
```

### 4. 测试报告

测试者完成测试后：
1. 总结测试结果
2. 列出发现的问题
3. 通知 team-lead

```javascript
SendMessage({
  type: "message",
  recipient: "team-lead",
  content: `任务 #2 测试完成

测试结果：
✅ POST /driver/add - 通过
✅ GET /driver/list - 通过
❌ PUT /driver/edit - 失败（缺少参数验证）
❌ DELETE /driver/{id} - 失败（没有权限检查）

发现 2 个 Bug，需要开发者修复。`,
  summary: "测试完成，发现2个Bug"
})
```

## 协作模式

### 模式1：串行协作

```
team-lead → developer → tester → team-lead
```

适用场景：
- 功能开发 + 测试
- 有明确的前后依赖关系

### 模式2：并行协作

```
team-lead → developer（前端）
         → developer（后端）
         → tester（集成测试）
```

适用场景：
- 前后端并行开发
- 多个独立功能同时开发

### 模式3：迭代协作

```
team-lead → developer → tester → developer（修复）→ tester（验证）
```

适用场景：
- 有 Bug 需要修复
- 需要多轮迭代

## 成员间直接通信

成员可以直接发消息给其他成员（不通过 team-lead）：

```javascript
// developer 直接通知 tester
SendMessage({
  type: "message",
  recipient: "tester",
  content: "功能已实现，可以开始测试了",
  summary: "通知测试者开始测试"
})
```

**注意**: 成员间的直接通信会在 idle 通知中以摘要形式显示给 team-lead。

## 任务自主认领

成员可以主动查看任务列表并认领任务：

```javascript
// 成员查看可用任务
TaskList()

// 认领未分配的任务
TaskUpdate({
  taskId: "3",
  owner: "developer",
  status: "in_progress"
})
```

**前提条件**:
- 任务状态为 pending
- 任务没有 owner
- 任务没有未完成的依赖（blockedBy 为空）

## 最佳实践

### 1. 及时更新状态

- 开始任务时立即标记为 in_progress
- 完成任务时立即标记为 completed
- 不要让任务长时间处于 in_progress 状态

### 2. 清晰的完成报告

完成任务时，报告应包含：
- 完成了什么
- 实现的文件路径
- 注意事项
- 是否有遗留问题

### 3. 详细的问题报告

遇到问题时，报告应包含：
- 问题描述
- 当前状态
- 已尝试的解决方案
- 需要什么帮助

### 4. 主动沟通

- 不要等待 team-lead 询问进度
- 完成里程碑时主动报告
- 遇到阻塞时立即报告

## 常见问题

### 问题1：成员不知道如何开始

**解决方案**: 在 prompt 中明确说明工作流程，包括如何接收任务、如何报告完成

### 问题2：成员完成任务但没有通知

**解决方案**: 在 prompt 中明确要求完成后使用 SendMessage 通知 team-lead

### 问题3：成员间协作不顺畅

**解决方案**: 明确定义协作边界，使用任务依赖关系管理工作流程

## 相关文档

- [团队创建](team-creation.md)
- [任务管理](task-management.md)
- [消息通信](messaging.md)
- [完整工作流程](workflow.md)
