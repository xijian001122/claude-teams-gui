# Agent Teams 快速参考

本文档提供 Agent Teams 的常用代码模板和速查表。

## ⚠️ Team-lead 职责规范（重要）

### Team-lead (@main) 职责
- ✅ **文档管理**: 更新 OpenSpec 文档、设计文档、任务清单
- ✅ **需求整理**: 将用户需求整理为清晰的任务描述
- ✅ **任务分配**: 将任务分配给合适的团队成员
- ✅ **代码审查**: 审查成员提交的代码变更
- ❌ **不参与编码**: 不直接编写或修改任何代码

### 团队成员职责
| 角色 | 职责 |
|------|------|
| frontend-dev | 前端开发、UI 实现、组件编写 |
| backend-dev | 后端开发、API 实现、服务层编写 |
| tester | 测试验证、问题发现 |
| bug-fixer | Bug 修复、问题调试 |

### 工作流程
```
用户 → @main → 整理需求 → 分配任务 → 团队成员执行 → @main 审查
```

### 问题处理流程
1. 收到问题/需求 → 整理为任务描述
2. 识别问题类型（前端/后端/测试/修复）
3. 分配给对应成员
4. 等待成员完成并审查结果
5. 如需修改，重新分配或调整

---

## ⚠️ OpenSpec 强制执行规范

**所有任务分配必须遵循 OpenSpec 工作流：**

### Team-lead 分支确认（必须）
```bash
# 1. 查询活跃变更
openspec list

# 2. 如果不确定，询问用户确认
```

### 任务分配消息模板（必须使用）
```javascript
SendMessage({
  to: "frontend-dev",
  message: `任务 #${taskId} 已分配给你：${taskTitle}

📋 OpenSpec 变更：${changeName}

🔧 执行命令：
  /opsx:apply ${changeName}

⚠️ 强制要求：
- 必须遵循 design.md 中的设计决策
- 必须按 tasks.md 中的任务顺序执行
- 完成后必须更新 tasks.md 中的任务状态

完成后 TaskUpdate 标记 completed 并通知我。`,
  summary: `分配任务 #${taskId}（OpenSpec: ${changeName}）`
})
```

---

## 模板1：创建四角色开发团队（默认模式）

**包含**: frontend-dev + backend-dev + tester + bug-fixer

```javascript
// 1. 创建团队
TeamCreate({
  team_name: "claude-teams-gui",
  description: "前后端开发测试修复协作团队"
})

// 2. Spawn 前端开发者（使用 kimi-k2.5 模型）
Agent({
  name: "frontend-dev",
  description: "前端开发者 - 负责UI实现",
  prompt: `你是 Claude Agent GUI 项目的前端开发者，负责实现用户界面。

================================================================================
🎯 你的职责
================================================================================
- 实现 Preact 组件和页面
- 使用 TailwindCSS 编写样式
- 处理 WebSocket 消息和状态管理
- 遵循项目规范和最佳实践

================================================================================
💡 快捷命令
================================================================================
| 命令 | 功能 |
|------|------|
| /frontend-dev | 前端开发技能 |
| /websocket-protocol | WebSocket 协议规范 |

================================================================================
🎓 可用技能
================================================================================
- **frontend-dev**: 前端开发规范（Preact + TailwindCSS）
- **websocket-protocol**: WebSocket 通信协议
- **project-arch**: 项目架构

================================================================================
📚 项目规范（必须遵守）
================================================================================
- **框架**: Preact + Vite + TailwindCSS
- **状态管理**: Preact hooks（useState, useEffect）
- **消息存储**: Map<teamName, Message[]>
- **WebSocket**: 通过 useWebSocket hook 处理

================================================================================
⚠️ 工作流程（重要）
================================================================================
1. 收到任务后，先评估需要激活哪些技能
2. 使用 Skill() 工具激活所需技能
3. 完成后使用 TaskUpdate 标记 completed
4. 使用 SendMessage 通知 team-lead 完成情况`,
  subagent_type: "general-purpose",
  model: "kimi-k2.5",
  team_name: "claude-teams-gui"
})

