# 最佳实践

## 概述

本文档总结 Agent Teams 使用的最佳实践，帮助团队高效协作。

## 团队设计原则

### 1. 最小化团队规模

- 只创建必要的成员
- 避免创建不需要的角色
- 2-4 人的小团队效率最高

### 2. 明确职责分工

- 每个成员有清晰的职责
- 避免职责重叠
- 明确协作边界

### 3. 选择合适的 Agent 类型

| 任务类型 | Agent 类型 | 原因 |
|---------|-----------|------|
| 功能开发 | general-purpose | 需要写代码 |
| Bug 修复 | general-purpose | 需要修改代码 |
| 测试编写 | general-purpose | 需要写测试代码 |
| 代码探索 | Explore | 只需要读代码 |
| 架构规划 | Plan | 只需要规划 |

## 任务管理最佳实践

### 1. 任务粒度适中

**太大的任务**（不好）:
```
实现整个停车场管理系统
```

**适中的任务**（好）:
```
实现停车场基础信息的CRUD功能
```

**太小的任务**（不好）:
```
创建 ParkingLot.java 文件
```

### 2. 任务描述要完整

每个任务描述应包含：
- 具体需求
- 验收标准
- 注意事项
- 参考资料

### 3. 合理设置依赖

```
开发任务 → 测试任务 → 修复任务 → 验证任务
```

避免：
- 循环依赖
- 不必要的依赖
- 遗漏关键依赖

## 通信最佳实践

### 1. 消息要具体

**不好的消息**:
```
去做任务
```

**好的消息**:
```
请实现任务 #1：司机管理的CRUD功能

需求：
1. 创建 Driver Entity/Bo/Vo
2. 实现 DriverController（包含 CRUD 接口）
3. 实现 DriverService 和 DriverServiceImpl
4. 实现 DriverMapper
5. 添加权限注解 @SaCheckPermission

验收标准：
- 所有接口正常工作
- 代码符合项目规范

注意：遵循分库分表规范，禁止使用 JOIN
```

### 2. 优先使用 message

- 只有真正需要所有人知道的信息才用 broadcast
- 大多数情况使用 message 发给特定成员

### 3. 及时响应

- 收到任务后立即开始
- 完成后立即通知
- 遇到问题立即报告

## 协作模式最佳实践

### 1. 开发-测试循环

```
开发 → 测试 → 修复 → 验证
```

- 开发完成后立即通知测试
- 测试发现问题立即通知开发
- 修复后立即通知测试验证

### 2. 并行开发

当任务可以并行时：
- 同时分配给不同成员
- 设置合理的集成点
- 最后进行集成测试

### 3. 知识共享

- 成员遇到问题时及时报告
- team-lead 提供必要的指导
- 记录重要的决策和解决方案

## 代码逻辑变更通知规范

### 场景：开发者修改了核心业务逻辑

当开发者对已有功能的**核心业务逻辑**进行了重大修改（如重构判断逻辑、修改计算方式、调整数据流），原有测试用例可能与新逻辑完全不符，**必须主动通知测试者更新测试**。

#### 触发条件（满足任一即需通知）

- 修改了核心判断逻辑（如多位多车的入场/出场判断）
- 修改了计算方式（如计费规则、费用计算）
- 修改了方法签名（参数增减、类型变更）
- 修改了数据流（字段含义变化、新增/删除字段）
- 重构了服务接口（如统一参数对象 Bo）

#### 通知消息模板

```
开发者完成逻辑变更后，发送消息给 tester：

SendMessage({
  to: "tester",
  message: `⚠️ 代码逻辑变更通知 - 需要更新测试

【变更模块】: MultiPortVehicleRecordService
【变更内容】: 多位多车入场判断逻辑已重构
  - 原逻辑: handleVehicleEnter(plateNumber, parkingLotId, ...)
  - 新逻辑: handleVehicleEnter(MultiPortVehicleEnterBo enterBo)
  - 影响范围: 入场处理、固定车办理/续费时的在场记录更新

【需要更新的测试文件】:
  - MultiPortVehicleRecordServiceImplTest.java
  - FixedVehiclesServiceImplTest.java（如有）

【更新要点】:
  1. 构造 MultiPortVehicleEnterBo 替代原来的多参数调用
  2. 验证 enterBo.getEnterTime() 为 null 时使用当前时间
  3. 验证 enterBo.getEnterTime() 非 null 时使用指定时间

请激活 testing-standards 技能后更新测试用例。`,
  summary: "通知测试者更新多位多车测试"
})
```

#### 通知内容要求

通知消息必须包含：
1. **变更模块** - 哪个类/服务发生了变化
2. **变更内容** - 原逻辑 vs 新逻辑的对比
3. **影响范围** - 哪些功能受到影响
4. **需要更新的测试文件** - 明确指出文件路径
5. **更新要点** - 测试用例需要调整的具体方向

#### 工作流程

```
developer 完成逻辑变更
    ↓
developer 发送变更通知给 tester（包含上述5项内容）
    ↓
tester 激活 testing-standards 技能
    ↓
tester 读取变更通知，理解新逻辑
    ↓
tester 更新/重写受影响的测试用例
    ↓
tester 执行测试验证（mvn test -pl {module} -Dtest={TestClass}）
    ↓
tester 通知 team-lead 测试更新完成
```

