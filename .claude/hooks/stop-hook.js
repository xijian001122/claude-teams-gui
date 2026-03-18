#!/usr/bin/env node

/**
 * Claude Code Hook - Stop
 * 触发时机：Claude 完成响应时
 * 功能：检查是否有未完成的任务
 */

const INPUT = process.argv[2] || '{}';
let data;

try {
  data = JSON.parse(INPUT);
} catch {
  data = {};
}

const STOP_HOOK_ACTIVE = data.stop_hook_active || false;

// 如果已经是因为 Stop hook 激活的，不再重复
if (STOP_HOOK_ACTIVE) {
  process.exit(0);
}

// 获取最后的消息
const LAST_MESSAGE = data.last_assistant_message || '';

// 检查是否有明确的未完成任务标记
if (/TODO:|FIXME:|待完成|继续|未完成/i.test(LAST_MESSAGE)) {
  console.log(JSON.stringify({
    decision: 'block',
    reason: '检测到未完成的任务。请确保完成所有 TODO 和 FIXME 项目后再结束。'
  }));
  process.exit(0);
}

// 检查是否提到了测试但没运行
if (/测试|test|spec/i.test(LAST_MESSAGE) && !/运行.*测试|测试.*通过|test.*pass/i.test(LAST_MESSAGE)) {
  console.log(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'Stop',
      additionalContext: '提醒：代码修改后建议运行测试验证。使用 npm run test 运行测试套件。'
    }
  }));
}

process.exit(0);
