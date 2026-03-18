#!/usr/bin/env node

/**
 * Claude Code Hook - PostToolUse
 * 触发时机：工具调用成功后
 * 功能：代码格式化检查、构建验证
 */

const INPUT = process.argv[2] || '{}';
let data;

try {
  data = JSON.parse(INPUT);
} catch {
  data = {};
}

const TOOL_NAME = data.tool_name || '';

// 只处理文件修改工具
if (TOOL_NAME !== 'Write' && TOOL_NAME !== 'Edit') {
  process.exit(0);
}

// 提取文件路径
const FILE_PATH = data.tool_input?.file_path || '';

// 获取文件扩展名
const ext = FILE_PATH.split('.').pop()?.toLowerCase() || '';

// 根据文件类型进行验证
switch (ext) {
  case 'ts':
  case 'tsx':
    // TypeScript 文件：检查语法（仅提示，不阻止）
    console.log(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PostToolUse',
        additionalContext: `TypeScript 文件已修改: ${FILE_PATH}。建议运行 npm run type-check 验证类型。`
      }
    }));
    break;

  case 'css':
  case 'scss':
    // CSS 文件：提示 TailwindCSS 使用
    const content = data.tool_input?.content || '';
    if (/@apply|@tailwind/.test(content)) {
      console.log(JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'PostToolUse',
          additionalContext: `CSS 文件包含 TailwindCSS 指令: ${FILE_PATH}`
        }
      }));
    }
    break;
}

process.exit(0);
