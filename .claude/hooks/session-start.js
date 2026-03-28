#!/usr/bin/env node

/* Claude Code Hook - SessionStart
 * 触发时机：每次启动 Claude Code 会话时
 * 功能：显示项目状态、Git 分支、待办事项、快捷命令
 * 构建要在对话中显示的消息
 */
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// 日志函数
function log(level, message) {
  const timestamp = new Date().toISOString();
  const logMsg = `[${timestamp}] [${level}] ${message}`;
  console.error(logMsg); // 输出到 stderr 以便捕获
}

function buildSessionMessage() {
  let msg = '';

  // 记录启动信息
  log('INFO', 'Session-start hook executing');
  log('INFO', `Platform: ${os.platform()}, Arch: ${os.arch()}`);
  log('INFO', `Node: ${process.version}, CWD: ${process.cwd()}`);

  // 1. 获取当前时间
  const now = new Date();
  const timeStr = now.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  msg += `⏰ 时间: ${timeStr}\n`;

  // 2. 获取 Git 分支信息
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', {
      encoding: 'utf-8',
      cwd: __dirname
    }).trim();

    const commit = execSync('git log -1 --format="%h - %s (%an, %ar)"', {
      encoding: 'utf-8',
      cwd: __dirname
    }).trim();

    msg += `\n🌿 Git 分支: \`${branch}\`\n`;
    msg += `📌 最近提交: ${commit}\n`;

    // 3. 检查未提交的变更
    try {
      const status = execSync('git status --short', {
        encoding: 'utf-8',
        cwd: __dirname
      }).trim();

      if (status) {
        const changedFiles = status.split('\n').filter(line => line.trim());
        msg += `\n  未提交变更 (${changedFiles.length} 个文件):\n`;

        changedFiles.slice(0, 10).forEach(file => {
          const [status, ...filePath] = file.split(/\s+/);
          const filePathStr = filePath.join(' ');
          msg += `  ${status} ${filePathStr}\n`;
        });

        if (changedFiles.length > 10) {
          msg += `  ... 还有 ${changedFiles.length - 10} 个文件\n`;
        }
      } else {
        msg += '\n 工作区干净: 无未提交变更\n';
      }
    } catch (e) {
      // Git status 失败
    }
  } catch (e) {
    msg += '\n  Git 信息获取失败: 可能不是 Git 仓库\n';
  }

  // 4. 检查 OpenSpec 变更
  const openspecPath = path.join(__dirname, '../../openspec/changes');
  if (fs.existsSync(openspecPath)) {
    const changes = fs.readdirSync(openspecPath).filter(f => {
      const stat = fs.statSync(path.join(openspecPath, f));
      return stat.isDirectory();
    });

    if (changes.length > 0) {
      msg += '\n📋 活跃变更 (' + changes.length + '):\n';
      changes.forEach(change => {
        msg += `   - ${change}\n`;
      });
    }
  }

  // 5. 显示快捷命令
  msg += '\n💡 快捷命令:\n';
  msg += '   | 命令 | 功能 |\n';
  msg += '   |------|------|\n';
  msg += '   | `/opsx:propose <name>` | 创建新提案 |\n';
  msg += '   | `/opsx:apply <change>` | 应用变更任务 |\n';
  msg += '   | `/opsx:archive <change>` | 归档完成变更 |\n';
  msg += '   | `/opsx:list` | 查看所有变更 |\n';
  msg += '   | `/teams:apply <change>` | 创建团队实施变更 |\n';

  // 6. 显示可用技能
  msg += '\n 可用技能 (13个):\n';
  msg += '   开发技能:\n';
  msg += '   - frontend-dev: 前端开发（Preact + TailwindCSS）\n';
  msg += '   - backend-dev: 后端开发（Fastify + SQLite）\n';
  msg += '   - websocket-protocol: WebSocket 通信协议\n';
  msg += '   架构技能:\n';
  msg += '   - project-arch: 项目架构\n';
  msg += '   - git-workflow: Git 工作流规范\n';
  msg += '   团队协作:\n';
  msg += '   - agent-teams: Agent Teams 协作规范\n';
  msg += '   OpenSpec 技能:\n';
  msg += '   - openspec-propose: 创建新提案\n';
  msg += '   - openspec-apply-change: 应用变更任务\n';
  msg += '   - openspec-archive-change: 归档完成变更\n';
  msg += '   - openspec-continue-change: 继续变更\n';
  msg += '   - openspec-explore: 探索变更\n';
  msg += '   其他:\n';
  msg += '   - skill-evolution: 技能系统维护\n';
  msg += '   - demo: UI 效果图生成\n';

  // 7. 项目信息
  msg += '\n 项目信息:\n';
  msg += '   - 描述: WeChat-like messaging for Claude Code Teams\n';
  msg += '   - 技术栈: Preact + Fastify + SQLite + WebSocket\n';
  msg += '   - 启动命令: `bash scripts/start.sh`\n';
  msg += '   - 配置文件: `~/.claude-chat/config.json`\n';

  // 8. 代码结构
  msg += '\n 代码结构:\n';
  msg += '   - 前端: `src/client/` （Preact + TailwindCSS）\n';
  msg += '   - 后端: `src/server/` （Fastify + SQLite）\n';
  msg += '   - 共享类型: `src/shared/`\n';

  return msg;
}

// 输出 JSON 格式让 Claude Code 在对话中显示
const message = buildSessionMessage();
console.log(JSON.stringify({
  continue: true,
  suppressOutput: false,
  systemMessage: message
}));
