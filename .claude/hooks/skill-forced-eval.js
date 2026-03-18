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

**Claude Chat 项目技能列表**：

- **frontend-dev**: 前端开发、Preact组件、TailwindCSS样式、UI交互、状态管理
- **backend-dev**: 后端开发、Fastify路由、SQLite数据库、API接口、服务层
- **websocket-protocol**: WebSocket通信、实时消息、连接管理、事件处理
- **project-arch**: 项目架构、目录结构、技术栈、设计模式、整体理解
- **skill-evolution**: 技能系统维护、新增技能、修改技能规范

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

### 步骤 4 - 示例评估流程

**示例**：

用户问题：帮我添加一个新的消息输入组件

AI 评估结果：
- frontend-dev: 是 - 涉及 Preact 组件开发
- backend-dev: 否 - 不涉及后端逻辑
- websocket-protocol: 否 - 不涉及 WebSocket 通信
- project-arch: 否 - 不需要了解整体架构
- skill-evolution: 否 - 不涉及技能系统维护

激活 frontend-dev 后：
    1. Read: .claude/skills/frontend-dev/QUICK_REF.md
    2. Read: .claude/skills/frontend-dev/docs/components.md
    3. 按照文档规范实现

激活技能：
> Skill(skill="frontend-dev")

[加载技能知识后开始实现...]

---

**重要提示**：
- 不要跳过评估步骤
- 不要在技能激活前开始实现
- **必须读取 QUICK_REF.md 和 docs/ 文档**
- 不要只依赖 SKILL.md（它只是导航中心）
- 严格按照文档中的规范进行开发
`;

console.log(instructions);
