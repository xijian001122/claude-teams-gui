#!/usr/bin/env node
/**
 * Start Service Script for Claude Teams GUI
 *
 * This script starts the backend server which also serves the frontend static files.
 * It's designed to work both in development mode and as an installed plugin.
 */

const { spawn, spawnSync } = require('child_process');
const { existsSync } = require('fs');
const { join, dirname } = require('path');
const { homedir } = require('os');
const { fileURLToPath } = require('url');

const IS_WINDOWS = process.platform === 'win32';

// Resolve plugin root
function resolveRoot() {
  if (process.env.CLAUDE_PLUGIN_ROOT) {
    return process.env.CLAUDE_PLUGIN_ROOT;
  }
  try {
    const scriptDir = dirname(fileURLToPath(import.meta.url));
    return dirname(scriptDir);
  } catch (e) {
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
  } catch (e) {
    return false;
  }
}

// Get bun path
function getBunPath() {
  try {
    const result = spawnSync('bun', ['--version'], {
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe'],
    shell: IS_WINDOWS
  });
    if (result.status === 0) return 'bun';
  } catch (e) {
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

// Start the server
function startServer() {
  const bunPath = getBunPath();
  if (!bunPath) {
    console.error('Bun not found. Please install Bun first.');
    return false;
  }

  const serverPath = join(PLUGIN_ROOT, 'src', 'server', 'cli.ts');
  if (!existsSync(serverPath)) {
    console.error('Server not found at ' + serverPath);
    return false;
  }

  const child = spawn(bunPath, [serverPath, '--headless'], {
    cwd: PLUGIN_ROOT,
    detached: true,
    stdio: 'ignore',
    env: {
    ...process.env,
    CLAUDE_PLUGIN_ROOT: PLUGIN_ROOT,
    NODE_ENV: 'production'
  },
    windowsHide: true
  });

  child.unref();
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
      systemMessage: `Claude Teams GUI ready!

Frontend: http://localhost:4559

Ready to use!`
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
          systemMessage: `Claude Teams GUI started!

Frontend: http://localhost:4559

Ready to use!`
        }));
        process.exit(0);
      }
      attempts++;
    }

    console.log(JSON.stringify({
      continue: true,
      suppressOutput: false,
      systemMessage: `Claude Teams GUI startup timeout

Please run manually: cd ${PLUGIN_ROOT} && bun run src/server/cli.ts`
    }));
  } else {
    console.log(JSON.stringify({
      continue: true,
      suppressOutput: false,
      systemMessage: `Claude Teams GUI failed to start

Please check if Bun is installed: bun --version`
    }));
  }
  } catch (err) {
    console.log(JSON.stringify({
      continue: true,
      suppressOutput: false,
      systemMessage: `Claude Teams GUI error: ${err.message}`
    }));
  }

  process.exit(0);
}

main();
