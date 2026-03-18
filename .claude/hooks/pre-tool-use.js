#!/usr/bin/env node

/**
 * Claude Code Hook - PreToolUse
 * 触发时机：工具调用前
 * 功能：验证和阻止危险操作
 */

const INPUT = process.argv[2] || '{}';
let data;

try {
  data = JSON.parse(INPUT);
} catch {
  data = {};
}

const TOOL_NAME = data.tool_name || '';

// 只处理 Bash 工具
if (TOOL_NAME !== 'Bash') {
  process.exit(0);
}

const COMMAND = data.tool_input?.command || '';

// 危险命令检测
const DANGEROUS_PATTERNS = [
  { pattern: /rm\s+-rf\s+\//, name: 'rm -rf /' },
  { pattern: /rm\s+-rf\s+~/, name: 'rm -rf ~' },
  { pattern: /rm\s+-rf\s+\*/, name: 'rm -rf *' },
  { pattern: /:\(\)\s*\{\s*:\s*\|\s*:\s*&\s*\}\s*;/, name: 'fork bomb' },
  { pattern: /mkfs/, name: 'mkfs' },
  { pattern: /dd\s+if=/, name: 'dd if=' },
  { pattern: />\s*\/dev\/sd/, name: 'write to disk' },
  { pattern: /chmod\s+-R\s+777\s+\//, name: 'chmod 777 /' }
];

// 检查危险命令
for (const { pattern, name } of DANGEROUS_PATTERNS) {
  if (pattern.test(COMMAND)) {
    console.log(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: `阻止了危险命令: ${name}`
      }
    }));
    process.exit(0);
  }
}

// 检查是否修改关键文件
const CRITICAL_FILES = [
  { pattern: /\.env/, name: '.env' },
  { pattern: /\.git\//, name: '.git/' },
  { pattern: /id_rsa/, name: 'SSH私钥' },
  { pattern: /\.ssh\//, name: '.ssh/' },
  { pattern: /credentials/, name: 'credentials' },
  { pattern: /\.claude\/settings/, name: '.claude/settings' }
];

for (const { pattern, name } of CRITICAL_FILES) {
  if (pattern.test(COMMAND)) {
    console.log(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'ask',
        permissionDecisionReason: `即将操作关键文件，请确认: ${name}`
      }
    }));
    process.exit(0);
  }
}

// 允许执行
process.exit(0);
