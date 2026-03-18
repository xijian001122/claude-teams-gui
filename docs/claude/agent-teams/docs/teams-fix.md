# teams:fix - 修复团队决策问题

**用途**: 当团队决策出现问题需要修复时，协调 team-lead 修复并通知成员继续实施

**触发场景**:
- 用户指出提案或设计有问题
- 成员发现决策错误需要修正
- 配置或架构需要调整

## 使用方法

```
/teams:fix [问题描述]
```

**参数**:
- `问题描述` (可选): 简要描述需要修复的问题

## 工作流程

### 步骤 1: 接收修复请求

当收到修复请求时（来自用户或成员），识别问题类型：

| 问题类型 | 示例 | 处理方式 |
|---------|------|---------|
| 提案错误 | 字段命名错误、功能理解偏差 | 修改 proposal.md |
| 设计问题 | 架构决策不合理、技术选型错误 | 修改 design.md |
| 任务错误 | 任务拆分不合理、依赖关系错误 | 修改 tasks.md |
| 配置问题 | 字段复用错误、配置理解偏差 | 修改配置文件 |

### 步骤 2: 通知成员暂停

如果有成员正在实施，发送暂停通知：

```javascript
SendMessage({
  type: "message",
  recipient: "developer",  // 或其他正在工作的成员
  content: `⚠️ 发现决策问题，请暂停当前实施

**问题描述**: ${问题描述}

team-lead 正在修复，修复完成后会通知你继续。`,
  summary: "暂停实施 - 等待决策修复"
})
```

### 步骤 3: 修复问题

根据问题类型，修复相应文件：

**修复提案**:
```javascript
// 读取并修改 proposal.md
Read("openspec/changes/{change-id}/proposal.md")
Edit({
  file_path: "openspec/changes/{change-id}/proposal.md",
  old_string: "错误内容",
  new_string: "正确内容"
})
```

**修复设计**:
```javascript
// 读取并修改 design.md
Read("openspec/changes/{change-id}/design.md")
Edit({
  file_path: "openspec/changes/{change-id}/design.md",
  old_string: "错误决策",
  new_string: "正确决策"
})
```

**修复任务**:
```javascript
// 读取并修改 tasks.md
Read("openspec/changes/{change-id}/tasks.md")
Edit({
  file_path: "openspec/changes/{change-id}/tasks.md",
  old_string: "错误任务",
  new_string: "正确任务"
})
```

**修复配置文件**:
```javascript
// 读取并修改配置类
Read("path/to/ConfigClass.java")
Edit({
  file_path: "path/to/ConfigClass.java",
  old_string: "错误配置",
  new_string: "正确配置"
})
```

### 步骤 4: 更新任务描述

如果任务已创建，更新任务描述以反映修复后的要求：

```javascript
TaskUpdate({
  taskId: "7",
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

### 步骤 5: 通知成员继续实施

修复完成后，通知成员继续：

```javascript
SendMessage({
  type: "message",
  recipient: "developer",
  content: `✅ 决策问题已修复完成！

**修复内容**:
- ${修复项1}
- ${修复项2}

**关键变更**:
${关键变更说明}

**你可以继续实施了**:
- 任务 #${taskId} 描述已更新
- 请按照新的要求继续实施
- 如有疑问随时询问

继续加油！`,
  summary: "决策已修复 - 可以继续实施"
})
```

## 完整示例

### 示例 1: 字段复用问题修复

**场景**: developer 发现配置层应该复用现有字段而非新增字段

```javascript
// 步骤 1: 接收修复请求
// developer 发送消息：需要修改提案，复用现有字段

// 步骤 2: 通知暂停
SendMessage({
  type: "message",
  recipient: "developer",
  content: `⚠️ 收到，正在修复字段复用问题

请暂停当前实施，等待修复完成。`,
  summary: "暂停实施 - 修复字段复用问题"
})

// 步骤 3: 修复配置文件
Read("fhd-modules/fhd-parking-lot/src/main/java/com/fhd/parking/domain/configs/FixedCarConfig.java")
Edit({
  file_path: "fhd-modules/fhd-parking-lot/src/main/java/com/fhd/parking/domain/configs/FixedCarConfig.java",
  old_string: `    /**
     * 固定车管理-免费放行
     */
    private Boolean fixedFreePassage;

    /**
     * 固定车管理-车型计费
     */
    private Boolean fixedBilling;

    /**
     * 固定车管理-按套餐车型计费
     */
    private Boolean usePackageVehicleType;

    /**
     * 固定车管理-办理/续费时更新在场车辆
     */
    private Boolean updateInLotOnRenew;`,
  new_string: `    /**
     * 固定车管理-办理/续费时更新在场车辆
     * <p>办理或续费固定车时，是否自动更新在场记录的服务类型和车型信息（true-更新，false-不更新）</p>
     */
    private Boolean fixedFreePassage;

    /**
     * 固定车管理-按套餐车型计费
     * <p>固定车过期或区域不匹配时，是否使用套餐车型进行计费（true-使用套餐车型，false-使用识别车型）</p>
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
Edit({
  file_path: "openspec/changes/add-fixed-vehicle-billing-and-update-config/tasks.md",
  old_string: "updateInLotOnRenew",
  new_string: "fixedFreePassage",
  replace_all: true
})

// 步骤 4: 更新任务描述
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

// 步骤 5: 通知继续实施
SendMessage({
  type: "message",
  recipient: "developer",
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
```

### 示例 2: 任务拆分问题修复

**场景**: 任务拆分不合理，需要重新组织

```javascript
// 步骤 1-2: 接收请求并通知暂停
SendMessage({
  type: "message",
  recipient: "developer",
  content: "⚠️ 任务拆分需要调整，请暂停",
  summary: "暂停实施 - 调整任务拆分"
})

// 步骤 3: 修复 tasks.md
Read("openspec/changes/{change-id}/tasks.md")
Edit({
  file_path: "openspec/changes/{change-id}/tasks.md",
  old_string: "原任务拆分",
  new_string: "新任务拆分"
})

// 步骤 4: 更新任务描述
TaskUpdate({
  taskId: "7",
  description: `## ⚠️ 重要变更：任务拆分已调整

**调整原因**: 原拆分不合理，导致依赖关系混乱

**新的任务组织**:
${新的任务组织}

---

${原任务描述}`
})

// 步骤 5: 通知继续
SendMessage({
  type: "message",
  recipient: "developer",
  content: `✅ 任务拆分已调整完成！

按照新的任务组织继续实施。`,
  summary: "任务拆分已调整 - 可以继续实施"
})
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

---

**最后更新**: 2026-03-14
**维护者**: 开发团队
