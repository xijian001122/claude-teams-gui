# 常见问题

## 概述

本文档收录 Agent Teams 使用中的常见问题和解决方案。

## 团队创建问题

### Q1：TeamCreate 失败

**症状**: TeamCreate 工具返回错误

**可能原因**:
- 团队名称包含特殊字符
- 团队名称已存在

**解决方案**:
1. 使用 kebab-case 命名（如 dev-test-team）
2. 避免使用特殊字符
3. 如果名称已存在，使用不同的名称

### Q2：Agent spawn 失败

**症状**: Agent 工具返回 "InputValidationError"

**可能原因**:
- 缺少必需参数（name、description、prompt）
- team_name 不存在

**解决方案**:
```javascript
// 确保提供所有必需参数
Agent({
  name: "developer",           // 必需
  description: "开发者",        // 必需
  prompt: "你的职责是...",      // 必需
  subagent_type: "general-purpose",
  team_name: "my-team"         // 必需
})
```

### Q3：成员 spawn 后没有响应

**症状**: 成员 spawn 成功但没有发送就绪消息

**解释**: 这是正常的。成员 spawn 后会进入 idle 状态，等待任务分配。

**解决方案**:
1. 等待成员发送 idle 通知
2. 使用 TaskCreate 创建任务
3. 使用 TaskUpdate 分配任务
4. 使用 SendMessage 通知成员

## 任务管理问题

### Q4：任务没有被成员接收

**症状**: 分配任务后成员没有开始工作

**可能原因**:
- 没有发送消息通知成员
- 成员处于 idle 状态（正常）

**解决方案**:
```javascript
// 分配任务后，发送消息通知
TaskUpdate({
  taskId: "1",
  owner: "developer",
  status: "in_progress"
})

SendMessage({
  type: "message",
  recipient: "developer",
  content: "请处理任务 #1：...",
  summary: "分配任务 #1"
})
```

### Q5：任务状态没有更新

**症状**: 成员完成任务但状态仍为 in_progress

**原因**: 成员没有调用 TaskUpdate 更新状态

**解决方案**:
1. 在成员 prompt 中明确要求完成后更新状态
2. 手动更新任务状态：
```javascript
TaskUpdate({
  taskId: "1",
  status: "completed"
})
```

### Q6：依赖任务没有解锁

**症状**: 前置任务完成后，后续任务仍然被阻塞

**解决方案**:
1. 确认前置任务状态已更新为 completed
2. 使用 TaskList 查看依赖关系
3. 手动分配后续任务

## 通信问题

### Q7：收到 JSON 格式的 idle 通知

**症状**: 收到类似以下消息：
```json
{"type":"idle_notification","from":"developer","timestamp":"...","idleReason":"available"}
```

**解释**: 这是正常的 idle 通知，表示成员已完成当前工作，等待新任务。

**处理方式**: 不需要回应，继续分配任务即可。

### Q8：消息发送失败

**症状**: SendMessage 返回错误

**可能原因**:
- recipient 名称错误
- 成员已关闭

**解决方案**:
1. 检查成员名称是否正确（区分大小写）
2. 确认成员仍然活跃

### Q9：关闭请求没有响应

**症状**: 发送 shutdown_request 后没有收到 shutdown_response

**可能原因**:
- 成员正在处理任务
- 成员已经关闭

**解决方案**:
1. 等待成员完成当前任务
2. 重新发送关闭请求
3. 如果成员已完成所有工作，直接调用 TeamDelete

## Agent 类型问题

### Q10：成员无法写代码

**症状**: 成员报告无法创建或修改文件

**原因**: 使用了 Explore 或 Plan agent，这些类型没有写权限

**解决方案**: 开发和测试任务必须使用 general-purpose agent：
```javascript
Agent({
  name: "developer",
  subagent_type: "general-purpose",  // 必须使用 general-purpose
  ...
})
```

### Q11：成员无法执行 Bash 命令

**症状**: 成员报告无法运行命令

**原因**: 使用了 Explore agent

**解决方案**: 使用 general-purpose agent

## 团队关闭问题

### Q12：TeamDelete 失败

**症状**: TeamDelete 返回错误，提示团队还有活跃成员

**解决方案**:
1. 向所有成员发送 shutdown_request
2. 等待所有成员响应
3. 再次调用 TeamDelete

```javascript
// 1. 发送关闭请求
SendMessage({
  type: "shutdown_request",
  recipient: "developer",
  content: "任务完成，准备关闭"
})

SendMessage({
  type: "shutdown_request",
  recipient: "tester",
  content: "任务完成，准备关闭"
})

// 2. 等待响应...

// 3. 删除团队
TeamDelete()
```

## 性能问题

### Q13：团队响应慢

**可能原因**:
- 成员数量过多
- 任务描述过于复杂
- 频繁使用 broadcast

**解决方案**:
1. 减少团队成员数量（2-4 人最佳）
2. 简化任务描述
3. 使用 message 代替 broadcast

### Q14：Token 消耗过多

**可能原因**:
- 频繁使用 broadcast
- 任务描述过长
- 不必要的消息

**解决方案**:
1. 优先使用 message 而非 broadcast
2. 精简任务描述
3. 避免重复发送消息

## 官方文档限制（重要）

### Q15：会话恢复后成员消失

**症状**: 重新启动会话后，尝试向成员发送消息失败

**原因**: **In-process 队友不支持会话恢复**。这是 Agent Teams 的已知限制，`/resume` 和 `/rewind` 不会恢复队友。

**解决方案**: 每次新会话都必须重新创建团队：
1. 清理旧团队（`TeamDelete()` 或手动删除目录）
2. 重新创建团队（`TeamCreate()`）
3. 重新 spawn 成员

**参考**: [团队重用](team-reuse.md)

### Q16：任务状态卡住不更新

**症状**: 成员已完成工作，但任务状态仍为 in_progress

**原因**: 这是 Agent Teams 的已知问题，任务状态可能滞后。

**解决方案**:
1. 检查工作是否实际完成
2. 手动更新任务状态：
```javascript
TaskUpdate({ taskId: "1", status: "completed" })
```
3. 如果任务卡住，直接分配下一个任务

### Q17：成员关闭很慢

**症状**: 发送 shutdown_request 后，成员长时间不响应

**原因**: 成员可能在完成当前请求或工具调用，这可能需要时间。

**解决方案**:
1. 耐心等待（这是正常行为）
2. 如果任务不重要，可以直接 TeamDelete
3. 避免在成员处理复杂任务时关闭

### Q18：同时创建多个团队失败

**症状**: 尝试创建第二个团队时失败

**原因**: **每个会话只能管理一个团队**。

**解决方案**:
1. 先关闭当前团队（TeamDelete）
2. 再创建新团队
3. 或者在不同会话中创建不同团队

### Q19：成员尝试创建子团队

**症状**: 成员报告无法创建新的 Agent Team

**原因**: **队友无法生成自己的团队或队友**。只有 team-lead 可以管理团队。

**解决方案**: 所有团队管理操作必须由 team-lead 执行。

### Q20：成员权限无法单独设置

**症状**: 想要在 spawn 时为不同成员设置不同权限模式

**原因**: **所有队友从负责人的权限模式开始**。生成时无法设置每个队友的权限。

**解决方案**:
1. 生成后使用权限设置更改个别队友模式
2. 或者在会话启动时设置好负责人权限

## 相关文档

- [团队创建](team-creation.md)
- [团队重用](team-reuse.md)
- [任务管理](task-management.md)
- [成员协作](member-collaboration.md)
- [消息通信](messaging.md)
- [完整工作流程](workflow.md)
- [最佳实践](best-practices.md)
