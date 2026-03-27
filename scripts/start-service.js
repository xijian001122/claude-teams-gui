#!/usr/bin/env node
/**
 * Start Service Script for Claude Teams GUI
 *
 * This script starts the backend server which also serves the frontend static files.
 * Optimized to avoid re-downloading node_modules on every start.
 */

import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';
import { fileURLToPath } from 'url';

const IS_WINDOWS = process.platform === 'win32';

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
      const { readdirSync } = require('fs');
      const entries = readdirSync(cacheBase, { withFileTypes: true });
      // Find the latest version directory
      let latestVersion = null;
      let latestPath = null;
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const versionPath = join(cacheBase, entry.name);
          if (existsSync(join(versionPath, 'package.json'))) {
            if (!latestVersion || entry.name > latestVersion) {
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

// Get bun path
function getBunPath() {
  const bunPaths = IS_WINDOWS
    ? [join(homedir(), '.bun', 'bin', 'bun.exe')]
    : [join(homedir(), '.bun', 'bin', 'bun'), '/usr/local/bin/bun', '/opt/homebrew/bin/bun'];

  for (const bunPath of bunPaths) {
    if (existsSync(bunPath)) return bunPath;
  }
  return 'bun';
}

// Check if node_modules exists
function hasNodeModules() {
  return existsSync(join(PLUGIN_ROOT, 'node_modules'));
}

// Start server using dist with node (no bun install needed)
function startWithNode() {
  const serverPath = join(PLUGIN_ROOT, 'dist', 'server', 'server', 'cli.js');
  if (!existsSync(serverPath)) {
    return false;
  }

  const cmd = IS_WINDOWS
    ? `start /B node "${serverPath}" --headless >> %TEMP%\\claude-teams-gui.log 2>&1`
    : `cd "${PLUGIN_ROOT}" && node "${serverPath}" --headless >> /tmp/claude-teams-gui.log 2>&1 &`;

  spawn(IS_WINDOWS ? 'cmd' : 'bash', IS_WINDOWS ? ['/C', cmd] : ['-c', cmd], {
    stdio: 'ignore',
    detached: !IS_WINDOWS,
    env: {
      ...process.env,
      CLAUDE_PLUGIN_ROOT: PLUGIN_ROOT,
      NODE_ENV: 'production'
    },
    windowsHide: true
  });

  return true;
}

// Start server using bun (for dev mode or when node_modules missing)
function startWithBun() {
  const serverPath = join(PLUGIN_ROOT, 'src', 'server', 'cli.ts');

  const cmd = IS_WINDOWS
    ? `start /B bun "${serverPath}" --headless >> %TEMP%\\claude-teams-gui.log 2>&1`
    : `cd "${PLUGIN_ROOT}" && bun "${serverPath}" --headless >> /tmp/claude-teams-gui.log 2>&1 &`;

  spawn(IS_WINDOWS ? 'cmd' : 'bash', IS_WINDOWS ? ['/C', cmd] : ['-c', cmd], {
    stdio: 'ignore',
    detached: !IS_WINDOWS,
    env: {
      ...process.env,
      CLAUDE_PLUGIN_ROOT: PLUGIN_ROOT,
      NODE_ENV: 'development'
    },
    windowsHide: true
  });

  return true;
}

// Install dependencies in background
function installInBackground() {
  const bunPath = getBunPath();

  const cmd = IS_WINDOWS
    ? `start /B "${bunPath}" install >> %TEMP%\\claude-teams-gui-install.log 2>&1`
    : `cd "${PLUGIN_ROOT}" && ${bunPath} install >> /tmp/claude-teams-gui-install.log 2>&1 &`;

  spawn(IS_WINDOWS ? 'cmd' : 'bash', IS_WINDOWS ? ['/C', cmd] : ['-c', cmd], {
    stdio: 'ignore',
    detached: !IS_WINDOWS,
    windowsHide: true
  });
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
    if (hasNodeModules()) {
      // node_modules exists - start immediately with node (dist)
      if (startWithNode()) {
        console.log(JSON.stringify({
          continue: true,
          suppressOutput: false,
          systemMessage: `🚀 Claude Teams GUI 服务启动中

🌐 查看界面: http://localhost:4558

💡 稍后刷新页面即可使用!`
        }));
        process.exit(0);
      }
    } else {
      // node_modules missing - trigger install in background
      installInBackground();
      console.log(JSON.stringify({
        continue: true,
        suppressOutput: false,
        systemMessage: `📦 正在安装依赖...

💡 首次安装需要几分钟，请稍后重新启动 Claude`
      }));
      process.exit(0);
    }

    // Fallback to bun (dev mode)
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
