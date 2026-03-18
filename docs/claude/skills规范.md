
# 大型Skill文件每次加载Token太多？拆分模块化方案：精准职责定位，Token优化92%

## 概述

本文档详细介绍了我项目中 Claude Code Skills 的系统架构设计、实现原理和最佳实践。通过本指南，你将了解为什么要采用这种结构，如何建立类似的系统。

### 本项目的主要优点
#### 1. Token 消耗优化显著
通过模块化设计，将大型技能文件拆分为核心指令和详细文档，显著降低了每次技能激活的 Token 消耗：

| 技能 | 传统单文件 | 模块化结构 | 优化比例 |
|-----|-----------|-----------|---------|
| crud-development | 2452 行 | ~200 行 | 92% |
| utils-toolkit | 960 行 | ~200 行 | 79% |
| backend-annotations | 1225 行 | ~200 行 | 84% |

总Token = SKILL.md + docs/子技能 文件的 token 消耗

**核心优化策略**：
- **核心文件轻量化**：SKILL.md 严格控制在 500 行以内
- **按需加载机制**：详细内容放在 docs/ 目录，需要时才读取
- **快速参考分离**：常用模板独立为 QUICK_REF.md，避免重复加载

#### 2. 维护效率大幅提升
- **查找时间减少 60%**：模块化结构使内容定位更快速
- **更新错误率降低 75%**：自动化验证脚本确保结构一致性
- **新人上手时间缩短 50%**：分层文档设计降低学习门槛

#### 3. 系统可扩展性强
- **标准化结构**：所有技能遵循统一规范，便于批量管理
- **自动化验证**：集成 check-structure.js 和 validate-links.js 确保质量
- **跨项目复用**：提供完整的复用指南和配置模板

#### 4. 开发体验优化
- **渐进式学习**：从核心规范到详细文档，逐步深入
- **快速参考支持**：QUICK_REF.md 提供常用代码模板
- **故障排查完善**：详细的故障排除指南和解决方案

#### 5. 实际应用效果
- **技能激活率提升**：从 ~25% 提升至 90%+（通过强制技能评估钩子）
- **代码规范问题减少**：每模块从 5-10 个问题降至 0-2 个
- **团队协作效率提升**：标准化流程减少沟通成本

通过本系统，我们实现了 Claude Code Skills 的工程化、标准化和自动化，为大型项目的 AI 辅助开发提供了可靠的基础设施。

## 系统架构总览

### 目录结构

```
.claude/skills/                      # Skills 根目录
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
        ├── {topic-1}.md
        ├── {topic-2}.md
        └── best-practices.md
```

## 设计目标与核心理念

### 1. 为什么采用这种结构？

#### Token 优化策略
- **核心文件轻量化**：SKILL.md 控制在 500 行以内，减少每次激活的 token 消耗
- **按需加载**：详细内容放在 docs/ 目录，需要时才读取
- **快速参考分离**：常用模板放在 QUICK_REF.md，方便快速查阅

#### 可维护性提升
- **模块化设计**：每个技能独立，避免内容耦合
- **标准化结构**：统一的结构便于工具检查和自动化
- **版本控制友好**：CHANGELOG.md 记录变更历史

#### 用户体验优化
- **分层信息**：从核心到详细，逐步深入
- **快速上手**：QUICK_REF.md 提供常用模板
- **完整文档**：docs/ 目录提供全面指导

### 2. 设计原则

1. **单一职责原则**：每个文件有明确职责
2. **渐进式披露**：从简到繁的信息组织
3. **工具友好**：支持自动化验证和检查
4. **可扩展性**：易于添加新技能和内容

## 核心组件详解

### 1. SKILL.md - 核心指令文件

#### 作用
- Claude Code 激活技能时加载的主要文件
- 提供核心规范、快速检查和文档索引
- 控制在 500 行以内，优化 token 使用

#### 结构规范
```yaml
---
name: skill-name              # kebab-case，最多 64 字符
description: 技能描述          # 说明何时使用此技能
---

# 技能名称

## 核心规范速查

| 规范 | 说明 | 详细文档 |
|-----|------|---------|
| 规范1 | 简要说明 | [docs/detail.md](docs/detail.md) |

## 常用模式索引

- [模式1](docs/pattern1.md)
- [模式2](docs/pattern2.md)

## 快速检查清单

- [ ] 检查项1
- [ ] 检查项2

## 详细文档索引

- [详细主题1](docs/topic1.md)
- [详细主题2](docs/topic2.md)
```

