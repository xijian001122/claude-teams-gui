# Team Lifecycle Specification

## ADDED Requirements

### Requirement: Team Instance Identification
The system SHALL generate a unique instance ID for each team directory by using the directory's birth time (creation time from filesystem).

#### Scenario: New team directory creation
- **WHEN** FileWatcher detects a new team directory is created
- **THEN** system SHALL extract the directory's birth time as `teamInstance`
- **AND** system SHALL store `teamInstance` in the database alongside team info

#### Scenario: Team directory recreation (same name)
- **WHEN** FileWatcher detects a team directory is deleted and recreated with the same name
- **THEN** system SHALL generate a NEW `teamInstance` ID (new birth time)
- **AND** system SHALL mark the previous instance as `archived`

### Requirement: Source Project Identification
The system SHALL extract the source project name from team members' `cwd` field by taking the last path segment (e.g., `/root/claude-chat` → `claude-chat`).

#### Scenario: First member has valid cwd
- **WHEN** syncing a team for the first time
- **THEN** system SHALL read the first member's `cwd` field
- **AND** system SHALL extract the project name as `sourceProject`

#### Scenario: Multiple members with same cwd
- **WHEN** extracting source project from team with multiple members
- **THEN** system SHALL use any member's `cwd` (they all have the same value)

### Requirement: Message Instance Grouping
All messages SHALL be associated with a `teamInstance` to enable grouping by team lifecycle.

#### Scenario: New message synced with instance
- **WHEN** DataSyncService syncs a new message from inbox file
- **THEN** system SHALL include the current `teamInstance` with the message
- **AND** system SHALL include `sourceProject` with the message

#### Scenario: Query messages by instance
- **WHEN** API requests messages for a team
- **THEN** system SHALL return messages grouped by `teamInstance`
- **OR** system SHALL filter messages by specific `teamInstance` if requested

### Requirement: Team Instance WebSocket Events
The system SHALL emit WebSocket events when team instance changes.

#### Scenario: Team recreated with new instance
- **WHEN** FileWatcher detects a team directory is recreated
- **THEN** system SHALL emit `team_instance_changed` event
- **AND** event SHALL contain `team`, `oldInstance`, `newInstance`, `sourceProject`

#### Scenario: Frontend receives instance change
- **WHEN** frontend receives `team_instance_changed` event
- **THEN** frontend SHALL refresh the team's messages
- **AND** frontend SHALL display messages grouped by instance with visual dividers

### Requirement: Instance Visual Separation in UI
The frontend SHALL display messages grouped by team instance with clear visual separation between different instances of the same team name.

#### Scenario: Display messages from multiple instances
- **WHEN** a team has messages from multiple instances
- **THEN** frontend SHALL display messages grouped by `teamInstance`
- **AND** frontend SHALL insert a visual divider between instances
- **AND** divider SHALL show "团队已重建" label with timestamp

#### Scenario: Current instance messages prominent
- **WHEN** displaying messages for a team with multiple instances
- **THEN** frontend SHALL initially show only the current (latest) instance's messages
- **AND** frontend SHALL provide UI to expand and view historical instances

### Requirement: Backward Compatibility
The system SHALL handle existing messages that have no `teamInstance` gracefully.

#### Scenario: Query messages without instance ID
- **WHEN** querying messages that were stored before this feature
- **THEN** system SHALL treat messages with null `teamInstance` as belonging to the same instance
- **AND** system SHALL display them normally without dividers
