# 完整工作流程

## 概述

本文档描述 Agent Teams 的端到端协作流程，从创建团队到关闭团队的完整过程。

## 标准工作流程

### 阶段1：准备阶段

**目标**: 创建团队和成员，准备开始工作

```
1. 分析任务需求
2. 确定需要哪些角色
3. 创建团队
4. Spawn 团队成员
5. 等待成员就绪
```

**示例**:
```javascript
// 1. 创建团队
TeamCreate({
  team_name: "feature-dev-team",
  description: "功能开发团队"
})

// 2. Spawn 开发者
Agent({
  name: "developer",
  description: "开发者 - 负责功能实现",
  prompt: "...",
  subagent_type: "general-purpose",
  team_name: "feature-dev-team"
})

// 3. Spawn 测试者
Agent({
  name: "tester",
  description: "测试者 - 负责测试验证",
  prompt: "...",
  subagent_type: "general-purpose",
  team_name: "feature-dev-team"
})

// 4. 等待成员就绪（收到 idle 通知）
```

### 阶段2：规划阶段

**目标**: 创建任务并设置依赖关系

```
1. 分解任务
2. 创建任务列表
3. 设置任务依赖
4. 确认任务顺序
```

**示例**:
```javascript
// 1. 创建开发任务
TaskCreate({
  subject: "实现司机管理的CRUD功能",
  description: `## ⚠️ 指令：强制技能激活流程（必须执行）

在开始实施任务前，你**必须**按以下步骤操作：

### 步骤 1 - 评估技能需求
根据任务内容，判断需要激活哪些技能。

### 步骤 2 - 激活技能
使用 Skill 工具激活所需技能：

Skill("crud-development")
Skill("database-ops")
Skill("api-development")
Skill("backend-annotations")


### 步骤 3 - 读取技能文档（必须）
激活技能后，**必须**读取技能的 QUICK_REF.md 和相关 docs/ 文档。

### 步骤 4 - 读取 OpenSpec 提案（如有）
如果任务来自 OpenSpec 提案：
# 如果不在提案分支，先调用：
/opsx:continue {change-id}

# 然后执行任务：
/opsx:apply {change-id}
该命令会自动激活所需技能并读取提案文档。


### 步骤 5 - 实施任务
按照技能规范实现司机管理的CRUD功能：
- 创建 Entity/BO/VO/Mapper
- 实现 Service 接口和实现类
- 实现 Controller（含 @SaCheckPermission）

验收标准：
- 禁止 JOIN，使用应用层组装
- @author 使用 zhangjiazheng`,
  activeForm: "实现司机管理CRUD"
})
// taskId: "1"

// 2. 创建测试任务
TaskCreate({
  subject: "测试司机管理CRUD功能",
  description: `## ⚠️ 指令：强制技能激活流程（必须执行）

在开始测试前，你**必须**按以下步骤操作：

### 步骤 1 - 激活技能
Skill("testing-standards")

### 步骤 2 - 读取技能文档（必须）
Read(".claude/skills/testing-standards/QUICK_REF.md")

### 步骤 3 - 实施测试
- 编写 HdDriverServiceTest 单元测试
- 覆盖正常流程、边界条件、异常情况
- 确保覆盖率 ≥ 80%`,
  activeForm: "测试司机管理CRUD"
})
// taskId: "2"

// 3. 设置依赖（测试依赖开发）
TaskUpdate({
  taskId: "2",
  addBlockedBy: ["1"]
})
```

### 阶段3：执行阶段

**目标**: 分配任务，协调成员工作

```
1. 分配第一批任务
2. 通知成员
3. 监控进度
4. 处理阻塞
5. 分配后续任务
```

**示例**:
```javascript
// 1. 分配开发任务
TaskUpdate({
  taskId: "1",
  owner: "developer",
  status: "in_progress"
})

// 2. 通知开发者
SendMessage({
  type: "message",
  recipient: "developer",
  content: `任务 #1 已分配给你：实现司机管理CRUD功能

📋 OpenSpec 提案：add-driver-mgmt（如有）

🔧 开始前请按顺序执行：

【第一步：读取提案（如果不在提案分支）】
如果不在 add-driver-mgmt 分支，请先调用：
  /opsx:continue add-driver-mgmt
已在该分支则跳过。

【第二步：实施任务】
调用以下命令开始实施：
  /opsx:apply add-driver-mgmt

该命令会自动：
- 激活所需技能（crud-development、database-ops、api-development、backend-annotations）
- 读取提案和设计文档
- 按任务列表逐步实施

⚠️ 注意事项：
- 禁止使用 JOIN，使用应用层组装
- @author 使用 zhangjiazheng

