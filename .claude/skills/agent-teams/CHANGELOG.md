# Changelog

## [1.5.0] - 2026-03-19
### Changed
- **更新 OpenSpec 集成规范**
  - 更新任务分配消息模板，包含完整的两步命令（/opsx:continue + /opsx:apply）
  - 更新 `commands/teams/apply.md`，添加强制 OpenSpec 规范要求
  - 更新 `docs/openspec-integration.md`，添加任务分类和技能映射规则
  - 更新 Agent Prompt 模板，包含 OpenSpec 快捷命令
  - 明确 Team-lead 只分配任务，不直接修改代码

### Added
- 新增 OpenSpec 技能映射规则
  - 开发者任务技能映射（CRUD、数据层、接口层等）
  - 测试者任务技能映射（单元测试、集成测试）
  - 任务分类规则（开发 vs 测试）

## [1.4.0] - 2026-03-18
### Changed
- **四角色团队成为默认模式**
  - 开启团队时自动创建四个角色：frontend-dev、backend-dev、tester、bug-fixer
  - 更新 `/teams:apply` 命令，默认创建完整四角色团队
- 更新所有模板为四角色版本
  - 模板1：创建四角色开发团队（默认模式）
  - 模板5：完整工作流程（四角色）
  - 模板6：团队创建（带自动清理，四角色）
  - 模板7：OpenSpec 集成工作流（四角色）
- 更新工作流程文档（docs/workflow.md）
  - 阶段1：准备阶段（四角色成员）
  - 阶段4：测试阶段（新增）
  - 阶段5：修复阶段（bug-fixer）
  - 阶段6：收尾阶段（四角色关闭）
- 更新 teams:fix 命令支持四角色

## [1.3.0] - 2026-03-17
### Changed
- 开发者角色分化为前端和后端
  - 前端开发者: `name: "frontend-dev"`, `model: "kimi-k2.5"` - 前端功能开发、UI实现
  - 后端开发者: `name: "backend-dev"`, `model: "glm-5"` - 后端API开发、数据库操作
- 更新模板1：创建前后端开发团队（包含 frontend-dev、backend-dev、tester、bug-fixer）
- 更新典型工作流程（前后端并行开发）
- 更新任务分类规则
- 更新模型选择速查表

## [1.2.0] - 2026-03-17
### Changed
- 重构团队成员角色配置
  - 开发者: `model: "kimi-k2.5"` - 功能开发、代码实现
  - 测试者: `model: "glm-5"` - 测试验证、质量保证
  - Bug修复: `model: "glm-5"` - 问题修复、调试排错
- 更新模板1：创建开发测试团队（包含 developer、tester、bug-fixer）
- 更新典型工作流程
- 更新模型选择速查表
- 更新任务分类规则

## [1.1.0] - 2026-03-17
### Added
- OpenSpec 集成规范（docs/openspec-integration.md）
- OpenSpec 工作流程与 Agent Teams 协作指南
- OpenSpec 命令速查表（/opsx:explore, /opsx:propose, /opsx:apply, /opsx:archive）
- OpenSpec 集成模板（QUICK_REF.md 模板7）
- 相关技能列表增加 OpenSpec 技能

### Changed
- 更新 SKILL.md 核心规范表，添加 OpenSpec 集成条目
- 更新版本号为 v1.1.0

## [1.0.1] - 2026-03-17
### Changed
- 统一团队名称为 `claude-teams-gui`（ClaudeTeams Gui）
- 更新所有文档和代码模板中的团队名称

## [1.0.0] - 2026-03-17
### Added
- 初始版本，适配 Claude Agent GUI 项目
- 团队创建和管理规范
- 任务分配和跟踪规范
- 成员协作模式
- 消息通信规范
- 完整工作流程示例
- 最佳实践指南

### Adapted from Original
- 移除 OpenSpec 集成（简化版本）
- 移除 Java/Spring Boot 相关内容
- 适配 Preact + Fastify + SQLite 技术栈
- 简化技能列表为项目实际可用的技能
- 更新 Prompt 模板为前端/后端开发者

## 技能列表

| 技能 | 用途 |
|------|------|
| frontend-dev | 前端开发（Preact + TailwindCSS） |
| backend-dev | 后端开发（Fastify + SQLite） |
| websocket-protocol | WebSocket 通信协议 |
| project-arch | 项目架构 |
| agent-teams | 团队协作规范 |

## 命令列表

| 命令 | 用途 |
|------|------|
| /teams:apply | 启动 Agent Teams 协作 |
| /teams:fix | 修复团队决策问题 |

---

**维护者**: Claude Agent GUI 开发团队
