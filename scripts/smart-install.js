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

// Resolve plugin root directory
function resolveRoot() {
  if (process.env.CLAUDE_PLUGIN_ROOT) {
    const root = process.env.CLAUDE_PLUGIN_ROOT;
    if (existsSync(join(root, 'package.json'))) return root;
  }

  try {
    const scriptDir = dirname(fileURLToPath(import.meta.url));
    const candidate = dirname(scriptDir);
    if (existsSync(join(candidate, 'package.json'))) return candidate;
  } catch {
    // import.meta.url not available
  }

  return process.cwd();
}

const ROOT = resolveRoot();
const MARKER = join(ROOT, '.install-version');

// Check if Bun is installed (fast check - file existence first, spawn as fallback)
function isBunInstalled() {
  // Fast path: check common install locations first
  const bunPaths = IS_WINDOWS
    ? [join(homedir(), '.bun', 'bin', 'bun.exe')]
    : [join(homedir(), '.bun', 'bin', 'bun'), '/usr/local/bin/bun', '/opt/homebrew/bin/bun'];

  for (const bunPath of bunPaths) {
    if (existsSync(bunPath)) return true;
  }

  // Fallback: try running bun --version (slower)
  try {
    const result = spawnSync('bun', ['--version'], {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: IS_WINDOWS,
      timeout: 3000  // 3 second timeout
    });
    if (result.status === 0) return true;
  } catch {
    // PATH check failed
  }

  return false;
}

// Install Bun automatically based on platform
function installBun() {
  console.error('Bun not found. Installing Bun runtime...');

  try {
    if (IS_WINDOWS) {
      console.error('   Installing via PowerShell...');
      execSync('powershell -c "irm bun.sh/install.ps1 | iex"', {
        stdio: ['pipe', 'pipe', 'inherit'],
        shell: true
      });
    } else {
      console.error('   Installing via curl...');
      execSync('curl -fsSL https://bun.sh/install | bash', {
        stdio: ['pipe', 'pipe', 'inherit'],
        shell: true
      });
    }

    if (isBunInstalled()) {
      console.error('Bun installed successfully');
      return true;
    } else {
      console.error('Bun installation completed but binary not found');
      console.error('Please restart your terminal and try again.');
      return false;
    }
  } catch (error) {
    console.error('Failed to install Bun automatically');
    console.error('Please install manually:');
    console.error('   - curl -fsSL https://bun.sh/install | bash');
    return false;
  }
}

// Check if dependencies need to be installed
function needsInstall() {
  if (!existsSync(join(ROOT, 'node_modules'))) return true;
  // Check if dist/ needs to be built (correct path: dist/server/server/cli.js)
  if (!existsSync(join(ROOT, 'dist', 'server', 'server', 'cli.js'))) return true;
  try {
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'));
    const marker = JSON.parse(readFileSync(MARKER, 'utf-8'));
    return pkg.version !== marker.version;
  } catch {
    return true;
  }
}

// Install dependencies using Bun
function installDeps() {
  // On Windows, always use 'bun' from PATH to avoid backslash issues in shell
  const bunCmd = IS_WINDOWS ? 'bun' : (existsSync(join(homedir(), '.bun', 'bin', 'bun')) ? join(homedir(), '.bun', 'bin', 'bun') : 'bun');

  console.error('Installing dependencies with Bun...');

  try {
    execSync(`${bunCmd} install`, { cwd: ROOT, stdio: ['pipe', 'pipe', 'inherit'], shell: IS_WINDOWS });
  } catch {
    try {
      execSync('npm install', { cwd: ROOT, stdio: ['pipe', 'pipe', 'inherit'], shell: IS_WINDOWS });
    } catch (npmError) {
      console.error('Failed to install dependencies');
      return false;
    }
  }

  // Build dist/ for production use
  console.error('Building dist/...');
  try {
    execSync(`${bunCmd} run build:client`, { cwd: ROOT, stdio: ['pipe', 'pipe', 'inherit'], shell: IS_WINDOWS, timeout: 180000 });
    execSync(`${bunCmd} run build:server`, { cwd: ROOT, stdio: ['pipe', 'pipe', 'inherit'], shell: IS_WINDOWS, timeout: 60000 });
  } catch (buildError) {
    console.error('Build failed, trying npm...');
    try {
      execSync('npm run build', { cwd: ROOT, stdio: ['pipe', 'pipe', 'inherit'], shell: IS_WINDOWS, timeout: 240000 });
    } catch {
      console.error('Build failed');
      // Continue anyway - start-service will fall back to dev mode
    }
  }

  // Write version marker
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'));
  writeFileSync(MARKER, JSON.stringify({
    version: pkg.version,
    installedAt: new Date().toISOString()
  }));

  return true;
}

// Main execution
async function main() {
  const messages = [];

  messages.push(`📁 插件目录: ${ROOT}`);
  messages.push(`🔍 Bun 检查: ${isBunInstalled() ? '✅ 已安装' : '❌ 未安装'}`);
  messages.push(`📦 node_modules: ${existsSync(join(ROOT, 'node_modules')) ? '✅ 存在' : '❌ 不存在'}`);
  messages.push(`🏗️ dist: ${existsSync(join(ROOT, 'dist', 'server', 'server', 'cli.js')) ? '✅ 存在' : '❌ 不存在'}`);
  messages.push(`🔧 needsInstall: ${needsInstall() ? '需要' : '跳过'}`);

  // Step 1: Ensure Bun is installed
  if (!isBunInstalled()) {
    messages.push('⏳ 正在安装 Bun...');
    if (!installBun()) {
      console.log(JSON.stringify({
        continue: true,
        suppressOutput: false,
        systemMessage: messages.join('\n') + '\n\n❌ Bun 安装失败'
      }));
      process.exit(1);
    }
  }

  // Step 2: Install dependencies if needed
  if (needsInstall()) {
    messages.push('⏳ 正在安装依赖...');
    if (!installDeps()) {
      console.log(JSON.stringify({
        continue: true,
        suppressOutput: false,
        systemMessage: messages.join('\n') + '\n\n❌ 依赖安装失败'
      }));
      process.exit(1);
    }
    messages.push('✅ 依赖安装完成');
  }

  // Output valid JSON for Claude Code hook contract
  console.log(JSON.stringify({
    continue: true,
    suppressOutput: false,
    systemMessage: messages.join('\n')
  }));
}

main().catch(e => {
  console.log(JSON.stringify({
    continue: true,
    suppressOutput: false,
    systemMessage: `❌ 安装失败: ${e.message}`
  }));
  process.exit(1);
});
