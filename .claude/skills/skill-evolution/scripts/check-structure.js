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
