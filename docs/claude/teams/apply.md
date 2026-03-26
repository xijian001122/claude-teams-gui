---
name: "Teams: Apply"
description: 启动 Agent Teams 协作，创建团队并按 OpenSpec 规范分配任务
tags: [teams, collaboration, agent-teams, openspec]
---

使用 Agent Teams 协作模式执行任务。

**输入**: 可选指定 OpenSpec change 名称（如 `/teams:apply add-driver-mgmt`），或直接描述任务。

## ⚠️ 强制要求：OpenSpec 规范

**所有任务分配必须遵循 OpenSpec 工作流：**

1. **Team-lead 必须先执行 `openspec list` 确认变更**
2. **分配任务时必须告知成员 change-name**
3. **成员执行 `/opsx:apply <change-name>` 实现任务**

## 步骤 1 - 激活技能

```
Skill("agent-teams")
```

读取技能文档：
- `.claude/skills/agent-teams/QUICK_REF.md`
- `.claude/skills/agent-teams/docs/workflow.md`
- `.claude/skills/agent-teams/docs/task-management.md`

## 步骤 2 - 确认 OpenSpec 变更（必须）

```bash
# 查询活跃变更
openspec list
```

**处理结果**：
- 如果有多个变更或不确定 → 使用 AskUserQuestion 询问用户确认
- 如果只有一个变更 → 直接使用
- 如果没有变更 → 询问用户是否需要创建提案

## 步骤 3 - 检查并准备团队

检查是否已有活跃团队：
```bash
test -d ~/.claude/teams/claude-teams-gui && echo "exists" || echo "not exists"
```

**如果团队不存在**，按 agent-teams 规范创建（参见 QUICK_REF.md 模板1）。

**如果团队已存在**，读取成员信息：
```bash
cat ~/.claude/teams/claude-teams-gui/config.json
```

## 步骤 4 - 创建任务

根据 openspec/changes/<change-name>/tasks.md 创建任务。

**⚠️ 任务描述不需要包含读取文档的步骤，因为 `/opsx:apply` 会自动处理**

## 步骤 3 - 检查并准备团队

检查是否已有活跃团队：
```bash
test -d ~/.claude/teams/claude-teams-gui && echo "exists" || echo "not exists"
```

**如果团队不存在**，按 agent-teams 规范创建：

```javascript
// 1. 创建团队
TeamCreate({
  team_name: "claude-teams-gui",
  agent_type: "team-lead",
  description: "前后端开发测试协作团队"
})

// 2. Spawn 前端开发者（kimi-k2.5 模型）
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
| /opsx:explore <change-id> | 读取 OpenSpec 提案详情 |
| /opsx:apply <change-id> | 执行 OpenSpec 任务 |

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
2. 如果是 OpenSpec 任务，按消息中的两步命令执行
3. 完成后使用 TaskUpdate 标记 completed
4. 使用 SendMessage 通知 team-lead 完成情况`,
  subagent_type: "general-purpose",
  model: "kimi-k2.5",
  team_name: "claude-teams-gui"
})

// 3. Spawn 后端开发者（glm-5 模型）
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
| /opsx:explore <change-id> | 读取 OpenSpec 提案详情 |
| /opsx:apply <change-id> | 执行 OpenSpec 任务 |

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
2. 如果是 OpenSpec 任务，按消息中的两步命令执行
3. 完成后使用 TaskUpdate 标记 completed
4. 使用 SendMessage 通知 team-lead 完成情况`,
  subagent_type: "general-purpose",
  model: "glm-5",
  team_name: "claude-teams-gui"
})

// 4. Spawn 测试者（glm-5 模型）
Agent({
  name: "tester",
  description: "测试者 - 负责测试验证",
  prompt: `你是 Claude Agent GUI 项目的测试人员，负责验证功能的正确性。

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
| /opsx:explore <change-id> | 读取 OpenSpec 提案详情 |
| /opsx:apply <change-id> | 执行 OpenSpec 测试任务 |

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

// 5. Spawn Bug修复者（glm-5 模型）
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

**如果团队已存在**，读取成员信息：
```bash
cat ~/.claude/teams/claude-teams-gui/config.json
```

## 步骤 4 - 创建任务

根据任务来源，按 agent-teams 规范创建任务。

