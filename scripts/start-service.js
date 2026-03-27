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
const logs = [];

function log(msg) {
  const elapsed = Date.now() - startTime;
  logs.push(`[${elapsed}ms] ${msg}`);
}

log(`脚本启动, Node: ${process.version}, 平台: ${process.platform}`);
log(`CLAUDE_PLUGIN_ROOT: ${process.env.CLAUDE_PLUGIN_ROOT || '未设置'}`);

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
  const stepStart = Date.now();
  log('>>> resolveRoot() 开始');

  if (process.env.CLAUDE_PLUGIN_ROOT) {
    const root = process.env.CLAUDE_PLUGIN_ROOT;
    log(`   CLAUDE_PLUGIN_ROOT: ${root}`);
    log(`<<< resolveRoot() 完成 (通过环境变量), 耗时: ${Date.now() - stepStart}ms`);
    return root;
  }

  try {
    const scriptDir = dirname(fileURLToPath(import.meta.url));
    const candidate = dirname(scriptDir);
    log(`   __dirname 方式: ${candidate}`);
    if (existsSync(join(candidate, 'package.json'))) {
      log(`<<< resolveRoot() 完成 (通过__dirname), 耗时: ${Date.now() - stepStart}ms`);
      return candidate;
    }
  } catch (e) {
    log(`   __dirname 方式失败: ${e.message}`);
  }

  // Scan cache for versioned plugin directory
  const cacheStart = Date.now();
  const home = homedir();
  const cacheBase = join(home, '.claude', 'plugins', 'cache', 'claude-teams-gui-marketplace', 'claude-teams-gui');
  log(`   扫描缓存目录: ${cacheBase}`);

  if (existsSync(cacheBase)) {
    try {
      const entries = readdirSync(cacheBase, { withFileTypes: true });
      log(`   发现 ${entries.length} 个条目`);
      let latestVersion = null;
      let latestPath = null;
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const versionPath = join(cacheBase, entry.name);
          if (existsSync(join(versionPath, 'package.json'))) {
            log(`   找到版本: ${entry.name}`);
            if (!latestVersion || compareVersions(entry.name, latestVersion) > 0) {
              latestVersion = entry.name;
              latestPath = versionPath;
            }
          }
        }
      }
      if (latestPath) {
        log(`   最新版本: ${latestVersion}, 路径: ${latestPath}`);
        log(`<<< resolveRoot() 完成 (缓存扫描), 耗时: ${Date.now() - stepStart}ms`);
        return latestPath;
      }
    } catch (e) {
      log(`   缓存扫描失败: ${e.message}`);
    }
  } else {
    log(`   缓存目录不存在`);
  }
  log(`   缓存扫描耗时: ${Date.now() - cacheStart}ms`);

  // Fallback to marketplaces directory
  const marketplacePath = join(home, '.claude', 'plugins', 'marketplaces', 'claude-teams-gui-marketplace');
  log(`   尝试 marketplaces: ${marketplacePath}`);
  if (existsSync(join(marketplacePath, 'package.json'))) {
    log(`<<< resolveRoot() 完成 (marketplaces), 耗时: ${Date.now() - stepStart}ms`);
    return marketplacePath;
  }

  log(`<<< resolveRoot() 完成 (cwd), 耗时: ${Date.now() - stepStart}ms`);
  return process.cwd();
}

const PLUGIN_ROOT = resolveRoot();
const BACKEND_URL = process.env.CLAUDE_CHAT_URL || 'http://localhost:4558';
log(`PLUGIN_ROOT: ${PLUGIN_ROOT}`);
log(`BACKEND_URL: ${BACKEND_URL}`);

// Get log file path
function getLogPath() {
  return IS_WINDOWS
    ? join(homedir(), 'AppData', 'Local', 'Temp', 'claude-teams-gui.log')
    : '/tmp/claude-teams-gui.log';
}

