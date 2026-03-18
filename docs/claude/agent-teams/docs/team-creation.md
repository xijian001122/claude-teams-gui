# 团队创建

## 概述

本文档详细说明如何创建 Agent Teams 和 spawn 团队成员。

## 创建团队

### 使用 TeamCreate 工具

```javascript
TeamCreate({
  team_name: "my-team",           // 团队名称（必需）
  agent_type: "team-lead",        // 团队领导类型（可选）
  description: "团队描述"          // 团队描述（可选）
})
```

**参数说明**:
- `team_name`: 团队名称，使用 kebab-case（如 dev-test-team）
- `agent_type`: 团队领导的类型，默认为 "team-lead"
- `description`: 团队的描述，说明团队的用途

**返回结果**:
```json
{
  "team_name": "my-team",
  "team_file_path": "/root/.claude/teams/my-team/config.json",
  "lead_agent_id": "team-lead@my-team"
}
```

### 团队配置文件

团队创建后，会生成配置文件：`~/.claude/teams/{team-name}/config.json`

配置文件包含：
- 团队名称
- 成员列表
- 任务列表目录

## Spawn 团队成员

### 使用 Agent 工具

```javascript
Agent({
  name: "developer",                    // 成员名称（必需）
  description: "开发者 - 负责功能实现",  // 简短描述（必需）
  prompt: "详细的角色说明和职责...",     // 详细提示（必需）
  subagent_type: "general-purpose",    // Agent 类型（可选）
  model: "sonnet",                     // 模型（可选，默认继承父进程）
  team_name: "my-team"                 // 团队名称（必需）
})
```

**参数说明**:
- `name`: 成员名称，用于标识和通信
- `description`: 简短描述（3-5 词），用于工具调用
- `prompt`: 详细的角色说明，包括职责和工作方式
- `subagent_type`: Agent 类型，决定可用工具
- `model`: 模型别名（`"sonnet"`, `"haiku"`, `"opus"`）或完整 model ID（如 `"claude-sonnet-4-6"`）
- `team_name`: 所属团队名称

### ⚠️ 模型与 API Base URL 说明

**`model` 参数**（Agent 工具支持，✅ 已实验验证）:
- 通过 `model: "sonnet"` / `model: "haiku"` / `model: "opus"` 指定不同成员使用不同模型
- 也可传完整 model ID，如 `model: "claude-sonnet-4-6"`
- 每个 agent 成员可以独立指定模型，实现**按角色分配算力**（如 developer 用 sonnet，tester 用 haiku 节省成本）
- **实验验证**（2026-03-16）：`Agent(model: "sonnet")` → 子 agent 启动时带 `--model sonnet` → agent 实际使用 `claude-sonnet-4-6` ✅

**`ANTHROPIC_BASE_URL` 环境变量**（环境变量继承机制）:
- 子 agent 启动命令示例：
  ```bash
  env ANTHROPIC_BASE_URL=https://xxx.example.com/api \
      claude --agent-id tester@dev-test-team --model haiku
  ```
- `ANTHROPIC_BASE_URL` 从**父进程 shell 环境**自动继承，无法通过 Agent 工具单独设置
- **所有 agent 成员共享同一个 `ANTHROPIC_BASE_URL`**
- 如需给某个成员单独使用不同 API 地址（如 GLM），目前 Agent 工具不直接支持，需在启动 team-lead 时就配置好目标 base URL

**推荐配置方案**（按角色分配模型）:
```javascript
// developer 使用 sonnet（更强能力）
Agent({
  name: "developer",
  subagent_type: "general-purpose",
  model: "sonnet",   // 对应 claude-sonnet-4-6
  team_name: "dev-test-team"
})

// tester 使用 haiku（节省成本）
Agent({
  name: "tester",
  subagent_type: "general-purpose",
  model: "haiku",    // 对应 claude-haiku-4-5
  team_name: "dev-test-team"
})
```

**返回结果**:
```
Spawned successfully.
agent_id: developer@my-team
name: developer
team_name: my-team
The agent is now running and will receive instructions via mailbox.
```

