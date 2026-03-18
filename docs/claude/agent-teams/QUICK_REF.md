# Agent Teams 快速参考

本文档提供 Agent Teams 的常用代码模板和速查表。

## 模板0：OpenSpec 集成（新增）

```javascript
// ⚠️ 重要：OpenSpec 任务必须使用 /opsx:continue 和 /opsx:apply

// 1. 读取 OpenSpec 任务列表
Read("openspec/changes/add-driver-mgmt/tasks.md")

// 2. 读取 OpenSpec 集成规范（必需）
Read(".claude/skills/agent-teams/docs/openspec-integration.md")

// 3. 分析任务，分类为开发任务和测试任务

// 4. 创建开发任务（description 必须包含强制技能评估指令）
TaskCreate({
  subject: "实现司机管理CRUD功能",
  description: `## ⚠️ 指令：强制技能激活流程（必须执行）

在开始实现之前，你必须先完成以下步骤：

### 步骤 1 - 评估技能需求
针对以下每个技能，严格陈述：[技能名] - 是/否 - [理由]

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

### 步骤 3 - 读取技能文档（必须）
激活技能后，必须按以下顺序读取文档：
1. 读取 QUICK_REF.md（如果存在）
2. 读取相关主题文档（docs/*.md）

### 步骤 4 - 读取 OpenSpec 提案
1. 检查当前分支
2. 如果不在提案分支，调用 /opsx:continue add-driver-mgmt
3. 如果已在提案分支，跳过此步

### 步骤 5 - 实施任务
只有在步骤 2-4 完成后，才能开始实现。

---

## 任务需求

根据 openspec/changes/add-driver-mgmt/tasks.md 实现：
- 创建 HdDriver Entity/Bo/Vo
- 实现 HdDriverService
- 实现 HdDriverController

## 验收标准
- 禁止使用 JOIN，使用应用层组装
- @author 使用 zhangjiazheng`,
  activeForm: "实现司机管理CRUD"
})
// taskId: "1"

// 5. 创建测试任务（description 同样包含强制技能评估指令）
TaskCreate({
  subject: "测试司机管理CRUD功能",
  description: `## ⚠️ 指令：强制技能激活流程（必须执行）

在开始测试之前，你必须先完成以下步骤：

### 步骤 1 - 评估技能需求
- **testing-standards**: 是 - 需要编写单元测试
- **api-development**: 是/否 - 根据是否需要接口测试判断
- **project-navigator**: 是/否 - 根据是否需要查找文件判断

### 步骤 2 - 激活技能
激活 testing-standards 后：
1. Read: .claude/skills/testing-standards/QUICK_REF.md
2. Read: .claude/skills/testing-standards/docs/junit5-basics.md

### 步骤 3 - 读取 OpenSpec 提案
1. 如果不在提案分支，调用 /opsx:continue add-driver-mgmt
2. 如果已在提案分支，跳过此步

### 步骤 4 - 编写测试
只有在步骤 2-3 完成后，才能开始编写测试。

---

## 测试需求

编写单元测试并验证功能：
- 测试正常流程
- 测试边界条件
- 测试异常情况

## 验收标准
- 使用 JUnit5 + Mockito
- 测试覆盖率 ≥ 80%`,
  activeForm: "测试司机管理CRUD"
})
// taskId: "2"

// 6. 设置依赖
TaskUpdate({ taskId: "2", addBlockedBy: ["1"] })

// 7. 分配任务并告知 OpenSpec 命令（关键步骤！）
TaskUpdate({ taskId: "1", owner: "developer", status: "in_progress" })

SendMessage({
  type: "message",
  recipient: "developer",
  content: `任务 #1 已分配给你：实现司机管理CRUD功能

📋 OpenSpec 提案：add-driver-mgmt

🔧 开始前请按顺序执行：

【第一步：读取提案（如果不在提案分支）】
如果不在 add-driver-mgmt 分支，请先调用：
  /opsx:continue add-driver-mgmt
已在该分支则跳过。

【第二步：实施任务】
调用以下命令开始实施：
  /opsx:apply add-driver-mgmt

该命令会自动激活所需技能并按任务列表逐步实施。

完成后请 TaskUpdate 标记完成并通知我。`,
  summary: "分配开发任务 #1（OpenSpec: add-driver-mgmt）"
})

// ⚠️ 注意：任务完成后不要关闭团队，保持活跃状态
```

👉 [详细说明](docs/openspec-integration.md)

## 模板1：创建开发测试团队

```javascript
// 1. 创建团队
TeamCreate({
  team_name: "dev-test-team",
  agent_type: "team-lead",
  description: "开发和测试协作团队"
})

// 2. Spawn 开发者（Sonnet 模型）
Agent({
  name: "developer",
  description: "开发者 - 负责功能实现",
  prompt: `你是 FHD Cloud Plus 项目的开发者，负责实现新功能和修复Bug。

================================================================================
🎯 你的职责
================================================================================
- 实现新功能和修复Bug
- 遵循项目规范和最佳实践
- 完成后通知 team-lead

================================================================================
💡 快捷命令
================================================================================
| 命令 | 功能 |
|------|------|
| /opsx:continue <change-id> | 读取 OpenSpec 提案详情 |
| /opsx:apply <change-id> | 执行 OpenSpec 任务（自动激活技能） |
| /check | 代码规范检查 |
| /crud | 快速生成CRUD代码 |

================================================================================
🎓 可用技能（11个）
================================================================================
- **crud-development**: CRUD全栈开发规范
- **database-ops**: 数据库操作和表设计
- **api-development**: REST API接口开发
- **backend-annotations**: 后端核心注解使用
- **error-handler**: 异常处理和错误规范
- **security-guard**: 安全最佳实践
- **utils-toolkit**: 工具类速查手册
- **git-workflow**: Git工作流规范
- **project-navigator**: 项目结构导航
- **skill-evolution**: 技能系统自我进化
- **testing-standards**: 单元测试编写规范

================================================================================
📚 项目规范（必须遵守）
================================================================================
- **架构**: Spring Boot 3.5.7 + MyBatis-Plus 3.5.14
- **分层**: Controller → Service → Mapper（四层架构）
- **禁止 JOIN**: 分库分表环境，必须使用应用层组装
- **@author**: 所有新增文件必须使用 zhangjiazheng
- **认证**: Sa-Token，使用 @SaCheckPermission 注解

================================================================================
⚠️ 工作流程（重要）
================================================================================
1. 收到任务后，先评估需要激活哪些技能
2. 如果是 OpenSpec 任务，按消息中的两步命令执行
3. 完成后使用 TaskUpdate 标记 completed
4. 使用 SendMessage 通知 team-lead 完成情况`,
  subagent_type: "general-purpose",
  model: "sonnet",
  team_name: "dev-test-team"
})

// 3. Spawn 测试者（GLM-5 模型）
Agent({
  name: "tester",
  description: "测试者 - 负责测试验证",
  prompt: `你是 FHD Cloud Plus 项目的测试人员，负责验证功能的正确性。

================================================================================
🎯 你的职责
================================================================================
- 编写单元测试验证功能
- 确保测试覆盖率 ≥ 80%
- 发现问题及时反馈给开发者
- 完成后通知 team-lead

================================================================================
💡 快捷命令
================================================================================
| 命令 | 功能 |
|------|------|
| /opsx:continue <change-id> | 读取 OpenSpec 提案详情 |
| /opsx:apply <change-id> | 执行 OpenSpec 测试任务（自动激活技能） |

================================================================================
🎓 可用技能
================================================================================
- **testing-standards**: 单元测试编写规范（JUnit5 + Mockito）
- **api-development**: API接口测试
- **project-navigator**: 项目结构导航

================================================================================
📚 测试规范（必须遵守）
================================================================================
- **框架**: JUnit5 + Mockito
- **注解**: @ExtendWith(MockitoExtension.class)
- **Mock**: 使用 @Mock 和 @InjectMocks
- **覆盖率**: 目标 ≥ 80%

================================================================================
⚠️ 工作流程（重要）
================================================================================
1. 收到任务后，先评估需要激活哪些技能
2. 如果是 OpenSpec 任务，按消息中的两步命令执行
3. 编写测试用例，覆盖正常流程、边界条件、异常情况
4. 完成后使用 TaskUpdate 标记 completed
5. 使用 SendMessage 通知 team-lead 测试结果`,
  subagent_type: "general-purpose",
  model: "glm-5",
  team_name: "dev-test-team"
})
```

👉 [详细说明](docs/team-creation.md)

## 模板2：创建和分配任务

```javascript
// 1. 创建开发任务
TaskCreate({
  subject: "实现司机管理的CRUD功能",
  description: `需要实现以下功能：
1. 创建 Driver Entity/Bo/Vo
2. 实现 DriverController
3. 实现 DriverService
4. 实现 DriverMapper
5. 添加权限注解`,
  activeForm: "实现司机管理CRUD"
})

// 2. 分配给开发者
TaskUpdate({
  taskId: "1",
  owner: "developer",
  status: "in_progress"
})

// 3. 开发完成后，创建测试任务
TaskCreate({
  subject: "测试司机管理CRUD功能",
  description: `测试以下功能：
1. 创建司机
2. 查询司机列表
3. 更新司机信息
4. 删除司机`,
  activeForm: "测试司机管理CRUD"
})

// 4. 分配给测试者
TaskUpdate({
  taskId: "2",
  owner: "tester",
  status: "in_progress"
})
```

👉 [详细说明](docs/task-management.md)

## 模板3：发送消息

```javascript
// 1. 发送消息给单个成员
SendMessage({
  type: "message",
  recipient: "developer",
  content: "请实现司机管理的CRUD功能，参考现有的车场管理模块",
  summary: "分配开发任务"
})

// 2. 广播消息（慎用）
SendMessage({
  type: "broadcast",
  content: "发现严重bug，所有人停止当前工作",
  summary: "紧急通知"
})

// 3. 请求关闭
SendMessage({
  type: "shutdown_request",
  recipient: "developer",
  content: "任务完成，准备关闭"
})

// 4. 响应关闭请求
SendMessage({
  type: "shutdown_response",
  request_id: "abc-123",
  approve: true
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

// 4. 标记任务为进行中
TaskUpdate({
  taskId: "2",
  status: "in_progress"
})
```

👉 [详细说明](docs/task-management.md)

## 模板5：完整工作流程

```javascript
// 1. 创建团队
TeamCreate({
  team_name: "feature-team",
  description: "功能开发团队"
})

// 2. Spawn 成员
Agent({
  name: "developer",
  description: "开发者",
  prompt: "负责功能实现",
  subagent_type: "general-purpose",
  model: "sonnet",  // 使用 Sonnet 模型
  team_name: "feature-team"
})

Agent({
  name: "tester",
  description: "测试者",
  prompt: "负责测试验证",
  subagent_type: "general-purpose",
  model: "glm-5",  // 使用 GLM-5 模型
  team_name: "feature-team"
})

// 3. 创建任务
TaskCreate({
  subject: "实现新功能",
  description: "详细需求..."
})

// 4. 分配任务
TaskUpdate({
  taskId: "1",
  owner: "developer",
  status: "in_progress"
})

// 5. 等待完成...

// 6. 关闭团队
SendMessage({
  type: "shutdown_request",
  recipient: "developer",
  content: "任务完成"
})

SendMessage({
  type: "shutdown_request",
  recipient: "tester",
  content: "任务完成"
})

// 7. 删除团队
TeamDelete()
```

👉 [详细说明](docs/workflow.md)

## 模板6：团队创建（带自动清理）

```javascript
/**
 * 创建团队（自动清理现有团队）
 * 适用场景：每次会话开始时创建团队，确保干净状态
 */
