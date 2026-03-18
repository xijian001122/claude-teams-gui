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
