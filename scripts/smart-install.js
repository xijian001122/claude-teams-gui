#!/usr/bin/env node
/**
 * Smart Install Script for Claude Teams GUI
 *
 * Ensures Bun runtime is installed (auto-installs if missing)
 * and handles dependency installation when needed.
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { execSync, spawnSync } from 'child_process';
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

// Resolve plugin root directory
function resolveRoot() {
  const stepStart = Date.now();
  log('>>> resolveRoot() 开始');

  if (process.env.CLAUDE_PLUGIN_ROOT) {
    const root = process.env.CLAUDE_PLUGIN_ROOT;
    if (existsSync(join(root, 'package.json'))) {
      log(`   通过 CLAUDE_PLUGIN_ROOT 找到: ${root}`);
      log(`<<< resolveRoot() 完成, 耗时: ${Date.now() - stepStart}ms`);
      return root;
    }
  }

  try {
    const scriptDir = dirname(fileURLToPath(import.meta.url));
    const candidate = dirname(scriptDir);
    if (existsSync(join(candidate, 'package.json'))) {
      log(`   通过 __dirname 找到: ${candidate}`);
      log(`<<< resolveRoot() 完成, 耗时: ${Date.now() - stepStart}ms`);
      return candidate;
    }
  } catch (e) {
    log(`   __dirname 方式失败: ${e.message}`);
  }

  log(`   使用 cwd: ${process.cwd()}`);
  log(`<<< resolveRoot() 完成, 耗时: ${Date.now() - stepStart}ms`);
  return process.cwd();
}

const ROOT = resolveRoot();
const MARKER = join(ROOT, '.install-version');
log(`ROOT: ${ROOT}`);
log(`MARKER: ${MARKER}`);

// Check if Bun is installed (fast check - file existence first, spawn as fallback)
function isBunInstalled() {
  const stepStart = Date.now();
  log('>>> isBunInstalled() 开始');

  // Fast path: check common install locations first
  const bunPaths = IS_WINDOWS
    ? [join(homedir(), '.bun', 'bin', 'bun.exe')]
    : [join(homedir(), '.bun', 'bin', 'bun'), '/usr/local/bin/bun', '/opt/homebrew/bin/bun'];

  for (const bunPath of bunPaths) {
    log(`   检查路径: ${bunPath}, 存在: ${existsSync(bunPath)}`);
    if (existsSync(bunPath)) {
      log(`<<< isBunInstalled() 完成 (文件存在), 耗时: ${Date.now() - stepStart}ms`);
      return true;
    }
  }

  // Fallback: try running bun --version (slower)
  log('   尝试 spawn bun --version...');
  try {
    const spawnStart = Date.now();
    const result = spawnSync('bun', ['--version'], {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: IS_WINDOWS,
      timeout: 3000
    });
    log(`   spawn 耗时: ${Date.now() - spawnStart}ms, status: ${result.status}`);
    if (result.status === 0) {
      log(`<<< isBunInstalled() 完成 (spawn成功), 耗时: ${Date.now() - stepStart}ms`);
      return true;
    }
  } catch (e) {
    log(`   spawn 失败: ${e.message}`);
  }

  log(`<<< isBunInstalled() 完成 (未找到), 耗时: ${Date.now() - stepStart}ms`);
  return false;
}

// Install Bun automatically based on platform
function installBun() {
  const stepStart = Date.now();
  log('>>> installBun() 开始');

  try {
    if (IS_WINDOWS) {
      log('   Windows: 使用 PowerShell 安装...');
      execSync('powershell -c "irm bun.sh/install.ps1 | iex"', {
        stdio: ['pipe', 'pipe', 'inherit'],
        shell: true
      });
    } else {
      log('   Unix: 使用 curl 安装...');
      execSync('curl -fsSL https://bun.sh/install | bash', {
        stdio: ['pipe', 'pipe', 'inherit'],
        shell: true
      });
    }

    if (isBunInstalled()) {
      log(`<<< installBun() 完成, 耗时: ${Date.now() - stepStart}ms`);
      return true;
    }
  } catch (error) {
    log(`   安装失败: ${error.message}`);
  }

  log(`<<< installBun() 失败, 耗时: ${Date.now() - stepStart}ms`);
  return false;
}

// Check if dependencies need to be installed
function needsInstall() {
  const stepStart = Date.now();
  log('>>> needsInstall() 开始');

  const nodeModulesExists = existsSync(join(ROOT, 'node_modules'));
  log(`   node_modules 存在: ${nodeModulesExists}`);
  if (!nodeModulesExists) {
    log(`<<< needsInstall() 返回 true (无node_modules), 耗时: ${Date.now() - stepStart}ms`);
    return true;
  }

  const distExists = existsSync(join(ROOT, 'dist', 'server', 'server', 'cli.js'));
  log(`   dist/server/server/cli.js 存在: ${distExists}`);
  if (!distExists) {
    log(`<<< needsInstall() 返回 true (无dist), 耗时: ${Date.now() - stepStart}ms`);
    return true;
  }

  try {
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'));
    log(`   package.json version: ${pkg.version}`);

    if (existsSync(MARKER)) {
      const marker = JSON.parse(readFileSync(MARKER, 'utf-8'));
      log(`   marker version: ${marker.version}`);
      const needsUpdate = pkg.version !== marker.version;
      log(`<<< needsInstall() 返回 ${needsUpdate} (版本${needsUpdate ? '不' : ''}匹配), 耗时: ${Date.now() - stepStart}ms`);
      return needsUpdate;
    } else {
      log(`   marker 文件不存在`);
      log(`<<< needsInstall() 返回 true (无marker), 耗时: ${Date.now() - stepStart}ms`);
      return true;
    }
  } catch (e) {
    log(`   读取版本失败: ${e.message}`);
    log(`<<< needsInstall() 返回 true (异常), 耗时: ${Date.now() - stepStart}ms`);
    return true;
  }
}

// Install dependencies using Bun
function installDeps() {
  const stepStart = Date.now();
  log('>>> installDeps() 开始');

  const bunCmd = IS_WINDOWS ? 'bun' : (existsSync(join(homedir(), '.bun', 'bin', 'bun')) ? join(homedir(), '.bun', 'bin', 'bun') : 'bun');
  log(`   bunCmd: ${bunCmd}`);

  try {
    log('   执行 bun install...');
    const installStart = Date.now();
    execSync(`${bunCmd} install`, { cwd: ROOT, stdio: ['pipe', 'pipe', 'inherit'], shell: IS_WINDOWS });
    log(`   bun install 耗时: ${Date.now() - installStart}ms`);
  } catch (e) {
    log(`   bun install 失败: ${e.message}`);
    try {
      log('   尝试 npm install...');
      const npmStart = Date.now();
      execSync('npm install', { cwd: ROOT, stdio: ['pipe', 'pipe', 'inherit'], shell: IS_WINDOWS });
      log(`   npm install 耗时: ${Date.now() - npmStart}ms`);
    } catch (npmError) {
      log(`   npm install 也失败: ${npmError.message}`);
      log(`<<< installDeps() 失败, 耗时: ${Date.now() - stepStart}ms`);
      return false;
    }
  }

  // Build dist/
  log('   开始构建 dist...');
  try {
    const buildClientStart = Date.now();
    execSync(`${bunCmd} run build:client`, { cwd: ROOT, stdio: ['pipe', 'pipe', 'inherit'], shell: IS_WINDOWS, timeout: 180000 });
    log(`   build:client 耗时: ${Date.now() - buildClientStart}ms`);

    const buildServerStart = Date.now();
    execSync(`${bunCmd} run build:server`, { cwd: ROOT, stdio: ['pipe', 'pipe', 'inherit'], shell: IS_WINDOWS, timeout: 60000 });
    log(`   build:server 耗时: ${Date.now() - buildServerStart}ms`);
  } catch (buildError) {
    log(`   构建失败: ${buildError.message}`);
  }

  // Write version marker
  try {
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'));
    writeFileSync(MARKER, JSON.stringify({
      version: pkg.version,
      installedAt: new Date().toISOString()
    }));
    log(`   写入 marker: ${pkg.version}`);
  } catch (e) {
    log(`   写入 marker 失败: ${e.message}`);
  }

  log(`<<< installDeps() 完成, 耗时: ${Date.now() - stepStart}ms`);
  return true;
}

// Main execution
async function main() {
  log('========== smart-install.js 开始 ==========');

  try {
    // Step 1: Ensure Bun is installed
    log('--- Step 1: 检查 Bun ---');
    const bunCheckStart = Date.now();
    const hasBun = isBunInstalled();
    log(`Bun 检查总耗时: ${Date.now() - bunCheckStart}ms`);

    if (!hasBun) {
      log('Bun 未安装，开始安装...');
      if (!installBun()) {
        log('❌ Bun 安装失败');
        console.log(JSON.stringify({
          continue: true,
          suppressOutput: false,
          systemMessage: logs.join('\n') + '\n\n❌ Bun 安装失败'
        }));
        process.exit(1);
      }
    }

    // Step 2: Install dependencies if needed
    log('--- Step 2: 检查依赖 ---');
    const needsCheckStart = Date.now();
    const needs = needsInstall();
    log(`依赖检查总耗时: ${Date.now() - needsCheckStart}ms`);

    if (needs) {
      log('需要安装/更新依赖，开始安装...');
      if (!installDeps()) {
        log('❌ 依赖安装失败');
        console.log(JSON.stringify({
          continue: true,
          suppressOutput: false,
          systemMessage: logs.join('\n') + '\n\n❌ 依赖安装失败'
        }));
        process.exit(1);
      }
    } else {
      log('依赖已是最新，跳过安装');
    }

    const totalTime = Date.now() - startTime;
    log(`========== smart-install.js 完成, 总耗时: ${totalTime}ms ==========`);

    console.log(JSON.stringify({
      continue: true,
      suppressOutput: false,
      systemMessage: logs.join('\n')
    }));

  } catch (e) {
    log(`❌ 异常: ${e.message}`);
    console.log(JSON.stringify({
      continue: true,
      suppressOutput: false,
      systemMessage: logs.join('\n') + `\n\n❌ 异常: ${e.message}`
    }));
    process.exit(1);
  }
}

main();