**任务描述必须包含强制技能评估指令**（仿照 skill-forced-eval.js）：

```javascript
// 开发任务
TaskCreate({
  subject: "<任务标题>",
  description: `## ⚠️ 指令：强制技能激活流程（必须执行）

在开始实现之前，你必须先完成以下步骤：


### 步骤 1 - 评估技能需求
**可用技能列表**（共11个）：
- **crud-development**: CRUD/业务模块开发、Entity/BO/VO/Service/Controller
- **database-ops**: 数据库操作、SQL、建表、表结构查询
- **api-development**: API设计、RESTful规范、Controller接口
- **backend-annotations**: 后端注解使用（@SaCheckPermission、@Cacheable等）
- **error-handler**: 异常处理、ServiceException使用
- **security-guard**: 安全、加密、XSS、SQL注入防护
- **utils-toolkit**: 工具类使用（StringUtils、MapstructUtils、EncryptUtils等）
- **git-workflow**: Git提交、分支管理、合并冲突
- **project-navigator**: 项目结构导航、文件查找
- **skill-evolution**: 技能系统自我进化、新增技能、变更技能
- **testing-standards**: 单元测试编写、JUnit5、Mockito、Mock对象

### 步骤 2 - 激活技能
- 如果任何技能评估为"是" → **必须**使用 Skill() 工具激活该技能
- 如果所有技能评估为"否" → 说明"不需要激活任何技能"并继续


### 步骤 3 - 读取技能文档（必须）
**激活技能后，必须按以下顺序读取文档：**

1. **读取 QUICK_REF.md**（如果存在）
   - 位置: ``.claude/skills/${skill-name}/QUICK_REF.md``
- 提供快速概览和常用模式

2. **读取相关主题文档**
- 位置: ``.claude/skills/${skill-name}/docs/${topic}.md``
- 包含详细规范和示例代码

3. **不要只依赖 SKILL.md**
- SKILL.md 只是导航中心
- 详细规范在 QUICK_REF.md 和 docs/ 中

### 步骤 4 - 读取子技能明细(必须)
激活 crud-development 后：
1. Read: .claude/skills/crud-development/QUICK_REF.md
2. Read: .claude/skills/crud-development/docs/controller-layer.md
3. Read: .claude/skills/crud-development/docs/service-layer.md
4. 按照文档规范实现

### 步骤 5 - 读取 OpenSpec 提案（如果适用）
如果是 OpenSpec 任务：
1. 检查当前分支
2. 如果不在提案分支，调用 /opsx:continue <change-id>
3. 如果已在提案分支，跳过此步

### 步骤 6 - 实施任务
- 只有在步骤 2-4 完成后，才能开始实现
- 严格遵守已读取文档中的规范

---

## 任务需求

<具体实现内容>

## 验收标准

- 代码符合项目规范
- 禁止使用 JOIN，使用应用层组装
- @author 使用 zhangjiazheng

## 参考

<相关模块路径>`,
  activeForm: "<进行中显示的文字>"
})

// 测试任务（依赖开发任务）
TaskCreate({
  subject: "测试 <功能名称>",
  description: `## ⚠️ 指令：强制技能激活流程（必须执行）

在开始测试之前，你必须先完成以下步骤：

### 步骤 1 - 评估技能需求
**可用技能列表**（共11个）：
- **crud-development**: CRUD/业务模块开发、Entity/BO/VO/Service/Controller
- **database-ops**: 数据库操作、SQL、建表、表结构查询
- **api-development**: API设计、RESTful规范、Controller接口
- **backend-annotations**: 后端注解使用（@SaCheckPermission、@Cacheable等）
- **error-handler**: 异常处理、ServiceException使用
- **security-guard**: 安全、加密、XSS、SQL注入防护
- **utils-toolkit**: 工具类使用（StringUtils、MapstructUtils、EncryptUtils等）
- **git-workflow**: Git提交、分支管理、合并冲突
- **project-navigator**: 项目结构导航、文件查找
- **skill-evolution**: 技能系统自我进化、新增技能、变更技能
- **testing-standards**: 单元测试编写、JUnit5、Mockito、Mock对象

**测试相关技能**：
- **testing-standards**: 单元测试编写、JUnit5、Mockito、Mock对象
- **api-development**: API接口测试
- **project-navigator**: 项目结构导航

