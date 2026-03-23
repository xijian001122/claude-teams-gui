# Realtime Events Specification

## ADDED Requirements

### Requirement: WebSocket team_added event

The system SHALL broadcast a `team_added` WebSocket event to all connected clients when a new team is detected by the FileWatcherService.

#### Scenario: New team detected and broadcasted
- **WHEN** Claude creates a new team directory in `~/.claude/teams/`
- **THEN** the FileWatcherService detects the new directory via `addDir` event
- **THEN** the system calls `syncTeam()` to persist team to database
- **THEN** the system broadcasts `team_added` event to all WebSocket clients with full team object

#### Scenario: WebSocket message format
- **WHEN** a new team is added
- **THEN** the WebSocket message has format:
  ```json
  {
    "type": "team_added",
    "team": { "name": "...", "displayName": "...", ... }
  }
  ```

### Requirement: Frontend team_added handler

The frontend SHALL handle the `team_added` WebSocket event and refresh the team list.

#### Scenario: Frontend receives team_added event
- **WHEN** frontend receives `team_added` WebSocket message
- **THEN** the frontend calls `loadTeams()` to fetch updated team list
- **THEN** the frontend calls `loadCrossTeamTargets()` to update cross-team messaging targets
- **THEN** the new team appears in the sidebar without page reload

#### Scenario: Multiple clients receive update
- **WHEN** multiple browser clients are connected
- **THEN** all clients receive the `team_added` event
- **THEN** all clients update their team lists

### Requirement: Backward compatibility

The system SHALL maintain backward compatibility with clients that do not handle the `team_added` event.

#### Scenario: Legacy client ignores unknown event
- **WHEN** a client does not have a handler for `team_added` event
- **THEN** the client continues to function normally
- **THEN** the client can still manually refresh the team list via the UI
