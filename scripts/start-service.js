#!/usr/bin/env node
/**
 * Start Service Script for Claude Teams GUI
 *
 * This script starts the backend server which also serves the frontend static files.
 * Optimized to avoid re-downloading node_modules on every start.
 */

import { spawn } from 'child_process';
import { existsSync, readdirSync, openSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';
import { fileURLToPath } from 'url';

const IS_WINDOWS = process.platform === 'win32';

// Compare versions (simple semver comparison)
function compareVersions(a, b) {
  const partsA = a.split('.').map(Number);
  const partsB = b.split('.').map(Number);
  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const numA = partsA[i] || 0;
    const numB = partsB[i] || 0;
    if (numA !== numB) return numA - numB;
  }
  return 0;
}

// Resolve plugin root
function resolveRoot() {
  if (process.env.CLAUDE_PLUGIN_ROOT) {
    return process.env.CLAUDE_PLUGIN_ROOT;
  }
  try {
    const scriptDir = dirname(fileURLToPath(import.meta.url));
    const candidate = dirname(scriptDir);
    if (existsSync(join(candidate, 'package.json'))) return candidate;
  } catch {
    // ignore
  }

  // Scan cache for versioned plugin directory
  const home = homedir();
  const cacheBase = join(home, '.claude', 'plugins', 'cache', 'claude-teams-gui-marketplace', 'claude-teams-gui');
  if (existsSync(cacheBase)) {
    try {
      const entries = readdirSync(cacheBase, { withFileTypes: true });
      let latestVersion = null;
      let latestPath = null;
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const versionPath = join(cacheBase, entry.name);
          if (existsSync(join(versionPath, 'package.json'))) {
            if (!latestVersion || compareVersions(entry.name, latestVersion) > 0) {
              latestVersion = entry.name;
              latestPath = versionPath;
            }
          }
        }
      }
      if (latestPath) return latestPath;
    } catch {
      // ignore
    }
  }

  // Fallback to marketplaces directory
  const marketplacePath = join(home, '.claude', 'plugins', 'marketplaces', 'claude-teams-gui-marketplace');
  if (existsSync(join(marketplacePath, 'package.json'))) {
    return marketplacePath;
  }

  return process.cwd();
}

const PLUGIN_ROOT = resolveRoot();
const BACKEND_URL = process.env.CLAUDE_CHAT_URL || 'http://localhost:4558';

// Get log file path
function getLogPath() {
  return IS_WINDOWS
    ? join(homedir(), 'AppData', 'Local', 'Temp', 'claude-teams-gui.log')
    : '/tmp/claude-teams-gui.log';
}

// Check if server is already running
async function isServerRunning() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const response = await fetch(`${BACKEND_URL}/api/teams`, {
      method: 'HEAD',
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}

// Get bun path - on Windows, use 'bun' from PATH to avoid backslash issues
function getBunPath() {
  if (IS_WINDOWS) return 'bun';

  // On Unix, check common locations
  const bunPaths = [
    join(homedir(), '.bun', 'bin', 'bun'),
    '/usr/local/bin/bun',
    '/opt/homebrew/bin/bun',
    'bun'
  ];

  for (const bunPath of bunPaths) {
    if (bunPath === 'bun') return bunPath;
    if (existsSync(bunPath)) return bunPath;
  }
  return 'bun';
}

// Check if node_modules exists
function hasNodeModules() {
  return existsSync(join(PLUGIN_ROOT, 'node_modules'));
}

// Check if dist exists
function hasDist() {
  return existsSync(join(PLUGIN_ROOT, 'dist', 'server', 'server', 'cli.js'));
}

// Start server using dist with bun (production mode - bun handles ESM better)
function startWithDist() {
  const serverPath = join(PLUGIN_ROOT, 'dist', 'server', 'server', 'cli.js');
  if (!existsSync(serverPath)) {
    return false;
  }

  const logPath = getLogPath();
  const logFd = openSync(logPath, 'a');
  const bunPath = getBunPath();

  // Use bun to run dist - it handles ESM imports without .js extensions
  const child = spawn(bunPath, [serverPath, '--headless'], {
    cwd: PLUGIN_ROOT,
    stdio: ['ignore', logFd, logFd],
    detached: true,
    windowsHide: true,
    env: {
      ...process.env,
      CLAUDE_PLUGIN_ROOT: PLUGIN_ROOT,
      NODE_ENV: 'production'
    }
  });

  child.unref();
  return true;
}

// Start server using bun (dev mode)
function startWithBun() {
  const serverPath = join(PLUGIN_ROOT, 'src', 'server', 'cli.ts');
  const bunPath = getBunPath();
  const logPath = getLogPath();
  const logFd = openSync(logPath, 'a');

  const child = spawn(bunPath, [serverPath, '--headless'], {
    cwd: PLUGIN_ROOT,
    stdio: ['ignore', logFd, logFd],
    detached: true,
    windowsHide: true,
    env: {
      ...process.env,
      CLAUDE_PLUGIN_ROOT: PLUGIN_ROOT,
      NODE_ENV: 'development'
    }
  });

  child.unref();
  return true;
}

// Install dependencies in background
function installInBackground() {
  const bunPath = getBunPath();

  const child = spawn(bunPath, ['install'], {
    cwd: PLUGIN_ROOT,
    stdio: ['ignore', 'ignore', 'ignore'],
    detached: true,
    windowsHide: true
  });

  child.unref();
}

// Main
async function main() {
  try {
    // Check if server is already running
    if (await isServerRunning()) {
      console.log(JSON.stringify({
        continue: true,
        suppressOutput: false,
        systemMessage: `✅ Claude Teams GUI 服务已就绪

🌐 查看界面: http://localhost:4558

💡 可以开始使用了!`
      }));
      process.exit(0);
    }

    // Check if we can start without waiting
    if (hasNodeModules() && hasDist()) {
      // node_modules + dist exist - start immediately with bun (handles ESM)
      if (startWithDist()) {
        console.log(JSON.stringify({
          continue: true,
          suppressOutput: false,
          systemMessage: `🚀 Claude Teams GUI 服务启动中

🌐 查看界面: http://localhost:4558

💡 稍后刷新页面即可使用!`
        }));
        process.exit(0);
      }
    }

    // If node_modules missing, trigger install in background
    if (!hasNodeModules()) {
      installInBackground();
      console.log(JSON.stringify({
        continue: true,
        suppressOutput: false,
        systemMessage: `📦 正在安装依赖...

💡 首次安装需要几分钟，请稍后重新启动 Claude`
      }));
      process.exit(0);
    }

    // Fallback to bun + src (dev mode)
    if (startWithBun()) {
      console.log(JSON.stringify({
        continue: true,
        suppressOutput: false,
        systemMessage: `🚀 Claude Teams GUI 服务启动中 (dev模式)

🌐 查看界面: http://localhost:4558

💡 稍后刷新页面即可使用!`
      }));
      process.exit(0);
    }

    console.log(JSON.stringify({
      continue: true,
      suppressOutput: false,
      systemMessage: `❌ Claude Teams GUI 启动失败

💡 请手动检查: bun --version`
    }));

  } catch (err) {
    console.log(JSON.stringify({
      continue: true,
      suppressOutput: false,
      systemMessage: `❌ Claude Teams GUI 启动错误: ${err.message}`
    }));
  }

  process.exit(0);
}

main();
