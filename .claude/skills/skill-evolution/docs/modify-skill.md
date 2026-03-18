# 修改现有技能规范

## 概述

本文档提供修改现有技能的规范和最佳实践。

## 修改原则

### 1. 向后兼容
- 不破坏现有功能
- 保持文件结构一致
- 维护现有链接有效性

### 2. 记录变更
- 更新 CHANGELOG.md
- 标注变更日期
- 说明变更原因

### 3. 验证完整性
- 运行结构验证
- 运行链接验证
- 测试技能功能

## 修改流程

### 步骤 1：确定修改范围

**问题清单**：
- 修改的目的是什么？
- 影响哪些文件？
- 是否需要新增文档？
- 是否需要更新链接？

### 步骤 2：更新 CHANGELOG.md

**在文件开头添加新版本**：
```markdown
# Changelog

## [1.1.0] - 2026-03-05
### Added
- 新增功能说明

### Changed
- 变更内容说明

### Fixed
- 修复问题说明

## [1.0.0] - 2026-03-01
### Added
- 初始版本
```

**版本号规则**：
- **主版本号（Major）**：不兼容的 API 修改
- **次版本号（Minor）**：向下兼容的功能性新增
- **修订号（Patch）**：向下兼容的问题修正

### 步骤 3：修改文件内容

#### 修改 SKILL.md

**注意事项**：
- ✅ 保持文件在 500 行以内
- ✅ 更新"最后更新"日期
- ✅ 验证所有链接有效
- ✅ 保持 YAML frontmatter 格式

**示例**：
```markdown
---
name: skill-name
description: 更新后的描述
---

# 技能名称

## 核心规范速查

| 规范 | 说明 | 详细文档 |
|------|------|---------|
| 新增规范 | 说明 | [docs/new-topic.md](docs/new-topic.md) |
| 现有规范 | 更新说明 | [docs/existing-topic.md](docs/existing-topic.md) |

---

**最后更新**: 2026-03-05  <!-- 更新日期 -->
**维护者**: 开发团队
```

#### 修改 QUICK_REF.md

**注意事项**：
- ✅ 保持代码示例完整可运行
- ✅ 更新过时的代码
- ✅ 添加新的模板
- ✅ 保持链接有效

**示例**：
```markdown
# 快速参考

## 新增模板：高级用法

```java
// 新增的代码示例
@Service
@RequiredArgsConstructor
public class NewExample {
    // 实现代码
}
```

👉 [详细说明](docs/new-topic.md)

## 更新模板：基础用法

```java
// 更新后的代码示例
public class UpdatedExample {
    // 更新的实现
}
```

👉 [详细说明](docs/updated-topic.md)
```

#### 修改 docs/ 文档

**注意事项**：
- ✅ 保持每个文件 200-400 行
- ✅ 更新过时的内容
- ✅ 添加新的章节
- ✅ 保持链接有效

**示例**：
```markdown
# 主题标题

## 概述

更新后的概述内容。

## 新增章节

### 新功能说明
详细说明新增的功能。

## 更新章节

### 更新的概念
更新后的概念说明。

## 相关文档

- [新增文档](new-topic.md)
- [现有文档](existing-topic.md)
```

### 步骤 4：新增文档（如需要）

**创建新文档**：
```bash
# 创建新文档
echo "# 新主题" > .claude/skills/{skill-name}/docs/new-topic.md
```

**更新 SKILL.md 索引**：
```markdown
## 详细文档索引

### 核心流程
- [新增主题](docs/new-topic.md) - 新功能说明
- [现有主题](docs/existing-topic.md) - 现有功能
```

### 步骤 5：更新链接引用

**检查需要更新的链接**：
1. SKILL.md 中的文档索引
2. QUICK_REF.md 中的链接
3. docs/ 文档中的相互引用

**示例**：
```markdown
<!-- 旧链接 -->
[详细说明](docs/old-name.md)

<!-- 新链接 -->
[详细说明](docs/new-name.md)
```

### 步骤 6：⚠️ 验证修改（必须执行）

