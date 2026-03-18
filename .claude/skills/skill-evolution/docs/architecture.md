# 技能系统架构设计

## 概述

本文档详细说明技能系统的架构设计、设计原则和实现细节。

## 设计目标

### 1. Token 优化
- **核心文件轻量化**：SKILL.md 控制在 500 行以内
- **按需加载**：详细内容放在 docs/ 目录，需要时才读取
- **快速参考分离**：常用模板放在 QUICK_REF.md

### 2. 可维护性
- **模块化设计**：每个技能独立，避免内容耦合
- **标准化结构**：统一的结构便于工具检查和自动化
- **版本控制友好**：CHANGELOG.md 记录变更历史

### 3. 用户体验
- **分层信息**：从核心到详细，逐步深入
- **快速上手**：QUICK_REF.md 提供常用模板
- **完整文档**：docs/ 目录提供全面指导

## 标准目录结构

```
.claude/skills/
├── MAINTENANCE.md                   # 系统维护指南
├── REUSABILITY_GUIDE.md            # 复用指南（可选）
├── scripts/                         # 自动化脚本
│   ├── check-structure.js          # 结构验证脚本
│   └── validate-links.js           # 链接验证脚本
└── {skill-name}/                    # 单个技能目录
    ├── SKILL.md                     # 核心技能文件（必需）
    ├── QUICK_REF.md                 # 快速参考（推荐）
    ├── CHANGELOG.md                 # 变更日志（推荐）
    └── docs/                        # 详细文档目录
        ├── architecture.md          # 架构设计
        ├── workflow.md              # 工作流程
        ├── best-practices.md        # 最佳实践
        └── ...                      # 其他主题文档
```

## 设计原则

### 1. 单一职责原则
每个文件有明确的职责：
- **SKILL.md**：核心规范和索引
- **QUICK_REF.md**：代码模板和速查
- **docs/*.md**：详细的主题文档
- **CHANGELOG.md**：版本历史

### 2. 渐进式披露
信息组织从简到繁：
1. SKILL.md：核心规范速查
2. QUICK_REF.md：常用模板
3. docs/：详细文档

### 3. 工具友好
支持自动化验证：
- 结构验证脚本
- 链接验证脚本
- 标准化报告格式

### 4. 可扩展性
易于添加新内容：
- 模块化文档结构
- 标准化命名规范
- 清晰的文档索引

## 文件职责详解

### SKILL.md（核心指令文件）

**作用**：
- Claude Code 激活技能时加载的主要文件
- 提供核心规范、快速检查和文档索引
- 控制在 500 行以内，优化 token 使用

**必需内容**：
1. YAML frontmatter（name、description）
2. 核心规范速查表
3. 快速检查清单
4. 详细文档索引

**结构模板**：
```markdown
---
name: skill-name
description: 技能描述
---

# 技能名称

## 核心规范速查
## 快速检查清单
## 详细文档索引
## 相关技能
```

### QUICK_REF.md（快速参考文件）

**作用**：
- 提供常用代码模板和速查表
- 避免在核心文件中包含大量代码
- 方便开发者快速复制粘贴

**内容组织**：
1. 代码模板（完整可运行）
2. 常用命令速查
3. 链接到详细文档

### docs/（详细文档目录）

**作用**：
- 存放详细的主题文档
- 按主题拆分，每个文件 200-400 行
- 提供深入的技术说明

**拆分原则**：
- 按主题拆分（如 controller-layer.md、service-layer.md）
- 单一主题（每个文件专注一个主题）
- 描述性命名（使用 kebab-case）

**常见主题**：
- architecture.md：架构设计
- workflow.md：工作流程
- best-practices.md：最佳实践
- troubleshooting.md：故障排除

### CHANGELOG.md（变更日志）

**作用**：
- 记录技能的版本历史和变更
- 遵循 Keep a Changelog 规范

**格式**：
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

## Token 优化策略

### 优化前后对比

| 技能 | 传统单文件 | 模块化结构 | 优化比例 |
|-----|-----------|-----------|---------|
| crud-development | 2452 行 | ~200 行 | 92% |
| utils-toolkit | 960 行 | ~200 行 | 79% |
| backend-annotations | 1225 行 | ~200 行 | 84% |

### 优化方式

1. **核心文件轻量化**
   - SKILL.md 严格控制在 500 行以内
   - 只保留核心规范和索引
   - 详细内容移到 docs/

2. **按需加载机制**
   - 详细内容放在 docs/ 目录
   - 需要时才读取
   - 避免一次性加载所有内容

3. **快速参考分离**
   - 代码模板独立为 QUICK_REF.md
   - 避免重复加载
   - 方便快速查阅

4. **模块化拆分**
   - 每个主题独立文件
   - 精准加载所需内容
   - 减少无关内容的 token 消耗

## 命名规范

### 技能名称
- **格式**：kebab-case
- **示例**：`crud-development`、`skill-evolution`
- **限制**：最多 64 字符
- **避免**：驼峰命名、下划线、空格

### 文档文件
- **格式**：kebab-case
- **示例**：`controller-layer.md`、`best-practices.md`
- **避免**：驼峰命名、空格、特殊字符

### 目录结构
- **技能目录**：`.claude/skills/{skill-name}/`
- **文档目录**：`.claude/skills/{skill-name}/docs/`
- **脚本目录**：`.claude/skills/scripts/`

## 文件大小限制

| 文件类型 | 行数限制 | 说明 |
|---------|---------|------|
| SKILL.md | ≤ 500 行 | 核心文件，优化 token 使用 |
| QUICK_REF.md | 不限 | 代码模板，按需加载 |
| docs/*.md | 200-400 行 | 详细文档，模块化拆分 |
| CHANGELOG.md | 不限 | 版本历史，持续累积 |

**为什么有这些限制？**
- **SKILL.md ≤ 500 行**：减少每次激活的 token 消耗
- **docs/*.md 200-400 行**：平衡可读性和模块化
- **QUICK_REF.md 不限**：代码模板需要完整性

## 自动化验证

### 结构验证（check-structure.js）
检查项：
1. 必需文件存在（SKILL.md）
2. 推荐文件存在（QUICK_REF.md、CHANGELOG.md）
3. YAML frontmatter 格式正确
4. 文件大小符合限制
5. 命名规范符合要求

### 链接验证（validate-links.js）
检查项：
1. 提取所有 Markdown 链接
2. 验证相对路径链接有效
3. 报告失效链接
4. 提供详细错误信息

## 相关文档

- [创建新技能](create-new-skill.md)
- [修改现有技能](modify-skill.md)
- [文件规范](file-standards.md)
- [自动化验证](automation.md)
