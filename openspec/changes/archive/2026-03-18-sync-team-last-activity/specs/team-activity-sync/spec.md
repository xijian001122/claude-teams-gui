## ADDED Requirements

### Requirement: Team lastActivity updates on message send

The system SHALL update the team's `lastActivity` timestamp whenever a message is sent to that team. The timestamp SHALL match the message's timestamp.

#### Scenario: Regular message updates team activity
- **WHEN** a user sends a message to team "claude-teams-gui"
- **THEN** the team's `lastActivity` is updated to the message's timestamp

#### Scenario: Agent message updates team activity
- **WHEN** an agent sends a message via DataSyncService
- **THEN** the team's `lastActivity` is updated to the message's timestamp

### Requirement: Cross-team message updates both teams

The system SHALL update `lastActivity` for both source and target teams when a cross-team message is sent.

#### Scenario: Cross-team message updates both teams
- **WHEN** user sends a cross-team message from "team-a" to "team-b"
- **THEN** both "team-a" and "team-b" have their `lastActivity` updated
