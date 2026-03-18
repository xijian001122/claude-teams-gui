# 团队重用

## 概述

本文档说明如何检查、清理和重用现有团队。

## 问题场景

当你尝试创建同名团队时，可能会遇到以下问题：
- 团队目录已存在
- 旧成员仍在运行
- 任务列表冲突

## 解决方案

### 方案1：检查后清理

```javascript
// 1. 检查团队是否存在
const teamExists = Bash({
  command: `test -d ~/.claude/teams/claude-teams-gui && echo "exists" || echo "not exists"`,
  description: "检查团队是否存在"
})

if (teamExists === "exists") {
  console.log("发现现有团队，开始清理...")

  // 2. 尝试发送关闭请求
  try {
    SendMessage({
      to: "frontend-dev",
      message: {
        type: "shutdown_request",
        reason: "清理团队，准备重建"
      }
    })
  } catch (e) {
    // 成员可能已不存在，忽略错误
  }

  // 3. 尝试删除团队
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

// 4. 创建新团队
TeamCreate({
  team_name: "claude-teams-gui",
  description: "前端后端开发协作团队"
})
```

### 方案2：使用不同名称

```javascript
// 使用带时间戳的团队名
const timestamp = Date.now()
TeamCreate({
  team_name: `claude-teams-gui-${timestamp}`,
  description: "前端后端开发协作团队"
})
```

## 最佳实践

### 1. 每次会话使用新团队

- 每次新会话开始时创建新团队
- 或在开始时清理旧团队
- 避免状态混乱

### 2. 完成后关闭团队

```javascript
// 任务完成后，正确关闭团队
SendMessage({
  to: "frontend-dev",
  message: {
    type: "shutdown_request",
    reason: "任务完成"
  }
})

// 等待响应后
TeamDelete()
```

### 3. 检查团队状态

```javascript
// 查看团队配置
Bash({
  command: "cat ~/.claude/teams/claude-teams-gui/config.json",
  description: "查看团队配置"
})

// 查看任务列表
TaskList()
```

## 常见问题

### 问题1：TeamDelete 失败

**症状**: TeamDelete 返回错误

**解决方案**:
```javascript
// 手动清理
Bash({
  command: "rm -rf ~/.claude/teams/claude-teams-gui ~/.claude/tasks/claude-teams-gui",
  description: "手动清理团队目录"
})
```

### 问题2：成员无法响应

**症状**: 发送消息后成员无响应

**解决方案**:
1. 成员可能已关闭或处于 idle 状态
2. 尝试重新 spawn 成员
3. 或清理后重建团队
