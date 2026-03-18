---
name: "Teams: Fix"
description: 修复团队决策问题 - 当提案/设计/任务出现错误时，协调修复并通知成员继续实施
tags: [teams, collaboration, agent-teams, fix]
---

修复团队决策问题，协调 team-lead 修复并通知成员继续实施。

**输入**: 可选指定问题描述（如 `/teams:fix 字段复用错误`），或从上下文推断。

## 步骤 1 - 确认身份（必须）

**⚠️ 重要：只有 team-lead 才能执行修复操作**

检查当前身份：
```javascript
// 检查团队配置文件
Read("~/.claude/teams/{team-name}/config.json")

// 或从上下文判断：
// - 如果你是通过 TeamCreate 创建的团队 → 你是 team-lead
// - 如果你是通过 Agent 工具 spawn 的成员 → 你不是 team-lead
```

**如果你不是 team-lead**：
```javascript
SendMessage({
  type: "message",
  recipient: "team-lead",
  content: `⚠️ 发现决策问题，需要修复

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
- `.claude/skills/agent-teams/docs/teams-fix.md`

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
SendMessage({
  type: "message",
  recipient: "frontend-dev",  // 或 backend-dev、tester、bug-fixer
  content: `⚠️ 发现决策问题，请暂停当前实施

**问题描述**: ${问题描述}

team-lead 正在修复，修复完成后会通知你继续。

请不要继续实施，等待通知。`,
  summary: "暂停实施 - 等待决策修复"
})
```

## 步骤 5 - 修复问题

根据问题类型，修复相应文件：

### 修复提案（proposal.md）

```javascript
// 1. 读取提案
Read("openspec/changes/{change-id}/proposal.md")

// 2. 修改错误内容
Edit({
  file_path: "openspec/changes/{change-id}/proposal.md",
  old_string: "错误的描述或方案",
  new_string: "正确的描述或方案"
})
```

### 修复设计（design.md）

```javascript
// 1. 读取设计文档
Read("openspec/changes/{change-id}/design.md")

// 2. 修改设计决策
Edit({
  file_path: "openspec/changes/{change-id}/design.md",
  old_string: "错误的设计决策",
  new_string: "正确的设计决策"
})
```

### 修复任务（tasks.md）

```javascript
// 1. 读取任务列表
Read("openspec/changes/{change-id}/tasks.md")

// 2. 修改任务描述或顺序
Edit({
  file_path: "openspec/changes/{change-id}/tasks.md",
  old_string: "错误的任务描述",
  new_string: "正确的任务描述"
})

// 3. 如果需要批量替换（如字段名变更）
Edit({
  file_path: "openspec/changes/{change-id}/tasks.md",
  old_string: "usePackageVehicleType",
  new_string: "fixedBilling",
  replace_all: true
})
```

### 修复配置文件

```javascript
// 1. 读取配置类
Read("path/to/ConfigClass.java")

// 2. 修改配置代码
Edit({
  file_path: "path/to/ConfigClass.java",
  old_string: "错误的配置代码",
  new_string: "正确的配置代码"
})
```

## 步骤 6 - 更新任务描述

如果任务已创建，更新任务描述以反映修复后的要求：

```javascript
// 1. 获取任务详情
TaskGet({ taskId: "7" })

