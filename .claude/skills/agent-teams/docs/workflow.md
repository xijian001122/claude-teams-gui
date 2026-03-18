# 完整工作流程

## 概述

本文档描述 Agent Teams 的端到端协作流程，从创建团队到关闭团队的完整过程。

## ⚠️ OpenSpec 强制规范

**所有任务分配必须遵循 OpenSpec 工作流：**

1. **Team-lead 执行 `openspec list` 确认变更**
2. **分配任务时告知成员 change-name**
3. **成员执行 `/opsx:apply <change-name>`**
4. **完成后更新 tasks.md**

## 标准工作流程

### 阶段1：准备阶段

**目标**: 创建团队和四角色成员，准备开始工作

```javascript
// 1. 创建团队
TeamCreate({
  team_name: "claude-teams-gui",
  description: "前后端开发测试修复协作团队"
})

// 2. Spawn 前端开发者
Agent({
  name: "frontend-dev",
  description: "前端开发者 - 负责UI实现",
  prompt: "...",
  subagent_type: "general-purpose",
  model: "kimi-k2.5",
  team_name: "claude-teams-gui"
})

// 3. Spawn 后端开发者
Agent({
  name: "backend-dev",
  description: "后端开发者 - 负责API和服务",
  prompt: "...",
  subagent_type: "general-purpose",
  model: "glm-5",
  team_name: "claude-teams-gui"
})

// 4. Spawn 测试者
Agent({
  name: "tester",
  description: "测试者 - 负责测试验证",
  prompt: "...",
  subagent_type: "general-purpose",
  model: "glm-5",
  team_name: "claude-teams-gui"
})

// 5. Spawn Bug修复者
Agent({
  name: "bug-fixer",
  description: "Bug修复者 - 负责问题修复",
  prompt: "...",
  subagent_type: "general-purpose",
  model: "glm-5",
  team_name: "claude-teams-gui"
})
```

### 阶段2：确认变更阶段（OpenSpec 强制）

**目标**: 确认 OpenSpec 变更名称

```bash
# Team-lead 执行
openspec list
```

**处理结果**：
- 如果有多个变更 → 使用 AskUserQuestion 询问用户确认
- 如果只有一个变更 → 直接使用
- 如果没有变更 → 询问用户是否需要创建提案

**确认后记录 change-name，后续分配任务时使用。**

### 阶段3：执行阶段

**目标**: 分配任务，协调成员工作

```javascript
// 1. 分配任务
TaskUpdate({
  taskId: "1",
  owner: "backend-dev",
  status: "in_progress"
})

// 2. 通知后端开发者（必须包含 change-name）
SendMessage({
  to: "backend-dev",
  message: `任务 #1 已分配给你：实现消息 API

📋 OpenSpec 变更：<change-name>

🔧 执行命令：
  /opsx:apply <change-name>

完成后 TaskUpdate 标记 completed 并通知我。`,
  summary: "分配任务 #1（OpenSpec: <change-name>）"
})
```

### 阶段4：测试阶段

**目标**: 测试已完成的功能

```javascript
// 1. 分配测试任务
TaskUpdate({
  taskId: "3",
  owner: "tester",
  status: "in_progress"
})

// 2. 通知测试者（包含 change-name）
SendMessage({
  to: "tester",
  message: `任务 #3 已分配给你：测试消息功能

📋 OpenSpec 变更：<change-name>

🔧 执行命令：
  /opsx:apply <change-name>

完成后 TaskUpdate 标记 completed 并通知我测试结果。`,
  summary: "分配测试任务 #3（OpenSpec: <change-name>）"
})
```

### 阶段5：修复阶段（如需要）

**目标**: 处理测试发现的问题

```javascript
// 1. 分配修复任务
TaskUpdate({
  taskId: "4",
  owner: "bug-fixer",
  status: "in_progress"
})

// 2. 通知修复（包含 change-name）
SendMessage({
  to: "bug-fixer",
  message: `任务 #4 已分配给你：修复消息显示Bug

📋 OpenSpec 变更：<change-name>

🔧 执行命令：
  /opsx:apply <change-name>

完成后 TaskUpdate 标记 completed 并通知我修复结果。`,
  summary: "分配修复任务 #4（OpenSpec: <change-name>）"
})
```

### 阶段6：收尾阶段

**目标**: 确认所有任务完成，关闭团队

```javascript
// 1. 查看任务状态
TaskList()

// 2. 确认所有任务完成后，发送关闭请求（四角色）
SendMessage({
  to: "frontend-dev",
  message: {
    type: "shutdown_request",
    reason: "所有任务已完成，准备关闭团队"
  }
})

SendMessage({
  to: "backend-dev",
  message: {
    type: "shutdown_request",
    reason: "所有任务已完成，准备关闭团队"
  }
})

SendMessage({
  to: "tester",
  message: {
    type: "shutdown_request",
    reason: "所有任务已完成，准备关闭团队"
  }
})

SendMessage({
  to: "bug-fixer",
  message: {
    type: "shutdown_request",
    reason: "所有任务已完成，准备关闭团队"
  }
})

// 3. 等待成员响应...

// 4. 删除团队
TeamDelete()
```

## 典型场景

### 场景1：OpenSpec 变更实施（标准流程）

```
确认变更 → 分配任务 → 成员执行 /opsx:apply → 完成 → 归档
```

**时间线**:
1. Team-lead 执行 `openspec list` 确认 change-name
2. 创建团队（四角色）
3. 分配任务，告知成员 change-name
4. 成员执行 `/opsx:apply <change-name>`
5. 完成后归档：`/opsx:archive <change-name>`
6. 关闭团队

### 场景2：完整开发流程（推荐）

```
确认变更 → 开发 → 测试 → 修复（如需要）→ 验证 → 归档 → 完成
```

**时间线**:
1. Team-lead 确认变更
2. backend-dev 执行 `/opsx:apply <change-name>` → API 实现
3. frontend-dev 执行 `/opsx:apply <change-name>` → UI 实现
4. tester 执行 `/opsx:apply <change-name>` → 功能测试
5. bug-fixer 执行 `/opsx:apply <change-name>` → 修复问题（如有）
6. 归档变更
7. 关闭团队

## 进度监控

```javascript
// 查看所有任务状态
TaskList()

// 查看特定任务详情
TaskGet({ taskId: "1" })
```

## 最佳实践

### 1. OpenSpec 规范

- **Team-lead 必须先确认 change-name**
- **分配任务时必须告知成员 change-name**
- **成员必须使用 `/opsx:apply` 而非直接实现**
- **完成后必须更新 tasks.md**

### 2. 及时沟通

- 分配任务后立即通知成员
- 成员完成任务后立即通知 team-lead
- 遇到问题及时报告

### 3. 清晰的验收标准

- 每个任务都有明确的验收标准
- 避免模糊的需求
