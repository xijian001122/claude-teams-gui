---
name: teams:fix
description: 修复团队决策问题 - 当提案/设计/任务出现错误时，协调修复并通知成员继续实施
---

修复团队决策问题，协调 team-lead 修复并通知成员继续实施。

**输入**: 可选指定问题描述。

## ⚠️ Team-lead 职责规范

| 可以做 | 不能做 |
|--------|--------|
| 修复文档（proposal.md, design.md, tasks.md） | 直接修改代码文件 |
| 重新分配任务 | 自己实现功能 |
| 更新任务描述 | 绕过成员直接修复 Bug |

**原则**: Team-lead 只修复文档和调整任务，实际代码修改由成员执行。

## 步骤 1 - 确认身份（必须）

**⚠️ 重要：只有 team-lead 才能执行修复操作**

检查当前身份：
- 如果你是通过 TeamCreate 创建的团队 → 你是 team-lead
- 如果你是通过 Agent 工具 spawn 的成员 → 你不是 team-lead

**如果你不是 team-lead**：
```javascript
SendMessage({
  to: "team-lead",
  message: `⚠️ 发现决策问题，需要修复

**问题描述**: ${问题描述}

**问题类型**: ${问题类型}（提案错误/设计问题/任务错误/配置问题）

**建议修复**:
${建议的修复方案}

请使用 \`/teams:fix\` 命令修复此问题。`,
  summary: "发现决策问题 - 请求修复"
})
// 然后停止执行，等待 team-lead 修复
```

**如果你是 team-lead**，继续执行步骤 2。

## 步骤 2 - 激活技能

```
Skill("agent-teams")
```

读取技能文档：
- `.claude/skills/agent-teams/QUICK_REF.md`
- `.claude/skills/agent-teams/docs/messaging.md`

## 步骤 3 - 识别问题类型

从用户或成员的消息中识别问题类型：

| 问题类型 | 关键词 | 需要修复的文件 |
|---------|--------|---------------|
| 提案错误 | 字段命名、功能理解、需求偏差 | `proposal.md` |
| 设计问题 | 架构决策、技术选型、设计不合理 | `design.md` |
| 任务错误 | 任务拆分、依赖关系、实施顺序 | `tasks.md` |
| 配置问题 | 字段复用、配置理解、代码结构 | 配置类文件 |

**示例识别**：
- "应该复用现有字段而非新增" → 配置问题
- "任务拆分不合理" → 任务错误
- "架构决策有问题" → 设计问题

## 步骤 4 - 通知成员暂停（如有正在实施的成员）

检查是否有成员正在实施任务：

```javascript
// 查看任务列表
TaskList()

// 如果有 in_progress 的任务，通知对应成员暂停
// 四角色：frontend-dev, backend-dev, tester, bug-fixer
const activeMembers = ["frontend-dev", "backend-dev", "tester", "bug-fixer"]

// 通知正在工作的成员暂停
SendMessage({
  to: "frontend-dev",  // 或其他正在工作的成员
  message: `⚠️ 发现决策问题，请暂停当前实施

**问题描述**: ${问题描述}

team-lead 正在修复，修复完成后会通知你继续。

请不要继续实施，等待通知。`,
  summary: "暂停实施 - 等待决策修复"
})
```

## 步骤 5 - 修复问题

根据问题类型，修复相应文件：

### 修复设计文档
```javascript
Read("openspec/changes/{change-id}/design.md")
Edit({
  file_path: "openspec/changes/{change-id}/design.md",
  old_string: "错误的设计决策",
  new_string: "正确的设计决策"
})
```

### 修复任务列表
```javascript
Read("openspec/changes/{change-id}/tasks.md")
Edit({
  file_path: "openspec/changes/{change-id}/tasks.md",
  old_string: "错误的任务描述",
  new_string: "正确的任务描述"
})
```

## 步骤 6 - 更新任务描述

如果任务已创建，更新任务描述以反映修复后的要求：

```javascript
TaskGet({ taskId: "1" })

TaskUpdate({
  taskId: "1",
  description: `## ⚠️ 重要变更：${变更说明}

**已修复的问题**: ${问题描述}

**修复内容**:
- ${修复项1}
- ${修复项2}

**更新后的实施要求**:
${新的实施要求}

---

${原任务描述（保留未变更部分）}`
})
```

## 步骤 7 - 通知成员继续实施

修复完成后，通知成员继续：

```javascript
SendMessage({
  to: "frontend-dev",
  message: `✅ 决策问题已修复完成！

**修复内容**:
- ${修复项1}
- ${修复项2}

**关键变更**:
${关键变更说明}

**你可以继续实施了**:
- 任务 #${taskId} 描述已更新
- 请按照新的要求继续实施

如有疑问随时询问，继续加油！`,
  summary: "决策已修复 - 可以继续实施"
})
```

## 步骤 8 - 显示修复摘要

输出修复摘要：

```
## Teams: Fix 已完成

**问题类型**: ${问题类型}
**修复范围**: ${修复的文件列表}

### 修复内容
- ${修复项1}
- ${修复项2}

### 已通知成员（四角色）
- frontend-dev: 已通知继续实施
- backend-dev: 已通知继续实施
- tester: 已通知继续实施
- bug-fixer: 已通知继续实施

### 下一步
成员将按照更新后的要求继续实施。
```

## 最佳实践

### 1. 快速响应
- 收到修复请求后立即响应
- 先通知成员暂停，避免浪费工作

### 2. 清晰沟通
- 明确说明问题是什么
- 说明修复了什么
- 告知如何继续

### 3. 完整修复
- 修复所有相关文件
- 更新任务描述
- 验证修复的正确性

## 注意事项

- ⚠️ 修复前先通知成员暂停，避免冲突
- ⚠️ 修复后必须更新任务描述
- ⚠️ 确保所有相关文件都已修复
- ⚠️ 通知成员时说明关键变更点
