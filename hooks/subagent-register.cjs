#!/usr/bin/env node
/**
 * SubagentStart Hook - Session Registration
 *
 * Registers a subagent's session information when the SubagentStart hook fires.
 * Writes session data to ~/.claude/teams/<team>/sessions/<member>.json
 *
 * Hook data format (via stdin):
 * {
 *   agent_id: string,      // e.g., "developer@fhd-app-team" or "agent-uuid"
 *   agent_type: string,   // "builder" | "validator" | "general-purpose" | etc
 *   session_id: string,   // UUID of the subagent's session
 *   cwd?: string          // Current working directory
 * }
 */

const os = require('os');
const fs = require('fs');
const path = require('path');

const CLAUDE_DIR = path.join(os.homedir(), '.claude');

/**
 * Resolve team and member name from agent_id or cwd
 * agent_id format: "member-name@team-name" or "agent-uuid"
 */
function resolveTeamAndMember(agentId, cwd) {
  // Try to parse from agent_id format "member@team"
  const parts = agentId.split('@');
  if (parts.length === 2) {
    return { memberName: parts[0], teamName: parts[1] };
  }

  // Fallback: search teams config.json for matching cwd
  if (cwd) {
    const teamsDir = path.join(CLAUDE_DIR, 'teams');
    if (fs.existsSync(teamsDir)) {
      const entries = fs.readdirSync(teamsDir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const configPath = path.join(teamsDir, entry.name, 'config.json');
        if (fs.existsSync(configPath)) {
          try {
            const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
            if (config.members) {
              const member = config.members.find(m => m.cwd === cwd);
              if (member) {
                return { memberName: member.name, teamName: entry.name };
              }
            }
          } catch {
            // Skip invalid config
          }
        }
      }
    }
  }

  return { memberName: null, teamName: null };
}

// ========== Main ==========

let inputData = '';
process.stdin.on('data', chunk => {
  inputData += chunk;
});

process.stdin.on('end', () => {
  try {
    const hookData = JSON.parse(inputData);
    const { agent_id, agent_type, session_id, cwd } = hookData;

    if (!agent_id || !session_id) {
      console.error('[SubagentRegister] Missing required fields: agent_id, session_id');
      process.exit(0);
      return;
    }

    const { memberName, teamName } = resolveTeamAndMember(agent_id, cwd);

    if (!memberName || !teamName) {
      console.error('[SubagentRegister] Could not determine team/member from agent_id:', agent_id);
      process.exit(0);
      return;
    }

    // Write session registration file
    const sessionsDir = path.join(CLAUDE_DIR, 'teams', teamName, 'sessions');
    fs.mkdirSync(sessionsDir, { recursive: true });

    const sessionFile = path.join(sessionsDir, `${memberName}.json`);
    const sessionData = {
      memberName,
      teamName,
      agentId: agent_id,
      agentType: agent_type,
      sessionId: session_id,
      cwd: cwd || null,
      registeredAt: new Date().toISOString()
    };

    fs.writeFileSync(sessionFile, JSON.stringify(sessionData, null, 2));

    console.log(`[SubagentRegister] Registered: ${memberName}@${teamName} -> ${session_id}`);
    if (agent_type) {
      console.log(`[SubagentRegister] Agent type: ${agent_type}`);
    }

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
