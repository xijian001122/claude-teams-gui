# 创建新技能完整流程

## 概述

本文档提供创建新技能的完整步骤和最佳实践。

## 前置准备

### 1. 确定技能需求
回答以下问题：
- 技能的目的是什么？
- 解决什么问题？
- 目标用户是谁？
- 与现有技能有何区别？

### 2. 规划技能结构
确定：
- 技能名称（kebab-case）
- 核心规范内容
- 需要哪些详细文档
- 代码模板需求

### 3. 检查命名冲突
```bash
# 检查技能名称是否已存在
ls .claude/skills/ | grep {skill-name}
```

## 创建流程

### 步骤 1：创建目录结构

```bash
# 创建技能目录
mkdir -p .claude/skills/{skill-name}/docs

# 进入目录
cd .claude/skills/{skill-name}
```

### 步骤 2：创建 SKILL.md

**模板**：
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

## 常用模式索引

- [模式1](docs/pattern1.md)
- [模式2](docs/pattern2.md)

## 快速检查清单

- [ ] 检查项1：确保文件结构正确
- [ ] 检查项2：验证链接有效性
- [ ] 检查项3：测试技能激活

## 详细文档索引

### 核心流程
- [详细主题1](docs/topic1.md)
- [详细主题2](docs/topic2.md)

### 最佳实践
- [最佳实践](docs/best-practices.md)

## 相关技能

- **related-skill-1**: 相关技能说明
- **related-skill-2**: 相关技能说明

---

**最后更新**: YYYY-MM-DD
**维护者**: 开发团队
```

**关键点**：
- ✅ 必须包含 YAML frontmatter
- ✅ name 使用 kebab-case
- ✅ description 简洁明了
- ✅ 控制在 500 行以内
- ✅ 所有链接使用相对路径

### 步骤 3：创建 QUICK_REF.md

**模板**：
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

**关键点**：
- ✅ 提供完整可运行的代码示例
- ✅ 使用代码块标注语言
- ✅ 链接到详细文档
- ✅ 使用表格组织命令速查

### 步骤 4：创建 CHANGELOG.md

**模板**：
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

**关键点**：
- ✅ 遵循 Keep a Changelog 规范
- ✅ 使用语义化版本号
- ✅ 记录日期
- ✅ 分类变更（Added/Changed/Fixed）

### 步骤 5：创建详细文档

**推荐文档结构**：
```
docs/
├── architecture.md       # 架构设计
├── workflow.md          # 工作流程
├── best-practices.md    # 最佳实践
├── troubleshooting.md   # 故障排除
└── ...                  # 其他主题文档
```

**文档模板**：
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

**关键点**：
- ✅ 每个文件 200-400 行
- ✅ 单一主题
- ✅ 使用 kebab-case 命名
- ✅ 包含代码示例
- ✅ 链接到相关文档

### 步骤 6：⚠️ 验证技能结构（必须执行）

**重要提示**：这是强制性步骤，所有错误必须修复后才能继续。

```bash
# 1. 验证结构（必需）
node .claude/skills/scripts/check-structure.js {skill-name}

# 2. 验证链接（必需）
node .claude/skills/scripts/validate-links.js {skill-name}
```

**验证要求**：
- ❌ **错误必须修复**：所有错误必须在提交前修复
- ⚠️ **警告需评估**：警告可能影响使用体验，需要评估是否修复
- ✅ **通过标准**：无错误，警告已评估

**检查项**：
- ✅ SKILL.md 存在且格式正确
- ✅ YAML frontmatter 格式正确
- ✅ 文件大小符合限制（SKILL.md ≤ 500行，docs/*.md 200-400行）
- ✅ 所有链接有效
- ✅ 命名规范符合要求（kebab-case）

**常见错误及解决方案**：

| 错误 | 原因 | 解决方案 |
|------|------|---------|
| 缺少 SKILL.md | 文件未创建 | 创建 SKILL.md 文件 |
| YAML frontmatter 格式错误 | 缺少 `---` 或字段错误 | 检查 frontmatter 格式 |
| 文件过大 | SKILL.md 超过 500 行 | 将内容移到 docs/ 或 QUICK_REF.md |
| 链接失效 | 文件不存在或路径错误 | 检查文件路径，使用相对路径 |
| 命名不规范 | 使用驼峰或空格 | 改为 kebab-case |

**验证通过示例**：
```
检查技能: my-skill
==================================================
✓ SKILL.md 存在
✓ QUICK_REF.md 存在
✓ CHANGELOG.md 存在
✓ docs/ 目录存在
✓ frontmatter 包含 name 字段
✓ frontmatter 包含 description 字段
  SKILL.md: 450 行
  docs/topic1.md: 350 行