#### 反例（不好的做法）

```
❌ 开发者修改逻辑后直接标记任务完成，不通知测试者
❌ 通知消息只说"逻辑改了，你去看看"，没有具体说明
❌ 测试者收到通知后直接删除旧测试，而不是更新
```

---

## 常见反模式

### 反模式1：过度广播

**问题**: 频繁使用 broadcast 发送消息

**影响**: 消耗大量 token，成员收到不相关的消息

**解决**: 使用 message 发给特定成员

### 反模式2：任务描述不清

**问题**: 任务描述模糊，成员不知道做什么

**影响**: 成员实现错误，需要返工

**解决**: 提供详细的需求和验收标准

### 反模式3：不更新任务状态

**问题**: 成员完成任务但不更新状态

**影响**: team-lead 不知道进度，无法分配后续任务

**解决**: 在成员 prompt 中明确要求完成后更新状态

### 反模式4：忽略 idle 通知

**问题**: 成员发送 idle 通知后，team-lead 误以为成员出错

**影响**: 不必要的干预，浪费时间

**解决**: 理解 idle 是正常状态，等待任务分配即可

### 反模式5：选错 Agent 类型

**问题**: 使用 Explore agent 做开发任务

**影响**: 成员无法写代码，任务无法完成

**解决**: 开发和测试任务使用 general-purpose

## 效率提升技巧

### 1. 并行 Spawn 成员

```javascript
// 同时 spawn 多个成员（并行）
Agent({name: "developer", ...})
Agent({name: "tester", ...})
```

### 2. 预先创建所有任务

在开始工作前，预先创建所有任务并设置依赖关系，这样可以更好地规划工作流程。

### 3. 使用 activeForm

为任务设置 activeForm，可以在任务进行中时显示更友好的状态信息：

```javascript
TaskCreate({
  subject: "实现司机管理的CRUD功能",
  activeForm: "实现司机管理CRUD"  // 进行中时显示
})
```

### 4. 批量分配任务

当有多个独立任务时，可以同时分配给不同成员：

```javascript
// 同时分配前端和后端任务
TaskUpdate({taskId: "1", owner: "frontend-dev", status: "in_progress"})
TaskUpdate({taskId: "2", owner: "backend-dev", status: "in_progress"})
```

## 团队复用最佳实践

### 1. 推荐模式：清理后创建

Agent Teams **不支持会话恢复**，无法重连已存在的成员。推荐采用"清理后创建"模式：

```javascript
// 1. 检查团队是否存在
const teamExists = Bash({
  command: "test -d ~/.claude/teams/dev-test-team && echo exists || echo not exists"
})

// 2. 如果存在，先清理
if (teamExists === "exists") {
  // 尝试关闭成员
  try { SendMessage({ type: "shutdown_request", recipient: "developer", content: "清理团队" }) } catch (e) {}
  try { SendMessage({ type: "shutdown_request", recipient: "tester", content: "清理团队" }) } catch (e) {}

  // 删除团队
  try { TeamDelete() } catch (e) {
    // 备用方案：手动清理目录
    Bash({ command: "rm -rf ~/.claude/teams/dev-test-team ~/.claude/tasks/dev-test-team" })
  }
}

// 3. 创建新团队
TeamCreate({ team_name: "dev-test-team" })
```

**优势**：
- 每次会话都是干净状态
- 避免残留任务和配置
- 遵循官方文档的推荐做法

### 2. 避免尝试重连成员

**错误做法**：
```
尝试发送消息给旧成员，期望它们响应
```

**原因**：官方文档明确说明 in-process 队友不支持会话恢复

**正确做法**：
```
每次新会话 → 清理旧团队 → 创建新团队 → Spawn 新成员
```

### 3. 团队状态检查

如果不确定团队状态，可以检查配置文件：

```bash
# 检查团队配置
cat ~/.claude/teams/dev-test-team/config.json

# 检查任务列表
ls ~/.claude/tasks/dev-test-team/
```

如果发现残留的团队或任务，建议清理后重建。

### 4. 自动化清理脚本

创建团队时使用自动化清理函数：

```javascript
function createTeamWithCleanup(teamName, members) {
  // 清理现有团队
  cleanupTeam(teamName)

  // 创建新团队
  TeamCreate({ team_name: teamName })

  // Spawn 成员
  members.forEach(m => Agent({ ...m, team_name: teamName }))
}
```

完整实现参考 `docs/team-reuse.md` 中的模板6。

### 5. 团队命名规范

使用稳定的团队名称，便于清理：
- `dev-test-team` - 开发测试团队
- `feature-team` - 功能开发团队

避免动态名称（如 `team-${timestamp}`），难以追踪和清理。

## 相关文档

- [团队创建](team-creation.md)
- [任务管理](task-management.md)
- [成员协作](member-collaboration.md)
- [消息通信](messaging.md)
- [完整工作流程](workflow.md)
- [团队重用](team-reuse.md)
- [常见问题](troubleshooting.md)