完成后 TaskUpdate 标记完成并通知我。`,
  summary: "分配开发任务 #1"
})

// 3. 等待开发完成...
// （收到 developer 的完成通知）

// 4. 分配测试任务
TaskUpdate({
  taskId: "2",
  owner: "tester",
  status: "in_progress"
})

// 5. 通知测试者
SendMessage({
  type: "message",
  recipient: "tester",
  content: `任务 #2 已分配给你：测试司机管理CRUD功能

📋 OpenSpec 提案：add-driver-mgmt（如有）

🔧 开始前请按顺序执行：

【第一步：读取提案（如果不在提案分支）】
如果不在 add-driver-mgmt 分支，请先调用：
  /opsx:continue add-driver-mgmt

【第二步：实施测试】
调用以下命令开始测试：
  /opsx:apply add-driver-mgmt

该命令会自动激活测试技能并按任务列表执行测试。

完成后 TaskUpdate 标记完成并通知我。`,
  summary: "分配测试任务 #2"
})
```

### 阶段4：修复阶段（如需要）

**目标**: 处理测试发现的问题

```
1. 接收测试报告
2. 创建修复任务
3. 分配给开发者
4. 验证修复
```

**示例**:
```javascript
// 1. 收到测试报告（来自 tester 的消息）

// 2. 创建修复任务
TaskCreate({
  subject: "修复司机管理接口Bug",
  description: "修复以下问题：\n1. 参数验证缺失\n2. 分页不生效",
  activeForm: "修复司机管理Bug"
})
// taskId: "3"

// 3. 分配给开发者
TaskUpdate({
  taskId: "3",
  owner: "developer",
  status: "in_progress"
})

// 4. 通知开发者
SendMessage({
  type: "message",
  recipient: "developer",
  content: "请修复任务 #3：司机管理接口Bug\n\n问题：...",
  summary: "分配修复任务 #3"
})

// 5. 等待修复完成...

// 6. 分配验证任务给测试者
SendMessage({
  type: "message",
  recipient: "tester",
  content: "Bug已修复，请重新验证",
  summary: "请求重新验证"
})
```

### 阶段5：收尾阶段

**目标**: 确认所有任务完成，关闭团队

```
1. 确认所有任务完成
2. 向成员发送关闭请求
3. 等待成员响应
4. 删除团队
```

**示例**:
```javascript
// 1. 查看任务状态
TaskList()

// 2. 确认所有任务完成后，发送关闭请求
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

## 典型场景

### 场景1：简单功能开发

```
准备 → 创建任务 → 开发 → 测试 → 完成
```

**时间线**:
1. 创建团队（developer + tester）
2. 创建开发任务
3. developer 实现功能
4. developer 完成，通知 team-lead
5. 创建测试任务，分配给 tester
6. tester 测试通过
7. 关闭团队

### 场景2：有Bug的功能开发

```
准备 → 创建任务 → 开发 → 测试 → 修复 → 验证 → 完成
```

**时间线**:
1. 创建团队（developer + tester）
2. 创建开发任务
3. developer 实现功能
4. tester 测试，发现 Bug
5. developer 修复 Bug
6. tester 重新验证
7. 验证通过，关闭团队

### 场景3：并行开发

```
准备 → 并行开发（前端 + 后端）→ 集成测试 → 完成
```

**时间线**:
1. 创建团队（frontend-dev + backend-dev + tester）
2. 同时创建前端和后端任务
3. frontend-dev 和 backend-dev 并行开发
4. 两者都完成后，tester 进行集成测试
5. 测试通过，关闭团队

## 进度监控

### 定期检查

```javascript
// 查看所有任务状态
TaskList()

// 查看特定任务详情
TaskGet({ taskId: "1" })
```

### 处理阻塞

当任务被阻塞时：
1. 识别阻塞原因
2. 解决阻塞（修复依赖任务、提供资源等）
3. 通知相关成员继续工作

## 最佳实践

### 1. 任务分解

- 将大任务分解为小任务
- 每个任务有明确的完成标准
- 设置合理的依赖关系

### 2. 及时沟通

- 分配任务后立即通知成员
- 成员完成任务后立即通知 team-lead
- 遇到问题及时报告

### 3. 并行工作

- 识别可以并行的任务
- 同时分配给不同成员
- 提高整体效率

### 4. 清晰的验收标准

- 每个任务都有明确的验收标准
- 测试者知道如何验证功能
- 避免模糊的需求

## 相关文档

- [团队创建](team-creation.md)
- [任务管理](task-management.md)
- [成员协作](member-collaboration.md)
- [消息通信](messaging.md)
- [最佳实践](best-practices.md)