## Agent 类型选择

### general-purpose（通用型）

**可用工具**: 所有工具（Read、Edit、Write、Bash、Glob、Grep 等）

**适用场景**:
- 功能开发
- Bug 修复
- 测试编写
- 代码重构
- 任何需要修改代码的任务

**示例**:
```javascript
Agent({
  name: "developer",
  description: "开发者",
  prompt: `你是团队的开发者，负责实现新功能和修复bug。
职责：
- 编写业务代码（Controller、Service、Mapper）
- 实现数据库操作和API接口
- 遵循项目的代码规范和架构模式
- 与测试人员协作，修复测试发现的问题`,
  subagent_type: "general-purpose",
  team_name: "dev-team"
})
```

### Explore（探索型）

**可用工具**: 只读工具（Glob、Grep、Read）

**适用场景**:
- 代码探索
- 架构研究
- 问题调查
- 文档查找
- 不需要修改代码的研究任务

**示例**:
```javascript
Agent({
  name: "researcher",
  description: "研究员",
  prompt: `你是团队的研究员，负责探索和分析代码。
职责：
- 探索代码库结构
- 分析现有实现
- 查找相关文档
- 提供研究报告`,
  subagent_type: "Explore",
  team_name: "research-team"
})
```

### Plan（规划型）

**可用工具**: 只读工具 + 规划工具

**适用场景**:
- 架构设计
- 实现规划
- 技术方案设计
- 需要规划但不实现的任务

**示例**:
```javascript
Agent({
  name: "architect",
  description: "架构师",
  prompt: `你是团队的架构师，负责设计技术方案。
职责：
- 设计系统架构
- 制定实现计划
- 评估技术方案
- 提供设计文档`,
  subagent_type: "Plan",
  team_name: "design-team"
})
```

## 成员职责定义

### 开发者（Developer）

**职责**:
- 实现新功能
- 修复 Bug
- 代码重构
- 遵循代码规范

**Prompt 模板**:
```
你是团队的开发者，负责实现新功能和修复bug。

职责：
1. 编写业务代码（Controller、Service、Mapper）
2. 实现数据库操作和API接口
3. 遵循项目的代码规范和架构模式
4. 与测试人员协作，修复测试发现的问题

工作流程：
- 收到任务后，先阅读需求
- 按照项目规范实现代码
- 完成后通知测试人员进行测试
- 根据测试反馈修复问题

请等待任务分配。
```

### 测试者（Tester）

**职责**:
- 编写测试用例
- 执行测试
- 发现并报告 Bug
- 验证修复

**Prompt 模板**:
```
你是团队的测试人员，负责验证功能的正确性。

职责：
1. 编写单元测试和集成测试
2. 执行测试并验证功能
3. 发现并报告bug
4. 与开发人员协作修复问题

工作流程：
- 收到测试任务后，理解功能需求
- 编写测试用例
- 运行测试并记录结果
- 如果发现问题，通知开发人员
- 验证修复后重新测试

请等待任务分配。
```

### 前端开发者（Frontend Developer）

**职责**:
- 实现前端页面
- 对接后端 API
- 优化用户体验

**Prompt 模板**:
```
你是团队的前端开发者，负责实现用户界面。

职责：
1. 实现前端页面和组件
2. 对接后端API接口
3. 优化用户体验和性能
4. 遵循前端开发规范

工作流程：
- 收到任务后，理解UI需求
- 实现页面和组件
- 对接后端API
- 测试功能和交互

请等待任务分配。
```

### 后端开发者（Backend Developer）

**职责**:
- 实现后端 API
- 数据库设计
- 业务逻辑实现

**Prompt 模板**:
```
你是团队的后端开发者，负责实现服务端功能。

职责：
1. 实现REST API接口
2. 设计数据库表结构
3. 实现业务逻辑
4. 遵循后端开发规范

工作流程：
- 收到任务后，理解业务需求
- 设计数据库表结构
- 实现API接口
- 编写单元测试

请等待任务分配。
```

## 完整示例

### 示例1：开发测试团队