// 3. Spawn 后端开发者（使用 glm-5 模型）
Agent({
  name: "backend-dev",
  description: "后端开发者 - 负责API和服务",
  prompt: `你是 Claude Agent GUI 项目的后端开发者，负责实现服务端功能。

================================================================================
🎯 你的职责
================================================================================
- 实现 Fastify REST API 接口
- 处理 SQLite 数据库操作
- 实现 WebSocket 服务端逻辑
- 遵循项目规范和最佳实践

================================================================================
💡 快捷命令
================================================================================
| 命令 | 功能 |
|------|------|
| /backend-dev | 后端开发技能 |
| /websocket-protocol | WebSocket 协议规范 |

================================================================================
🎓 可用技能
================================================================================
- **backend-dev**: 后端开发规范（Fastify + SQLite）
- **websocket-protocol**: WebSocket 通信协议
- **project-arch**: 项目架构

================================================================================
📚 项目规范（必须遵守）
================================================================================
- **框架**: Fastify + SQLite + WebSocket
- **服务层**: DatabaseService, DataSyncService, FileWatcherService
- **WebSocket**: @fastify/websocket（原生 WebSocket）
- **端口**: Server :4558, Client dev :4559

================================================================================
⚠️ 工作流程（重要）
================================================================================
1. 收到任务后，先评估需要激活哪些技能
2. 使用 Skill() 工具激活所需技能
3. 完成后使用 TaskUpdate 标记 completed
4. 使用 SendMessage 通知 team-lead 完成情况`,
  subagent_type: "general-purpose",
  model: "glm-5",
  team_name: "claude-teams-gui"
})

// 4. Spawn 测试者（使用 glm-5 模型）
Agent({
  name: "tester",
  description: "测试者 - 负责测试验证",
  prompt: `你是 Claude Agent GUI 项目的测试者，负责质量保证。

================================================================================
🎯 你的职责
================================================================================
- 编写和执行测试用例
- 验证功能是否符合需求
- 报告发现的问题
- 进行回归测试

================================================================================
💡 快捷命令
================================================================================
| 命令 | 功能 |
|------|------|
| /frontend-dev | 前端开发技能（了解组件结构）|
| /backend-dev | 后端开发技能（了解 API 结构）|

================================================================================
🎓 可用技能
================================================================================
- **frontend-dev**: 前端开发规范
- **backend-dev**: 后端开发规范
- **project-arch**: 项目架构

================================================================================
📚 测试规范
================================================================================
- **单元测试**: Vitest
- **E2E测试**: Playwright
- **测试命令**: npm run test, npm run test:e2e

================================================================================
⚠️ 工作流程（重要）
================================================================================
1. 收到测试任务后，理解需求
2. 编写测试用例或执行测试
3. 发现问题时，详细记录问题现象
4. 完成后使用 TaskUpdate 标记 completed
5. 使用 SendMessage 通知 team-lead 测试结果`,
  subagent_type: "general-purpose",
  model: "glm-5",
  team_name: "claude-teams-gui"
})

// 5. Spawn Bug修复者（使用 glm-5 模型）
Agent({
  name: "bug-fixer",
  description: "Bug修复者 - 负责问题修复",
  prompt: `你是 Claude Agent GUI 项目的 Bug 修复者，负责调试和修复问题。

================================================================================
🎯 你的职责
================================================================================
- 分析和定位问题根因
- 修复代码中的 Bug
- 确保修复不影响其他功能
- 编写回归测试

================================================================================
💡 快捷命令
================================================================================
| 命令 | 功能 |
|------|------|
| /frontend-dev | 前端开发技能 |
| /backend-dev | 后端开发技能 |

================================================================================
🎓 可用技能
================================================================================
- **frontend-dev**: 前端开发规范
- **backend-dev**: 后端开发规范
- **project-arch**: 项目架构

================================================================================
📚 调试规范
================================================================================
- 使用 console.log 或调试工具定位问题
- 修复后运行相关测试确保不引入新问题
- 更新相关文档（如有必要）

================================================================================
⚠️ 工作流程（重要）
================================================================================
1. 收到修复任务后，先理解问题现象
2. 定位问题根因
3. 实施修复
4. 验证修复效果
5. 完成后使用 TaskUpdate 标记 completed
6. 使用 SendMessage 通知 team-lead 修复结果`,
  subagent_type: "general-purpose",
  model: "glm-5",
  team_name: "claude-teams-gui"
})
```

👉 [详细说明](docs/team-creation.md)

## 模板2：创建和分配任务

```javascript
// 1. 创建前端任务
TaskCreate({
  subject: "实现消息气泡组件",
  description: `需要实现以下功能：
1. 创建 MessageBubble 组件
2. 显示消息内容、发送者、时间戳
3. 支持 @ 提及高亮
4. 响应式布局`,
  activeForm: "实现消息气泡组件"
})

