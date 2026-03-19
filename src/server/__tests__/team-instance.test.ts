import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { DatabaseService } from '../db';
import { DataSyncService } from '../services/data-sync';
import { getDirectoryBirthTime } from '../utils/file-stats';

describe('Team Instance Integration Tests', () => {
  let testDir: string;
  let teamsPath: string;
  let db: DatabaseService;
  let dataSync: DataSyncService;

  beforeEach(async () => {
    // Create temporary directories
    testDir = join(tmpdir(), `team-instance-test-${Date.now()}`);
    teamsPath = join(testDir, 'teams');
    const dataDir = join(testDir, 'data');
    mkdirSync(teamsPath, { recursive: true });
    mkdirSync(dataDir, { recursive: true });

    // Initialize database (constructor handles initialization)
    db = new DatabaseService(dataDir);

    // Initialize DataSyncService
    dataSync = new DataSyncService({
      claudeTeamsPath: teamsPath,
      dataDir,
      db
    });
  });

  afterEach(async () => {
    // Clean up
    try {
      rmSync(testDir, { recursive: true, force: true });
    } catch (err) {
      // Ignore cleanup errors
    }
    if (db) {
      db.close();
    }
  });

  describe('7.3 Team recreation triggers new instance', () => {
    it('should generate different instance IDs for recreated team directories', async () => {
      const teamName = 'test-team';
      const teamPath = join(teamsPath, teamName);

      // Create initial team directory
      mkdirSync(teamPath, { recursive: true });
      writeFileSync(join(teamPath, 'config.json'), JSON.stringify({
        name: teamName,
        members: [{ name: 'agent1', cwd: '/home/user/test-project' }]
      }));
      mkdirSync(join(teamPath, 'inboxes'), { recursive: true });
      writeFileSync(join(teamPath, 'inboxes', 'agent1.json'), JSON.stringify([]));

      // Get initial instance ID
      const instance1 = getDirectoryBirthTime(teamPath);
      expect(instance1).toBeDefined();

      // Delete and recreate team directory (simulating Claude Code team recreation)
      await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
      rmSync(teamPath, { recursive: true, force: true });
      mkdirSync(teamPath, { recursive: true });
      writeFileSync(join(teamPath, 'config.json'), JSON.stringify({
        name: teamName,
        members: [{ name: 'agent1', cwd: '/home/user/test-project' }]
      }));
      mkdirSync(join(teamPath, 'inboxes'), { recursive: true });
      writeFileSync(join(teamPath, 'inboxes', 'agent1.json'), JSON.stringify([]));

      // Get new instance ID
      const instance2 = getDirectoryBirthTime(teamPath);
      expect(instance2).toBeDefined();

      // Instance IDs should be different
      expect(instance1).not.toBe(instance2);
    });

    it('should store team instance ID in database', async () => {
      const teamName = 'test-team-2';
      const teamPath = join(teamsPath, teamName);

      // Create team directory
      mkdirSync(teamPath, { recursive: true });
      writeFileSync(join(teamPath, 'config.json'), JSON.stringify({
        name: teamName,
        members: [{ name: 'agent1', cwd: '/home/user/my-project' }]
      }));
      mkdirSync(join(teamPath, 'inboxes'), { recursive: true });
      writeFileSync(join(teamPath, 'inboxes', 'agent1.json'), JSON.stringify([
        {
          from: 'agent1',
          text: 'Test message from agent',
          summary: 'Test',
          timestamp: new Date().toISOString(),
          read: false
        }
      ]));

      // Sync team
      await dataSync.syncTeam(teamName);

      // Verify team has instance ID
      const team = await db.getTeam(teamName);
      expect(team).toBeDefined();
      expect(team?.teamInstance).toBeDefined();
      expect(typeof team?.teamInstance).toBe('string');

      // Verify messages have instance ID
      const messages = await db.getMessages(teamName, { limit: 100 });
      expect(messages.length).toBeGreaterThan(0);
      expect(messages[0].teamInstance).toBeDefined();
      expect(typeof messages[0].teamInstance).toBe('string');
    });

    it('should extract source project from member cwd', async () => {
      const teamName = 'test-team-3';
      const teamPath = join(teamsPath, teamName);

      // Create team directory
      mkdirSync(teamPath, { recursive: true });
      writeFileSync(join(teamPath, 'config.json'), JSON.stringify({
        name: teamName,
        members: [{ name: 'agent1', cwd: '/home/user/projects/my-awesome-project' }]
      }));
      mkdirSync(join(teamPath, 'inboxes'), { recursive: true });
      writeFileSync(join(teamPath, 'inboxes', 'agent1.json'), JSON.stringify([
        {
          from: 'agent1',
          text: 'Test message',
          summary: 'Test',
          timestamp: new Date().toISOString(),
          read: false
        }
      ]));

      // Sync team
      await dataSync.syncTeam(teamName);

      // Verify messages have source project
      const messages = await db.getMessages(teamName, { limit: 100 });
      expect(messages.length).toBeGreaterThan(0);
      expect(messages[0].sourceProject).toBe('my-awesome-project');
    });

    it('should handle team recreation with new messages', async () => {
      const teamName = 'test-team-4';
      const teamPath = join(teamsPath, teamName);

      // Create first team instance
      mkdirSync(teamPath, { recursive: true });
      writeFileSync(join(teamPath, 'config.json'), JSON.stringify({
        name: teamName,
        members: [{ name: 'agent1', cwd: '/home/user/test' }]
      }));
      mkdirSync(join(teamPath, 'inboxes'), { recursive: true });
      writeFileSync(join(teamPath, 'inboxes', 'agent1.json'), JSON.stringify([
        {
          from: 'agent1',
          text: 'Message from instance 1',
          summary: 'Instance 1',
          timestamp: new Date().toISOString(),
          read: false
        }
      ]));

      // Sync first instance
      await dataSync.syncTeam(teamName);
      const messages1 = await db.getMessages(teamName, { limit: 100 });
      expect(messages1.length).toBeGreaterThan(0);
      const instance1 = messages1[0].teamInstance;
      expect(instance1).toBeDefined();

      // Recreate team (new instance)
      await new Promise(resolve => setTimeout(resolve, 10));
      rmSync(teamPath, { recursive: true, force: true });
      mkdirSync(teamPath, { recursive: true });
      writeFileSync(join(teamPath, 'config.json'), JSON.stringify({
        name: teamName,
        members: [{ name: 'agent1', cwd: '/home/user/test' }]
      }));
      mkdirSync(join(teamPath, 'inboxes'), { recursive: true });
      writeFileSync(join(teamPath, 'inboxes', 'agent1.json'), JSON.stringify([
        {
          from: 'agent1',
          text: 'Message from instance 2',
          summary: 'Instance 2',
          timestamp: new Date().toISOString(),
          read: false
        }
      ]));

      // Sync second instance
      await dataSync.syncTeam(teamName);
      const messages2 = await db.getMessages(teamName, { limit: 100 });
      expect(messages2.length).toBeGreaterThanOrEqual(2);

      const instance2 = messages2.find(m => m.content.includes('instance 2'))?.teamInstance;
      expect(instance2).toBeDefined();

      // Instances should be different
      expect(instance1).not.toBe(instance2);
    });
  });

  describe('7.5 Instance filter in messages API', () => {
    it('should filter messages by team instance', async () => {
      const teamName = 'test-team-5';
      const teamPath = join(teamsPath, teamName);

      // Create first team instance
      mkdirSync(teamPath, { recursive: true });
      writeFileSync(join(teamPath, 'config.json'), JSON.stringify({
        name: teamName,
        members: [{ name: 'agent1', cwd: '/home/user/test' }]
      }));
      mkdirSync(join(teamPath, 'inboxes'), { recursive: true });
      writeFileSync(join(teamPath, 'inboxes', 'agent1.json'), JSON.stringify([
        {
          from: 'agent1',
          text: 'Message from instance 1',
          summary: 'Instance 1',
          timestamp: new Date().toISOString(),
          read: false
        }
      ]));

      await dataSync.syncTeam(teamName);
      const messages1 = await db.getMessages(teamName, { limit: 100 });
      expect(messages1.length).toBeGreaterThan(0);
      const instance1 = messages1[0].teamInstance!;

      // Recreate team
      await new Promise(resolve => setTimeout(resolve, 10));
      rmSync(teamPath, { recursive: true, force: true });
      mkdirSync(teamPath, { recursive: true });
      writeFileSync(join(teamPath, 'config.json'), JSON.stringify({
        name: teamName,
        members: [{ name: 'agent1', cwd: '/home/user/test' }]
      }));
      mkdirSync(join(teamPath, 'inboxes'), { recursive: true });
      writeFileSync(join(teamPath, 'inboxes', 'agent1.json'), JSON.stringify([
        {
          from: 'agent1',
          text: 'Message from instance 2',
          summary: 'Instance 2',
          timestamp: new Date().toISOString(),
          read: false
        }
      ]));

      await dataSync.syncTeam(teamName);
      const allMessages = await db.getMessages(teamName, { limit: 100 });
      expect(allMessages.length).toBeGreaterThanOrEqual(2);
      const instance2 = allMessages.find(m => m.content.includes('instance 2'))?.teamInstance!;

      // Query by instance 1
      const filtered1 = await db.getMessages(teamName, { limit: 100, instance: instance1 });
      expect(filtered1.every(m => m.teamInstance === instance1)).toBe(true);
      expect(filtered1.length).toBeGreaterThan(0);

      // Query by instance 2
      const filtered2 = await db.getMessages(teamName, { limit: 100, instance: instance2 });
      expect(filtered2.every(m => m.teamInstance === instance2)).toBe(true);
      expect(filtered2.length).toBeGreaterThan(0);

      // All messages should include both instances
      expect(allMessages.length).toBeGreaterThanOrEqual(filtered1.length + filtered2.length);
    });
  });
});
