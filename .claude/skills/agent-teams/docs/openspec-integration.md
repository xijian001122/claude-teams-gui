# OpenSpec 集成

## 概述

本文档说明 Agent Teams 如何与 OpenSpec 工作流集成，实现从提案到实现的完整协作流程。

## OpenSpec 工作流概述

```
┌─────────────────────────────────────────────────────────────────┐
│                    OpenSpec 工作流                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  /opsx:explore  →  /opsx:propose  →  /opsx:apply  →  /opsx:archive  │
│       │                   │                │                │   │
│       ▼                   ▼                ▼                ▼   │
│  ┌────────┐         ┌────────┐        ┌────────┐       ┌────────┐│
│  │ 思考   │         │ 创建   │        │ 实现   │       │ 归档   ││
│  │ 探索   │────────▶│ 提案   │───────▶│ 任务   │──────▶│ 完成   ││
│  └────────┘         └────────┘        └────────┘       └────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 命令速查

| 命令 | 用途 | 使用场景 |
|------|------|---------|
| `/opsx:explore` | 探索模式 | 思考问题、调查代码、澄清需求 |
| `/opsx:propose` | 创建提案 | 生成 proposal.md, design.md, tasks.md |
| `/opsx:apply` | 实现任务 | 按 tasks.md 逐步实现功能 |
| `/opsx:archive` | 归档变更 | 完成后归档到 archive 目录 |

## 团队协作流程

### 流程1：探索阶段（Explore）

```javascript
// 1. 进入探索模式
// 用户: /opsx:explore 消息功能

// 2. 探索代码库
// - 查看现有消息实现
// - 分析 WebSocket 协议
// - 识别集成点

// 3. 输出探索结果
// - ASCII 架构图
// - 选项对比表
// - 风险和未知项
```

### 流程2：提案阶段（Propose）

```javascript
// 1. 创建提案
// 用户: /opsx:propose add-message-feature

// 2. OpenSpec 自动生成
// - openspec/changes/add-message-feature/proposal.md
// - openspec/changes/add-message-feature/design.md
// - openspec/changes/add-message-feature/tasks.md

// 3. 读取任务列表
Read("openspec/changes/add-message-feature/tasks.md")
```

### 流程3：团队分配（Agent Teams）

```javascript
// 1. 创建团队
TeamCreate({
  team_name: "claude-teams-gui",
  description: "OpenSpec 变更实施团队"
})

// 2. Spawn 成员
Agent({
  name: "frontend-dev",
  description: "前端开发者",
  prompt: `...`,
  subagent_type: "general-purpose",
  model: "sonnet",
  team_name: "claude-teams-gui"
})

Agent({
  name: "backend-dev",
  description: "后端开发者",
  prompt: `...`,
  subagent_type: "general-purpose",
  model: "sonnet",
  team_name: "claude-teams-gui"
})

// 3. 根据 tasks.md 创建任务
TaskCreate({
  subject: "实现消息 API",
  description: `来自 OpenSpec 变更: add-message-feature

参考: openspec/changes/add-message-feature/design.md

## 任务需求
...`,
  activeForm: "实现消息 API"
})

// 4. 分配任务
TaskUpdate({
  taskId: "1",
  owner: "backend-dev",
  status: "in_progress"
})

// 5. 通知成员
SendMessage({
  to: "backend-dev",
  message: `任务 #1 已分配给你：实现消息 API

📋 OpenSpec 变更：add-message-feature

🔧 实施步骤：

【第一步：读取提案】
/opsx:explore add-message-feature

【第二步：实现任务】
/opsx:apply add-message-feature

完成后 TaskUpdate 标记完成并通知我。`,
  summary: "分配任务 #1（OpenSpec: add-message-feature）"
})
```

### 流程4：实施阶段（Apply）

```javascript
// 成员执行实现
// 1. 读取 OpenSpec 上下文
Read("openspec/changes/add-message-feature/proposal.md")
Read("openspec/changes/add-message-feature/design.md")
Read("openspec/changes/add-message-feature/tasks.md")

// 2. 实现代码
// ... 编写代码 ...

// 3. 更新任务状态
// 在 tasks.md 中标记完成：- [ ] → - [x]

// 4. 通知 team-lead
SendMessage({
  to: "team-lead",
  message: "任务 #1 完成：消息 API 已实现",
  summary: "任务 #1 完成"
})
```

### 流程5：归档阶段（Archive）

```javascript
// 1. 确认所有任务完成
TaskList()

// 2. 归档 OpenSpec 变更
// 用户: /opsx:archive add-message-feature

// 3. 关闭团队
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

// 4. 删除团队
TeamDelete()
```

## 任务分类规则

根据 `tasks.md` 内容分类任务：

| 任务类型 | 关键词 | 分配给 |
|---------|--------|--------|
| 前端任务 | UI、组件、样式、页面、Preact | frontend-dev |
| 后端任务 | API、路由、数据库、SQLite、服务 | backend-dev |
| 测试任务 | 测试、test、spec、验证 | frontend-dev 或 backend-dev |

## 消息模板

### 分配任务通知（含 OpenSpec）

```javascript
SendMessage({
  to: "frontend-dev",
  message: `任务 #${taskId} 已分配给你：${taskTitle}

📋 OpenSpec 变更：${changeName}

🔧 实施步骤：

【第一步：读取上下文】
/opsx:explore ${changeName}

【第二步：实现任务】
/opsx:apply ${changeName}

⚠️ 注意事项：
- 遵循 design.md 中的设计决策
- 完成后更新 tasks.md 中的任务状态

完成后 TaskUpdate 标记完成并通知我。`,
  summary: `分配任务 #${taskId}（OpenSpec: ${changeName}）`
})
```

## OpenSpec 目录结构

```
openspec/
├── config.yaml                    # OpenSpec 配置
├── changes/                       # 活跃变更
│   └── {change-name}/
│       ├── .openspec.yaml        # 变更配置
│       ├── proposal.md           # 提案（what & why）
│       ├── design.md             # 设计（how）
│       ├── tasks.md              # 任务列表
│       └── specs/                # 规格文档
│           └── {capability}/
│               └── spec.md
├── specs/                         # 主规格
│   └── {capability}/
│       └── spec.md
└── archive/                       # 已归档变更
    └── YYYY-MM-DD-{change-name}/
```

## 最佳实践

### 1. 先探索再提案
- 使用 `/opsx:explore` 充分思考
- 理解问题后再创建提案

### 2. 任务粒度适中
- 每个 Task 对应一个明确的交付物
- 任务之间设置合理的依赖关系

### 3. 及时同步状态
- 完成任务后立即更新 tasks.md
- 通知 team-lead 进度

### 4. 遵循 OpenSpec 设计
- 实现时参考 design.md
- 如发现问题，更新设计文档

## 相关命令

- `/opsx:explore` - 探索模式
- `/opsx:propose` - 创建提案
- `/opsx:apply` - 实现任务
- `/opsx:archive` - 归档变更
