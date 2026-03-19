# 规范：OpenSpec 集成

## 功能需求

### FR1: 任务分配必须包含 OpenSpec 指令

**描述**: 当 Team-lead 分配任务给团队成员时，消息必须包含 `/opsx:apply <change-name>` 指令。

**验收标准**:
- [ ] 消息中包含 OpenSpec 变更名称
- [ ] 消息中包含 `/opsx:apply <change-name>` 命令
- [ ] 消息中说明该命令的作用

### FR2: 任务分配必须包含强制技能激活流程

**描述**: 消息必须包含强制技能激活流程的详细步骤。

**验收标准**:
- [ ] 步骤1: 评估技能需求
- [ ] 步骤2: 使用 Skill() 激活技能
- [ ] 步骤3: 读取技能文档（QUICK_REF.md 和 docs/）
- [ ] 步骤4: 执行 OpenSpec 命令
- [ ] 步骤5: 通知完成

### FR3: 明确 Team-lead 职责边界

**描述**: 文档必须明确说明 Team-lead 只分配任务，不直接修改代码。

**验收标准**:
- [ ] 明确列出 Team-lead 可以做的事
- [ ] 明确列出 Team-lead 不能做的事
- [ ] 强调代码修改由成员执行

### FR4: 所有文档保持一致

**描述**: `commands/teams/apply.md` 和 `skills/agent-teams/` 中的消息模板必须保持一致。

**验收标准**:
- [ ] commands/teams/apply.md 使用更新后的模板
- [ ] skills/agent-teams/SKILL.md 使用更新后的模板
- [ ] skills/agent-teams/docs/workflow.md 使用更新后的模板

## 非功能需求

### NFR1: 文档可读性

**描述**: 消息模板必须清晰易读，结构分明。

**验收标准**:
- 使用 Markdown 格式
- 使用代码块展示命令
- 使用表情符号增强可读性

### NFR2: 向后兼容

**描述**: 更新不应破坏现有团队的工作流程。

**验收标准**:
- 现有团队可以继续使用
- 新增内容是增强而非破坏
