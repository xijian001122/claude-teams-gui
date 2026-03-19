-- Claude Chat Database Schema

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  local_id TEXT NOT NULL,
  team TEXT NOT NULL,
  from_member TEXT NOT NULL,
  from_type TEXT NOT NULL CHECK(from_type IN ('agent', 'user', 'system')),
  to_member TEXT,
  content TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK(content_type IN ('text', 'code', 'markdown', 'image', 'file', 'task', 'system')),
  timestamp TEXT NOT NULL,
  edited_at TEXT,
  deleted_at TEXT,
  claude_team TEXT,
  claude_inbox TEXT,
  claude_index INTEGER,
  claude_timestamp TEXT,
  metadata TEXT,
  original_team TEXT,
  team_instance_id TEXT,
  source_project TEXT
);

-- Indexes for messages
CREATE INDEX IF NOT EXISTS idx_messages_team_time ON messages(team, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_messages_from ON messages(from_member);
CREATE INDEX IF NOT EXISTS idx_messages_to ON messages(to_member) WHERE to_member IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_claude_ref ON messages(claude_team, claude_inbox);
CREATE INDEX IF NOT EXISTS idx_messages_team_instance ON messages(team, team_instance_id) WHERE team_instance_id IS NOT NULL;

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
  name TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('active', 'archived')),
  created_at TEXT NOT NULL,
  archived_at TEXT,
  last_activity TEXT NOT NULL,
  message_count INTEGER DEFAULT 0,
  members TEXT NOT NULL,
  config TEXT,
  allow_cross_team_messages INTEGER DEFAULT 0,
  team_instance_id TEXT
);

-- Indexes for teams
CREATE INDEX IF NOT EXISTS idx_teams_status ON teams(status);
CREATE INDEX IF NOT EXISTS idx_teams_activity ON teams(last_activity DESC);

-- Attachments table
CREATE TABLE IF NOT EXISTS attachments (
  id TEXT PRIMARY KEY,
  team TEXT NOT NULL,
  message_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_path TEXT NOT NULL,
  thumb_path TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_attachments_team ON attachments(team);
CREATE INDEX IF NOT EXISTS idx_attachments_message ON attachments(message_id);

-- Schema version tracking
CREATE TABLE IF NOT EXISTS schema_version (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL
);

INSERT OR IGNORE INTO schema_version (version, applied_at) VALUES (1, datetime('now'));
