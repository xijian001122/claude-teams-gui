---
name: agent-teams
description: Agent Teams 协作规范 - 团队创建、任务分配、成员协作、消息通信
---

# Agent Teams 协作规范

**作用**: 规范 Agent Teams 的创建、使用和协作流程，实现多 Agent 并行开发

**触发关键词**: agent teams、团队协作、多 agent、并行开发、任务分配、团队通信

---

## ⚠️ Team-lead (@main) 职责规范（重要）

### Team-lead 职责边界
- ✅ **文档管理**: 更新 OpenSpec 文档、设计文档、任务清单
- ✅ **需求整理**: 将用户需求整理为清晰的任务描述
- ✅ **任务分配**: 将任务分配给合适的团队成员
- ✅ **代码审查**: 审查成员提交的代码变更
- ❌ **不参与编码**: **不直接编写或修改任何代码**

### 重要规则

**没用户允许不可自行关闭团队**

- Team-lead 在任务未完成前不得自行关闭团队
- 团队成员完成任务后必须等待用户确认
- 需要审查所有完成的工作后才能决定关闭团队
- 如果需要关闭团队，必须先询问用户获得许可

### 团队成员职责
| 角色 | 职责 | 说明 |
|------|------|------|
| frontend-dev | 前端开发 | UI 实现、组件编写、样式开发 |
| backend-dev | 后端开发 | API 实现、服务层、数据库 |
| tester | 测试验证 | 测试用例、问题发现 |
| bug-fixer | Bug 修复 | 问题调试、缺陷修复 |

### 问题处理流程
```
用户需求 → Team-lead 整理 → 识别问题类型 → 分配给成员 → 成员执行 → Team-lead 审查
```

### 注意事项
- Team-lead 收到问题后不要直接修复，应分配给对应成员
- 代码变更由成员执行，Team-lead 只负责审查
- 紧急情况可临时调整，但事后应补充流程

---

## ⚠️ OpenSpec 强制执行规范（重要）

**所有团队成员执行任务时必须严格遵守 OpenSpec 工作流：**

### 强制执行规则

| 规则 | 说明 | 违反后果 |
|------|------|---------|
| **必须读取 OpenSpec 文档** | 实现前必须读取 proposal.md, design.md, tasks.md | 实现可能偏离设计决策 |
| **必须使用 /opsx:apply** | 通过 OpenSpec 命令执行任务，而非直接实现 | 无法追踪进度和状态 |
| **必须遵循 design.md** | 代码实现必须严格按照设计决策 | 需要返工修复 |
| **必须更新 tasks.md** | 完成任务后更新任务清单 `- [ ]` → `- [x]` | 进度不可见 |

### Team-lead 分支确认流程（必须执行）

```bash
# 1. 查询当前活跃的 OpenSpec 变更
openspec list

# 2. 如果有多个变更或不确定，使用 AskUserQuestion 询问用户
# 3. 确认后，将 change-name 告知团队成员
```

### 任务分配消息模板（必须使用）

```javascript
SendMessage({
  to: "frontend-dev",  // 或 backend-dev, tester, bug-fixer
  message: `任务 #${taskId} 已分配给你：${taskTitle}

📋 OpenSpec 变更：${changeName}
📍 提案路径：openspec/changes/${changeName}/

🔧 开始前请按顺序执行：

【第一步：读取提案（如果不在提案分支）】
如果你当前不在 ${changeName} 分支，请先调用：
  /opsx:continue ${changeName}
这将读取提案的 proposal.md、tasks.md 和 design.md。
如果你已在 ${changeName} 分支，跳过此步骤。

【第二步：实施任务】
调用以下命令开始实施：
  /opsx:apply ${changeName}

该命令会自动：
- 激活所需技能
- 读取提案和设计文档
- 按任务列表逐步实施

⚠️ 注意事项：
- 必须遵循 design.md 中的设计决策
- 必须按 tasks.md 中的任务顺序执行
- 完成后必须更新 tasks.md 中的任务状态