// Check if server is already running
async function isServerRunning() {
  const stepStart = Date.now();
  log('>>> isServerRunning() 开始');
  log(`   请求: ${BACKEND_URL}/api/teams`);

  try {
    const fetchStart = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      log(`   fetch 超时触发 (3000ms)`);
      controller.abort();
    }, 3000);

    const response = await fetch(`${BACKEND_URL}/api/teams`, {
      method: 'HEAD',
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    log(`   fetch 耗时: ${Date.now() - fetchStart}ms, status: ${response.status}`);
    log(`<<< isServerRunning() 完成 (运行中), 耗时: ${Date.now() - stepStart}ms`);
    return response.ok;
  } catch (e) {
    log(`   fetch 失败: ${e.message}`);
    log(`<<< isServerRunning() 完成 (未运行), 耗时: ${Date.now() - stepStart}ms`);
    return false;
  }
}

// Get bun path
function getBunPath() {
  const stepStart = Date.now();
  log('>>> getBunPath() 开始');

  if (IS_WINDOWS) {
    log(`<<< getBunPath() 完成 (Windows: bun), 耗时: ${Date.now() - stepStart}ms`);
    return 'bun';
  }

  const bunPaths = [
    join(homedir(), '.bun', 'bin', 'bun'),
    '/usr/local/bin/bun',
    '/opt/homebrew/bin/bun',
    'bun'
  ];

  for (const bunPath of bunPaths) {
    log(`   检查: ${bunPath}, 存在: ${bunPath === 'bun' ? 'N/A' : existsSync(bunPath)}`);
    if (bunPath === 'bun') {
      log(`<<< getBunPath() 完成 (bun), 耗时: ${Date.now() - stepStart}ms`);
      return bunPath;
    }
    if (existsSync(bunPath)) {
      log(`<<< getBunPath() 完成 (${bunPath}), 耗时: ${Date.now() - stepStart}ms`);
      return bunPath;
    }
  }

  log(`<<< getBunPath() 完成 (fallback: bun), 耗时: ${Date.now() - stepStart}ms`);
  return 'bun';
}

// Check if node_modules exists
function hasNodeModules() {
  const exists = existsSync(join(PLUGIN_ROOT, 'node_modules'));
  log(`hasNodeModules: ${exists}`);
  return exists;
}

// Check if dist exists
function hasDist() {
  const exists = existsSync(join(PLUGIN_ROOT, 'dist', 'server', 'server', 'cli.js'));
  log(`hasDist: ${exists}`);
  return exists;
}

// Start server using dist with bun
function startWithDist() {
  const stepStart = Date.now();
  log('>>> startWithDist() 开始');

  const serverPath = join(PLUGIN_ROOT, 'dist', 'server', 'server', 'cli.js');
  log(`   serverPath: ${serverPath}`);
  log(`   serverPath 存在: ${existsSync(serverPath)}`);

  if (!existsSync(serverPath)) {
    log(`<<< startWithDist() 失败 (文件不存在), 耗时: ${Date.now() - stepStart}ms`);
    return false;
  }

  const logPath = getLogPath();
  log(`   logPath: ${logPath}`);

  const bunPath = getBunPath();
  log(`   bunPath: ${bunPath}`);

  try {
    const logFd = openSync(logPath, 'a');
    log(`   日志文件已打开`);

    log(`   启动命令: ${bunPath} ${serverPath} --headless`);
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
    log(`   子进程已启动, PID: ${child.pid}`);
    log(`<<< startWithDist() 完成, 耗时: ${Date.now() - stepStart}ms`);
    return true;
  } catch (e) {
    log(`   启动失败: ${e.message}`);
    log(`<<< startWithDist() 失败, 耗时: ${Date.now() - stepStart}ms`);
    return false;
  }
}

// Start server using bun (dev mode)
function startWithBun() {
  const stepStart = Date.now();
  log('>>> startWithBun() 开始');

  const serverPath = join(PLUGIN_ROOT, 'src', 'server', 'cli.ts');
  log(`   serverPath: ${serverPath}`);
  log(`   serverPath 存在: ${existsSync(serverPath)}`);

  if (!existsSync(serverPath)) {
    log(`<<< startWithBun() 失败 (文件不存在), 耗时: ${Date.now() - stepStart}ms`);
    return false;
  }

  const bunPath = getBunPath();
  const logPath = getLogPath();
  log(`   bunPath: ${bunPath}, logPath: ${logPath}`);

  try {
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
    log(`   子进程已启动, PID: ${child.pid}`);
    log(`<<< startWithBun() 完成, 耗时: ${Date.now() - stepStart}ms`);
    return true;
  } catch (e) {
    log(`   启动失败: ${e.message}`);
    log(`<<< startWithBun() 失败, 耗时: ${Date.now() - stepStart}ms`);
    return false;
  }
}

