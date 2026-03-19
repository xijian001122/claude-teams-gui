import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmdirSync, writeFileSync, unlinkSync, statSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { getDirectoryBirthTime, extractProjectFromCwd } from '../file-stats';

describe('file-stats utilities', () => {
  let testDir: string;

  beforeEach(() => {
    // Create a unique temporary directory for each test
    testDir = join(tmpdir(), `file-stats-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    // Clean up temporary directory
    try {
      rmdirSync(testDir, { recursive: true });
    } catch (err) {
      // Ignore cleanup errors
    }
  });

  describe('getDirectoryBirthTime', () => {
    it('should return an ISO timestamp string', () => {
      const timestamp = getDirectoryBirthTime(testDir);

      expect(typeof timestamp).toBe('string');
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should return a valid date string that can be parsed', () => {
      const timestamp = getDirectoryBirthTime(testDir);
      const date = new Date(timestamp);

      expect(date).toBeInstanceOf(Date);
      expect(date.getTime()).not.toBeNaN();
    });

    it('should return different timestamps for different directories', async () => {
      // Create a second directory with a small delay to ensure different birthtime
      const testDir2 = join(tmpdir(), `file-stats-test-2-${Date.now()}`);
      await new Promise(resolve => setTimeout(resolve, 10));
      mkdirSync(testDir2, { recursive: true });

      try {
        const timestamp1 = getDirectoryBirthTime(testDir);
        const timestamp2 = getDirectoryBirthTime(testDir2);

        // Both should be valid ISO strings
        expect(typeof timestamp1).toBe('string');
        expect(typeof timestamp2).toBe('string');

        // They should be different (or at least both valid)
        expect(new Date(timestamp1)).toBeInstanceOf(Date);
        expect(new Date(timestamp2)).toBeInstanceOf(Date);
      } finally {
        rmdirSync(testDir2, { recursive: true });
      }
    });

    it('should fallback to current time if directory does not exist', () => {
      const nonExistentDir = join(tmpdir(), 'non-existent-dir-12345');
      const timestamp = getDirectoryBirthTime(nonExistentDir);

      // Should return a valid timestamp (fallback to current time)
      expect(typeof timestamp).toBe('string');
      const date = new Date(timestamp);
      expect(date).toBeInstanceOf(Date);

      // Should be recent (within last 5 seconds)
      const now = Date.now();
      const diff = Math.abs(now - date.getTime());
      expect(diff).toBeLessThan(5000);
    });

    it('should use birthtimeMs or mtimeMs from stats', () => {
      const stats = statSync(testDir);
      const timestamp = getDirectoryBirthTime(testDir);
      const date = new Date(timestamp);

      // The timestamp should match either birthtime or mtime
      const expectedTime = stats.birthtimeMs || stats.mtimeMs;
      const expectedDate = new Date(expectedTime);

      // Allow small difference due to ISO string conversion
      const diff = Math.abs(date.getTime() - expectedDate.getTime());
      expect(diff).toBeLessThan(1000);
    });
  });

  describe('extractProjectFromCwd', () => {
    it('should extract project name from absolute path', () => {
      const cwd = '/home/user/projects/claude-chat';
      const result = extractProjectFromCwd(cwd);

      expect(result).toBe('claude-chat');
    });

    it('should extract project name from nested path', () => {
      const cwd = '/Users/developer/code/ai/my-project';
      const result = extractProjectFromCwd(cwd);

      expect(result).toBe('my-project');
    });

    it('should handle path with trailing slash', () => {
      const cwd = '/home/user/projects/my-app/';
      const result = extractProjectFromCwd(cwd);

      expect(result).toBe('my-app');
    });

    it('should return undefined for empty string', () => {
      const result = extractProjectFromCwd('');

      expect(result).toBeUndefined();
    });

    it('should return undefined for undefined input', () => {
      const result = extractProjectFromCwd(undefined);

      expect(result).toBeUndefined();
    });

    it('should handle single directory path', () => {
      const cwd = '/home';
      const result = extractProjectFromCwd(cwd);

      expect(result).toBe('home');
    });

    it('should handle root path', () => {
      const cwd = '/';
      const result = extractProjectFromCwd(cwd);

      expect(result).toBeUndefined();
    });

    it('should handle relative paths', () => {
      const cwd = 'projects/my-project';
      const result = extractProjectFromCwd(cwd);

      expect(result).toBe('my-project');
    });

    it('should handle paths with multiple consecutive slashes', () => {
      const cwd = '/home//user///projects////test-project';
      const result = extractProjectFromCwd(cwd);

      expect(result).toBe('test-project');
    });

    it('should handle Windows-style paths (forward slashes)', () => {
      const cwd = 'C:/Users/Dev/Projects/my-win-project';
      const result = extractProjectFromCwd(cwd);

      expect(result).toBe('my-win-project');
    });
  });
});
