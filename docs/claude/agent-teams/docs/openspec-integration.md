# OpenSpec 集成规范

## 概述

当使用 OpenSpec 提案驱动开发时，team-lead 需要从 `tasks.md` 中解析任务，
正确分类并分配给对应成员，同时在分配前告知成员需要激活哪些技能。

## 第一步：读取 OpenSpec 任务

```bash
# 读取提案的任务列表
cat openspec/changes/{change-id}/tasks.md
```

或使用 Read 工具：
```javascript
Read("openspec/changes/{change-id}/tasks.md")
```

### tasks.md 格式示例

```markdown
## 实现任务

### 数据层
- [ ] 创建 `HdDriver` Entity 继承 TenantEntity
- [ ] 创建 `HdDriverBo` 请求对象（含验证注解）
- [ ] 创建 `HdDriverVo` 响应对象（含 @AutoMapper）
- [ ] 创建 `HdDriverMapper` 继承 BaseMapperPlus

### 业务层
- [ ] 实现 `IHdDriverService` 接口
- [ ] 实现 `HdDriverServiceImpl`（queryPageList/getById/insert/update/delete）

### 接口层
- [ ] 实现 `HdDriverController`（含 @SaCheckPermission）

### 测试
- [ ] 编写 `HdDriverServiceTest` 单元测试
- [ ] 验证所有接口正常工作
```

## 第二步：任务分类规则

### 开发者任务（分配给 developer）

| 关键词 | 示例 |
|--------|------|
| 创建、实现、添加 | 创建 Entity、实现 Service |
| 修改、重构、优化 | 修改 Controller、重构逻辑 |
| 修复 Bug | 修复参数验证问题 |
| 数据库迁移 | 创建表结构 SQL |

### 测试者任务（分配给 tester）

| 关键词 | 示例 |
|--------|------|
| 编写测试、测试用例 | 编写单元测试 |
| 验证、检查 | 验证接口正常工作 |
| 测试覆盖率 | 确保覆盖率 ≥ 80% |

## 第三步：技能映射规则

根据任务内容，team-lead 需要告知成员激活哪些技能：

### OpenSpec 专用技能（必需）

**所有 OpenSpec 任务都需要激活 OpenSpec 技能**：

| 技能 | 用途 | 何时使用 |
|------|------|---------|
| `opsx:continue` | 读取 OpenSpec 提案详情 | 成员不在提案分支时必须调用 |
| `opsx:apply` | 执行 OpenSpec 任务 | 开始实现任务时调用 |
| `opsx:verify` | 验证实现是否符合提案 | 完成任务后验证 |

**重要**：
- 如果成员**不在提案分支**，必须先调用 `/opsx:continue {change-id}` 读取提案
- 如果成员**已在提案分支**，可以直接开始工作，无需调用 `opsx:continue`

### 开发者技能映射

| 任务类型 | 需要激活的技能 |
|----------|---------------|
| CRUD 全栈开发 | `crud-development`, `database-ops`, `api-development`, `backend-annotations` |
| 仅数据层（Entity/Mapper） | `crud-development`, `database-ops` |
| 仅接口层（Controller） | `api-development`, `backend-annotations` |
| 仅业务层（Service） | `crud-development`, `error-handler` |
| Bug 修复 | 根据 Bug 类型判断（通常 `error-handler`） |
| 数据库建表 | `database-ops` |

### 测试者技能映射

| 任务类型 | 需要激活的技能 |
|----------|---------------|
| 单元测试 | `testing-standards` |
| 集成测试 | `testing-standards`, `api-development` |

## 第四步：创建任务并分配

### 从 OpenSpec 任务创建 TaskCreate

```javascript
// 将 OpenSpec 的多个小任务合并为一个 TaskCreate
// 开发任务：合并数据层 + 业务层 + 接口层
TaskCreate({
  subject: "实现司机管理CRUD功能",
  description: `## ⚠️ 指令：强制技能激活流程（必须执行）

在开始实施任务前，你**必须**按以下步骤操作：

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


### 步骤 5 - 读取 OpenSpec 提案
读取提案的核心文档：

# 如果不在提案分支，先调用：
/opsx:continue add-driver-mgmt

# 然后执行任务：
/opsx:apply add-driver-mgmt

该命令会自动激活所需技能并读取提案文档。

### 步骤 6 - 实施任务
按照技能规范和提案要求实施以下任务：

【数据层】
- 创建 HdDriver Entity 继承 TenantEntity
- 创建 HdDriverBo（含验证注解）
- 创建 HdDriverVo（含 @AutoMapper）
- 创建 HdDriverMapper 继承 BaseMapperPlus

【业务层】
- 实现 IHdDriverService 接口
- 实现 HdDriverServiceImpl

【接口层】
- 实现 HdDriverController（含 @SaCheckPermission）

验收标准：
- 代码符合项目规范（禁止 JOIN，使用 @author zhangjiazheng）
- 所有接口可正常调用`,
  activeForm: "实现司机管理CRUD"
})
// 返回 taskId: "1"

// 测试任务：依赖开发任务
TaskCreate({
  subject: "测试司机管理CRUD功能",
  description: `## ⚠️ 指令：强制技能激活流程（必须执行）

在开始测试前，你**必须**按以下步骤操作：

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

### 步骤 5 - 读取子技能明细(必须)
激活 testing-standards 后：
1. Read: .claude/skills/testing-standards/QUICK_REF.md
2. Read: .claude/skills/testing-standards/docs/assertions.md
3. Read: .claude/skills/testing-standards/docs/test-data.md
4. 按照文档规范实现