// Install dependencies in background
function installInBackground() {
  const stepStart = Date.now();
  log('>>> installInBackground() 开始');

  const bunPath = getBunPath();
  log(`   bunPath: ${bunPath}`);

  try {
    const child = spawn(bunPath, ['install'], {
      cwd: PLUGIN_ROOT,
      stdio: ['ignore', 'ignore', 'ignore'],
      detached: true,
      windowsHide: true
    });

    child.unref();
    log(`   后台安装进程已启动, PID: ${child.pid}`);
    log(`<<< installInBackground() 完成, 耗时: ${Date.now() - stepStart}ms`);
    return true;
  } catch (e) {
    log(`   后台安装失败: ${e.message}`);
    log(`<<< installInBackground() 失败, 耗时: ${Date.now() - stepStart}ms`);
    return false;
  }
}

// Main
async function main() {
  log('========== start-service.js 开始 ==========');

  try {
    // Check if server is already running
    log('--- Step 1: 检查服务状态 ---');
    const running = await isServerRunning();
    log(`服务状态: ${running ? '✅ 运行中' : '⏹️ 未运行'}`);

    if (running) {
      const totalTime = Date.now() - startTime;
      log(`========== start-service.js 完成 (服务已运行), 总耗时: ${totalTime}ms ==========`);

      console.log(JSON.stringify({
        continue: true,
        suppressOutput: false,
        systemMessage: logs.join('\n') + '\n\n✅ 服务已运行\n\n🌐 http://localhost:4558'
      }));
      process.exit(0);
    }

    // Check prerequisites
    log('--- Step 2: 检查前置条件 ---');
    const hasModules = hasNodeModules();
    const hasDistFiles = hasDist();
    log(`node_modules: ${hasModules ? '✅' : '❌'}`);
    log(`dist: ${hasDistFiles ? '✅' : '❌'}`);

    // If node_modules missing, trigger install in background
    if (!hasModules) {
      log('--- Step 3: 后台安装依赖 ---');
      installInBackground();

      const totalTime = Date.now() - startTime;
      log(`========== start-service.js 完成 (后台安装), 总耗时: ${totalTime}ms ==========`);

      console.log(JSON.stringify({
        continue: true,
        suppressOutput: false,
        systemMessage: logs.join('\n') + '\n\n📦 后台安装中...'
      }));
      process.exit(0);
    }

    // Start server
    log('--- Step 3: 启动服务 ---');
    if (hasDistFiles) {
      log('使用 dist 模式启动');
      if (startWithDist()) {
        const totalTime = Date.now() - startTime;
        log(`========== start-service.js 完成 (dist模式), 总耗时: ${totalTime}ms ==========`);

        console.log(JSON.stringify({
          continue: true,
          suppressOutput: false,
          systemMessage: logs.join('\n') + '\n\n✅ 服务已启动 (dist)\n\n🌐 http://localhost:4558'
        }));
        process.exit(0);
      }
    }

    // Fallback to dev mode
    log('使用 dev 模式启动');
    if (startWithBun()) {
      const totalTime = Date.now() - startTime;
      log(`========== start-service.js 完成 (dev模式), 总耗时: ${totalTime}ms ==========`);

      console.log(JSON.stringify({
        continue: true,
        suppressOutput: false,
        systemMessage: logs.join('\n') + '\n\n✅ 服务已启动 (dev)\n\n🌐 http://localhost:4558'
      }));
      process.exit(0);
    }

    const totalTime = Date.now() - startTime;
    log(`========== start-service.js 失败, 总耗时: ${totalTime}ms ==========`);

    console.log(JSON.stringify({
      continue: true,
      suppressOutput: false,
      systemMessage: logs.join('\n') + '\n\n❌ 启动失败'
    }));

  } catch (err) {
    log(`❌ 异常: ${err.message}`);
    console.log(JSON.stringify({
      continue: true,
      suppressOutput: false,
      systemMessage: logs.join('\n') + `\n\n❌ 异常: ${err.message}`
    }));
  }

  process.exit(0);
}

main();