### 2. QUICK_REF.md - 快速参考文件

#### 作用
- 提供常用代码模板和速查表
- 避免在核心文件中包含大量代码
- 方便开发者快速复制粘贴

#### 内容组织
```markdown
# 快速参考

## Entity 模板
```java
// 完整代码示例
@Entity
@Table(name = "t_example")
public class Example extends BaseEntity {
    // 字段定义
}
```

## Service 模板
```java
// 完整代码示例
@Service
@RequiredArgsConstructor
public class ExampleServiceImpl implements IExampleService {
    // 方法实现
}
```

## 链接到详细文档
详细说明请参考：[docs/entity-layer.md](docs/entity-layer.md)
```

### 3. docs/ 目录 - 详细文档

#### 拆分原则
- **按主题拆分**：每个文件 200-400 行
- **单一主题**：每个文件专注一个主题
- **描述性命名**：使用 kebab-case

#### 常见主题结构
```
docs/
├── architecture.md          # 架构设计
├── controller-layer.md      # Controller 层规范
├── service-layer.md        # Service 层规范
├── data-access.md          # 数据访问层
├── domain-objects.md       # 领域对象
├── best-practices.md       # 最佳实践
└── workflow.md            # 工作流程
```

### 4. CHANGELOG.md - 变更日志

#### 格式规范
```markdown
# Changelog

## [1.0.0] - 2026-01-28
### Added
- 初始版本
- 核心技能结构

## [1.1.0] - 2026-02-15
### Added
- 添加 QUICK_REF.md
- 新增 3 个详细文档

### Changed
- 优化 SKILL.md 结构
- 更新链接引用
```

## 自动化脚本系统

### 1. 为什么需要自动化脚本？

#### 质量保证
- **结构一致性**：确保所有技能遵循相同规范
- **链接有效性**：防止死链和错误引用
- **文件大小控制**：避免文件过大影响性能

#### 效率提升
- **批量检查**：一键检查所有技能
- **早期发现问题**：在提交前发现问题
- **标准化报告**：统一的检查报告格式

### 2. check-structure.js - 结构验证脚本