// 1. 检查并清理现有团队
const teamExists = Bash({
  command: `test -d ~/.claude/teams/dev-test-team && echo "exists" || echo "not exists"`,
  description: "检查团队是否存在"
})

if (teamExists === "exists") {
  console.log("发现现有团队，开始清理...")

  // 尝试发送关闭请求
  try {
    SendMessage({
      type: "shutdown_request",
      recipient: "developer",
      content: "清理团队，准备重建"
    })
  } catch (e) {}

  try {
    SendMessage({
      type: "shutdown_request",
      recipient: "tester",
      content: "清理团队，准备重建"
    })
  } catch (e) {}

  // 删除团队
  try {
    TeamDelete()
  } catch (e) {
    // 手动清理目录
    Bash({
      command: "rm -rf ~/.claude/teams/dev-test-team ~/.claude/tasks/dev-test-team 2>/dev/null || true",
      description: "手动清理团队目录"
    })
  }

  console.log("团队清理完成")
}

// 2. 创建新团队
TeamCreate({
  team_name: "dev-test-team",
  description: "开发和测试协作团队"
})

// 3. Spawn 成员
Agent({
  name: "developer",
  description: "开发者 - 负责功能实现",
  prompt: "...",
  subagent_type: "general-purpose",
  model: "sonnet",
  team_name: "dev-test-team"
})