// 2. 更新任务描述
TaskUpdate({
  taskId: "7",
  description: `## ⚠️ 重要变更：${变更说明}

**已修复的问题**: ${问题描述}

**修复内容**:
- ${修复项1}
- ${修复项2}

**更新后的实施要求**:
${新的实施要求}

**关键变更点**:
- ${关键变更1}
- ${关键变更2}

---

${原任务描述（保留未变更部分）}`
})
```

## 步骤 7 - 通知成员继续实施

修复完成后，通知成员继续：

```javascript
SendMessage({
  type: "message",
  recipient: "frontend-dev",  // 或 backend-dev、tester、bug-fixer
  content: `✅ 决策问题已修复完成！

**修复内容**:
- ${修复项1}
- ${修复项2}

**关键变更**:
${关键变更说明}

**你可以继续实施了**:
- 任务 #${taskId} 描述已更新
- 请按照新的要求继续实施
- ${具体的继续实施指引}

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

### 已通知成员
- frontend-dev: 已通知继续实施
- backend-dev: 已通知继续实施

### 下一步
成员将按照更新后的要求继续实施。
```

## 完整示例：字段复用问题修复

```javascript
// 步骤 1: 激活技能
Skill("agent-teams")

// 步骤 2: 识别问题
// 用户/成员反馈：应该复用现有字段而非新增
// 问题类型：配置问题

// 步骤 3: 通知暂停
SendMessage({
  type: "message",
  recipient: "frontend-dev",
  content: `⚠️ 收到，正在修复字段复用问题

请暂停当前实施，等待修复完成。`,
  summary: "暂停实施 - 修复字段复用问题"
})

// 步骤 4: 修复配置文件
Read("fhd-modules/fhd-parking-lot/src/main/java/com/fhd/parking/domain/configs/FixedCarConfig.java")
Edit({
  file_path: "fhd-modules/fhd-parking-lot/src/main/java/com/fhd/parking/domain/configs/FixedCarConfig.java",
  old_string: `    private Boolean usePackageVehicleType;
    private Boolean updateInLotOnRenew;`,
  new_string: `    /**
     * 固定车管理-办理/续费时更新在场车辆
     */
    private Boolean fixedFreePassage;

    /**
     * 固定车管理-按套餐车型计费
     */
    private Boolean fixedBilling;`
})

// 修复 tasks.md
Read("openspec/changes/add-fixed-vehicle-billing-and-update-config/tasks.md")
Edit({
  file_path: "openspec/changes/add-fixed-vehicle-billing-and-update-config/tasks.md",
  old_string: "usePackageVehicleType",
  new_string: "fixedBilling",
  replace_all: true
})

// 步骤 5: 更新任务描述
TaskUpdate({
  taskId: "7",
  description: `## ⚠️ 重要变更：复用现有字段

**已修复的问题**: 配置层应复用现有字段而非新增字段

**字段映射**:
- fixedBilling → "按套餐车型计费"（原 usePackageVehicleType）
- fixedFreePassage → "办理/续费时更新在场车辆"（原 updateInLotOnRenew）

**已完成的修复**:
1. ✅ FixedCarConfig.java - 删除新增字段，更新注释
2. ✅ RemoteFixedCarConfig.java - 更新注释
3. ✅ tasks.md - 更新所有字段引用

---

${原任务描述}`
})

// 步骤 6: 通知继续
SendMessage({
  type: "message",
  recipient: "frontend-dev",
  content: `✅ 字段复用问题已修复完成！

**修复内容**:
- 删除了 usePackageVehicleType 和 updateInLotOnRenew 新增字段
- 复用 fixedBilling 和 fixedFreePassage 现有字段
- 更新了字段注释和 tasks.md 引用

**关键变更**:
- 使用 fixedBilling 而非 usePackageVehicleType
- 使用 fixedFreePassage 而非 updateInLotOnRenew

**你可以继续实施了**:
- 任务 #7 描述已更新
- 按照新的字段名称继续实施
- 配置文件已修复，可以直接使用

继续加油！`,
  summary: "字段复用问题已修复 - 可以继续实施"
})

// 步骤 7: 显示摘要
console.log(`
## Teams: Fix 已完成

**问题类型**: 配置问题
**修复范围**: FixedCarConfig.java, RemoteFixedCarConfig.java, tasks.md

### 修复内容
- 删除新增字段，复用现有字段
- 更新字段注释和文档引用

### 已通知成员
- frontend-dev: 已通知继续实施
- backend-dev: 已通知继续实施

### 下一步
团队成员将按照更新后的字段名称继续实施。
`)
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
- 修复所有相关文件（proposal/design/tasks/代码）
- 更新任务描述
- 验证修复的正确性

### 4. 及时通知
- 修复完成后立即通知成员
- 提供清晰的继续实施指引

### 5. 记录变更
- 在任务描述中记录变更历史
- 便于后续追溯和理解

## 注意事项

- ⚠️ 修复前先通知成员暂停，避免冲突
- ⚠️ 修复后必须更新任务描述
- ⚠️ 确保所有相关文件都已修复
- ⚠️ 通知成员时说明关键变更点
- ⚠️ 如果修复涉及已完成的代码，需要告知成员回滚

## 相关文档

- [团队创建](../docs/team-creation.md)
- [任务管理](../docs/task-management.md)
- [消息通信](../docs/messaging.md)
- [OpenSpec 集成](../docs/openspec-integration.md)
- [详细修复流程](../commands/teams-fix.md)
