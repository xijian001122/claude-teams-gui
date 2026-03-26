#!/usr/bin/env node
/**
 * SessionStart Hook for Claude Agent Teams UI
 *
 * This hook is triggered when a Claude Code session starts.
 * It automatically starts the Claude Agent Teams UI backend and frontend servers
 * if they are not already running.
 *
 * Output format: JSON with systemMessage to display in Claude Code conversation
 */

const PLUGIN_ROOT = process.env.CLAUDE_PLUGIN_ROOT || process.cwd();
const BACKEND_URL = process.env.CLAUDE_CHAT_URL || 'http://localhost:4558';
const AUTO_START = process.env.CLAUDE_CHAT_AUTO_START !== 'false';
const STARTUP_TIMEOUT = 30000; // 30 seconds

const { spawn } = require('child_process');

async function isServerRunning(url) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(`${url}/api/teams`, {
      method: 'HEAD',
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}

async function startServers() {
  const projectRoot = process.env.CLAUDE_PROJECT_ROOT || process.cwd();

  // Start backend in background
  const backend = spawn('bun', ['--hot', 'run', 'src/server/cli.ts'], {
    cwd: projectRoot,
    detached: true,
    stdio: 'ignore',
    env: {
      ...process.env,
      SERVER_PORT: '4558'
    }
  });
  backend.unref();

  // Wait a bit for backend to start
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Start frontend in background
  const frontend = spawn('npx', ['vite', '--host', 'localhost', '--port', '4559'], {
    cwd: projectRoot,
    detached: true,
    stdio: 'ignore',
    env: {
      ...process.env,
      CLIENT_PORT: '4559',
      CLIENT_HOST: 'localhost'
    }
  });
  frontend.unref();
}

async function waitForServer(url, timeout = STARTUP_TIMEOUT) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    if (await isServerRunning(url)) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  return false;
}

async function main() {
  try {
    // Check if auto-start is enabled
    if (!AUTO_START) {
      // 输出 JSON 格式让 Claude Code 在对话中显示
      console.log(JSON.stringify({
        continue: true,
        suppressOutput: false,
        systemMessage: '⏭️ Claude Agent Teams UI 自动启动已禁用 (CLAUDE_CHAT_AUTO_START=false)'
      }));
      process.exit(0);
    }

    // Check if server is already running
    if (await isServerRunning(BACKEND_URL)) {
      console.log(JSON.stringify({
        continue: true,
        suppressOutput: false,
        systemMessage: `🎉 Claude Agent Teams UI 服务已就绪！

🌐 前端: http://localhost:4559
🔧 后端: http://localhost:4558

💡 访问 http://localhost:4559 开始使用`
      }));
      process.exit(0);
    }

    // Start servers
    await startServers();

    // Wait for server to be ready
    if (await waitForServer(BACKEND_URL)) {
      console.log(JSON.stringify({
        continue: true,
        suppressOutput: false,
        systemMessage: `🚀 Claude Agent Teams UI 服务启动成功！

🌐 前端: http://localhost:4559
🔧 后端: http://localhost:4558

💡 访问 http://localhost:4559 开始使用`
      }));
    } else {
      console.log(JSON.stringify({
        continue: true,
        suppressOutput: false,
        systemMessage: '⚠️ Claude Agent Teams UI 服务启动超时，请手动检查\n   - 运行: `bash scripts/start.sh`'
      }));
    }

    process.exit(0);
  } catch (err) {
    console.log(JSON.stringify({
      continue: true,
      suppressOutput: false,
      systemMessage: `❌ Claude Agent Teams UI 启动错误: ${err.message}\n   - 运行: \`bash scripts/start.sh\` 手动启动`
    }));
    process.exit(0);
  }
}

main();
