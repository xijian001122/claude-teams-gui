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

  return bunPaths.some(existsSync);
}

// Get Bun path
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

// Install Bun automatically
function installBun() {
  console.error('🔧 Bun not found. Installing Bun runtime...');

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
      const version = spawnSync(getBunPath() || 'bun', ['--version'], { encoding: 'utf-8' });
      console.error(`✅ Bun ${version.stdout.trim()} installed successfully`);
      return true;
    } else {
      const bunPath = join(homedir(), '.bun', 'bin', 'bun');
      if (existsSync(bunPath)) {
        console.error(`✅ Bun installed at ${bunPath}`);
        console.error('⚠️  Please restart your terminal or add Bun to PATH:');
        console.error('   export PATH="$HOME/.bun/bin:$PATH"');
        return true;
      }
      throw new Error('Bun installation completed but binary not found');
    }
  } catch (error) {
    console.error('❌ Failed to install Bun automatically');
    console.error('   Please install manually:');
    if (IS_WINDOWS) {
      console.error('   - winget install Oven-sh.Bun');
      console.error('   - Or: powershell -c "irm bun.sh/install.ps1 | iex"');
    } else {
      console.error('   - curl -fsSL https://bun.sh/install | bash');
      console.error('   - Or: brew install oven-sh/bun/bun');
    }
    throw error;
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

// Install dependencies
function installDeps() {
  const bunPath = getBunPath();
  if (!bunPath) {
    throw new Error('Bun executable not found');
  }

  console.error('📦 Installing dependencies with Bun...');

  const bunCmd = IS_WINDOWS && bunPath.includes(' ') ? `"${bunPath}"` : bunPath;

  try {
    execSync(`${bunCmd} install`, { cwd: ROOT, stdio: ['pipe', 'pipe', 'inherit'], shell: IS_WINDOWS });
  } catch {
    try {
      execSync(`${bunCmd} install --force`, { cwd: ROOT, stdio: ['pipe', 'pipe', 'inherit'], shell: IS_WINDOWS });
    } catch {
      // Fallback to npm
      console.error('⚠️  Bun install failed, falling back to npm...');
      execSync('npm install', { cwd: ROOT, stdio: ['pipe', 'pipe', 'inherit'], shell: IS_WINDOWS });
    }
  }

  // Write version marker
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'));
  writeFileSync(MARKER, JSON.stringify({
    version: pkg.version,
    bun: spawnSync(bunPath, ['--version'], { encoding: 'utf-8' }).stdout.trim(),
    installedAt: new Date().toISOString()
  }));
}

// Build frontend if needed
function buildFrontend() {
  const clientDist = join(ROOT, 'dist', 'client');
  if (!existsSync(join(clientDist, 'index.html'))) {
    console.error('🔨 Building frontend...');
    const bunPath = getBunPath() || 'bun';
    const bunCmd = IS_WINDOWS && bunPath.includes(' ') ? `"${bunPath}"` : bunPath;
    try {
      execSync(`${bunCmd} run build:client`, { cwd: ROOT, stdio: ['pipe', 'pipe', 'inherit'], shell: IS_WINDOWS });
      console.error('✅ Frontend built successfully');
    } catch (err) {
      console.error('⚠️  Failed to build frontend, trying npm...');
      execSync('npm run build:client', { cwd: ROOT, stdio: ['pipe', 'pipe', 'inherit'], shell: IS_WINDOWS });
    }
  }
}

// Main execution
try {
  // Step 1: Ensure Bun is installed
  if (!isBunInstalled()) {
    installBun();
    if (!isBunInstalled()) {
      console.error('❌ Bun is required but not available');
      process.exit(1);
    }
  }

  // Step 2: Install dependencies if needed
  if (needsInstall()) {
    installDeps();
    console.error('✅ Dependencies installed');
  }

  // Step 3: Build frontend if needed
  buildFrontend();

  // Output valid JSON for Claude Code hook contract
  console.log(JSON.stringify({ continue: true, suppressOutput: true }));
} catch (e) {
  console.error('❌ Installation failed:', e.message);
  console.log(JSON.stringify({ continue: true, suppressOutput: true }));
  process.exit(1);
}