```javascript
// 1. 创建团队
TeamCreate({
  team_name: "dev-test-team",
  description: "开发和测试协作团队"
})

// 2. Spawn 开发者
Agent({
  name: "developer",
  description: "开发者 - 负责功能实现",
  prompt: `你是团队的开发者，负责实现新功能和修复bug。
职责：
- 编写业务代码（Controller、Service、Mapper）
- 实现数据库操作和API接口
- 遵循项目的代码规范和架构模式
- 与测试人员协作，修复测试发现的问题

工作流程：
- 收到任务后，先阅读需求
- 按照项目规范实现代码
- 完成后通知测试人员进行测试
- 根据测试反馈修复问题

请等待任务分配。`,
  subagent_type: "general-purpose",
  team_name: "dev-test-team"
})

// 3. Spawn 测试者
Agent({
  name: "tester",
  description: "测试者 - 负责测试验证",
  prompt: `你是团队的测试人员，负责验证功能的正确性。
职责：
- 编写单元测试和集成测试
- 执行测试并验证功能
- 发现并报告bug
- 与开发人员协作修复问题

工作流程：
- 收到测试任务后，理解功能需求
- 编写测试用例
- 运行测试并记录结果
- 如果发现问题，通知开发人员
- 验证修复后重新测试

请等待任务分配。`,
  subagent_type: "general-purpose",
  team_name: "dev-test-team"
})
```

### 示例2：全栈开发团队

```javascript
// 1. 创建团队
TeamCreate({
  team_name: "fullstack-team",
  description: "前后端协作团队"
})

// 2. Spawn 前端开发者
Agent({
  name: "frontend-dev",
  description: "前端开发者",
  prompt: "负责实现前端页面和组件...",
  subagent_type: "general-purpose",
  team_name: "fullstack-team"
})

// 3. Spawn 后端开发者
Agent({
  name: "backend-dev",
  description: "后端开发者",
  prompt: "负责实现后端API和业务逻辑...",
  subagent_type: "general-purpose",
  team_name: "fullstack-team"
})
```

## 最佳实践

### 1. 团队命名

- 使用 kebab-case（如 dev-test-team）
- 名称要有意义，反映团队用途
- 避免使用特殊字符

### 2. 成员命名

- 使用简短、清晰的名称（如 developer、tester）
- 名称要反映成员角色
- 避免使用数字或特殊字符

### 3. Prompt 编写

- 清晰定义职责
- 说明工作流程
- 包含协作方式
- 提供具体指导

### 4. Agent 类型选择

- 需要修改代码 → general-purpose
- 只需要研究 → Explore
- 只需要规划 → Plan

### 5. 并行 Spawn

可以在一个消息中并行 spawn 多个成员：

```javascript
// 同时 spawn 两个成员
Agent({...})  // developer
Agent({...})  // tester
```

## 常见问题

### 问题1：成员 spawn 失败

**症状**: Agent 工具返回错误

**可能原因**:
- 缺少必需参数（name、description、prompt）
- team_name 不存在
- 参数格式错误

**解决方案**:
1. 检查所有必需参数是否提供
2. 确认团队已创建
3. 检查参数格式

### 问题2：成员没有响应

**症状**: 成员 spawn 成功但不响应

**可能原因**:
- 成员处于 idle 状态（正常）
- 没有分配任务
- 消息没有发送给正确的成员

**解决方案**:
1. 成员 idle 是正常的，等待任务分配
2. 使用 TaskCreate 创建任务
3. 使用 TaskUpdate 分配任务给成员
4. 使用 SendMessage 发送消息

### 问题3：选择错误的 Agent 类型

**症状**: 成员无法完成任务

**可能原因**:
- 使用 Explore agent 做开发任务（没有 Write 权限）
- 使用 Plan agent 做实现任务（没有 Write 权限）

**解决方案**:
1. 开发和测试任务使用 general-purpose
2. 研究任务使用 Explore
3. 规划任务使用 Plan

## 相关文档

- [任务管理](task-management.md)
- [成员协作](member-collaboration.md)
- [消息通信](messaging.md)
- [完整工作流程](workflow.md)
