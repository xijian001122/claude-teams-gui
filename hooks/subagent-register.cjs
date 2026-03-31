#!/usr/bin/env node
/**
 * Session Registration Script
 *
 * Registers a team member's session by scanning jsonl files.
 * The jsonl filename IS the session ID, and its first line contains
 * teamName and agentName for reliable matching.
 *
 * Modes:
 *   1. CLI:   node subagent-register.cjs --member <name> --team <team> [--cwd <dir>] [--wait <ms>]
 *   2. Hook:  reads JSON from stdin (SubagentStart data)
 */

const os = require('os');
const fs = require('fs');
const path = require('path');

const CLAUDE_DIR = path.join(os.homedir(), '.claude');

// ========== Session Discovery via jsonl ==========

/**
 * Compute project hash from cwd (matches Claude Code's algorithm)
 */
function projectHash(cwd) {
  return '-' + cwd.replace(/[/\\]/g, '-').replace(/^-/, '');
}

/**
 * Find session ID by scanning jsonl files for matching teamName + agentName.
 * Returns the most recent matching session ID.
 */
function findSessionByJsonl(teamName, memberName, cwd) {
  const projectsDir = path.join(CLAUDE_DIR, 'projects');
  if (!fs.existsSync(projectsDir)) return null;

  const hash = projectHash(cwd);
  const projectDir = path.join(projectsDir, hash);
  if (!fs.existsSync(projectDir)) return null;

  let bestMatch = null;
  let bestTime = 0;

  const files = fs.readdirSync(projectDir).filter(f => f.endsWith('.jsonl'));

  for (const f of files) {
    try {
      const fd = fs.openSync(path.join(projectDir, f), 'r');
      const buf = Buffer.alloc(4096);
      const bytesRead = fs.readSync(fd, buf, 0, 4096, 0);
      fs.closeSync(fd);

      const firstLine = buf.toString('utf8', 0, bytesRead).split('\n')[0];
      const entry = JSON.parse(firstLine);

      if (entry.teamName === teamName && entry.agentName === memberName) {
        const stat = fs.statSync(path.join(projectDir, f));
        if (stat.mtimeMs > bestTime) {
          bestMatch = f.replace('.jsonl', '');
          bestTime = stat.mtimeMs;
        }
      }
    } catch { /* skip */ }
  }

  return bestMatch;
}

// ========== Registration ==========

function writeRegistration(memberName, teamName, agentId, agentType, sessionId, cwd) {
  const sessionsDir = path.join(CLAUDE_DIR, 'teams', teamName, 'sessions');
  fs.mkdirSync(sessionsDir, { recursive: true });

  const sessionFile = path.join(sessionsDir, `${memberName}.json`);
  const sessionData = {
    memberName,
    teamName,
    agentId: agentId || `${memberName}@${teamName}`,
    agentType: agentType || 'general-purpose',
    sessionId,
    cwd: cwd || null,
    registeredAt: new Date().toISOString()
  };

  fs.writeFileSync(sessionFile, JSON.stringify(sessionData, null, 2));
  return sessionData;
}

// ========== CLI Mode ==========

function runCliMode(args) {
  const memberName = args['--member'];
  const teamName = args['--team'];
  const cwd = args['--cwd'] || process.cwd();
  const waitMs = parseInt(args['--wait']) || 5000;

  if (!memberName || !teamName) {
    console.error('[SubagentRegister] --member and --team are required');
    process.exit(1);
  }

  // Retry loop: wait for jsonl file to appear
  const deadline = Date.now() + waitMs;
  let sessionId = null;

  while (Date.now() < deadline) {
    sessionId = findSessionByJsonl(teamName, memberName, cwd);
    if (sessionId) break;
    // Busy-wait 300ms
    const spinEnd = Date.now() + 300;
    while (Date.now() < spinEnd) {}
  }

  const data = writeRegistration(memberName, teamName, `${memberName}@${teamName}`, null, sessionId, cwd);

  if (sessionId) {
    console.log(`[SubagentRegister] Registered: ${memberName}@${teamName} -> ${sessionId}`);
  } else {
    console.log(`[SubagentRegister] Registered (pending): ${memberName}@${teamName} - jsonl not found after ${waitMs}ms`);
  }

  process.exit(0);
}

// ========== Hook stdin Mode ==========

function runHookMode() {
  let inputData = '';
  process.stdin.on('data', chunk => { inputData += chunk; });

  process.stdin.on('end', () => {
    try {
      const hookData = JSON.parse(inputData);
      const { agent_id, agent_type, cwd } = hookData;

      if (!agent_id) {
        console.error('[SubagentRegister] Missing agent_id');
        process.exit(0);
        return;
      }

      // Parse member@team from agent_id
      const parts = agent_id.split('@');
      let memberName, teamName;

      if (parts.length === 2) {
        memberName = parts[0];
        teamName = parts[1];
      } else {
        // Fallback: search jsonl files
        console.error('[SubagentRegister] agent_id not in member@team format');
        process.exit(0);
        return;
      }

      const sessionId = findSessionByJsonl(teamName, memberName, cwd || process.cwd());

      writeRegistration(memberName, teamName, agent_id, agent_type, sessionId, cwd);

      console.log(`[SubagentRegister] Registered: ${memberName}@${teamName} -> ${sessionId || 'pending'}`);
      process.exit(0);
    } catch (err) {
      console.error('[SubagentRegister] Error:', err.message);
      process.exit(0);
    }
  });

  process.stdin.on('error', err => {
    console.error('[SubagentRegister] stdin error:', err.message);
    process.exit(0);
  });
}

// ========== Entry ==========

const args = {};
process.argv.slice(2).forEach((val, i, arr) => {
  if (val.startsWith('--')) args[val] = arr[i + 1] || true;
});

if (args['--member'] && args['--team']) {
  runCliMode(args);
} else {
  runHookMode();
}
