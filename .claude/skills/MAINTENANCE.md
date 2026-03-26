# Claude Agent GUI 技能系统维护指南

## 概述

本文档描述了 Claude Agent GUI 项目的技能系统架构、维护规范和最佳实践。

## 技能清单

| 技能名 | 描述 | 用途 |
|--------|------|------|
| `frontend-dev` | 前端开发 | Preact 组件、TailwindCSS、状态管理 |
| `backend-dev` | 后端开发 | Fastify 路由、SQLite、服务层 |
| `websocket-protocol` | WebSocket 协议 | 实时通信消息格式 |
| `project-arch` | 项目架构 | 整体设计、技术栈、目录结构 |
| `skill-evolution` | 技能进化 | 技能系统自我维护 |
| `agent-teams` | 团队协作 | Agent Teams 创建、任务分配、消息通信 |
| `openspec-*` | OpenSpec 工作流 | 变更提案、实现、归档 |

## 命令清单

| 命令 | 描述 | 用途 |
|------|------|------|
| `/teams:apply` | 启动团队协作 | 创建团队并分配任务 |
| `/teams:fix` | 修复决策问题 | 修复提案/设计/任务错误 |

## 目录结构

```
.claude/skills/
├── MAINTENANCE.md              # 本维护指南
├── frontend-dev/
│   ├── SKILL.md               # 核心技能文件
│   ├── QUICK_REF.md           # 快速参考
│   ├── CHANGELOG.md           # 变更日志
│   └── docs/                  # 详细文档
│       ├── components.md
│       ├── styling.md
│       └── state-management.md
├── backend-dev/
│   ├── SKILL.md
│   ├── QUICK_REF.md
│   ├── CHANGELOG.md
│   └── docs/
│       └── services.md
├── websocket-protocol/
│   ├── SKILL.md
│   └── CHANGELOG.md
├── project-arch/
│   ├── SKILL.md
│   └── CHANGELOG.md
├── agent-teams/
│   ├── SKILL.md
│   ├── QUICK_REF.md
│   ├── CHANGELOG.md
│   └── docs/
│       ├── team-creation.md
│       ├── messaging.md
│       ├── workflow.md
│       ├── team-reuse.md
│       └── task-management.md
├── skill-evolution/
│   ├── SKILL.md
│   ├── QUICK_REF.md
│   ├── CHANGELOG.md
│   └── docs/
│       ├── architecture.md
│       ├── create-new-skill.md
│       ├── modify-skill.md
│       └── file-standards.md
└── openspec-*/
    └── SKILL.md
```

## 技能使用方式

### 1. 斜杠命令
```
/frontend-dev    # 激活前端开发技能
/backend-dev     # 激活后端开发技能
/project-arch    # 查看项目架构
```

### 2. 自动触发
当用户的问题与技能描述匹配时，Claude 会自动激活相关技能。

### 3. 手动调用
```
请使用 frontend-dev 技能来开发这个组件
```

## 维护规范

### 新增技能
1. 创建技能目录：`mkdir -p .claude/skills/{skill-name}/docs`
2. 创建 `SKILL.md`（必需）
3. 创建 `QUICK_REF.md`（推荐）
4. 创建 `CHANGELOG.md`（推荐）
5. 创建详细文档到 `docs/` 目录

### 修改技能
1. 更新 `CHANGELOG.md`
2. 保持 `SKILL.md` 在 500 行以内
3. 运行验证脚本（如有）

### 删除技能
1. 移动到归档目录或直接删除
2. 更新本维护指南

## 技能文件规范

### SKILL.md 结构
```yaml
---
name: skill-name
description: 技能描述，说明何时使用
---

# 技能名称

## 核心规范速查
| 规范 | 说明 | 详细文档 |
|------|------|---------|

## 快速检查清单
- [ ] 检查项

## 详细文档索引
- [主题1](docs/topic1.md)
```

### QUICK_REF.md 结构
```markdown
# 快速参考

## 代码模板
### 模板1
```language
// 代码示例
```

## 常用模式
```

### CHANGELOG.md 结构
```markdown
# Changelog

## [版本号] - 日期
### Added
- 新增内容

### Changed
- 变更内容

### Fixed
- 修复内容
```

## 技能依赖关系

```
project-arch (项目架构)
    ├── frontend-dev (前端开发)
    │       └── websocket-protocol (WebSocket 协议)
    └── backend-dev (后端开发)
            └── websocket-protocol (WebSocket 协议)

skill-evolution (技能进化) - 独立，用于维护技能系统
```

## 常见任务

### 添加新的前端组件规范
1. 编辑 `frontend-dev/SKILL.md` 添加规范概要
2. 在 `frontend-dev/docs/` 中创建详细文档
3. 更新 `frontend-dev/QUICK_REF.md` 添加模板
4. 更新 `frontend-dev/CHANGELOG.md`

### 添加新的 API 路由规范
1. 编辑 `backend-dev/SKILL.md` 添加规范概要
2. 在 `backend-dev/docs/` 中创建详细文档
3. 更新 `backend-dev/QUICK_REF.md` 添加模板
4. 更新 `backend-dev/CHANGELOG.md`

### 更新 WebSocket 协议
1. 编辑 `websocket-protocol/SKILL.md`
2. 更新 `websocket-protocol/CHANGELOG.md`
3. 通知前端和后端技能维护者

## Token 优化策略

1. **核心文件轻量化**：`SKILL.md` ≤ 500 行
2. **按需加载**：详细内容放在 `docs/` 目录
3. **快速参考分离**：代码模板放在 `QUICK_REF.md`

## 质量检查

### 检查清单
- [ ] `SKILL.md` 存在且格式正确
- [ ] YAML frontmatter 包含 `name` 和 `description`
- [ ] `QUICK_REF.md` 包含实用模板
- [ ] `CHANGELOG.md` 记录变更历史
- [ ] `docs/` 文件命名使用 kebab-case
- [ ] 文件编码为 UTF-8

---

**最后更新**: 2026-03-17
**维护者**: 开发团队