// 2. 分配给前端开发者
TaskUpdate({
  taskId: "1",
  owner: "frontend-dev",
  status: "in_progress"
})

// 3. 创建后端任务
TaskCreate({
  subject: "实现消息 API",
  description: `需要实现以下功能：
1. GET /api/teams/:name/messages 获取消息列表
2. POST /api/teams/:name/messages 发送消息
3. WebSocket new_message 事件推送`,
  activeForm: "实现消息 API"
})

// 4. 分配给后端开发者
TaskUpdate({
  taskId: "2",
  owner: "backend-dev",
  status: "in_progress"
})
```

👉 [详细说明](docs/task-management.md)

## 模板3：发送消息

```javascript
// 1. 发送消息给单个成员
SendMessage({
  to: "frontend-dev",
  message: "请实现消息气泡组件，参考 src/client/components/ 目录下的现有组件",
  summary: "分配前端任务"
})

// 2. 请求关闭
SendMessage({
  to: "frontend-dev",
  message: {
    type: "shutdown_request",
    reason: "任务完成"
  }
})

// 3. 响应关闭请求
SendMessage({
  to: "team-lead",
  message: {
    type: "shutdown_response",
    request_id: "abc-123",
    approve: true
  }
})
```

👉 [详细说明](docs/messaging.md)

## 模板4：查看任务状态

```javascript
// 1. 查看所有任务
TaskList()

// 2. 获取任务详情
TaskGet({
  taskId: "1"
})

// 3. 更新任务状态
TaskUpdate({
  taskId: "1",
  status: "completed"
})
```

## 模板5：完整工作流程（四角色 + OpenSpec）

```javascript
// 0. 确认 OpenSpec 变更
// Team-lead 执行：openspec list
// 确认 change-name

// 1. 创建团队
TeamCreate({
  team_name: "feature-team",
  description: "前后端开发测试修复协作团队"
})

// 2. Spawn 四角色成员
Agent({
  name: "frontend-dev",
  description: "前端开发者",
  prompt: "负责前端实现...",
  subagent_type: "general-purpose",
  model: "kimi-k2.5",
  team_name: "feature-team"
})

Agent({
  name: "backend-dev",
  description: "后端开发者",
  prompt: "负责后端实现...",
  subagent_type: "general-purpose",
  model: "glm-5",
  team_name: "feature-team"
})

Agent({
  name: "tester",
  description: "测试者",
  prompt: "负责测试验证...",
  subagent_type: "general-purpose",
  model: "glm-5",
  team_name: "feature-team"
})

Agent({
  name: "bug-fixer",
  description: "Bug修复者",
  prompt: "负责问题修复...",
  subagent_type: "general-purpose",
  model: "glm-5",
  team_name: "feature-team"
})

// 3. 创建任务
TaskCreate({
  subject: "实现新功能",
  description: "详细需求..."
})

// 4. 分配任务（告知 change-name）
TaskUpdate({
  taskId: "1",
  owner: "frontend-dev",
  status: "in_progress"
})

SendMessage({
  to: "frontend-dev",
  message: `任务 #1 已分配给你：实现新功能

📋 OpenSpec 变更：${changeName}

🔧 执行命令：
  /opsx:apply ${changeName}

完成后 TaskUpdate 标记 completed 并通知我。`,
  summary: "分配任务 #1（OpenSpec: ${changeName}）"
})

// 5. 等待完成...

// 6. 关闭团队（四角色）
SendMessage({
  to: "frontend-dev",
  message: {
    type: "shutdown_request",
    reason: "任务完成"
  }
})

SendMessage({
  to: "backend-dev",
  message: {
    type: "shutdown_request",
    reason: "任务完成"
  }
})

SendMessage({
  to: "tester",
  message: {
    type: "shutdown_request",
    reason: "任务完成"
  }
})

SendMessage({
  to: "bug-fixer",
  message: {
    type: "shutdown_request",
    reason: "任务完成"
  }
})

// 7. 删除团队
TeamDelete()
```

👉 [详细说明](docs/workflow.md)

## 模板6：团队创建（带自动清理，四角色）

```javascript
/**
 * 创建四角色团队（自动清理现有团队）
 * 适用场景：每次会话开始时创建团队，确保干净状态
 */
// 1. 检查并清理现有团队
const teamExists = Bash({
  command: `test -d ~/.claude/teams/claude-teams-gui && echo "exists" || echo "not exists"`,
  description: "检查团队是否存在"
})

