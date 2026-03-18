# 技能系统快速参考

本文档提供技能创建和变更的快速模板和命令。

## 新增技能快速流程

### 1. 创建目录结构
```bash
# 创建技能目录
mkdir -p .claude/skills/{skill-name}/docs

# 进入目录
cd .claude/skills/{skill-name}
```

### 2. SKILL.md 模板

```markdown
---
name: skill-name
description: 技能描述，说明何时使用此技能
---

# 技能名称

**作用**: 简要说明技能的用途

**触发关键词**: 关键词1、关键词2、关键词3

## 核心规范速查

| 规范 | 说明 | 详细文档 |
|------|------|---------|
| 规范1 | 简要说明 | [docs/topic1.md](docs/topic1.md) |
| 规范2 | 简要说明 | [docs/topic2.md](docs/topic2.md) |

## 快速检查清单

- [ ] 检查项1
- [ ] 检查项2
- [ ] 检查项3

## 详细文档索引

### 核心流程
- [主题1](docs/topic1.md) - 详细说明
- [主题2](docs/topic2.md) - 详细说明

### 最佳实践
- [最佳实践](docs/best-practices.md) - 开发建议

## 相关技能

- **related-skill-1**: 相关技能说明
- **related-skill-2**: 相关技能说明

---

**最后更新**: YYYY-MM-DD
**维护者**: 开发团队
```

### 3. QUICK_REF.md 模板

```markdown
# 快速参考

本文档提供常用代码模板和速查表。

## 模板1：基础模板

```java
// 代码示例
public class Example {
    private String field;

    public String getField() {
        return field;
    }
}
```

👉 [详细说明](docs/topic1.md)

## 模板2：高级模板

```java
// 更复杂的代码示例
@Service
@RequiredArgsConstructor
public class ExampleServiceImpl implements IExampleService {
    private final ExampleMapper mapper;

    @Override
    public ExampleVo getById(Long id) {
        return mapper.selectVoById(id);
    }
}
```

👉 [详细说明](docs/topic2.md)

## 常用命令

| 命令 | 说明 |
|------|------|
| 命令1 | 说明1 |
| 命令2 | 说明2 |

## 链接到详细文档

- [详细主题1](docs/topic1.md)
- [详细主题2](docs/topic2.md)
```

### 4. CHANGELOG.md 模板

```markdown
# Changelog

## [1.0.0] - YYYY-MM-DD
### Added
- 初始版本
- 创建核心技能结构
- 添加详细文档

### Changed
- 无

### Fixed
- 无
```

### 5. docs/ 文档模板

```markdown
# 主题标题

## 概述

简要说明本主题的内容和目的。

## 核心概念

### 概念1
详细说明概念1。

### 概念2
详细说明概念2。

## 使用示例

### 示例1：基础用法
```java
// 代码示例
```

### 示例2：高级用法
```java
// 代码示例
```

## 最佳实践

1. **实践1**：说明
2. **实践2**：说明

## 常见问题

### 问题1
**症状**：问题描述
**解决方案**：解决步骤

### 问题2
**症状**：问题描述
**解决方案**：解决步骤

## 相关文档

- [相关主题1](topic1.md)
- [相关主题2](topic2.md)
```

## ⚠️ 验证命令（必须执行）

**重要提示**：新增或变更技能后，**必须**运行以下验证命令，确保所有错误已修复后才能提交。

### 结构验证（必需）
```bash
# 验证单个技能
node .claude/skills/scripts/check-structure.js {skill-name}

# 验证所有技能
node .claude/skills/scripts/check-structure.js --all
```

**检查项**：
- ✅ 必需文件存在（SKILL.md）
- ✅ YAML frontmatter 格式正确
- ✅ 文件大小符合限制（SKILL.md ≤ 500行，docs/*.md 200-400行）
- ✅ 命名规范符合要求（kebab-case）

### 链接验证（必需）
```bash
# 验证单个技能
node .claude/skills/scripts/validate-links.js {skill-name}

# 验证所有技能
node .claude/skills/scripts/validate-links.js --all
```

**检查项**：
- ✅ 所有相对路径链接有效
- ✅ 文档引用正确
- ✅ 无死链

### 验证结果处理

**错误（❌）**：
- **必须修复**：所有错误必须在提交前修复
- 常见错误：缺少必需文件、YAML格式错误、链接失效

**警告（⚠️）**：
- **需要评估**：警告可能影响使用体验
- 常见警告：文件过大、文件过小、缺少推荐文件

**示例输出**：
```
检查技能: my-skill
==================================================
✓ SKILL.md 存在
✓ QUICK_REF.md 存在
✓ CHANGELOG.md 存在
✓ docs/ 目录存在
  SKILL.md: 450 行
  docs/topic1.md: 350 行

==================================================
检查报告
==================================================
✅ 所有检查通过！
```

## 文件大小限制

| 文件类型 | 行数限制 | 说明 |
|---------|---------|------|
| SKILL.md | ≤ 500 行 | 核心文件，优化 token 使用 |
| QUICK_REF.md | 不限 | 代码模板，按需加载 |
| docs/*.md | 200-400 行 | 详细文档，模块化拆分 |

## 命名规范

### 技能名称
- **格式**：kebab-case
- **示例**：`crud-development`、`skill-evolution`
- **限制**：最多 64 字符

### 文档文件
- **格式**：kebab-case
- **示例**：`controller-layer.md`、`best-practices.md`
- **避免**：驼峰命名、空格、特殊字符

## 常用 Git 命令

```bash
# 添加新技能
git add .claude/skills/{skill-name}/
git commit -m "feat(skills): 添加 {skill-name} 技能"

# 修改技能
git add .claude/skills/{skill-name}/
git commit -m "docs(skills): 更新 {skill-name} 技能文档"

# 删除技能
git rm -r .claude/skills/{skill-name}/
git commit -m "chore(skills): 移除 {skill-name} 技能"
```

## 完整创建流程示例

```bash
# 1. 创建目录
mkdir -p .claude/skills/my-skill/docs

# 2. 创建核心文件
cat > .claude/skills/my-skill/SKILL.md << 'EOF'
---
name: my-skill
description: 我的技能描述
---
# 我的技能
...
EOF

# 3. 创建快速参考
cat > .claude/skills/my-skill/QUICK_REF.md << 'EOF'
# 快速参考
...
EOF

# 4. 创建变更日志
cat > .claude/skills/my-skill/CHANGELOG.md << 'EOF'
# Changelog
## [1.0.0] - 2026-03-05
### Added
- 初始版本
EOF

# 5. 创建详细文档
echo "# 主题1" > .claude/skills/my-skill/docs/topic1.md
echo "# 主题2" > .claude/skills/my-skill/docs/topic2.md

# 6. 验证结构
node .claude/skills/scripts/check-structure.js my-skill

# 7. 验证链接
node .claude/skills/scripts/validate-links.js my-skill

# 8. 提交
git add .claude/skills/my-skill/
git commit -m "feat(skills): 添加 my-skill 技能"
```

## 故障排除快速参考

| 问题 | 解决方案 |
|------|---------|
| SKILL.md 过大 | 将详细内容移到 docs/，代码模板移到 QUICK_REF.md |
| 链接失效 | 检查文件路径，使用相对路径 |
| 技能无法激活 | 检查 YAML frontmatter 格式，验证文件编码为 UTF-8 |
| 结构验证失败 | 运行 check-structure.js 查看详细错误 |

## 相关文档

- [技能架构设计](docs/architecture.md)
- [创建新技能](docs/create-new-skill.md)
- [修改现有技能](docs/modify-skill.md)
- [文件规范](docs/file-standards.md)
