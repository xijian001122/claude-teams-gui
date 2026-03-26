#!/usr/bin/env node

/**
 * Claude Code Hook - TaskCreated
 * 触发时机：任务创建成功时
 * 功能：通知 Claude Chat 后端广播 task_created 事件
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

// 默认后端地址
const DEFAULT_HOST = 'localhost';
const DEFAULT_PORT = 4558;

// 最大重试次数
const MAX_RETRIES = 3;
// 重试延迟（毫秒）
const RETRY_DELAY = 500;

/**
 * 从配置文件读取后端端口
 */
function getBackendConfig() {
  const configPaths = [
    path.join(os.homedir(), '.claude-chat', 'config.json'),
    path.join(process.cwd(), '.claude-chat', 'config.json'),
    '/root/.claude-chat/config.json'
  ];

  for (const configPath of configPaths) {
    try {
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        return {
          host: config.host || DEFAULT_HOST,
          port: config.port || DEFAULT_PORT
        };
      }
    } catch (err) {
      // 忽略错误，继续尝试下一个路径
    }
  }

  return { host: DEFAULT_HOST, port: DEFAULT_PORT };
}

/**
 * 发送 HTTP POST 请求
 */
function postTaskCreated(host, port, payload) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(payload);

    const options = {
      hostname: host,
      port: port,
      path: '/api/hooks/task-created',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(body));
          } catch {
            resolve({ success: true });
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.write(postData);
    req.end();
  });
}

/**
 * 带重试的请求
 */
async function notifyWithRetry(host, port, payload, retries = MAX_RETRIES) {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await postTaskCreated(host, port, payload);
      console.error(`[task-created-hook] Task notified successfully: ${payload.taskId}`);
      return result;
    } catch (err) {
      console.error(`[task-created-hook] Attempt ${i + 1} failed: ${err.message}`);

      if (i < retries - 1) {
        await new Promise(r => setTimeout(r, RETRY_DELAY));
      }
    }
  }

  console.error(`[task-created-hook] Failed to notify after ${retries} attempts. Task ID: ${payload.taskId}`);
  process.exit(1);
}

/**
 * 解析 hook 输入
 */
function parseInput() {
  const INPUT = process.argv[2] || '{}';
  try {
    return JSON.parse(INPUT);
  } catch {
    return {};
  }
}

// 主流程
async function main() {
  const input = parseInput();

  // 从 Claude Code hook 接收的数据
  const taskId = input.task_id || input.taskId || '';
  const teamName = input.team_name || input.teamName || extractTeamFromPath(input.task_path || '');

  // 如果没有 teamName，尝试从当前工作目录推断
  const resolvedTeamName = teamName || inferTeamFromCwd();

  if (!taskId) {
    console.error('[task-created-hook] No task ID provided');
    process.exit(0); // 不算失败，只是没有任务ID
  }

  const { host, port } = getBackendConfig();

  const payload = {
    taskId: String(taskId),
    teamName: resolvedTeamName || 'default',
    subject: input.subject || '',
    status: input.status || 'pending',
    owner: input.owner || ''
  };

  console.error(`[task-created-hook] Notifying task created: ${taskId} for team: ${payload.teamName}`);

  await notifyWithRetry(host, port, payload);
}

/**
 * 从任务文件路径提取团队名
 */
function extractTeamFromPath(taskPath) {
  if (!taskPath) return '';

  // 路径格式: ~/.claude/tasks/<team-name>/<task-id>.json
  const match = taskPath.match(/\/tasks\/([^\/]+)\//);
  return match ? match[1] : '';
}

/**
 * 从当前工作目录推断团队名
 */
function inferTeamFromCwd() {
  const cwd = process.cwd();
  // 尝试从 tasks 目录结构推断
  const tasksMatch = cwd.match(/\/tasks\/([^\/]+)/);
  if (tasksMatch) {
    return tasksMatch[1];
  }

  // 尝试从 teams 目录推断
  const teamsMatch = cwd.match(/\/teams\/([^\/]+)/);
  if (teamsMatch) {
    return teamsMatch[1];
  }

  return 'default';
}

main().catch((err) => {
  console.error(`[task-created-hook] Error: ${err.message}`);
  process.exit(1);
});
