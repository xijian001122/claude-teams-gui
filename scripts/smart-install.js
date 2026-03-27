#!/usr/bin/env node
/**
 * Smart Install Script for Claude Teams GUI
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { execSync, spawnSync } from 'child_process';
import { join, dirname } from 'path';
import { homedir } from 'os';
import { fileURLToPath } from 'url';

const IS_WINDOWS = process.platform === 'win32';
const startTime = Date.now();

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
  } catch {}
  return process.cwd();
}

const ROOT = resolveRoot();
const MARKER = join(ROOT, '.install-version');

// Check if Bun is installed
function isBunInstalled() {
  const bunPaths = IS_WINDOWS
    ? [join(homedir(), '.bun', 'bin', 'bun.exe')]
    : [join(homedir(), '.bun', 'bin', 'bun'), '/usr/local/bin/bun', '/opt/homebrew/bin/bun'];
  for (const bunPath of bunPaths) {
    if (existsSync(bunPath)) return true;
  }
  try {
    const result = spawnSync('bun', ['--version'], {
      encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'],
      shell: IS_WINDOWS, timeout: 3000
    });
    return result.status === 0;
  } catch {}
  return false;
}

// Check if dependencies need to be installed
function needsInstall() {
  if (!existsSync(join(ROOT, 'node_modules'))) return true;
  if (!existsSync(join(ROOT, 'dist', 'server', 'server', 'cli.js'))) return true;
  try {
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'));
    const marker = JSON.parse(readFileSync(MARKER, 'utf-8'));
    return pkg.version !== marker.version;
  } catch {
    return true;
  }
}

// Install dependencies
function installDeps() {
  const bunCmd = IS_WINDOWS ? 'bun' : (existsSync(join(homedir(), '.bun', 'bin', 'bun')) ? join(homedir(), '.bun', 'bin', 'bun') : 'bun');
  try {
    execSync(`${bunCmd} install`, { cwd: ROOT, stdio: 'inherit', shell: IS_WINDOWS });
  } catch {
    execSync('npm install', { cwd: ROOT, stdio: 'inherit', shell: IS_WINDOWS });
  }

  try {
    execSync(`${bunCmd} run build:client`, { cwd: ROOT, stdio: 'inherit', shell: IS_WINDOWS, timeout: 180000 });
    execSync(`${bunCmd} run build:server`, { cwd: ROOT, stdio: 'inherit', shell: IS_WINDOWS, timeout: 60000 });
  } catch {
    try { execSync('npm run build', { cwd: ROOT, stdio: 'inherit', shell: IS_WINDOWS, timeout: 240000 }); } catch {}
  }

  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'));
  writeFileSync(MARKER, JSON.stringify({ version: pkg.version, installedAt: new Date().toISOString() }));
  return true;
}

// Main
try {
  if (!isBunInstalled()) {
    console.log(JSON.stringify({ continue: true, suppressOutput: false, systemMessage: `❌ Bun 未安装\n\n💡 请先安装 Bun: https://bun.sh` }));
    process.exit(1);
  }

  if (needsInstall()) {
    installDeps();
  }

  const elapsed = Date.now() - startTime;
  console.log(JSON.stringify({
    continue: true,
    suppressOutput: false,
    systemMessage: `\n╔══════════════════════════════════════╗\n║   📦 Claude Teams GUI Ready (${elapsed}ms)   ║\n╚══════════════════════════════════════╝`
  }));
} catch (e) {
  console.log(JSON.stringify({ continue: true, suppressOutput: false, systemMessage: `❌ 安装失败: ${e.message}` }));
  process.exit(1);
}
