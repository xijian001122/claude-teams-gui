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

const { spawn, spawnSync } = require('child_process');
const { existsSync, readdirSync } = require('fs');
const { join, dirname } = require('path');
const { homedir } = require('os');

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

// Resolve plugin root directory with fallback
function resolvePluginRoot() {
  if (process.env.CLAUDE_PLUGIN_ROOT) {
    const root = process.env.CLAUDE_PLUGIN_ROOT;
    if (existsSync(join(root, 'package.json'))) return root;
  }

  // Try to derive from script location
  try {
    const scriptDir = __dirname;
    const candidate = dirname(scriptDir);
    if (existsSync(join(candidate, 'package.json'))) return candidate;
  } catch {
    // __dirname not available
  }

  const home = homedir();

  // Scan cache for versioned plugin directory (find latest version)
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

function hasNodeModules() {
  return existsSync(join(PLUGIN_ROOT, 'node_modules'));
}

function hasDist() {
  return existsSync(join(PLUGIN_ROOT, 'dist', 'server', 'server', 'cli.js'));
}

// Start server using dist with node
function startWithNode() {
  const serverPath = join(PLUGIN_ROOT, 'dist', 'server', 'server', 'cli.js');
  if (!existsSync(serverPath)) {
    return false;
  }

  if (IS_WINDOWS) {
    // Windows: use powershell to properly background and redirect
    const logFile = join(homedir(), 'AppData', 'Local', 'Temp', 'claude-teams-gui.log');
    const psCmd = `Start-Process node -ArgumentList '${serverPath}','--headless' -WindowStyle Hidden -RedirectStandardOutput '${logFile}' -RedirectStandardError '${logFile}' -WorkingDirectory '${PLUGIN_ROOT}'`;
    spawn('powershell', ['-WindowStyle', 'Hidden', '-Command', psCmd], {
      stdio: 'ignore',
      detached: true,
      env: {
        ...process.env,
        CLAUDE_PLUGIN_ROOT: PLUGIN_ROOT,
        NODE_ENV: 'production'
      },
      windowsHide: true
    });
  } else {
    // Unix: use bash with &
    const cmd = `cd "${PLUGIN_ROOT}" && CLAUDE_PLUGIN_ROOT="${PLUGIN_ROOT}" NODE_ENV=production node "${serverPath}" --headless >> /tmp/claude-teams-gui.log 2>&1 &`;
    spawn('bash', ['-c', cmd], {
      stdio: 'ignore',
      detached: true,
      windowsHide: true
    });
  }

  return true;
}

// Start server using bun (src mode)
function startWithBun(bunPath) {
  const serverPath = join(PLUGIN_ROOT, 'src', 'server', 'cli.ts');

  if (IS_WINDOWS) {
    // Windows: use powershell
    const logFile = join(homedir(), 'AppData', 'Local', 'Temp', 'claude-teams-gui.log');
    const psCmd = `Start-Process '${bunPath}' -ArgumentList '${serverPath}','--headless' -WindowStyle Hidden -RedirectStandardOutput '${logFile}' -RedirectStandardError '${logFile}' -WorkingDirectory '${PLUGIN_ROOT}'`;
    spawn('powershell', ['-WindowStyle', 'Hidden', '-Command', psCmd], {
      stdio: 'ignore',
      detached: true,
      env: {
        ...process.env,
        CLAUDE_PLUGIN_ROOT: PLUGIN_ROOT,
        NODE_ENV: 'development'
      },
      windowsHide: true
    });
  } else {
    // Unix
    const cmd = `cd "${PLUGIN_ROOT}" && CLAUDE_PLUGIN_ROOT="${PLUGIN_ROOT}" NODE_ENV=development "${bunPath}" "${serverPath}" --headless >> /tmp/claude-teams-gui.log 2>&1 &`;
    spawn('bash', ['-c', cmd], {
      stdio: 'ignore',
      detached: true,
      windowsHide: true
    });
  }

  return true;
}

// Install dependencies in background
function installInBackground(bunPath) {
  const cmd = IS_WINDOWS
    ? `start /B "${bunPath}" install >> %TEMP%\\claude-teams-gui-install.log 2>&1`
    : `cd "${PLUGIN_ROOT}" && "${bunPath}" install >> /tmp/claude-teams-gui-install.log 2>&1 &`;

  spawn(IS_WINDOWS ? 'cmd' : 'bash', IS_WINDOWS ? ['/C', cmd] : ['-c', cmd], {
    stdio: 'ignore',
    detached: !IS_WINDOWS,
    windowsHide: true
  });
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

🌐 查看界面: http://localhost:4558

💡 可以开始使用了!`
      }));
      process.exit(0);
    }

    const bunPath = getBunPath();

    // If node_modules exists and dist exists, use node+dist
    if (hasNodeModules() && hasDist()) {
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
    }

    // If node_modules missing, trigger install in background
    if (!hasNodeModules()) {
      if (bunPath) {
        installInBackground(bunPath);
        console.log(JSON.stringify({
          continue: true,
          suppressOutput: false,
          systemMessage: `📦 正在安装依赖...

💡 首次安装需要几分钟，请稍后重新启动 Claude`
        }));
        process.exit(0);
      } else {
        console.log(JSON.stringify({
          continue: true,
          suppressOutput: false,
          systemMessage: `❌ Bun 未安装

💡 请安装 Bun: https://bun.sh`
        }));
        process.exit(0);
      }
    }

    // Fallback: use bun + src (dev mode)
    if (bunPath && startWithBun(bunPath)) {
      // Wait briefly and check if it started
      if (await waitForServer(BACKEND_URL, 15000)) {
        console.log(JSON.stringify({
          continue: true,
          suppressOutput: false,
          systemMessage: `🚀 Claude Teams GUI 服务启动成功!

🌐 查看界面: http://localhost:4558

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
    }

    console.log(JSON.stringify({
      continue: true,
      suppressOutput: false,
      systemMessage: `❌ Claude Teams GUI 启动失败

💡 请检查 Bun 是否已安装: bun --version`
    }));

  } catch (err) {
    console.log(JSON.stringify({
      continue: true,
      suppressOutput: false,
      systemMessage: `❌ Claude Teams GUI 启动错误: ${err.message}

💡 插件目录: ${PLUGIN_ROOT}`
    }));
  }

  process.exit(0);
}

main();
