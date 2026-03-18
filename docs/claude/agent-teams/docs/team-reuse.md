# 团队重用和清理

## 概述

当需要频繁创建团队时，每次都创建新团队会消耗额外资源。本文档介绍如何重用现有团队和成员，以及如何正确清理不再需要的团队。

## 检查团队状态

### 检查团队是否存在

团队配置文件存储在：`~/.claude/teams/{team-name}/config.json`

检查方法：
```javascript
// 使用 Bash 工具检查团队目录是否存在
Bash({
  command: "ls ~/.claude/teams/ 2>/dev/null | grep dev-test-team",
  description: "检查团队是否存在"
})
```

### 检查团队成员是否活跃

通过检查团队成员是否发送过 idle 通知或响应消息来判断。更简单的方法是尝试 spawn 新成员，如果团队已存在且有活跃成员，可以重用。

## 清理现有团队

### 正确清理流程

如果团队已存在但不再需要，应按以下顺序清理：

1. **关闭所有成员**
2. **删除团队**

```javascript
// 1. 发送关闭请求给所有成员
SendMessage({
  type: "shutdown_request",
  recipient: "developer",
  content: "清理团队，请关闭"
})

SendMessage({
  type: "shutdown_request",
  recipient: "tester",
  content: "清理团队，请关闭"
})

// 2. 等待成员响应（可选，可以等待或直接删除）
// 成员会发送 shutdown_response

// 3. 删除团队
TeamDelete()
```

### 强制清理（如果成员无响应）

如果成员没有响应 shutdown_request，可以强制清理：

```javascript
// 1. 直接删除团队（如果确定成员已无响应）
TeamDelete()

// 2. 清理团队目录（如果 TeamDelete 失败）
Bash({
  command: "rm -rf ~/.claude/teams/dev-test-team ~/.claude/tasks/dev-test-team 2>/dev/null",
  description: "强制清理团队目录"
})
```

## 团队重用流程

### 方案1：重用现有团队（如果团队健康）

如果团队已存在且成员活跃，可以直接使用现有团队：

```javascript
// 1. 检查团队是否存在且健康
const teamExists = Bash({
  command: "test -f ~/.claude/teams/dev-test-team/config.json && echo 'exists' || echo 'not exists'",
  description: "检查团队配置文件"
})

if (teamExists === "exists") {
  // 团队已存在，检查成员是否活跃
  console.log("团队已存在，尝试重用...")

  // 可以尝试发送消息测试成员是否响应
  SendMessage({
    type: "message",
    recipient: "developer",
    content: "团队已存在，请确认是否就绪",
    summary: "检查成员状态"
  })

  // 如果成员响应，可以继续分配任务
  // 如果成员不响应，可能需要清理后重建
} else {
  // 团队不存在，创建新团队
  createNewTeam()
}
```

### 方案2：清理后重建（推荐）

更安全的方法是先清理，然后重新创建：

```javascript
// 1. 清理现有团队（如果存在）
cleanupExistingTeam("dev-test-team")

// 2. 创建新团队
TeamCreate({
  team_name: "dev-test-team",
  description: "开发和测试协作团队"
})

// 3. Spawn 新成员
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

// 清理函数的实现
function cleanupExistingTeam(teamName) {
  // 尝试正常关闭
  try {
    // 发送关闭请求给可能存在的成员
    SendMessage({
      type: "shutdown_request",
      recipient: "developer",
      content: "清理团队，准备重建"
    })
    SendMessage({
      type: "shutdown_request",
      recipient: "tester",
      content: "清理团队，准备重建"
    })
  } catch (e) {
    // 成员可能不存在，继续清理
  }

  // 删除团队
  try {
    TeamDelete()
  } catch (e) {
    // 如果 TeamDelete 失败，手动清理目录
    Bash({
      command: `rm -rf ~/.claude/teams/${teamName} ~/.claude/tasks/${teamName} 2>/dev/null || true`,
      description: "手动清理团队目录"
    })
  }
}
```

## 完整模板：团队创建（带清理）

### 模板6：团队创建（自动清理后创建）

