## ADDED Requirements

### Requirement: Archive Team Data Export
The system SHALL export team messages and metadata to JSON files when archiving a team.

#### Scenario: Export team data on archive
- **WHEN** `handleTeamDeleted(teamName)` is called
- **THEN** a directory is created at `~/.claude-chat/archive/<teamName>-<timestamp>/`
- **AND** `team.json` is written containing team metadata (name, display_name, members, config, created_at, archived_at, message_count)
- **AND** `messages.json` is written containing all messages for that team from SQLite
- **AND** each message includes id, from, to, content, content_type, timestamp, claude_ref fields

#### Scenario: Handle empty team (no messages)
- **WHEN** a team with zero messages is archived
- **THEN** `team.json` is written normally
- **AND** `messages.json` contains an empty array `[]`

### Requirement: Clean Up Empty Archive Directories
The system SHALL clean up existing empty archive directories.

#### Scenario: Remove empty directories on archive
- **WHEN** `archiveTeamData` is called
- **THEN** any directories under `~/.claude-chat/archive/` that contain zero files are deleted

### Requirement: Delete Archive Files on Permanent Delete
The system SHALL remove archive files when a team is permanently deleted.

#### Scenario: Delete archive directory on permanent team deletion
- **WHEN** `DELETE /api/archive/:name` is called
- **THEN** the corresponding archive directory matching `<name>-*` pattern is deleted
- **AND** if no archive directory exists, the operation still succeeds