完成后 TaskUpdate 标记 completed 并通知我。`,
  summary: `分配任务 #${taskId}（OpenSpec: ${changeName}）`
})
```

### OpenSpec 文件结构

```
openspec/changes/{change-name}/
├── proposal.md    # 提案（what & why）- 必读
├── design.md      # 设计决策（how）- 必读
├── tasks.md       # 任务清单（checklist）- 必更新
└── specs/         # 规格文档（可选）
```

👉 [OpenSpec 集成详细文档](docs/openspec-integration.md)

---

## 核心规范速查

| 规范 | 说明 | 详细文档 |
|------|------|---------|
| 团队创建 | 创建和配置团队 | [docs/team-creation.md](docs/team-creation.md) |
| **团队重用** | **清理和重用现有团队** | **[docs/team-reuse.md](docs/team-reuse.md)** |
| 任务管理 | 创建和分配任务 | [docs/task-management.md](docs/task-management.md) |
| 成员协作 | 团队成员间协作 | [docs/member-collaboration.md](docs/member-collaboration.md) |
| 消息通信 | 消息发送和接收 | [docs/messaging.md](docs/messaging.md) |
| 工作流程 | 完整协作流程 | [docs/workflow.md](docs/workflow.md) |
| **OpenSpec 集成** | **与 OpenSpec 工作流协作** | **[docs/openspec-integration.md](docs/openspec-integration.md)** |

## 快速检查清单

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
- [ ] **⚠️ 发送消息时必须包含 OpenSpec 命令（/opsx:explore + /opsx:apply）**
- [ ] **⚠️ 必须指定变更名称（change-name）**
- [ ] 使用 TaskList 查看任务状态

### 团队协作时
- [ ] 使用 SendMessage 与成员通信
- [ ] 成员完成任务后使用 TaskUpdate 标记完成
- [ ] 使用 TaskList 跟踪进度
- [ ] 协调成员间的依赖关系
- [ ] 完成后使用 SendMessage 发送 shutdown_request

### 结束团队时
- [ ] **⚠️ 必须先获得用户许可才能关闭团队（没用户允许不可自行关闭）**
- [ ] 确保所有任务完成
- [ ] 向用户汇报工作成果等待确认
- [ ] 向所有成员发送 shutdown_request
- [ ] 等待成员 shutdown_response
- [ ] 使用 TeamDelete 删除团队

## 常用工具速查

| 工具 | 用途 | 示例 |
|------|------|------|
| TeamCreate | 创建团队 | `TeamCreate(team_name="claude-teams-gui")` |
| Agent | Spawn 团队成员 | `Agent(name="developer", team_name="claude-teams-gui")` |
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

## 团队成员角色配置

| 角色 | 名称 | 模型 | 职责 |
|------|------|------|------|
| 前端开发者 | frontend-dev | kimi-k2.5 | 前端功能开发、UI实现 |
| 后端开发者 | backend-dev | glm-5 | 后端API开发、数据库操作 |
| 测试者 | tester | glm-5 | 测试验证、质量保证 |
| Bug修复 | bug-fixer | glm-5 | 问题修复、调试排错 |

**模型说明**:
- **kimi-k2.5**: 高性能模型，适合复杂前端逻辑开发
- **glm-5**: 平衡性能，适合后端、测试和修复任务

## 典型工作流程

### 1. 四角色协作（默认模式）
```
1. 创建团队（claude-teams-gui）
2. Spawn frontend-dev（kimi-k2.5, general-purpose）
3. Spawn backend-dev（glm-5, general-purpose）
4. Spawn tester（glm-5, general-purpose）
5. Spawn bug-fixer（glm-5, general-purpose）
6. 【Team-lead】执行 openspec list 确认变更
7. 【Team-lead】创建任务，分配给成员，告知 change-name
8. 【成员】执行 /opsx:apply <change-name> 实现任务
9. 【成员】完成后 TaskUpdate 标记 completed 并通知 team-lead
10. shutdown 团队
```

### 2. OpenSpec 变更实施流程（标准）
```
1. /opsx:propose <change-name>  → 生成 OpenSpec 文档
2. 创建团队（四角色）
3. openspec list → 确认变更名称
4. 创建任务 → 分配给成员（告知 change-name）
5. 成员执行 /opsx:apply <change-name>
6. 成员完成后通知 team-lead
7. /opsx:archive <change-name> → 归档变更
8. shutdown 团队
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

## OpenSpec 工作流集成

Agent Teams 可与 OpenSpec 工作流无缝集成，实现从提案到实现的完整协作：

| OpenSpec 命令 | 用途 | 与 Agent Teams 集成 |
|--------------|------|---------------------|
| `/opsx:explore` | 探索模式 | 思考问题、调查代码、澄清需求 |
| `/opsx:propose` | 创建提案 | 生成 proposal.md, design.md, tasks.md |
| `/opsx:apply` | 实现任务 | 按 tasks.md 逐步实现功能 |
| `/opsx:archive` | 归档变更 | 完成后归档到 archive 目录 |

**典型集成流程**:
1. `/opsx:explore` → 探索问题
2. `/opsx:propose` → 生成 OpenSpec 变更文档
3. 创建 Agent Team → 根据 tasks.md 分配任务
4. 成员执行 `/opsx:apply` → 实现任务
5. 完成后 `/opsx:archive` → 归档变更

👉 [OpenSpec 集成详细文档](docs/openspec-integration.md)

## 相关技能

- **frontend-dev**: 前端开发规范
- **backend-dev**: 后端开发规范
- **websocket-protocol**: WebSocket 通信协议
- **project-arch**: 项目架构
- **openspec-propose**: OpenSpec 提案创建
- **openspec-apply-change**: OpenSpec 任务实现
- **openspec-explore**: OpenSpec 探索模式
- **openspec-archive-change**: OpenSpec 归档变更

---

**最后更新**: 2026-03-19 (v1.5.0)
