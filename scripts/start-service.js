#!/usr/bin/env node
/**
 * Start Service Script for Claude Teams GUI
 *
 * This script starts the backend server which also serves the frontend static files.
 * It's designed to work both in development mode and as an installed plugin.
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
    return dirname(scriptDir);
  } catch {
    return process.cwd();
  }
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
  // Try PATH first
  const bunPaths = IS_WINDOWS
    ? [join(homedir(), '.bun', 'bin', 'bun.exe')]
    : [join(homedir(), '.bun', 'bin', 'bun'), '/usr/local/bin/bun', '/opt/homebrew/bin/bun'];

  for (const bunPath of bunPaths) {
    if (existsSync(bunPath)) return bunPath;
  }
  return 'bun'; // Fallback to PATH
}

// Start the server
function startServer() {
  const serverDistPath = join(PLUGIN_ROOT, 'dist', 'server', 'index.js');
  const serverDevPath = join(PLUGIN_ROOT, 'src', 'server', 'cli.ts');
  const serverPath = existsSync(serverDistPath) ? serverDistPath : serverDevPath;

  // Determine runtime (node for dist, bun for src)
  const useBun = !existsSync(serverDistPath);
  const runtime = useBun ? getBunPath() : 'node';
  const args = useBun ? [serverPath, '--headless'] : [serverPath, '--headless'];

  if (!existsSync(serverPath)) {
    console.error(`Server not found at ${serverPath}`);
    return false;
  }

  // Use bash -c with & to properly detach
  const cmd = `cd "${PLUGIN_ROOT}" && ${runtime} ${args.join(' ')} >> /tmp/claude-teams-gui.log 2>&1`;
  spawn('bash', ['-c', `${cmd} &`], {
    stdio: 'ignore',
    env: {
      ...process.env,
      CLAUDE_PLUGIN_ROOT: PLUGIN_ROOT,
      NODE_ENV: 'production'
    }
  });

  return true;
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

    // Start server
    if (startServer()) {
      // Wait for server to be ready
      let attempts = 0;
      const maxAttempts = 30;
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        if (await isServerRunning()) {
          console.log(JSON.stringify({
            continue: true,
            suppressOutput: false,
            systemMessage: `🚀 Claude Teams GUI 服务启动成功

🌐 查看界面: http://localhost:4558

💡 可以开始使用了!`
          }));
          process.exit(0);
        }
        attempts++;
      }

      console.log(JSON.stringify({
        continue: true,
        suppressOutput: false,
        systemMessage: `⚠️ Claude Teams GUI 服务启动超时

💡 请手动运行: cd ${PLUGIN_ROOT} && bun run src/server/cli.ts`
      }));
    } else {
      console.log(JSON.stringify({
        continue: true,
        suppressOutput: false,
        systemMessage: `❌ Claude Teams GUI 启动失败

💡 请检查 Bun 是否已安装: bun --version`
      }));
    }
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