**重要提示**：这是强制性步骤，所有错误必须修复后才能提交。

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
- ✅ SKILL.md 格式正确
- ✅ 文件大小符合限制（SKILL.md ≤ 500行，docs/*.md 200-400行）
- ✅ 所有链接有效（特别是新增或修改的链接）
- ✅ CHANGELOG.md 已更新

**修改后常见错误**：

| 错误 | 原因 | 解决方案 |
|------|------|---------|
| 链接失效 | 文件重命名或删除 | 更新所有引用该文件的链接 |
| 文件过大 | 新增内容过多 | 拆分到新文档或移到 QUICK_REF.md |
| CHANGELOG 未更新 | 忘记记录变更 | 添加变更记录 |
| 相对路径错误 | 使用绝对路径 | 改为相对路径 |

**验证失败处理流程**：
1. 查看错误信息
2. 根据错误类型修复问题
3. 重新运行验证脚本
4. 确认所有错误已修复
5. 评估警告是否需要修复
6. 继续下一步

# 验证链接
node .claude/skills/scripts/validate-links.js {skill-name}
```

**检查项**：
- ✅ SKILL.md 格式正确
- ✅ 文件大小符合限制
- ✅ 所有链接有效
- ✅ CHANGELOG.md 已更新

### 步骤 7：测试技能功能

**测试方法**：
1. 激活技能
2. 验证内容正确加载
3. 测试链接可访问
4. 验证代码示例有效

### 步骤 8：提交变更

```bash
# 添加修改的文件
git add .claude/skills/{skill-name}/

# 提交（根据变更类型选择）
git commit -m "feat(skills): {skill-name} 新增功能"
git commit -m "docs(skills): {skill-name} 更新文档"
git commit -m "fix(skills): {skill-name} 修复问题"

# 推送
git push origin {branch-name}
```

## 常见修改场景

### 场景 1：新增规范

**步骤**：
1. 在 docs/ 创建新文档
2. 在 SKILL.md 添加规范速查条目
3. 在 QUICK_REF.md 添加代码模板（如需要）
4. 更新 CHANGELOG.md

**示例**：
```markdown
<!-- SKILL.md -->
## 核心规范速查

| 规范 | 说明 | 详细文档 |
|------|------|---------|
| 新增规范 | 简要说明 | [docs/new-rule.md](docs/new-rule.md) |
```

### 场景 2：更新代码模板

**步骤**：
1. 更新 QUICK_REF.md 中的代码
2. 更新相关 docs/ 文档
3. 更新 CHANGELOG.md

**示例**：
```markdown
<!-- QUICK_REF.md -->
## 更新模板：Service 层

```java
// 更新后的代码
@Service
@RequiredArgsConstructor
public class UpdatedServiceImpl implements IService {
    // 新的实现方式
}
```
```

### 场景 3：重构文档结构

**步骤**：
1. 规划新的文档结构
2. 创建新文档或重命名现有文档
3. 更新所有链接引用
4. 运行链接验证
5. 更新 CHANGELOG.md

**示例**：
```bash
# 重命名文档
mv docs/old-name.md docs/new-name.md

# 更新所有引用该文档的链接
# 在 SKILL.md、QUICK_REF.md、其他 docs/*.md 中更新

# 验证链接
node .claude/skills/scripts/validate-links.js {skill-name}
```

### 场景 4：修复错误

**步骤**：
1. 定位错误位置
2. 修复错误内容
3. 验证修复效果
4. 更新 CHANGELOG.md（Fixed 部分）

**示例**：
```markdown
<!-- CHANGELOG.md -->
## [1.0.1] - 2026-03-05
### Fixed
- 修复 SKILL.md 中的链接错误
- 更正 QUICK_REF.md 中的代码示例
```

## 最佳实践

### 1. 小步快跑
- 每次修改范围不要太大
- 及时提交和验证
- 避免一次性大规模重构

### 2. 保持一致性
- 遵循现有的文件结构
- 保持命名规范一致
- 维护文档风格统一

### 3. 完善文档
- 详细记录变更原因
- 提供清晰的示例
- 更新相关文档

### 4. 充分测试
- 验证结构正确性
- 测试链接有效性
- 确认功能正常

## 常见问题

### 问题1：修改后 SKILL.md 超过 500 行
**解决方案**：
1. 将新增内容移到 docs/
2. 在 SKILL.md 中只保留索引
3. 使用表格简化规范速查

### 问题2：链接验证失败
**解决方案**：
1. 检查文件是否已重命名或删除
2. 更新所有引用该文件的链接
3. 使用相对路径而非绝对路径

### 问题3：不确定是否需要更新版本号
**解决方案**：
- **Major（主版本）**：破坏性变更，如删除文档、重大重构
- **Minor（次版本）**：新增功能，如新增文档、新增规范
- **Patch（修订号）**：修复错误，如修正错别字、修复链接

### 问题4：修改后技能无法激活
**解决方案**：
1. 检查 YAML frontmatter 格式
2. 验证文件编码为 UTF-8
3. 运行结构验证脚本
4. 重新加载 Claude Code 会话

## 提交规范

### Commit Message 格式

```
<type>(skills): <subject>

<body>

<footer>
```

### Type 类型

| Type | 说明 | 示例 |
|------|------|------|
| feat | 新增功能 | feat(skills): crud-development 新增分库分表规范 |
| docs | 文档更新 | docs(skills): 更新 database-ops 文档 |
| fix | 修复问题 | fix(skills): 修复 api-development 链接错误 |
| refactor | 重构 | refactor(skills): 重构 utils-toolkit 文档结构 |
| chore | 其他变更 | chore(skills): 更新 CHANGELOG.md |

### 示例

```bash
# 新增功能
git commit -m "feat(skills): crud-development 新增分库分表规范"

# 文档更新
git commit -m "docs(skills): 更新 database-ops 索引使用指南"

# 修复问题
git commit -m "fix(skills): 修复 api-development 中的链接错误"
```

## 相关文档

- [技能架构设计](architecture.md)
- [创建新技能](create-new-skill.md)
- [文件规范](file-standards.md)
- [自动化验证](automation.md)
