#!/usr/bin/env node
/**
 * SessionStart Hook for Claude Teams GUI
 *
 * This hook is triggered when a Claude Code session starts.
 * It automatically starts the Claude Teams GUI backend server if not already running.
 *
 * Output format: JSON with systemMessage to display in Claude Code conversation
 */

const IS_WINDOWS = process.platform === 'win32';
const BACKEND_URL = process.env.CLAUDE_CHAT_URL || 'http://localhost:4558';
const AUTO_START = process.env.CLAUDE_CHAT_AUTO_START !== 'false';
const STARTUP_TIMEOUT = 30000;

const { spawn } = require('child_process');
const { existsSync } = require('fs');
const { join, dirname, resolve } from 'path');
const { homedir } = require('os');

// Resolve plugin root directory with fallback
function resolvePluginRoot() {
  if (process.env.CLAUDE_PLUGIN_ROOT) {
    const root = process.env.CLAUDE_PLUGIN_ROOT;
    if (existsSync(join(root, 'package.json'))) return root;
  }

  // Try to derive from script location
  try {
    // This script is at hooks/session-start.js
    const scriptDir = __dirname;
    const candidate = dirname(scriptDir);
    if (existsSync(join(candidate, 'package.json'))) return candidate;
  } catch {
    // __dirname not available
  }

  // Fallback to common paths
  const home = homedir();
  const fallbackPaths = [
    join(home, '.claude', 'plugins', 'cache', 'claude-teams-gui-marketplace', 'claude-teams-gui'),
    join(home, '.claude', 'plugins', 'marketplaces', 'claude-teams-gui-marketplace', 'plugin')
  ];

  for (const path of fallbackPaths) {
    if (existsSync(join(path, 'package.json'))) return path;
  }

  return process.cwd();
}

const PLUGIN_ROOT = resolvePluginRoot();

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

function getBunPath() {
  try {
    const result = spawnSync('bun', ['--version'], {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: IS_WINDOWS
    });
    if (result.status === 0) return 'bun';
  } catch {
    // Not in PATH
  }

  const bunPaths = IS_WINDOWS
    ? [join(homedir(), '.bun', 'bin', 'bun.exe')]
    : [join(homedir(), '.bun', 'bin', 'bun'), '/usr/local/bin/bun', '/opt/homebrew/bin/bun'];

  for (const bunPath of bunPaths) {
    if (existsSync(bunPath)) return bunPath;
  }
  return null;
}

async function startServers() {
  const bunPath = getBunPath();
  if (!bunPath) {
    throw new Error('Bun not found. Please install Bun: curl -fsSL https://bun.sh/install | bash');
  }

  const serverPath = join(PLUGIN_ROOT, 'src', 'server', 'cli.ts');
  if (!existsSync(serverPath)) {
    throw new Error(`Server not found at ${serverPath}`);
  }

  // Start backend in background
  const backend = spawn(bunPath, [serverPath, '--headless'], {
    cwd: PLUGIN_ROOT,
    detached: true,
    stdio: 'ignore',
    env: {
      ...process.env,
      CLAUDE_PLUGIN_ROOT: PLUGIN_ROOT,
      NODE_ENV: 'production'
    },
    windowsHide: true
  });
  backend.unref();
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
      console.log(JSON.stringify({
        continue: true,
        suppressOutput: false,
        systemMessage: '⏭ Claude Teams GUI 自动启动已禁用 (CLAUDE_CHAT_AUTO_START=false)'
      }));
      process.exit(0);
    }

    // Check if server is already running
    if (await isServerRunning(BACKEND_URL)) {
      console.log(JSON.stringify({
        continue: true,
        suppressOutput: false,
        systemMessage: `✅ Claude Teams GUI 服务已就绪

🌐 查看界面: http://localhost:4559

💡 可以开始使用了!`
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
        systemMessage: `🚀 Claude Teams GUI 服务启动成功!

🌐 查看界面: http://localhost:4559

💡 可以开始使用了!`
      }));
    } else {
      console.log(JSON.stringify({
        continue: true,
        suppressOutput: false,
        systemMessage: `⚠️ Claude Teams GUI 服务启动超时

💡 请手动运行: cd ${PLUGIN_ROOT} && bun run src/server/cli.ts`
      }));
    }

    process.exit(0);
  } catch (err) {
    console.log(JSON.stringify({
      continue: true,
      suppressOutput: false,
      systemMessage: `❌ Claude Teams GUI 启动错误: ${err.message}

💡 请检查:
   - Bun 是否已安装: bun --version
   - 插件目录: ${PLUGIN_ROOT}`
      }));
    process.exit(0);
  }
}

main();
