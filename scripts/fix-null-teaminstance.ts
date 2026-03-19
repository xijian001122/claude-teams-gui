#!/usr/bin/env bun
/**
 * One-time script to fix null teamInstance in messages
 * Run with: bun scripts/fix-null-teaminstance.ts
 */

import { join } from 'path';
import { homedir } from 'os';
import { DatabaseService } from '../src/server/db';

const dataDir = join(homedir(), '.claude-chat');
const db = new DatabaseService(dataDir);

async function main() {
  const teamName = 'claude-teams-gui';

  console.log(`Checking teamInstance for team: ${teamName}`);

  // First check the team's teamInstance
  const team = await db.getTeam(teamName);
  if (!team) {
    console.error(`Team ${teamName} not found`);
    process.exit(1);
  }

  console.log(`Team teamInstance: ${team.teamInstance}`);

  // Count messages with null teamInstance
  const messages = await db.getMessages(teamName, { limit: 1000 });
  const nullCount = messages.filter(m => !m.teamInstance).length;
  console.log(`Messages with null teamInstance: ${nullCount}`);

  if (nullCount === 0) {
    console.log('No messages to fix');
    process.exit(0);
  }

  // Fix null teamInstance
  const fixed = await db.fixNullTeamInstance(teamName);
  console.log(`Fixed ${fixed} messages`);

  // Verify
  const messagesAfter = await db.getMessages(teamName, { limit: 1000 });
  const nullCountAfter = messagesAfter.filter(m => !m.teamInstance).length;
  console.log(`Messages with null teamInstance after fix: ${nullCountAfter}`);

  if (nullCountAfter === 0) {
    console.log('✅ All messages fixed!');
  } else {
    console.log('❌ Some messages still have null teamInstance');
  }
}

main().catch(console.error);
