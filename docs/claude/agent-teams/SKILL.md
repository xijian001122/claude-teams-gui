---
name: agent-teams
description: Agent Teams 协作规范 - 团队创建、任务分配、成员协作、消息通信
---

# Agent Teams 协作规范

**作用**: 规范 Agent Teams 的创建、使用和协作流程，实现多 Agent 并行开发和测试

**触发关键词**: agent teams、团队协作、多 agent、并行开发、任务分配、团队通信

## 核心规范速查

| 规范 | 说明 | 详细文档 |
|------|------|---------|
| 团队创建 | 创建和配置团队 | [docs/team-creation.md](docs/team-creation.md) |
| **团队重用** | **清理和重用现有团队** | **[docs/team-reuse.md](docs/team-reuse.md)** |
| 任务管理 | 创建和分配任务 | [docs/task-management.md](docs/task-management.md) |
| 成员协作 | 团队成员间协作 | [docs/member-collaboration.md](docs/member-collaboration.md) |
| 消息通信 | 消息发送和接收 | [docs/messaging.md](docs/messaging.md) |
| 工作流程 | 完整协作流程 | [docs/workflow.md](docs/workflow.md) |
| **OpenSpec 集成** | **从 OpenSpec 提案解析任务** | **[docs/openspec-integration.md](docs/openspec-integration.md)** |
| **决策修复** | **修复团队决策问题** | **[docs/teams-fix.md](docs/teams-fix.md)** |

## 快速检查清单

### 使用 OpenSpec 提案时（新增）
- [ ] 读取 `openspec/changes/{id}/tasks.md`
- [ ] 分类任务（开发任务 vs 测试任务）
- [ ] 确定每个任务需要的技能列表
- [ ] 创建 TaskCreate（合并相关小任务）
- [ ] 设置任务依赖（测试依赖开发）
- [ ] **分配前先在消息中告知成员需要激活哪些技能**

### 创建团队时
- [ ] **先检查是否有同名团队存在**
- [ ] **如有旧团队，先清理（发送 shutdown_request → TeamDelete）**
- [ ] 使用 TeamCreate 创建团队
- [ ] 使用 Agent 工具 spawn 团队成员
- [ ] 为每个成员指定明确的职责
- [ ] 选择合适的 subagent_type（general-purpose/Explore/Plan）
- [ ] 等待成员就绪通知

### 分配任务时
- [ ] 使用 TaskCreate 创建任务
- [ ] 任务描述清晰具体
- [ ] 使用 TaskUpdate 分配给合适的成员
- [ ] 设置任务依赖关系（如需要）
- [ ] **⚠️ 发送消息时必须包含需要激活的技能列表**
- [ ] 使用 TaskList 查看任务状态

### 团队协作时
- [ ] 使用 SendMessage 与成员通信
- [ ] 成员完成任务后使用 TaskUpdate 标记完成
- [ ] 使用 TaskList 跟踪进度
- [ ] 协调成员间的依赖关系
- [ ] 完成后使用 SendMessage 发送 shutdown_request

### 结束团队时
- [ ] 确保所有任务完成
- [ ] 向所有成员发送 shutdown_request
- [ ] 等待成员 shutdown_response
- [ ] 使用 TeamDelete 删除团队

## 常用工具速查

| 工具 | 用途 | 示例 |
|------|------|------|
| TeamCreate | 创建团队 | `TeamCreate(team_name="dev-team")` |
| Agent | Spawn 团队成员 | `Agent(name="developer", team_name="dev-team")` |
| TaskCreate | 创建任务 | `TaskCreate(subject="实现功能", description="...")` |
| TaskUpdate | 更新任务状态 | `TaskUpdate(taskId="1", status="completed")` |
| TaskList | 查看任务列表 | `TaskList()` |
| SendMessage | 发送消息 | `SendMessage(type="message", recipient="developer")` |
| TeamDelete | 删除团队 | `TeamDelete()` |

