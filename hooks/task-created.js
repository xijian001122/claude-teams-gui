#!/usr/bin/env node
/**
 * TaskCreated Hook for Claude Chat
 *
 * This hook is triggered when a task is created via TaskCreate tool.
 * It sends a notification to the Claude Chat backend, which broadcasts
 * the event to all connected WebSocket clients.
 *
 * Environment Variables:
 * - CLAUDE_CHAT_URL: Backend URL (default: http://localhost:4558)
 */

const BACKEND_URL = process.env.CLAUDE_CHAT_URL || 'http://localhost:4558';
const HOOK_TIMEOUT = 5000; // 5 seconds

async function main() {
  let input = '';

  // Read JSON input from stdin
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', chunk => {
    input += chunk;
  });

  process.stdin.on('end', async () => {
    try {
      if (!input.trim()) {
        console.error('[TaskCreated Hook] No input received');
        process.exit(0);
      }

      const data = JSON.parse(input);

      // Extract task information
      const taskId = data.task_id || data.taskId;
      const teamName = data.team_name || data.teamName;
      const subject = data.subject || '';
      const status = data.status || 'pending';
      const owner = data.owner || '';

      if (!taskId || !teamName) {
        console.error('[TaskCreated Hook] Missing required fields: taskId, teamName');
        process.exit(0);
      }

      console.error(`[TaskCreated Hook] Task ${taskId} created for team ${teamName}`);

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), HOOK_TIMEOUT);

      // Send to backend API
      const response = await fetch(`${BACKEND_URL}/api/hooks/task-created`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          taskId,
          teamName,
          subject,
          status,
          owner
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error(`[TaskCreated Hook] API returned ${response.status}`);
      } else {
        console.error(`[TaskCreated Hook] Successfully notified backend`);
      }

      // Always exit 0 to not block the main flow
      process.exit(0);
    } catch (err) {
      if (err.name === 'AbortError') {
        console.error('[TaskCreated Hook] Request timed out');
      } else {
        console.error('[TaskCreated Hook] Error:', err.message);
      }
      // Exit 0 to not block the main flow
      process.exit(0);
    }
  });
}

main();