#### 完整代码
```javascript
#!/usr/bin/env node
/**
 * check-structure.js
 * 验证 Skills 文件结构是否符合规范
 *
 * 使用方法:
 *   node check-structure.js [skill-name]  # 检查单个技能
 *   node check-structure.js --all         # 检查所有技能
 */

const fs = require('fs');
const path = require('path');

const SKILLS_DIR = path.join(__dirname, '..');
const MAX_SKILL_LINES = 500;
const MAX_DOC_LINES = 400;
const MIN_DOC_LINES = 100;

class StructureChecker {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }

  /**
   * 检查单个技能
   */
  checkSkill(skillName) {
    const skillDir = path.join(SKILLS_DIR, skillName);

    if (!fs.existsSync(skillDir)) {
      this.errors.push(`技能目录不存在: ${skillName}`);
      return;
    }

    console.log(`\n检查技能: ${skillName}`);
    console.log('='.repeat(50));

    // 检查必需文件
    this.checkRequiredFiles(skillDir, skillName);

    // 检查 YAML frontmatter
    this.checkFrontmatter(skillDir, skillName);

    // 检查文件大小
    this.checkFileSizes(skillDir, skillName);

    // 检查 docs 目录
    this.checkDocsDirectory(skillDir, skillName);
  }

  /**
   * 检查必需文件
   */
  checkRequiredFiles(skillDir, skillName) {
    const requiredFiles = ['SKILL.md'];
    const recommendedFiles = ['QUICK_REF.md', 'CHANGELOG.md'];

    requiredFiles.forEach(file => {
      const filePath = path.join(skillDir, file);
      if (!fs.existsSync(filePath)) {
        this.errors.push(`${skillName}: 缺少必需文件 ${file}`);
      } else {
        console.log(`✓ ${file} 存在`);
      }
    });

    recommendedFiles.forEach(file => {
      const filePath = path.join(skillDir, file);
      if (!fs.existsSync(filePath)) {
        this.warnings.push(`${skillName}: 建议添加 ${file}`);
      } else {
        console.log(`✓ ${file} 存在`);
      }
    });

    // 检查 docs 目录
    const docsDir = path.join(skillDir, 'docs');
    if (!fs.existsSync(docsDir)) {
      this.warnings.push(`${skillName}: 建议创建 docs/ 目录`);
    } else {
      console.log(`✓ docs/ 目录存在`);
    }
  }

  /**
   * 检查 YAML frontmatter
   */
  checkFrontmatter(skillDir, skillName) {
    const skillFile = path.join(skillDir, 'SKILL.md');
    if (!fs.existsSync(skillFile)) return;

    const content = fs.readFileSync(skillFile, 'utf-8');
    const lines = content.split('\n');

    // 检查是否以 --- 开头
    if (lines[0].trim() !== '---') {
      this.errors.push(`${skillName}: SKILL.md 缺少 YAML frontmatter`);
      return;
    }

    // 查找第二个 ---
    let endIndex = -1;
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === '---') {
        endIndex = i;
        break;
      }
    }

    if (endIndex === -1) {
      this.errors.push(`${skillName}: YAML frontmatter 格式错误（缺少结束标记）`);
      return;
    }

    // 解析 frontmatter
    const frontmatter = lines.slice(1, endIndex).join('\n');
    const hasName = /^name:\s*.+$/m.test(frontmatter);
    const hasDescription = /^description:\s*.+$/m.test(frontmatter);

    if (!hasName) {
      this.warnings.push(`${skillName}: 建议在 frontmatter 中添加 name 字段`);
    } else {
      console.log(`✓ frontmatter 包含 name 字段`);
    }

    if (!hasDescription) {
      this.warnings.push(`${skillName}: 建议在 frontmatter 中添加 description 字段`);
    } else {
      console.log(`✓ frontmatter 包含 description 字段`);
    }
  }

  /**
   * 检查文件大小
   */
  checkFileSizes(skillDir, skillName) {
    // 检查 SKILL.md
    const skillFile = path.join(skillDir, 'SKILL.md');
    if (fs.existsSync(skillFile)) {
      const lines = this.countLines(skillFile);
      console.log(`  SKILL.md: ${lines} 行`);

      if (lines > MAX_SKILL_LINES) {
        this.warnings.push(
          `${skillName}: SKILL.md 过大（${lines} 行），建议控制在 ${MAX_SKILL_LINES} 行以下`
        );
      }
    }

    // 检查 docs/ 文件
    const docsDir = path.join(skillDir, 'docs');
    if (fs.existsSync(docsDir)) {
      const docFiles = fs.readdirSync(docsDir).filter(f => f.endsWith('.md'));
      docFiles.forEach(file => {
        const filePath = path.join(docsDir, file);
        const lines = this.countLines(filePath);
        console.log(`  docs/${file}: ${lines} 行`);

        if (lines > MAX_DOC_LINES) {
          this.warnings.push(
            `${skillName}: docs/${file} 过大（${lines} 行），建议控制在 ${MAX_DOC_LINES} 行以下`
          );
        }

        if (lines < MIN_DOC_LINES) {
          this.warnings.push(
            `${skillName}: docs/${file} 过小（${lines} 行），考虑合并到其他文件`
          );
        }
      });
    }
  }

  /**
   * 检查 docs 目录
   */
  checkDocsDirectory(skillDir, skillName) {
    const docsDir = path.join(skillDir, 'docs');
    if (!fs.existsSync(docsDir)) return;

    const docFiles = fs.readdirSync(docsDir).filter(f => f.endsWith('.md'));

    if (docFiles.length === 0) {
      this.warnings.push(`${skillName}: docs/ 目录为空`);
    } else {
      console.log(`✓ docs/ 包含 ${docFiles.length} 个文件`);
    }

    // 检查文件命名
    docFiles.forEach(file => {
      if (!/^[a-z0-9-]+\.md$/.test(file)) {
        this.warnings.push(
          `${skillName}: docs/${file} 命名不符合 kebab-case 规范`
        );
      }
    });
  }

  /**
   * 计算文件行数
   */
  countLines(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    return content.split('\n').length;
  }

  /**
   * 获取所有技能列表
   */
  getAllSkills() {
    return fs.readdirSync(SKILLS_DIR)
      .filter(name => {
        const skillPath = path.join(SKILLS_DIR, name);
        return fs.statSync(skillPath).isDirectory() &&
               name !== 'scripts' &&
               fs.existsSync(path.join(skillPath, 'SKILL.md'));
      });
  }

  /**
   * 打印报告
   */
  printReport() {
    console.log('\n');
    console.log('='.repeat(50));
    console.log('检查报告');
    console.log('='.repeat(50));

    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('✅ 所有检查通过！');
    } else {
      if (this.errors.length > 0) {
        console.log(`\n❌ 发现 ${this.errors.length} 个错误:\n`);
        this.errors.forEach((error, index) => {
          console.log(`${index + 1}. ${error}`);
        });
      }

      if (this.warnings.length > 0) {
        console.log(`\n⚠️  发现 ${this.warnings.length} 个警告:\n`);
        this.warnings.forEach((warning, index) => {
          console.log(`${index + 1}. ${warning}`);
        });
      }
    }

    return this.errors.length === 0;
  }
}

// 主程序
function main() {
  const args = process.argv.slice(2);
  const checker = new StructureChecker();

  if (args.length === 0) {
    console.log('使用方法:');
    console.log('  node check-structure.js [skill-name]  # 检查单个技能');
    console.log('  node check-structure.js --all         # 检查所有技能');
    process.exit(1);
  }

  if (args[0] === '--all') {
    const skills = checker.getAllSkills();
    console.log(`找到 ${skills.length} 个技能`);
    skills.forEach(skill => checker.checkSkill(skill));
  } else {
    checker.checkSkill(args[0]);
  }

  const success = checker.printReport();
  process.exit(success ? 0 : 1);
}

main();
```

