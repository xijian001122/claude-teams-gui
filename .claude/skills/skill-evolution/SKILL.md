---
name: skill-evolution
description: 技能系统自我进化规范 - 用于新增技能、变更技能、维护技能架构和规范
---

# 技能系统自我进化

**作用**: 规范技能系统的新增、变更和维护流程，确保技能架构的一致性和可维护性。

**触发关键词**: 新增技能、修改技能、技能架构、技能规范、自我进化、skill evolution

## 核心规范速查

| 规范 | 说明 | 详细文档 |
|------|------|---------|
| 技能架构 | 标准目录结构和文件组织 | [docs/architecture.md](docs/architecture.md) |
| 新增技能 | 创建新技能的完整流程 | [docs/create-new-skill.md](docs/create-new-skill.md) |
| 变更技能 | 修改现有技能的规范 | [docs/modify-skill.md](docs/modify-skill.md) |
| 文件规范 | SKILL.md/QUICK_REF.md/docs/ 规范 | [docs/file-standards.md](docs/file-standards.md) |
| 自动化验证 | 结构检查和链接验证 | [docs/automation.md](docs/automation.md) |

## 快速检查清单

### 新增技能时
- [ ] 创建标准目录结构（skill-name/docs/）
- [ ] 编写 SKILL.md（包含 YAML frontmatter）
- [ ] 创建 QUICK_REF.md（代码模板和速查）
- [ ] 拆分详细文档到 docs/ 目录（每个文件 200-400 行）
- [ ] 创建 CHANGELOG.md（记录版本历史）
- [ ] ⚠️ **必须运行结构验证**：`node scripts/check-structure.js skill-name`
- [ ] ⚠️ **必须运行链接验证**：`node scripts/validate-links.js skill-name`
- [ ] ⚠️ **验证必须通过**：所有错误必须修复，警告需评估
- [ ] 测试技能激活

### 变更技能时
- [ ] 更新 CHANGELOG.md（记录变更）
- [ ] 保持 SKILL.md 在 500 行以内
- [ ] 保持 docs/*.md 在 200-400 行之间
- [ ] 更新相关链接引用
- [ ] ⚠️ **必须运行验证脚本**：确保结构和链接正确
- [ ] ⚠️ **验证必须通过**：修复所有错误后才能提交
- [ ] 测试变更后的技能功能

## 标准目录结构

```
.claude/skills/{skill-name}/
├── SKILL.md              # 核心技能文件（必需，≤500行）
├── QUICK_REF.md          # 快速参考（推荐，代码模板）
├── CHANGELOG.md          # 变更日志（推荐）
└── docs/                 # 详细文档目录
    ├── architecture.md   # 架构设计
    ├── workflow.md       # 工作流程
    ├── best-practices.md # 最佳实践
    └── ...              # 其他主题文档（200-400行）
```

## 设计原则

1. **单一职责原则**：每个文件有明确职责
2. **渐进式披露**：从简到繁的信息组织
3. **Token 优化**：核心文件轻量化，详细内容按需加载
4. **工具友好**：支持自动化验证和检查
5. **可扩展性**：易于添加新技能和内容

## 文件职责划分

### SKILL.md（核心指令文件）
- **作用**：Claude Code 激活技能时加载的主要文件
- **内容**：核心规范速查、常用模式索引、快速检查清单、详细文档索引
- **限制**：≤500 行，优化 token 使用
- **格式**：必须包含 YAML frontmatter（name、description）

### QUICK_REF.md（快速参考文件）
- **作用**：提供常用代码模板和速查表
- **内容**：完整代码示例、常用模式、快速复制粘贴
- **优势**：避免在核心文件中包含大量代码

### docs/（详细文档目录）
- **作用**：存放详细的主题文档
- **拆分原则**：按主题拆分，每个文件 200-400 行
- **命名规范**：使用 kebab-case（如 controller-layer.md）

### CHANGELOG.md（变更日志）
- **作用**：记录技能的版本历史和变更
- **格式**：遵循 Keep a Changelog 规范

## Token 优化策略

| 优化方式 | 说明 | 效果 |
|---------|------|------|
| 核心文件轻量化 | SKILL.md ≤ 500 行 | 减少每次激活的 token 消耗 |
| 按需加载 | 详细内容放在 docs/ | 需要时才读取 |
| 快速参考分离 | 代码模板独立为 QUICK_REF.md | 避免重复加载 |
| 模块化拆分 | 每个主题独立文件 | 精准加载所需内容 |

**实际效果**：
- crud-development: 2452 行 → ~200 行（优化 92%）
- utils-toolkit: 960 行 → ~200 行（优化 79%）
- backend-annotations: 1225 行 → ~200 行（优化 84%）

## 详细文档索引

### 核心流程
- [技能架构设计](docs/architecture.md) - 标准结构和设计原则
- [创建新技能](docs/create-new-skill.md) - 完整的创建流程
- [修改现有技能](docs/modify-skill.md) - 变更规范和最佳实践

### 规范标准
- [文件规范](docs/file-standards.md) - SKILL.md/QUICK_REF.md/docs/ 详细规范
- [命名规范](docs/naming-conventions.md) - 文件和目录命名规则
- [内容组织](docs/content-organization.md) - 信息架构和内容拆分

### 自动化工具
- [自动化验证](docs/automation.md) - check-structure.js 和 validate-links.js
- [故障排除](docs/troubleshooting.md) - 常见问题和解决方案

### 最佳实践
- [维护指南](docs/maintenance.md) - 技能维护和更新
- [复用指南](docs/reusability.md) - 跨项目复用技能

## 相关技能

- **project-navigator**: 项目结构导航，用于定位技能文件
- **git-workflow**: Git 工作流规范，用于提交技能变更

---

**最后更新**: 2026-03-05 (v1.1.0)
**维护者**: 开发团队