if (teamExists === "exists") {
  console.log("发现现有团队，开始清理...")

  // 尝试发送关闭请求（四角色）
  try {
    SendMessage({
      to: "frontend-dev",
      message: {
        type: "shutdown_request",
        reason: "清理团队，准备重建"
      }
    })
    SendMessage({
      to: "backend-dev",
      message: {
        type: "shutdown_request",
        reason: "清理团队，准备重建"
      }
    })
    SendMessage({
      to: "tester",
      message: {
        type: "shutdown_request",
        reason: "清理团队，准备重建"
      }
    })
    SendMessage({
      to: "bug-fixer",
      message: {
        type: "shutdown_request",
        reason: "清理团队，准备重建"
      }
    })
  } catch (e) {}

  // 删除团队
  try {
    TeamDelete()
  } catch (e) {
    // 手动清理目录
    Bash({
      command: "rm -rf ~/.claude/teams/claude-teams-gui ~/.claude/tasks/claude-teams-gui 2>/dev/null || true",
      description: "手动清理团队目录"
    })
  }

  console.log("团队清理完成")
}

// 2. 创建新团队
TeamCreate({
  team_name: "claude-teams-gui",
  description: "前后端开发测试修复协作团队"
})

// 3. Spawn 四角色成员
Agent({
  name: "frontend-dev",
  description: "前端开发者",
  prompt: "...",
  subagent_type: "general-purpose",
  model: "kimi-k2.5",
  team_name: "claude-teams-gui"
})

Agent({
  name: "backend-dev",
  description: "后端开发者",
  prompt: "...",
  subagent_type: "general-purpose",
  model: "glm-5",
  team_name: "claude-teams-gui"
})

Agent({
  name: "tester",
  description: "测试者",
  prompt: "...",
  subagent_type: "general-purpose",
  model: "glm-5",
  team_name: "claude-teams-gui"
})

Agent({
  name: "bug-fixer",
  description: "Bug修复者",
  prompt: "...",
  subagent_type: "general-purpose",
  model: "glm-5",
  team_name: "claude-teams-gui"
})
```

## 常用命令速查

| 命令 | 说明 | 示例 |
|------|------|------|
| TeamCreate | 创建团队 | `TeamCreate(team_name="my-team")` |
| Agent | Spawn 成员 | `Agent(name="dev", team_name="my-team")` |
| TaskCreate | 创建任务 | `TaskCreate(subject="任务", description="...")` |
| TaskUpdate | 更新任务 | `TaskUpdate(taskId="1", status="completed")` |
| TaskList | 查看任务 | `TaskList()` |
| TaskGet | 获取任务详情 | `TaskGet(taskId="1")` |
| SendMessage | 发送消息 | `SendMessage(to="dev", message="...")` |
| TeamDelete | 删除团队 | `TeamDelete()` |

## Agent 类型速查

| 类型 | 工具 | 用途 |
|------|------|------|
| general-purpose | 所有工具 | 开发、测试、实现 |
| Explore | 只读工具 | 代码探索、研究 |
| Plan | 只读 + 规划 | 设计规划 |

## 模型选择速查

| 模型 | 性能 | 推荐用途 |
|------|------|---------|
| kimi-k2.5 | 高 | 前端开发者（复杂UI逻辑、组件开发） |
| glm-5 | 中 | 后端开发者、测试者、Bug修复 |

**推荐配置**：
- 前端开发者：`model: "kimi-k2.5"`
- 后端开发者：`model: "glm-5"`
- 测试者：`model: "glm-5"`
- Bug修复：`model: "glm-5"`

## 任务状态速查

| 状态 | 说明 |
|------|------|
| pending | 待处理 |
| in_progress | 进行中 |
| completed | 已完成 |
| deleted | 已删除 |

## 消息类型速查

| 类型 | 用途 |
|------|------|
| message | 发送给单个成员 |
| broadcast | 发送给所有成员（慎用） |
| shutdown_request | 请求关闭 |
| shutdown_response | 响应关闭 |
| plan_approval_response | 批准/拒绝计划 |

## 模板7：OpenSpec 集成工作流（四角色）

```javascript
// 0. Team-lead 确认变更
// 执行：openspec list
// 确认 change-name，如不确定则询问用户

// 1. 创建提案（用户执行 /opsx:propose feature-name）
//    生成：openspec/changes/feature-name/{proposal.md, design.md, tasks.md}

