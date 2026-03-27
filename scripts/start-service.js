#!/usr/bin/env node
/**
 * Start Service Script for Claude Teams GUI
 */

import { spawn } from 'child_process';
import { existsSync, readdirSync, openSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';
import { fileURLToPath } from 'url';

const IS_WINDOWS = process.platform === 'win32';
const startTime = Date.now();

// Compare versions
function compareVersions(a, b) {
  const partsA = a.split('.').map(Number);
  const partsB = b.split('.').map(Number);
  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const diff = (partsA[i] || 0) - (partsB[i] || 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

// Resolve plugin root
function resolveRoot() {
  if (process.env.CLAUDE_PLUGIN_ROOT) return process.env.CLAUDE_PLUGIN_ROOT;
  try {
    const scriptDir = dirname(fileURLToPath(import.meta.url));
    const candidate = dirname(scriptDir);
    if (existsSync(join(candidate, 'package.json'))) return candidate;
  } catch {}

  const cacheBase = join(homedir(), '.claude', 'plugins', 'cache', 'claude-teams-gui-marketplace', 'claude-teams-gui');
  if (existsSync(cacheBase)) {
    try {
      const entries = readdirSync(cacheBase, { withFileTypes: true });
      let latestVersion = null, latestPath = null;
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
    } catch {}
  }

  const marketplacePath = join(homedir(), '.claude', 'plugins', 'marketplaces', 'claude-teams-gui-marketplace');
  if (existsSync(join(marketplacePath, 'package.json'))) return marketplacePath;
  return process.cwd();
}

const PLUGIN_ROOT = resolveRoot();
const BACKEND_URL = process.env.CLAUDE_CHAT_URL || 'http://localhost:4558';

function getLogPath() {
  return IS_WINDOWS
    ? join(homedir(), 'AppData', 'Local', 'Temp', 'claude-teams-gui.log')
    : '/tmp/claude-teams-gui.log';
}

async function isServerRunning() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const response = await fetch(`${BACKEND_URL}/api/teams`, { method: 'HEAD', signal: controller.signal });
    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}

function getBunPath() {
  if (IS_WINDOWS) return 'bun';
  const bunPaths = [join(homedir(), '.bun', 'bin', 'bun'), '/usr/local/bin/bun', '/opt/homebrew/bin/bun'];
  for (const bunPath of bunPaths) {
    if (existsSync(bunPath)) return bunPath;
  }
  return 'bun';
}

function startServer() {
  const serverPath = join(PLUGIN_ROOT, 'dist', 'server', 'server', 'cli.js');
  if (!existsSync(serverPath)) return false;

  const logFd = openSync(getLogPath(), 'a');
  const bunPath = getBunPath();

  const child = spawn(bunPath, [serverPath, '--headless'], {
    cwd: PLUGIN_ROOT,
    stdio: ['ignore', logFd, logFd],
    detached: true,
    windowsHide: true,
    env: { ...process.env, CLAUDE_PLUGIN_ROOT: PLUGIN_ROOT, NODE_ENV: 'production' }
  });

  child.unref();
  return true;
}

// Main
async function main() {
  try {
    // Check if already running
    if (await isServerRunning()) {
      const elapsed = Date.now() - startTime;
      console.log(JSON.stringify({
        continue: true,
        suppressOutput: false,
        systemMessage: `\n╔══════════════════════════════════════╗\n║   ✅ Claude Teams GUI Running (${elapsed}ms)  ║\n╚══════════════════════════════════════╝\n\n🌐 http://localhost:4558`
      }));
      process.exit(0);
    }

    // Check prerequisites
    const hasModules = existsSync(join(PLUGIN_ROOT, 'node_modules'));
    const hasDist = existsSync(join(PLUGIN_ROOT, 'dist', 'server', 'server', 'cli.js'));

    if (!hasModules) {
      console.log(JSON.stringify({
        continue: true,
        suppressOutput: false,
        systemMessage: `📦 正在安装依赖，请稍后重启 Claude...`
      }));
      process.exit(0);
    }

    // Start server
    if (hasDist && startServer()) {
      const elapsed = Date.now() - startTime;
      console.log(JSON.stringify({
        continue: true,
        suppressOutput: false,
        systemMessage: `╔══════════════════════════════════════╗\n║   🚀 Claude Teams GUI Started (${elapsed}ms) ║\n╚══════════════════════════════════════╝\n\n🌐 http://localhost:4558`
      }));
      process.exit(0);
    }

    console.log(JSON.stringify({
      continue: true,
      suppressOutput: false,
      systemMessage: `❌ 启动失败，请检查 bun 是否安装`
    }));
  } catch (err) {
    console.log(JSON.stringify({
      continue: true,
      suppressOutput: false,
      systemMessage: `❌ 错误: ${err.message}`
    }));
  }
  process.exit(0);
}

main();