Agent({
  name: "tester",
  description: "测试者 - 负责测试验证",
  prompt: "...",
  subagent_type: "general-purpose",
  model: "haiku",
  team_name: "dev-test-team"
})
```

👉 [详细说明](docs/team-reuse.md)

## 常用命令速查

| 命令 | 说明 | 示例 |
|------|------|------|
| TeamCreate | 创建团队 | `TeamCreate(team_name="my-team")` |
| Agent | Spawn 成员 | `Agent(name="dev", team_name="my-team")` |
| TaskCreate | 创建任务 | `TaskCreate(subject="任务", description="...")` |
| TaskUpdate | 更新任务 | `TaskUpdate(taskId="1", status="completed")` |
| TaskList | 查看任务 | `TaskList()` |
| TaskGet | 获取任务详情 | `TaskGet(taskId="1")` |
| SendMessage | 发送消息 | `SendMessage(type="message", recipient="dev")` |
| TeamDelete | 删除团队 | `TeamDelete()` |

## Agent 类型速查

| 类型 | 工具 | 用途 |
|------|------|------|
| general-purpose | 所有工具 | 开发、测试、实现 |
| Explore | 只读工具 | 代码探索、研究 |
| Plan | 只读 + 规划 | 设计规划 |

## 模型选择速查

| 模型 | 性能 | 成本 | 推荐用途 |
|------|------|------|---------|
| sonnet | 高 | 中 | 开发者（复杂逻辑、代码生成） |
| opus | 最高 | 高 | 架构设计、复杂问题 |
| haiku | 快 | 低 | 简单任务、快速验证 |
| glm-5 | 中 | 低 | 测试者（测试验证、单元测试） |

**推荐配置**：
- 开发者：`model: "sonnet"` - 平衡性能和成本
- 测试者：`model: "glm-5"` - 经济且高效

## ⚠️ 官方限制速查（重要）

| 限制 | 说明 | 解决方案 |
|------|------|---------|
| 不支持会话恢复 | `/resume` 不恢复队友 | 每次新会话重新创建团队 |
| 每会话一个团队 | 不能同时管理多个团队 | 先 TeamDelete 再创建新团队 |
| 无嵌套团队 | 队友无法创建子团队 | 只有 team-lead 管理团队 |
| 关闭可能很慢 | 成员完成当前任务后才关闭 | 耐心等待或直接 TeamDelete |
| 任务状态可能滞后 | 状态更新可能不及时 | 手动更新或检查实际完成情况 |
| 权限继承模式 | 所有队友从负责人权限开始 | 生成后单独修改权限 |

👉 [详细说明](docs/troubleshooting.md#官方文档限制重要)

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

## 链接到详细文档

- [团队创建](docs/team-creation.md)
- [任务管理](docs/task-management.md)
- [成员协作](docs/member-collaboration.md)
- [消息通信](docs/messaging.md)
- [完整工作流程](docs/workflow.md)
- [最佳实践](docs/best-practices.md)
- [常见问题](docs/troubleshooting.md)
