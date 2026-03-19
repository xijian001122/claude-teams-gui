# Proposal: 修复 teams:apply 命令的 OpenSpec 集成

## Problem

当前的 `teams:apply` 命令在创建团队和分配任务时存在以下问题：

1. **缺少 OpenSpec 指令**：分配任务给团队成员时，消息模板中没有告知成员必须使用 `/opsx:apply <change-name>` 来执行任务
2. **缺少技能激活强制流程**：消息中没有强制要求成员先激活技能再实施任务
3. **Team-lead 职责不明确**：没有明确说明 Team-lead 只负责分配任务，不直接修改代码

这导致团队成员不知道：
- 如何正确读取 OpenSpec 提案
- 如何激活所需技能
- 应该使用什么命令来实施任务

## Solution

更新以下内容，强制集成 OpenSpec 工作流程：

1. **更新 `.claude/commands/teams/apply.md`**：
   - 添加步骤：确认 OpenSpec 变更名称
   - 更新任务分配消息模板，包含强制技能激活流程
   - 明确 Team-lead 只分配任务，不修改代码

2. **更新 `.claude/skills/agent-teams/SKILL.md`**：
   - 更新消息模板，与 commands/teams/apply.md 保持一致
   - 添加 OpenSpec 集成详细说明

3. **更新 `.claude/skills/agent-teams/docs/workflow.md`**：
   - 添加完整的任务分配消息模板
   - 包含强制技能激活和 OpenSpec 命令

## Success Criteria

- [ ] `teams:apply` 命令的消息模板包含 `/opsx:apply <change-name>` 指令
- [ ] 消息模板包含强制技能激活流程
- [ ] 明确区分 Team-lead 和成员的职责边界
- [ ] 所有文档保持一致

## Scope

**In Scope:**
- `commands/teams/apply.md` 更新
- `skills/agent-teams/SKILL.md` 更新
- `skills/agent-teams/docs/workflow.md` 更新
- `skills/agent-teams/CHANGELOG.md` 更新

**Out of Scope:**
- 修改其他命令
- 修改其他技能文档
