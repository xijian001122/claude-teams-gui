#!/usr/bin/env node

/**
 * Claude Code Hook - UserPromptSubmit
 * 触发时机：用户每次提交问题时
 * 功能：强制评估并激活相关技能，将技能激活率从 25% 提升到 90%+
 *
 * 核心逻辑：
 * 1. 检测是否为斜杠命令（如果是则跳过）
 * 2. 针对每个技能，要求 AI 评估是否需要
 * 3. 如果需要，强制使用 Skill() 工具激活
 * 4. 只有在技能激活完成后，才允许开始实现
 */

const fs = require('fs');
const path = require('path');

// 读取用户输入
const prompt = process.argv.slice(2).join(' ');

// 检测是否为斜杠命令（跳过技能评估）
const isSlashCommand = /^\/[^\/\s]+$/.test(prompt.split(/\s/)[0]);

if (isSlashCommand) {
    // 斜杠命令直接放行，不执行技能评估
    process.exit(0);
}

// 强制技能评估指令
const instructions = `
## ⚠️ 指令：强制技能激活流程（必须执行）

在回答用户问题之前，你必须先完成以下步骤：

### 步骤 1 - 评估
针对以下每个技能，严格陈述：[技能名] - 是/否 - [理由]

**Claude Agent GUI 项目技能列表**（共13个）：

**开发技能**：
- **frontend-dev**: 前端开发、Preact组件、TailwindCSS样式、UI交互、状态管理
- **backend-dev**: 后端开发、Fastify路由、SQLite数据库、API接口、服务层
- **websocket-protocol**: WebSocket通信、实时消息、连接管理、事件处理

**架构技能**：
- **project-arch**: 项目架构、目录结构、技术栈、设计模式、整体理解
- **git-workflow**: Git工作流规范、分支管理、提交规范

**团队协作**：
- **agent-teams**: Agent Teams协作、团队创建、任务分配、成员协作

**OpenSpec 技能**：
- **openspec-propose**: 创建新提案、生成proposal/design/tasks
- **openspec-apply-change**: 应用变更任务、按照tasks执行
- **openspec-archive-change**: 归档完成变更、保存到archive
- **openspec-continue-change**: 继续变更、创建下一个artifact
- **openspec-explore**: 探索变更、调查问题、澄清需求

**其他**：
- **skill-evolution**: 技能系统维护、新增技能、修改技能规范
- **demo**: UI效果图生成、交互式原型

### 步骤 2 - 激活
- 如果任何技能评估为"是" → **必须**使用 Skill() 工具激活该技能
- 如果所有技能评估为"否" → 说明"不需要激活任何技能"并继续

### 步骤 3 - 读取技能文档（必须）
**激活技能后，必须按以下顺序读取文档：**

1. **读取 QUICK_REF.md**（如果存在）
   - 位置: \`.claude/skills/\${skill-name}/QUICK_REF.md\`
   - 提供快速概览和常用模式

2. **读取相关主题文档**
   - 位置: \`.claude/skills/\${skill-name}/docs/\${topic}.md\`
   - 包含详细规范和示例代码

3. **不要只依赖 SKILL.md**
   - SKILL.md 只是导航中心
   - 详细规范在 QUICK_REF.md 和 docs/ 中

### 步骤 4 - 读取子技能明细（必须）
**激活技能后，必须阅读对应的子技能文档：**

激活 **frontend-dev** 后：
1. Read: \`.claude/skills/frontend-dev/QUICK_REF.md\`
2. Read: \`.claude/skills/frontend-dev/docs/components.md\`
3. Read: \`.claude/skills/frontend-dev/docs/state-management.md\`
4. 按照文档规范实现

激活 **backend-dev** 后：
1. Read: \`.claude/skills/backend-dev/QUICK_REF.md\`
2. Read: \`.claude/skills/backend-dev/docs/api-design.md\`
3. Read: \`.claude/skills/backend-dev/docs/database.md\`
4. 按照文档规范实现

激活 **websocket-protocol** 后：
1. Read: \`.claude/skills/websocket-protocol/QUICK_REF.md\`
2. Read: \`.claude/skills/websocket-protocol/docs/message-format.md\`
3. 按照文档规范实现

激活 **project-arch** 后：
1. Read: \`.claude/skills/project-arch/QUICK_REF.md\`
2. Read: \`.claude/skills/project-arch/docs/architecture.md\`
3. 按照文档规范实现

激活 **agent-teams** 后：
1. Read: \`.claude/skills/agent-teams/QUICK_REF.md\`
2. Read: \`.claude/skills/agent-teams/docs/team-creation.md\`
3. Read: \`.claude/skills/agent-teams/docs/task-management.md\`
4. Read: \`.claude/skills/agent-teams/docs/openspec-integration.md\`
5. 按照文档规范创建团队和分配任务

激活 **openspec-propose** 后：
1. Read: \`.claude/skills/openspec-propose/SKILL.md\`
2. 按照提案规范创建变更文档

激活 **openspec-apply-change** 后：
1. Read: \`.claude/skills/openspec-apply-change/SKILL.md\`
2. Read: \`openspec/changes/<change-name>/tasks.md\`
3. 按照任务清单执行开发

激活 **git-workflow** 后：
1. Read: \`.claude/skills/git-workflow/SKILL.md\`
2. 按照Git规范执行提交和分支操作

### 步骤 5 - 实现
- 只有在步骤 2-4 完成后（技能已激活且文档已读取），才能开始实现
- 在实现过程中，严格遵守已读取文档中的规范

---

**示例**：

用户问题：帮我创建一个团队来实施 interactive-permission-auth 变更

AI 评估结果：
- agent-teams: 是 - 需要创建团队和分配任务
- openspec-propose: 否 - 变更已存在
- openspec-apply-change: 否 - 由团队成员执行
- frontend-dev: 否 - 由团队成员执行
- backend-dev: 否 - 由团队成员执行
- git-workflow: 否 - 稍后归档时需要
- 其他技能: 否

激活技能：
> Skill(skill="agent-teams")

激活 agent-teams 后：
1. Read: \`.claude/skills/agent-teams/QUICK_REF.md\`
2. Read: \`.claude/skills/agent-teams/docs/team-creation.md\`
3. Read: \`.claude/skills/agent-teams/docs/task-management.md\`
4. Read: \`.claude/skills/agent-teams/docs/openspec-integration.md\`
5. 使用 TeamCreate 创建团队，使用 TaskCreate 创建任务，使用 TaskUpdate 分配任务
6. 使用 /teams:apply <change-name> 让成员开始实施

**或者使用快捷命令**：
> /teams:apply interactive-permission-auth

[加载技能知识后开始实施...]

---

**重要提示**：
- 不要跳过评估步骤
- 不要在技能激活前开始实现
- **必须读取 QUICK_REF.md 和 docs/ 文档**
- 不要只依赖 SKILL.md（它只是导航中心）
- 严格按照文档中的规范进行开发
`;

console.log(instructions);
