# Design: 修复 teams:apply 命令的 OpenSpec 集成

## 核心设计决策

### 1. 强制 OpenSpec 集成流程

```
┌─────────────────────────────────────────────────────────────────┐
│                    任务分配消息结构                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. 任务基本信息                                                │
│     - 任务 ID 和标题                                            │
│     - OpenSpec 变更名称（必填）                                 │
│                                                                 │
│  2. 强制技能激活流程（必须执行）                                │
│     - 步骤1: 评估技能需求                                       │
│     - 步骤2: 使用 Skill() 激活技能                              │
│     - 步骤3: 读取技能文档（QUICK_REF.md 和 docs/）              │
│                                                                 │
│  3. OpenSpec 执行命令                                           │
│     - /opsx:explore <change-name>（如果需要）                  │
│     - /opsx:apply <change-name>（必须）                        │
│                                                                 │
│  4. 完成通知                                                    │
│     - TaskUpdate 标记 completed                                 │
│     - SendMessage 通知 team-lead                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Team-lead 职责边界

```
┌─────────────────────────────────────────────────────────────────┐
│                    Team-lead 职责边界                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ✅ 可以做：                                                    │
│     - 创建团队和成员                                            │
│     - 创建和分配任务                                            │
│     - 读取 OpenSpec 文档                                        │
│     - 审查成员提交的代码                                        │
│     - 更新任务描述（如需要）                                    │
│                                                                 │
│  ❌ 不能做：                                                    │
│     - 直接修改代码文件                                          │
│     - 自己实施任务（应该分配给成员）                            │
│     - 绕过 OpenSpec 流程直接开发                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3. 任务分配消息模板

```javascript
SendMessage({
  to: "frontend-dev",  // 或 backend-dev, tester, bug-fixer
  message: `任务 #${taskId} 已分配给你：${taskTitle}

📋 OpenSpec 变更：${changeName}

## ⚠️ 强制技能激活流程（必须执行）

在开始实施任务前，你**必须**按以下步骤操作：

### 步骤 1 - 评估技能需求
根据任务内容，判断需要激活哪些技能：
- 前端任务：frontend-dev, websocket-protocol
- 后端任务：backend-dev, websocket-protocol
- 测试任务：frontend-dev（了解组件）或 backend-dev（了解 API）

### 步骤 2 - 激活技能
使用 Skill() 工具激活所需技能：
\`\`\`
Skill("frontend-dev")  // 或 "backend-dev", "websocket-protocol"
\`\`\`

### 步骤 3 - 读取技能文档（必须）
激活技能后，**必须**读取技能的文档：
1. 读取 QUICK_REF.md（快速参考）
2. 读取相关的 docs/*.md（详细文档）

### 步骤 4 - 执行 OpenSpec 命令（必须）

【第一步：探索提案（可选）】
如果需要了解设计决策：
  /opsx:explore ${changeName}

【第二步：实施任务】
调用以下命令开始实施：
  /opsx:apply ${changeName}

该命令会自动：
- 读取 OpenSpec 提案和设计文档
- 按 tasks.md 中的任务列表逐步实施
- 更新任务完成状态

⚠️ 注意事项：
- 必须遵循 design.md 中的设计决策
- 必须按 tasks.md 中的任务顺序执行
- 完成后必须更新 tasks.md 中的任务状态

### 步骤 5 - 通知完成

完成后：
1. TaskUpdate 标记 completed
2. SendMessage 通知 team-lead

team-lead 将审查你的实现，如有需要会提出修改意见。`,
  summary: `分配任务 #${taskId}（OpenSpec: ${changeName}）`
})
```

### 4. 文档更新策略

| 文件 | 更新内容 |
|------|----------|
| `commands/teams/apply.md` | 1. 添加步骤2.5：确认 OpenSpec 变更名称<br>2. 更新步骤4：使用上述消息模板<br>3. 添加 Team-lead 职责边界说明 |
| `skills/agent-teams/SKILL.md` | 1. 更新"任务分配消息模板"章节<br>2. 添加 Team-lead 职责边界说明 |
| `skills/agent-teams/docs/workflow.md` | 1. 更新"阶段3：执行阶段"的消息示例<br>2. 添加强制技能激活流程 |
| `skills/agent-teams/CHANGELOG.md` | 记录本次变更 |

### 5. 验证策略

修改完成后：
1. 运行结构验证：`node scripts/check-structure.js agent-teams`
2. 运行链接验证：`node scripts/validate-links.js agent-teams`
3. 确认所有链接有效
4. 确认 SKILL.md 行数 ≤ 500 行
