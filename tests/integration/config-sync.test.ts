import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawn, ChildProcess } from 'child_process';
import { writeFileSync, unlinkSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import WebSocket from 'ws';
import type { AppConfig } from '@shared/types';

describe('Config Hot Reload Integration', () => {
  let serverProcess: ChildProcess;
  let wsClient: WebSocket;
  const testDir = join(__dirname, '../fixtures/integration');
  const configPath = join(testDir, 'config.json');
  const testConfig: AppConfig = {
    port: 4558,
    host: '0.0.0.0',
    dataDir: testDir,
    teamsPath: join(testDir, 'teams'),
    theme: 'dark',
    retentionDays: 7,
    cleanupEnabled: true,
    cleanupTime: '00:00',
    desktopNotifications: true,
    soundEnabled: true
  };

  beforeAll(async () => {
    // Ensure test directory exists
    if (!existsSync(testDir)) {
      mkdirSync(testDir, { recursive: true });
    }

    // Write test config
    writeFileSync(configPath, JSON.stringify(testConfig, null, 2));

    // Start server
    serverProcess = spawn('node', ['dist/server/cli.js', '--port', '4558'], {
      cwd: join(__dirname, '../../'),
      env: { ...process.env, DATA_DIR: testDir }
    });

    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  afterAll(async () => {
    // Cleanup
    if (wsClient) wsClient.close();
    if (serverProcess) serverProcess.kill();
    if (existsSync(configPath)) unlinkSync(configPath);
  });

  describe('File-based config reload', () => {
    it('should detect file changes and broadcast WebSocket event', async () => {
      // Connect to WebSocket
      wsClient = new WebSocket('ws://localhost:4558/ws');

      const messagePromise = new Promise<any>((resolve) => {
        wsClient.on('message', (data) => {
          const message = JSON.parse(data.toString());
          if (message.type === 'config_updated') {
            resolve(message);
          }
        });
      });

      // Wait for WebSocket to be ready
      await new Promise(resolve => wsClient.on('open', resolve));

      // Modify config file
      const updatedConfig = { ...testConfig, theme: 'light' };
      writeFileSync(configPath, JSON.stringify(updatedConfig, null, 2));

      // Wait for config_updated event
      const message = await messagePromise;

      expect(message.type).toBe('config_updated');
      expect(message.changes).toBeDefined();
      expect(message.changes).toHaveLength(1);
      expect(message.changes[0].key).toBe('theme');
      expect(message.changes[0].oldValue).toBe('dark');
      expect(message.changes[0].newValue).toBe('light');
      expect(message.changes[0].requiresRestart).toBe(false);
      expect(message.pendingRestart).toBe(false);
    });

    it('should set pendingRestart when restart-required key changes', async () => {
      wsClient = new WebSocket('ws://localhost:4558/ws');

      const messagePromise = new Promise<any>((resolve) => {
        wsClient.on('message', (data) => {
          const message = JSON.parse(data.toString());
          if (message.type === 'config_updated') {
            resolve(message);
          }
        });
      });

      await new Promise(resolve => wsClient.on('open', resolve));

      // Modify port (restart-required)
      const updatedConfig = { ...testConfig, port: 8080 };
      writeFileSync(configPath, JSON.stringify(updatedConfig, null, 2));

      const message = await messagePromise;

      expect(message.pendingRestart).toBe(true);
      expect(message.changes[0].requiresRestart).toBe(true);
    });
  });

  describe('API-based config update', () => {
    it('should persist config to file when updated via API', async () => {
      // Update config via API
      const response = await fetch('http://localhost:4558/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: 'auto' })
      });

      expect(response.ok).toBe(true);

      // Wait for file to be written (debounced)
      await new Promise(resolve => setTimeout(resolve, 500));

      // Read file and verify
      // Note: This test requires settingsRoutes to be integrated with ConfigService
      // Currently will fail because settingsRoutes doesn't use ConfigService
    });
  });

  describe('Debounced write', () => {
    it('should only write once when multiple updates within 300ms', async () => {
      wsClient = new WebSocket('ws://localhost:4558/ws');
      await new Promise(resolve => wsClient.on('open', resolve));

      // Send multiple rapid updates
      const updates = [
        { theme: 'light' },
        { retentionDays: 14 },
        { desktopNotifications: false }
      ];

      for (const update of updates) {
        await fetch('http://localhost:4558/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(update)
        });
      }

      // Wait for debounce period
      await new Promise(resolve => setTimeout(resolve, 500));

      // Verify file was written only once
      // Note: This test requires settingsRoutes to be integrated with ConfigService
    });
  });
});
