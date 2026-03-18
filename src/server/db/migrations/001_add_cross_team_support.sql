-- Migration 001: Add cross-team messaging support
-- Adds original_team column to messages table
-- Adds allow_cross_team_messages column to teams table

-- Add original_team column to messages table
ALTER TABLE messages ADD COLUMN original_team TEXT;

-- Add allow_cross_team_messages column to teams table (default 0 = false)
ALTER TABLE teams ADD COLUMN allow_cross_team_messages INTEGER DEFAULT 0;

-- Create index for cross-team message queries
CREATE INDEX IF NOT EXISTS idx_messages_original_team ON messages(original_team) WHERE original_team IS NOT NULL;

-- Update schema version
INSERT OR REPLACE INTO schema_version (version, applied_at) VALUES (2, datetime('now'));
