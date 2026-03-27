#!/usr/bin/env node
/**
 * Bun Runner - Finds and executes Bun even when not in PATH
 *
 * This script solves the fresh install problem where:
 * 1. Bun may be installed to ~/.bun/bin/bun
 * 2. But Bun isn't in PATH until terminal restart
 * 3. Hooks fail because they can't find `bun`
 *
 * Usage: node bun-runner.js <script> [args...]
 */
import { spawnSync, spawn } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { homedir } from 'os';
import { fileURLToPath } from 'url';

const IS_WINDOWS = process.platform === 'win32';

// Self-resolve plugin root when CLAUDE_PLUGIN_ROOT is not set by Claude Code.
const __bun_runner_dirname = dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = process.env.CLAUDE_PLUGIN_ROOT || dirname(__bun_runner_dirname);

function getBunPath() {
  // Try PATH first
  const pathCheck = spawnSync('bun', ['--version'], {
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe'],
    shell: IS_WINDOWS
  });

  if (pathCheck.status === 0 && pathCheck.stdout.trim()) {
    return 'bun'; // Found in PATH
  }

  // Check common installation paths
  const bunPaths = IS_WINDOWS
    ? [join(homedir(), '.bun', 'bin', 'bun.exe')]
    : [
        join(homedir(), '.bun', 'bin', 'bun'),
        '/usr/local/bin/bun',
        '/opt/homebrew/bin/bun',
        '/home/linuxbrew/.linuxbrew/bin/bun'
      ];

  for (const bunPath of bunPaths) {
    if (existsSync(bunPath)) {
      return bunPath;
    }
  }

  return null;
}

// Check if plugin is disabled
function isPluginDisabledInClaudeSettings() {
  try {
    const configDir = process.env.CLAUDE_CONFIG_DIR || join(homedir(), '.claude');
    const settingsPath = join(configDir, 'settings.json');
    if (!existsSync(settingsPath)) return false;
    const settings = JSON.parse(readFileSync(settingsPath, 'utf-8'));
    return settings?.enabledPlugins?.['claude-teams-gui@claude-teams-gui-marketplace'] === false;
  } catch {
    return false;
  }
}

if (isPluginDisabledInClaudeSettings()) {
  process.exit(0);
}

// Get args: node bun-runner.js <script> [args...]
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('Usage: node bun-runner.js <script> [args...]');
  process.exit(1);
}

// Fix script path if it's relative
if (!args[0].startsWith('/') && !args[0].startsWith('./')) {
  args[0] = join(PLUGIN_ROOT, args[0]);
}

const bunPath = getBunPath();

if (!bunPath) {
  console.error('❌ Bun not found. Please install Bun:');
  console.error('   curl -fsSL https://bun.sh/install | bash');
  process.exit(1);
}

// Collect stdin data (if any)
async function collectStdin() {
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];

    process.stdin.on('data', (chunk) => chunks.push(chunk));
    process.stdin.on('end', () => {
      resolve(chunks.length > 0 ? Buffer.concat(chunks) : null);
    });
    process.stdin.on('error', () => resolve(null));

    // Safety: if no data arrives within 5s, proceed without stdin
    setTimeout(() => {
      process.stdin.removeAllListeners();
      process.stdin.pause();
      resolve(chunks.length > 0 ? Buffer.concat(chunks) : null);
    }, 5000);
  });
}

const stdinData = await collectStdin();

// Spawn Bun with the provided script and args
const child = spawn(bunPath, args, {
  stdio: [stdinData ? 'pipe' : 'ignore', 'inherit', 'inherit'],
  windowsHide: true,
  env: {
    ...process.env,
    CLAUDE_PLUGIN_ROOT: PLUGIN_ROOT
  }
});

// Write buffered stdin to child's pipe
if (stdinData && child.stdin) {
  child.stdin.write(stdinData);
  child.stdin.end();
}

child.on('error', (err) => {
  console.error(`Failed to start Bun: ${err.message}`);
  process.exit(1);
});

child.on('close', (code) => {
  process.exit(code || 0);
});