// 2. 创建团队实施变更（四角色）
TeamCreate({
  team_name: "claude-teams-gui",
  description: "OpenSpec 变更实施团队"
})

// 3. Spawn 四角色成员
Agent({
  name: "frontend-dev",
  description: "前端开发者",
  prompt: `...`,
  subagent_type: "general-purpose",
  model: "kimi-k2.5",
  team_name: "claude-teams-gui"
})

Agent({
  name: "backend-dev",
  description: "后端开发者",
  prompt: `...`,
  subagent_type: "general-purpose",
  model: "glm-5",
  team_name: "claude-teams-gui"
})

Agent({
  name: "tester",
  description: "测试者",
  prompt: `...`,
  subagent_type: "general-purpose",
  model: "glm-5",
  team_name: "claude-teams-gui"
})

Agent({
  name: "bug-fixer",
  description: "Bug修复者",
  prompt: `...`,
  subagent_type: "general-purpose",
  model: "glm-5",
  team_name: "claude-teams-gui"
})

// 4. 根据 tasks.md 创建任务
TaskCreate({
  subject: "实现消息 API",
  description: `来自 OpenSpec 变更: feature-name

参考: openspec/changes/feature-name/design.md

## 任务需求
...`,
  activeForm: "实现消息 API"
})

// 5. 分配任务并通知成员（告知 change-name）
TaskUpdate({
  taskId: "1",
  owner: "backend-dev",
  status: "in_progress"
})

SendMessage({
  to: "backend-dev",
  message: `任务 #1 已分配给你：实现消息 API

📋 OpenSpec 变更：feature-name

🔧 执行命令：
  /opsx:apply feature-name

⚠️ 强制要求：
- 必须遵循 design.md 中的设计决策
- 必须按 tasks.md 中的任务顺序执行
- 完成后必须更新 tasks.md 中的任务状态

完成后 TaskUpdate 标记 completed 并通知我。`,
  summary: "分配任务 #1（OpenSpec: feature-name）"
})

// 6. 等待成员完成...

// 7. 归档变更（用户执行 /opsx:archive feature-name）

// 8. 关闭团队（四角色）
SendMessage({
  to: "frontend-dev",
  message: {
    type: "shutdown_request",
    reason: "OpenSpec 变更已完成并归档"
  }
})

SendMessage({
  to: "backend-dev",
  message: {
    type: "shutdown_request",
    reason: "OpenSpec 变更已完成并归档"
  }
})

SendMessage({
  to: "tester",
  message: {
    type: "shutdown_request",
    reason: "OpenSpec 变更已完成并归档"
  }
})

SendMessage({
  to: "bug-fixer",
  message: {
    type: "shutdown_request",
    reason: "OpenSpec 变更已完成并归档"
  }
})

// 9. 删除团队
TeamDelete()
```

👉 [OpenSpec 集成详细文档](docs/openspec-integration.md)

## OpenSpec 命令速查

| 命令 | 执行者 | 用途 |
|------|--------|------|
| `openspec list` | Team-lead | 查询活跃变更，确认 change-name |
| `/opsx:propose` | 用户 | 创建提案，生成 proposal.md, design.md, tasks.md |
| `/opsx:apply <change-name>` | 成员 | 按 tasks.md 逐步实现功能 |
| `/opsx:archive` | 用户 | 完成后归档到 archive目录 |

**工作流程**：
1. Team-lead: `openspec list` → 确认 change-name
2. 分配任务时告知成员 change-name
3. 成员执行: `/opsx:apply <change-name>`
4. 完成后归档: `/opsx:archive <change-name>`

## 任务分类规则

| 任务类型 | 关键词 | 分配给 |
|---------|--------|--------|
| 前端任务 | UI、组件、样式、页面、Preact | frontend-dev |
| 后端任务 | API、路由、数据库、SQLite、服务 | backend-dev |
| 测试任务 | 测试、test、spec、验证、QA | tester |
| 修复任务 | bug、修复、fix、问题、错误 | bug-fixer |

## 团队成员角色速查

| 角色 | 名称 | 模型 | 职责 |
|------|------|------|------|
| 前端开发者 | frontend-dev | kimi-k2.5 | 前端功能开发、UI实现 |
| 后端开发者 | backend-dev | glm-5 | 后端API开发、数据库操作 |
| 测试者 | tester | glm-5 | 测试验证、质量保证 |
| Bug修复 | bug-fixer | glm-5 | 问题修复、调试排错 |
