import { test, expect } from '@playwright/test';
import { writeFileSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';

test.describe('Config Hot Reload E2E', () => {
  const testDir = join(__dirname, '../fixtures/e2e');
  const configPath = join(testDir, 'config.json');

  test.beforeAll(async () => {
    // Ensure test directory exists
    if (!existsSync(testDir)) {
      const { mkdirSync } = await import('fs');
      mkdirSync(testDir, { recursive: true });
    }
  });

  test('should display restart badge when config changes require restart', async ({ page }) => {
    // Start server and open browser
    await page.goto('http://localhost:4558');

    // Wait for sidebar to load
    await page.waitForSelector('[data-testid="sidebar"]', { timeout: 5000 });

    // Initial state - no badge should be visible
    const settingsTab = await page.locator('button:has-text("设置")');
    const badge = await settingsTab.locator('.bg-red-500\\/10');
    await expect(badge).toBeHidden();

    // Simulate config change requiring restart
    // Note: This requires backend endpoint or file modification
    // For testing purposes, we'll manually trigger via file modification

    // Modify config file directly
    const newConfig = {
      port: 8080, // Changed from 4558 - requires restart
      host: '0.0.0.0',
      dataDir: '~/.claude-chat',
      teamsPath: '~/.claude/teams',
      theme: 'dark',
      retentionDays: 7,
      cleanupEnabled: true,
      cleanupTime: '00:00',
      desktopNotifications: true,
      soundEnabled: true
    };

    writeFileSync(configPath, JSON.stringify(newConfig, null, 2));

    // Wait for WebSocket event and UI update
    await page.waitForTimeout(500); // Wait for file watcher to detect

    // Badge should now be visible
    await expect(badge).toBeVisible();
    await expect(badge).toContainText('需重启');
  });

  test('should hide restart badge after service restart', async ({ page }) => {
    await page.goto('http://localhost:4558');
    await page.waitForSelector('[data-testid="sidebar"]', { timeout: 5000 });

    const settingsTab = await page.locator('button:has-text("设置")');
    const badge = await settingsTab.locator('.bg-red-500\\/10');

    // This test simulates a restart
    // In a real scenario, the service would restart and load the new config
    // The badge should disappear because no pending changes exist after restart

    // Reset config to original values
    const originalConfig = {
      port: 4558,
      host: '0.0.0.0',
      dataDir: '~/.claude-chat',
      teamsPath: '~/.claude/teams',
      theme: 'dark',
      retentionDays: 7,
      cleanupEnabled: true,
      cleanupTime: '00:00',
      desktopNotifications: true,
      soundEnabled: true
    };

    writeFileSync(configPath, JSON.stringify(originalConfig, null, 2));

    // Wait for UI update
    await page.waitForTimeout(500);

    // In a real restart scenario, the service would be restarted
    // For now, just verify the badge state management
    await expect(badge).toBeHidden();
  });

  test('should show config change notification', async ({ page }) => {
    await page.goto('http://localhost:4558');

    // Listen for console messages
    const consoleMessages: string[] = [];
    page.on('console', msg => consoleMessages.push(msg.text()));

    // Trigger config change
    const newConfig = {
      port: 4558,
      host: '0.0.0.0',
      dataDir: '~/.claude-chat',
      teamsPath: '~/.claude/teams',
      theme: 'light', // Changed - hot reloadable
      retentionDays: 7,
      cleanupEnabled: true,
      cleanupTime: '00:00',
      desktopNotifications: true,
      soundEnabled: true
    };

    writeFileSync(configPath, JSON.stringify(newConfig, null, 2));

    // Wait for WebSocket event
    await page.waitForTimeout(500);

    // Verify config_updated event was received
    expect(consoleMessages.some(msg => msg.includes('Config updated'))).toBe(true);
  });

  test.afterAll(() => {
    // Cleanup test config
    if (existsSync(configPath)) {
      unlinkSync(configPath);
    }
  });
});