==================================================
检查报告
==================================================
✅ 所有检查通过！
```

**如果验证失败**：
1. 查看错误信息
2. 根据错误提示修复问题
3. 重新运行验证脚本
4. 重复直到所有错误修复

### 步骤 7：测试技能激活

**方法1：使用斜杠命令**
```
/{skill-name}
```

**方法2：使用 Skill 工具**
```
Skill(tool="{skill-name}")
```

**验证项**：
- ✅ 技能可以正常激活
- ✅ SKILL.md 内容正确加载
- ✅ 链接可以正常访问
- ✅ 代码示例可以正常显示

### 步骤 8：提交到版本控制

```bash
# 添加文件
git add .claude/skills/{skill-name}/

# 提交
git commit -m "feat(skills): 添加 {skill-name} 技能"

# 推送
git push origin {branch-name}
```

## 完整示例

### 示例：创建 "database-query" 技能

```bash
# 1. 创建目录
mkdir -p .claude/skills/database-query/docs

# 2. 创建 SKILL.md
cat > .claude/skills/database-query/SKILL.md << 'EOF'
---
name: database-query
description: 数据库查询规范 - SQL查询、性能优化、索引使用
---

# 数据库查询规范

**作用**: 提供数据库查询的最佳实践和性能优化指南

**触发关键词**: SQL查询、数据库查询、查询优化、索引

## 核心规范速查

| 规范 | 说明 | 详细文档 |
|------|------|---------|
| 查询优化 | 避免全表扫描 | [docs/query-optimization.md](docs/query-optimization.md) |
| 索引使用 | 合理使用索引 | [docs/index-usage.md](docs/index-usage.md) |

## 快速检查清单

- [ ] 避免 SELECT *
- [ ] 使用索引字段查询
- [ ] 避免在 WHERE 中使用函数

## 详细文档索引

- [查询优化](docs/query-optimization.md)
- [索引使用](docs/index-usage.md)
- [最佳实践](docs/best-practices.md)

---

**最后更新**: 2026-03-05
**维护者**: 开发团队
EOF

# 3. 创建 QUICK_REF.md
cat > .claude/skills/database-query/QUICK_REF.md << 'EOF'
# 快速参考

## 查询模板

```sql
-- 基础查询
SELECT id, name, status
FROM t_user
WHERE status = 1
  AND create_time >= '2026-01-01'
ORDER BY id DESC
LIMIT 10;
```

👉 [详细说明](docs/query-optimization.md)
EOF

# 4. 创建 CHANGELOG.md
cat > .claude/skills/database-query/CHANGELOG.md << 'EOF'
# Changelog

## [1.0.0] - 2026-03-05
### Added
- 初始版本
- 查询优化规范
- 索引使用指南
EOF

# 5. 创建详细文档
echo "# 查询优化" > .claude/skills/database-query/docs/query-optimization.md
echo "# 索引使用" > .claude/skills/database-query/docs/index-usage.md
echo "# 最佳实践" > .claude/skills/database-query/docs/best-practices.md

# 6. 验证
node .claude/skills/scripts/check-structure.js database-query
node .claude/skills/scripts/validate-links.js database-query

# 7. 提交
git add .claude/skills/database-query/
git commit -m "feat(skills): 添加 database-query 技能"
```

## 最佳实践

### 1. 内容组织
- **从简到繁**：SKILL.md → QUICK_REF.md → docs/
- **单一主题**：每个文档专注一个主题
- **清晰索引**：提供完整的文档索引

### 2. 代码示例
- **完整可运行**：提供完整的代码示例
- **注释清晰**：关键代码添加注释
- **多种场景**：覆盖常见使用场景

### 3. 链接管理
- **相对路径**：使用相对路径而非绝对路径
- **验证有效性**：使用 validate-links.js 验证
- **避免死链**：定期检查链接有效性

### 4. 版本管理
- **语义化版本**：使用语义化版本号
- **记录变更**：在 CHANGELOG.md 中记录所有变更
- **标注日期**：记录变更日期

## 常见问题

### 问题1：SKILL.md 超过 500 行
**解决方案**：
1. 将详细内容移到 docs/
2. 将代码模板移到 QUICK_REF.md
3. 只保留核心规范和索引

### 问题2：不知道如何拆分文档
**解决方案**：
1. 按主题拆分（如 controller-layer.md、service-layer.md）
2. 每个文件 200-400 行
3. 参考现有技能的拆分方式

### 问题3：链接验证失败
**解决方案**：
1. 检查文件路径是否正确
2. 确保文件已创建
3. 使用相对路径而非绝对路径

## 相关文档

- [技能架构设计](architecture.md)
- [修改现有技能](modify-skill.md)
- [文件规范](file-standards.md)
- [自动化验证](automation.md)