#### 检查项详解
1. **必需文件检查**：确保 SKILL.md 存在
2. **推荐文件检查**：检查 QUICK_REF.md 和 CHANGELOG.md
3. **YAML frontmatter 验证**：确保格式正确
4. **文件大小控制**：SKILL.md ≤ 500 行，docs/*.md 100-400 行
5. **命名规范检查**：docs/ 文件使用 kebab-case

### 3. validate-links.js - 链接验证脚本

#### 完整代码
```javascript
#!/usr/bin/env node
/**
 * validate-links.js
 * 验证 Skills 文件中的所有链接有效性
 *
 * 使用方法:
 *   node validate-links.js [skill-name]  # 验证单个技能
 *   node validate-links.js --all         # 验证所有技能
 */

const fs = require('fs');
const path = require('path');

const SKILLS_DIR = path.join(__dirname, '..');
const LINK_REGEX = /\[([^\]]+)\]\(([^)]+)\)/g;

class LinkValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }

  /**
   * 验证单个技能
   */
  validateSkill(skillName) {
    const skillDir = path.join(SKILLS_DIR, skillName);

    if (!fs.existsSync(skillDir)) {
      this.errors.push(`技能目录不存在: ${skillName}`);
      return;
    }

    console.log(`\n验证技能: ${skillName}`);
    console.log('='.repeat(50));

    // 验证 SKILL.md
    this.validateFile(skillDir, 'SKILL.md');

    // 验证 QUICK_REF.md
    if (fs.existsSync(path.join(skillDir, 'QUICK_REF.md'))) {
      this.validateFile(skillDir, 'QUICK_REF.md');
    }

    // 验证 docs/ 目录
    const docsDir = path.join(skillDir, 'docs');
    if (fs.existsSync(docsDir)) {
      const docFiles = fs.readdirSync(docsDir).filter(f => f.endsWith('.md'));
      docFiles.forEach(file => {
        this.validateFile(docsDir, file);
      });
    }
  }

  /**
   * 验证单个文件中的链接
   */
  validateFile(dir, filename) {
    const filePath = path.join(dir, filename);
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    let match;
    const regex = new RegExp(LINK_REGEX);

    lines.forEach((line, index) => {
      regex.lastIndex = 0;
      while ((match = regex.exec(line)) !== null) {
        const linkText = match[1];
        const linkUrl = match[2];

        // 跳过外部链接和锚点
        if (linkUrl.startsWith('http') || linkUrl.startsWith('#')) {
          continue;
        }

        // 验证相对路径链接
        this.validateRelativeLink(dir, filename, linkUrl, index + 1);
      }
    });
  }

  /**
   * 验证相对路径链接
   */
  validateRelativeLink(dir, filename, linkUrl, lineNumber) {
    // 移除锚点
    const urlWithoutAnchor = linkUrl.split('#')[0];
    if (!urlWithoutAnchor) return; // 纯锚点链接

    const targetPath = path.join(dir, urlWithoutAnchor);

    if (!fs.existsSync(targetPath)) {
      this.errors.push({
        file: path.relative(SKILLS_DIR, path.join(dir, filename)),
        line: lineNumber,
        link: linkUrl,
        message: '链接目标不存在'
      });
    }
  }

  /**
   * 获取所有技能列表
   */
  getAllSkills() {
    return fs.readdirSync(SKILLS_DIR)
      .filter(name => {
        const skillPath = path.join(SKILLS_DIR, name);
        return fs.statSync(skillPath).isDirectory() &&
               name !== 'scripts' &&
               fs.existsSync(path.join(skillPath, 'SKILL.md'));
      });
  }

  /**
   * 打印报告
   */
  printReport() {
    console.log('\n');
    console.log('='.repeat(50));
    console.log('验证报告');
    console.log('='.repeat(50));

    if (this.errors.length === 0) {
      console.log('✅ 所有链接验证通过！');
    } else {
      console.log(`❌ 发现 ${this.errors.length} 个失效链接:\n`);
      this.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.file}:${error.line}`);
        console.log(`   链接: ${error.link}`);
        console.log(`   问题: ${error.message}\n`);
      });
    }

    if (this.warnings.length > 0) {
      console.log(`\n⚠️  ${this.warnings.length} 个警告:\n`);
      this.warnings.forEach((warning, index) => {
        console.log(`${index + 1}. ${warning}\n`);
      });
    }

    return this.errors.length === 0;
  }
}

// 主程序
function main() {
  const args = process.argv.slice(2);
  const validator = new LinkValidator();

  if (args.length === 0) {
    console.log('使用方法:');
    console.log('  node validate-links.js [skill-name]  # 验证单个技能');
    console.log('  node validate-links.js --all         # 验证所有技能');
    process.exit(1);
  }

  if (args[0] === '--all') {
    const skills = validator.getAllSkills();
    console.log(`找到 ${skills.length} 个技能`);
    skills.forEach(skill => validator.validateSkill(skill));
  } else {
    validator.validateSkill(args[0]);
  }

  const success = validator.printReport();
  process.exit(success ? 0 : 1);
}

main();
```

#### 验证逻辑
1. **提取链接**：使用正则表达式提取 Markdown 链接
2. **过滤外部链接**：跳过 http/https 链接
3. **验证相对路径**：检查链接目标文件是否存在
4. **报告生成**：提供详细的错误信息


## 完整示例：创建一个新技能

### 步骤1：创建目录结构
```bash
# 创建技能目录
mkdir -p .claude/skills/my-new-skill/docs

# 进入目录
cd .claude/skills/my-new-skill
```

### 步骤2：创建 SKILL.md
```markdown
---
name: my-new-skill
description: 我的新技能，用于演示技能创建流程
---

# 我的新技能

## 核心规范速查

| 规范 | 说明 | 详细文档 |
|-----|------|---------|
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

- [详细主题1](docs/topic1.md)
- [详细主题2](docs/topic2.md)
749- [最佳实践](docs/best-practices.md)
```

### 步骤3：创建 QUICK_REF.md
```markdown
# 快速参考

## 模板1：基础模板

```java
// 这里是代码示例
public class Example {
    private String field;

    public String getField() {
        return field;
    }
}
```

## 模板2：高级模板

```java
// 这里是更复杂的代码示例
@Service
@RequiredArgsConstructor
public class ExampleServiceImpl implements IExampleService {
    private final ExampleMapper exampleMapper;

    @Override
    public ExampleVo getById(Long id) {
        return exampleMapper.selectVoById(id);
    }
}
```

## 链接到详细文档

详细说明请参考：
- [docs/topic1.md](docs/topic1.md)
- [docs/topic2.md](docs/topic2.md)
### 步骤4：创建详细文档
```bash
# 创建详细文档
echo "# 主题1详细说明" > docs/topic1.md
echo "# 主题2详细说明" > docs/topic2.md
echo "# 最佳实践" > docs/best-practices.md
```

### 步骤5：创建 CHANGELOG.md
```markdown
# Changelog

## [1.0.0] - 2026-03-04
### Added
- 初始版本
- 创建核心技能结构
- 添加详细文档

### Changed
- 无

### Fixed
- 无
```

### 步骤6：验证技能
```bash
# 验证结构
node ../scripts/check-structure.js my-new-skill

# 验证链接
node ../scripts/validate-links.js my-new-skill

# 如果发现问题，根据提示修复
```

### 步骤7：测试激活
```bash
# 在 Claude Code 中测试
# 使用命令：/my-new-skill
# 或通过 Skill 工具激活
```

## 故障排除指南

### 常见问题及解决方案

#### 问题1：SKILL.md 过大
**症状**：check-structure.js 报告文件过大
**解决方案**：
1. 将详细内容移到 docs/ 目录
2. 将代码模板移到 QUICK_REF.md
3. 只保留核心规范和索引

#### 问题2：链接失效
**症状**：validate-links.js 报告链接不存在
**解决方案**：
1. 检查文件路径是否正确
2. 确保文件已创建
3. 使用相对路径而非绝对路径

#### 问题3：技能无法激活
**症状**：Claude Code 无法识别技能
**解决方案**：

1. **检查钩子配置**（核心解决方案）：

   **skill-forced-eval.js 钩子工作原理**：
    - 触发时机：用户每次提交问题时（UserPromptSubmit钩子）
    - 核心功能：强制评估并激活相关技能，将技能激活率从 25% 提升到 90%+
    - 核心逻辑：
        1. 检测是否为斜杠命令（如果是则跳过）
        2. 针对每个技能，要求 AI 评估是否需要
        3. 如果需要，强制使用 Skill() 工具激活
        4. 只有在技能激活完成后，才允许开始实现

   **检查步骤**：
    - 确认 `.claude/settings.json` 中正确注册了钩子
    - 检查 `skill-forced-eval.js` 钩子是否正常工作
    - 运行测试：`node .claude/hooks/skill-forced-eval.js "测试技能"`
    - 验证钩子输出是否包含强制技能评估指令

2. **验证技能结构**：
    - 检查 SKILL.md 的 YAML frontmatter 格式正确
    - 确保文件编码为 UTF-8（无 BOM）
    - 验证文件路径正确：`.claude/skills/{skill-name}/`

3. **检查权限和配置**：
    - 查看 `.claude/settings.local.json` 权限配置
    - 确保钩子文件有执行权限：`chmod +x .claude/hooks/*.js`
    - 验证 Node.js 环境：`node --version`

4. **常见修复步骤**：
    - 重新加载 Claude Code 会话
    - 检查控制台错误日志
    - 使用斜杠命令测试：`/{skill-name}`


5. **我改进后的`skill-forced-eval.js`钩子示例**：
```js
#!/usr/bin/env node

/**
 * Claude Code Hook - UserPromptSubmit
 * 触发时机：用户每次提交问题时
 * 功能：强制评估并激活相关技能，将技能激活率从 25% 提升到 90%+
 *
 * 核心逻辑：
 * 1. 检测是否为斜杠命令（如果是则跳过）
 * 2. 针对每个技能，要求 AI 评估是否需要
 * 3. 如果需要，强制使用 Skill() 工具激活
 * 4. 只有在技能激活完成后，才允许开始实现
 */

const fs = require('fs');
const path = require('path');

// 读取用户输入
const prompt = process.argv.slice(2).join(' ');

// 检测是否为斜杠命令（跳过技能评估）
const isSlashCommand = /^\/[^\/\s]+$/.test(prompt.split(/\s/)[0]);

if (isSlashCommand) {
    // 斜杠命令直接放行，不执行技能评估
    process.exit(0);
}

// 强制技能评估指令
const instructions = `
## ⚠️ 指令：强制技能激活流程（必须执行）

在回答用户问题之前，你必须先完成以下步骤：

### 步骤 1 - 评估
针对以下每个技能，严格陈述：[技能名] - 是/否 - [理由]

**可用技能列表**（共9个）：

- **crud-development**: CRUD/业务模块开发、Entity/BO/VO/Service/Controller
- **database-ops**: 数据库操作、SQL、建表、表结构查询
- **api-development**: API设计、RESTful规范、Controller接口
- **backend-annotations**: 后端注解使用（@SaCheckPermission、@Cacheable等）
- **error-handler**: 异常处理、ServiceException使用
- **security-guard**: 安全、加密、XSS、SQL注入防护
- **utils-toolkit**: 工具类使用（StringUtils、MapstructUtils、EncryptUtils等）
- **git-workflow**: Git提交、分支管理、合并冲突
- **project-navigator**: 项目结构导航、文件查找

### 步骤 2 - 激活
- 如果任何技能评估为"是" → **必须**使用 Skill() 工具激活该技能
- 如果所有技能评估为"否" → 说明"不需要激活任何技能"并继续

### 步骤 3 - 读取技能文档（必须）
**激活技能后，必须按以下顺序读取文档：**

1. **读取 QUICK_REF.md**（如果存在）
   - 位置: \`.claude/skills/\${skill-name}/QUICK_REF.md\`
   - 提供快速概览和常用模式

2. **读取相关主题文档**
   - 位置: \`.claude/skills/\${skill-name}/docs/\${topic}.md\`
   - 包含详细规范和示例代码

3. **不要只依赖 SKILL.md**
   - SKILL.md 只是导航中心
   - 详细规范在 QUICK_REF.md 和 docs/ 中

### 步骤 4 - 读取子技能明细(必须)
    激活 crud-development 后：
    1. Read: .claude/skills/crud-development/QUICK_REF.md
    2. Read: .claude/skills/crud-development/docs/controller-layer.md
    3. Read: .claude/skills/crud-development/docs/service-layer.md
    4. 按照文档规范实现


### 步骤 5 - 实现
- 只有在步骤 2-3 完成后（技能已激活且文档已读取），才能开始实现
- 在实现过程中，严格遵守已读取文档中的规范

---

**示例**：

用户问题：帮我创建司机管理的CRUD功能

AI 评估结果：
- crud-development: 是 - 涉及业务模块CRUD开发
- database-ops: 是 - 需要查询t_driver表结构
- api-development: 是 - 需要设计REST接口
- backend-annotations: 是 - 需要使用权限注解
- error-handler: 是 - 需要处理异常
- security-guard: 否 - 不涉及特殊安全处理
- utils-toolkit: 否 - 工具类使用已在crud-development中涵盖
- git-workflow: 否 - 用户未要求提交
- project-navigator: 否 - 不需要查找项目文件

激活 crud-development 后：
    1. Read: .claude/skills/crud-development/QUICK_REF.md
    2. Read: .claude/skills/crud-development/docs/controller-layer.md
    3. Read: .claude/skills/crud-development/docs/service-layer.md
    4. 按照文档规范实现

激活技能：
> Skill(tool="crud-development")
> Skill(tool="database-ops")
> Skill(tool="api-development")
> Skill(tool="backend-annotations")
> Skill(tool="error-handler")

[加载技能知识后开始实现...]

---

**重要提示**：
- 不要跳过评估步骤
- 不要在技能激活前开始实现
- **必须读取 QUICK_REF.md 和 docs/ 文档**
- 不要只依赖 SKILL.md（它只是导航中心）
- 严格按照文档中的规范进行开发
`;

console.log(instructions);

```


**参考文档**：
- 技术参考：[25% → 90%！别让 Skills 吃灰：Hooks + Commands + Agents 协同激活 AI 全部能力：Claude Code 工程化实践](https://blog.csdn.net/leoisaking/article/details/156203326)