## Agent 类型选择

| Agent 类型 | 工具权限 | 适用场景 |
|-----------|---------|---------|
| general-purpose | 所有工具（Read/Edit/Write/Bash等） | 开发、测试、实现任务 |
| Explore | 只读工具（Glob/Grep/Read） | 代码探索、研究 |
| Plan | 只读工具 + 规划工具 | 设计规划、架构设计 |

**重要提示**:
- 开发和测试任务必须使用 general-purpose agent
- 只读任务（研究、探索）使用 Explore agent
- 规划任务使用 Plan agent

## 典型工作流程

### 1. 开发 + 测试协作
```
1. 创建团队（dev-test-team）
2. Spawn developer（general-purpose）
3. Spawn tester（general-purpose）
4. 创建开发任务 → 分配给 developer
5. developer 完成 → 创建测试任务 → 分配给 tester
6. tester 发现问题 → 创建修复任务 → 分配给 developer
7. developer 修复 → 分配验证任务给 tester
8. 所有任务完成 → shutdown 团队
```

### 2. 前端 + 后端协作
```
1. 创建团队（fullstack-team）
2. Spawn frontend-dev（general-purpose）
3. Spawn backend-dev（general-purpose）
4. 创建后端 API 任务 → 分配给 backend-dev
5. 创建前端页面任务 → 分配给 frontend-dev
6. 并行开发
7. 集成测试
8. shutdown 团队
```

### 3. 研究 + 实现协作
```
1. 创建团队（research-impl-team）
2. Spawn researcher（Explore）
3. Spawn implementer（general-purpose）
4. 创建研究任务 → 分配给 researcher
5. researcher 完成研究 → 创建实现任务 → 分配给 implementer
6. implementer 实现功能
7. shutdown 团队
```

## 消息类型

| 类型 | 用途 | 必需参数 |
|------|------|---------|
| message | 发送给单个成员 | recipient, content, summary |
| broadcast | 发送给所有成员（慎用） | content, summary |
| shutdown_request | 请求成员关闭 | recipient, content |
| shutdown_response | 响应关闭请求 | request_id, approve |
| plan_approval_response | 批准/拒绝计划 | request_id, recipient, approve |

**重要提示**:
- 优先使用 message 而非 broadcast
- broadcast 会向所有成员发送，成本高
- 成员的 idle 通知是正常的，不需要回应

## 任务状态管理

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

## 团队配置文件

团队配置存储在: `~/.claude/teams/{team-name}/config.json`

包含信息:
- 团队名称
- 成员列表（name、agentId、agentType）
- 任务列表目录

**查看团队成员**:
```bash
cat ~/.claude/teams/{team-name}/config.json
```

## 任务列表目录

任务存储在: `~/.claude/tasks/{team-name}/`

**查看任务**:
- 使用 TaskList 工具
- 使用 TaskGet 获取详细信息

## 详细文档索引

### 核心流程
- [团队创建](docs/team-creation.md) - 创建团队和 spawn 成员
- [任务管理](docs/task-management.md) - 创建、分配、跟踪任务
- [成员协作](docs/member-collaboration.md) - 成员间协作模式
- [消息通信](docs/messaging.md) - 消息发送和接收规范
- **[OpenSpec 集成](docs/openspec-integration.md)** - **从 OpenSpec 提案解析任务并分配**

### 工作流程
- [完整工作流程](docs/workflow.md) - 端到端协作流程
- [最佳实践](docs/best-practices.md) - 团队协作最佳实践

### 故障排除
- [常见问题](docs/troubleshooting.md) - 常见问题和解决方案

## 相关技能

- **testing-standards**: 测试规范，用于测试成员编写测试
- **crud-development**: CRUD 开发规范，用于开发成员实现功能
- **git-workflow**: Git 工作流规范，用于代码提交

---

**最后更新**: 2026-03-14 (v1.4.0)
**维护者**: 开发团队
