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

// Check if Bun is installed
function isBunInstalled() {
  try {
    const result = spawnSync('bun', ['--version'], {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: IS_WINDOWS
    });
    if (result.status === 0) return true;
  } catch {
    // PATH check failed
  }

  const bunPaths = IS_WINDOWS
    ? [join(homedir(), '.bun', 'bin', 'bun.exe')]
    : [join(homedir(), '.bun', 'bin', 'bun'), '/usr/local/bin/bun', '/opt/homebrew/bin/bun'];

  for (const bunPath of bunPaths) {
    if (existsSync(bunPath)) return true;
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
  const bunPath = IS_WINDOWS
    ? join(homedir(), '.bun', 'bin', 'bun.exe')
    : join(homedir(), '.bun', 'bin', 'bun');

  const bunCmd = existsSync(bunPath) ? bunPath : 'bun';

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

  // Write version marker
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'));
  writeFileSync(MARKER, JSON.stringify({
    version: pkg.version,
    installedAt: new Date().toISOString()
  }));

  return true;
}

// Main execution
try {
  // Step 1: Ensure Bun is installed
  if (!isBunInstalled()) {
    if (!installBun()) {
      console.error('Bun is required but not available');
      process.exit(1);
    }
  }

  // Step 2: Install dependencies if needed
  if (needsInstall()) {
    if (!installDeps()) {
      console.error('Failed to install dependencies');
      process.exit(1);
    }
    console.error('Dependencies installed');
  }

  // Output valid JSON for Claude Code hook contract
  console.log(JSON.stringify({ continue: true, suppressOutput: true }));
} catch (e) {
  console.error('Installation failed:', e.message);
  console.log(JSON.stringify({ continue: true, suppressOutput: true }));
  process.exit(1);
}