### 步骤 2 - 激活技能
- 如果任何技能评估为"是" → **必须**使用 Skill() 工具激活该技能
- 如果所有技能评估为"否" → 说明"不需要激活任何技能"并继续


### 步骤 3 - 读取技能文档（必须）
**激活技能后，必须按以下顺序读取文档：**

1. **读取 QUICK_REF.md**（如果存在）
   - 位置: ``.claude/skills/${skill-name}/QUICK_REF.md``
- 提供快速概览和常用模式

2. **读取相关主题文档**
- 位置: ``.claude/skills/${skill-name}/docs/${topic}.md``
- 包含详细规范和示例代码

3. **不要只依赖 SKILL.md**
- SKILL.md 只是导航中心
- 详细规范在 QUICK_REF.md 和 docs/ 中

激活 testing-standards 后：
1. Read: .claude/skills/testing-standards/QUICK_REF.md
2. Read: .claude/skills/testing-standards/docs/junit5-basics.md
3. Read: .claude/skills/testing-standards/docs/mockito-usage.md

### 步骤 5 - 读取 OpenSpec 提案（如果适用）
如果是 OpenSpec 任务：
1. 检查当前分支
2. 如果不在提案分支，调用 /opsx:continue <change-id>
3. 如果已在提案分支，跳过此步

### 步骤 6 - 编写测试
- 只有在步骤 2-4 完成后，才能开始编写测试
- 严格遵守 testing-standards 规范

---

## 测试需求

编写单元测试验证功能：
- 测试正常流程
- 测试边界条件
- 测试异常情况

## 验收标准

- 使用 JUnit5 + Mockito
- 测试覆盖率 ≥ 80%
- 所有测试通过`,
  activeForm: "测试 <功能名称>"
})

// 设置依赖：测试任务依赖开发任务
TaskUpdate({ taskId: "<test-id>", addBlockedBy: ["<dev-id>"] })
```

## 步骤 5 - 分配任务并通知（必须告知 change-name）

**⚠️ 关键要求：分配消息必须包含 change-name**

```javascript
// 分配任务
TaskUpdate({
  taskId: "<task-id>",
  owner: "frontend-dev",  // 或 backend-dev, tester, bug-fixer
  status: "in_progress"
})

// 通知成员（必须使用此模板）
SendMessage({
  to: "frontend-dev",
  message: `任务 #<id> 已分配给你：<任务标题>

📋 OpenSpec 变更：<change-name>

🔧 执行命令：
  /opsx:apply <change-name>

⚠️ 注意：
- /opsx:apply 会自动读取 proposal.md, design.md, tasks.md
- 必须遵循 design.md 中的设计决策
- 完成后 TaskUpdate 标记 completed 并通知我

完成后通知我。`,
  summary: "分配任务 #<id>（OpenSpec: <change-name>）"
})
```

## 步骤 6 - 显示状态

输出当前团队状态：

```
## Teams: Apply 已启动

**团队**: claude-teams-gui
**任务来源**: <OpenSpec change 名称 或 "手动描述">

### 已创建任务
| ID | 任务 | 负责人 | 状态 |
|----|------|--------|------|
| 1  | <前端任务> | frontend-dev | in_progress |
| 2  | <后端任务> | backend-dev | in_progress |
| 3  | <测试任务> | - | pending (等待 #1, #2) |
| 4  | <修复任务> | - | pending |

### 等待中
前端和后端开发者正在并行处理任务，完成后测试任务将自动解锁。

使用 TaskList 查看实时进度。
```

## 注意事项

- 团队成员 idle 是正常状态，不代表不可用
- 发送消息后等待成员响应，不要重复发送
- 如果成员长时间无响应，使用 SendMessage 再次通知
- **任务完成后不要关闭团队**，保持团队活跃以便后续任务

## OpenSpec 集成要求（重要）

**如果任务来源是 OpenSpec change，必须严格遵守以下规范：**

1. **读取 openspec-integration.md 文档**
   ```
   Read(".claude/skills/agent-teams/docs/openspec-integration.md")
   ```

2. **通知消息必须包含两步命令**
   - 第一步：`/opsx:continue <change-name>`
   - 第二步：`/opsx:apply <change-name>`

3. **优先使用 `/opsx:apply` 自动激活技能**，也可在消息中额外列出需要手动激活的技能