```javascript
/**
 * 创建团队（自动清理现有团队）
 * @param {string} teamName - 团队名称
 * @param {object} members - 成员配置列表
 */
function createTeamWithCleanup(teamName, members) {
  // 步骤1：检查并清理现有团队
  const teamExists = Bash({
    command: `test -d ~/.claude/teams/${teamName} && echo "exists" || echo "not exists"`,
    description: "检查团队是否存在"
  })

  if (teamExists === "exists") {
    console.log(`发现现有团队 ${teamName}，开始清理...`)

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
        command: `rm -rf ~/.claude/teams/${teamName} ~/.claude/tasks/${teamName} 2>/dev/null || true`,
        description: "手动清理团队目录"
      })
    }

    console.log(`团队 ${teamName} 清理完成`)
  }

  // 步骤2：创建新团队
  console.log(`创建新团队 ${teamName}...`)
  TeamCreate({
    team_name: teamName,
    description: "开发和测试协作团队"
  })

  // 步骤3：Spawn 成员
  console.log(`Spawn 成员到团队 ${teamName}...`)
  members.forEach(member => {
    Agent({
      name: member.name,
      description: member.description,
      prompt: member.prompt,
      subagent_type: member.subagent_type || "general-purpose",
      model: member.model || "sonnet",
      team_name: teamName
    })
  })

  console.log(`团队 ${teamName} 创建完成，等待成员就绪...`)
}

// 使用示例
const teamConfig = {
  teamName: "dev-test-team",
  members: [
    {
      name: "developer",
      description: "开发者 - 负责功能实现",
      prompt: `你是团队的开发者，负责实现新功能和修复bug。
职责：
- 编写业务代码（Controller、Service、Mapper）
- 实现数据库操作和API接口
- 遵循项目的代码规范和架构模式
- 与测试人员协作，修复测试发现的问题`,
      model: "sonnet"
    },
    {
      name: "tester",
      description: "测试者 - 负责测试验证",
      prompt: `你是团队的测试人员，负责验证功能的正确性。
职责：
- 编写单元测试和集成测试
- 执行测试并验证功能
- 发现并报告bug
- 与开发人员协作修复问题`,
      model: "haiku"
    }
  ]
}

// 创建团队（自动清理）
createTeamWithCleanup(teamConfig.teamName, teamConfig.members)
```

## 最佳实践

### 1. 每次会话清理后创建

对于新会话，建议采用"清理后创建"模式：
- 检查是否有现有团队
- 清理现有团队
- 创建新团队
- Spawn 新成员

这确保每次会话开始时都是干净的状态。

### 2. 团队命名规范

使用有意义的团队名称：
- `dev-test-team` - 开发测试团队
- `feature-dev-team` - 功能开发团队
- `research-team` - 研究团队

避免使用通用名称如 `team1`、`temp-team`。

### 3. 成员命名一致性

保持成员名称一致：
- `developer` - 开发者
- `tester` - 测试者
- `frontend-dev` - 前端开发者
- `backend-dev` - 后端开发者

这样可以在不同团队间重用清理逻辑。

### 4. 记录团队生命周期

在任务或文档中记录：
- 团队创建时间
- 团队成员配置
- 团队清理时间
- 重要工作成果

### 5. 测试团队状态

创建团队后，发送测试消息确认成员就绪：

```javascript
// 创建团队后测试
SendMessage({
  type: "message",
  recipient: "developer",
  content: "团队创建完成，请回复确认就绪",
  summary: "测试成员状态"
})
```

## 常见问题

### 问题1：TeamCreate 失败，提示团队已存在

**原因**：团队已存在且可能处于活动状态。

**解决方案**：
1. 先清理现有团队
2. 再调用 TeamCreate

```javascript
// 清理
Bash({
  command: "rm -rf ~/.claude/teams/my-team ~/.claude/tasks/my-team 2>/dev/null || true",
  description: "清理团队目录"
})
```

### 问题2：成员 Spawn 失败，提示名称已存在

**原因**：同名成员已存在于团队中。

**解决方案**：
1. 清理整个团队
2. 重新创建团队和成员

### 问题3：团队清理不彻底

**原因**：TeamDelete 可能没有完全清理目录。

**解决方案**：手动清理目录：

```bash
rm -rf ~/.claude/teams/{team-name} ~/.claude/tasks/{team-name}
```

## 相关文档

- [团队创建](team-creation.md) - 基础团队创建流程
- [完整工作流程](workflow.md) - 端到端协作流程
- [最佳实践](best-practices.md) - 团队协作最佳实践
- [常见问题](troubleshooting.md) - 故障排除指南