#!/usr/bin/env node

/**
 * Claude Code Hook - SessionStart
 * 触发时机：会话开始时
 * 功能：加载项目上下文、设置环境变量
 */

const INPUT = process.argv[2] || '{}';
let data;

try {
  data = JSON.parse(INPUT);
} catch {
  data = {};
}

const SOURCE = data.source || 'startup';

// 根据会话来源加载不同的上下文
let context = '';

switch (SOURCE) {
  case 'startup':
    // 新会话：加载项目概述
    context = `
## 📋 项目上下文加载

### 项目信息
- **项目名称**: Claude Chat
- **描述**: WeChat-like messaging for Claude Code Teams
- **技术栈**: Preact + Fastify + SQLite + WebSocket

### 可用技能
- \`frontend-dev\`: 前端开发（Preact + TailwindCSS）
- \`backend-dev\`: 后端开发（Fastify + SQLite）
- \`websocket-protocol\`: WebSocket 通信协议
- \`project-arch\`: 项目架构

### 开发命令
- \`npm run dev\`: 启动开发服务器
- \`npm run test\`: 运行测试
- \`npm run build\`: 构建项目

### 注意事项
- 前端代码在 \`src/client/\`
- 后端代码在 \`src/server/\`
- 共享类型在 \`src/shared/\`
`;
    break;
  case 'resume':
    // 恢复会话：简要提示
    context = `
## 🔄 会话已恢复

继续之前的工作。如需了解项目结构，请使用 /project-arch 技能。
`;
    break;
}

// 输出上下文
if (context) {
  console.log(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext: context
    }
  }));
}

process.exit(0);