### 步骤 6 - 读取 OpenSpec 提案
读取提案的核心文档：
Read("openspec/changes/add-driver-mgmt/proposal.md")
Read("openspec/changes/add-driver-mgmt/tasks.md")

### 步骤 7 - 实施测试任务
按照技能规范和提案要求执行以下测试：

- 编写 HdDriverServiceTest 单元测试
- 验证所有接口正常工作
- 确保测试覆盖率 ≥ 80%`,
  activeForm: "测试司机管理CRUD"
})
// 返回 taskId: "2"

// 设置依赖：测试依赖开发
TaskUpdate({ taskId: "2", addBlockedBy: ["1"] })
```

## 第五步：分配任务并通知技能

**这是关键步骤**：分配任务时，必须在消息中明确告知成员：
1. OpenSpec 提案的 change-id（分支名）
2. 是否需要调用 `opsx:continue` 读取提案
3. 需要激活哪些技能

### 通知开发者

```javascript
TaskUpdate({ taskId: "1", owner: "developer", status: "in_progress" })

SendMessage({
  type: "message",
  recipient: "developer",
  content: `任务 #1 已分配给你：实现司机管理CRUD功能

📋 OpenSpec 提案：add-driver-mgmt
📍 提案路径：openspec/changes/add-driver-mgmt/

🔧 开始前请按顺序执行：

【第一步：读取提案（如果不在提案分支）】
如果你当前不在 add-driver-mgmt 分支，请先调用：
  /opsx:continue add-driver-mgmt
这将读取提案的 proposal.md、tasks.md 和 design.md。
如果你已在 add-driver-mgmt 分支，跳过此步骤。

【第二步：实施任务】
调用以下命令开始实施：
  /opsx:apply add-driver-mgmt

该命令会自动：
- 激活所需技能（crud-development、database-ops、api-development、backend-annotations）
- 读取提案和设计文档
- 按任务列表逐步实施

📌 注意事项：
- 禁止使用 JOIN，使用应用层组装
- @author 必须使用 zhangjiazheng
- 参考模块：fhd-modules/fhd-parking-lot

完成后请 TaskUpdate 标记完成并通知我。`,
  summary: "分配开发任务 #1（OpenSpec: add-driver-mgmt）"
})
```

### 通知测试者

```javascript
// 等开发完成后
TaskUpdate({ taskId: "2", owner: "tester", status: "in_progress" })

SendMessage({
  type: "message",
  recipient: "tester",
  content: `任务 #2 已分配给你：测试司机管理CRUD功能

📋 OpenSpec 提案：add-driver-mgmt
📍 提案路径：openspec/changes/add-driver-mgmt/

🔧 开始前请按顺序执行：

【第一步：读取提案（如果不在提案分支）】
如果你当前不在 add-driver-mgmt 分支，请先调用：
  /opsx:continue add-driver-mgmt

【第二步：实施测试任务】
调用以下命令开始测试：
  /opsx:apply add-driver-mgmt

该命令会自动激活测试技能并按任务列表执行测试。

📌 注意事项：
- 使用 @ExtendWith(MockitoExtension.class)
- Mock 所有外部依赖
- 覆盖率目标 ≥ 80%

完成后请 TaskUpdate 标记完成并通知我。`,
  summary: "分配测试任务 #2（OpenSpec: add-driver-mgmt）"
})
```

## 完整 OpenSpec 工作流程

```
1. Read openspec/changes/{change-id}/tasks.md
2. 分类任务（开发 vs 测试）
3. TaskCreate（开发任务）→ taskId: "1"
4. TaskCreate（测试任务）→ taskId: "2"
5. TaskUpdate（设置依赖：2 blockedBy 1）
6. TaskUpdate（分配 #1 给 developer）
7. SendMessage（通知 developer）
   - 包含 OpenSpec change-id
   - 告知是否需要调用 opsx:continue
   - 列出需要激活的技能
8. 等待 developer 完成...
9. TaskUpdate（分配 #2 给 tester）
10. SendMessage（通知 tester）
    - 包含 OpenSpec change-id
    - 告知是否需要调用 opsx:continue
    - 列出需要激活的技能
11. 等待 tester 完成...
12. 所有任务完成 → shutdown 团队
```

## 成员工作流程

### 开发者收到任务后的流程

```
1. 检查当前分支
   - 如果不在提案分支 → 调用 `/opsx:continue {change-id}`
   - 如果已在提案分支 → 跳过此步

2. 调用 `/opsx:apply {change-id}` 开始实施
   - 自动激活所需技能
   - 自动读取提案和设计文档
   - 按任务列表逐步实施

3. 完成后
   - TaskUpdate 标记完成
   - SendMessage 通知 team-lead
```

### 测试者收到任务后的流程

```
1. 检查当前分支
   - 如果不在提案分支 → 调用 `/opsx:continue {change-id}`
   - 如果已在提案分支 → 跳过此步

2. 调用 `/opsx:apply {change-id}` 开始测试
   - 自动激活 testing-standards 技能
   - 按任务列表执行测试任务

3. 完成后
   - TaskUpdate 标记完成
   - SendMessage 通知 team-lead（包含测试结果）
```

## 相关文档

- [任务管理](task-management.md)
- [成员协作](member-collaboration.md)
- [完整工作流程](workflow.md)
