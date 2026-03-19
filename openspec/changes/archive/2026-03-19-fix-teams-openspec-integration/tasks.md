# 任务清单

## 阶段 1: 更新 commands/teams/apply.md

- [x] 1.1 添加步骤 2：确认 OpenSpec 变更名称
  - 添加 `openspec list` 查询步骤
  - 添加 AskUserQuestion 处理多变更场景

- [x] 1.2 更新步骤 4：任务分配消息模板
  - 替换为包含完整两步命令的新模板
  - 添加 `/opsx:continue` 和 `/opsx:apply` 说明

- [x] 1.3 更新 Agent Prompt 模板
  - 添加 OpenSpec 快捷命令到所有四个角色的 prompt
  - 包含 `/opsx:explore` 和 `/opsx:apply`

- [x] 1.4 添加 Team-lead 职责边界说明
  - 明确 Team-lead 不直接修改代码
  - 明确代码变更由成员执行

## 阶段 2: 更新 skills/agent-teams/SKILL.md

- [x] 2.1 更新"任务分配消息模板"章节
  - 更新为包含完整两步命令的模板
  - 添加提案路径说明

- [x] 2.2 更新 CHANGELOG.md
  - 添加版本 1.5.0
  - 记录本次变更

- [x] 2.3 更新最后更新日期
  - 更新为 2026-03-19 (v1.5.0)

## 阶段 3: 更新 skills/agent-teams/docs/openspec-integration.md

- [x] 3.1 重写 OpenSpec 集成规范
  - 添加任务分类规则（开发 vs 测试）
  - 添加技能映射规则
  - 添加完整的任务分配消息模板

- [x] 3.2 添加成员工作流程
  - 开发者收到任务后的流程
  - 测试者收到任务后的流程

## 阶段 4: 验证和测试

- [x] 4.1 验证 SKILL.md 行数
  - 当前 285 行，符合 ≤500 行要求

- [x] 4.2 确认所有文档一致性
  - `commands/teams/apply.md` 使用更新后的模板
  - `skills/agent-teams/SKILL.md` 使用更新后的模板
  - `skills/agent-teams/docs/openspec-integration.md` 使用更新后的模板

## 完成总结

所有任务已完成。主要改进：

1. **强制 OpenSpec 集成**: 任务分配消息必须包含 `/opsx:continue` 和 `/opsx:apply` 命令
2. **明确职责边界**: Team-lead 只分配任务，不直接修改代码
3. **技能映射规则**: 根据任务类型告知成员需要激活哪些技能
4. **Agent Prompt 更新**: 所有成员都知道 OpenSpec 快捷命令

现在可以使用 `/teams:apply` 创建团队并按 OpenSpec 规范分配任务了。
