/**
 * Shared constants for Claude Chat
 */

// Default configuration
export const DEFAULT_CONFIG = {
  port: 4558,
  host: 'localhost',
  clientPort: 4559,
  clientHost: 'localhost',
  dataDir: '~/.claude-chat',
  teamsPath: '~/.claude/teams',
  retentionDays: 90,
  theme: 'auto' as const,
  desktopNotifications: true,
  soundEnabled: false,
  cleanupEnabled: true,
  cleanupTime: '02:00'
};

// Database
export const DB_FILE_NAME = 'messages.db';
export const METADATA_FILE_NAME = 'metadata.json';
export const ATTACHMENTS_DIR = 'attachments';

// File size limits
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_INLINE_IMAGE_SIZE = 500 * 1024; // 500KB
export const THUMB_SIZE = 200; // 200x200px

// Pagination
export const DEFAULT_MESSAGE_LIMIT = 50;
export const MAX_MESSAGE_LIMIT = 200;

// Cleanup
export const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Claude Teams paths
export const CLAUDE_TEAMS_DIR = '.claude/teams';
export const CLAUDE_INBOXES_DIR = 'inboxes';
