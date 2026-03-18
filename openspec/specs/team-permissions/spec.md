## ADDED Requirements

### Requirement: Team-level cross-team permission
The system SHALL allow teams to opt-in to receiving cross-team messages via a configuration setting.

#### Scenario: Enabling cross-team messages
- **GIVEN** a team has `allowCrossTeamMessages: false` (default)
- **WHEN** a team admin updates the team configuration to set `allowCrossTeamMessages: true`
- **THEN** other teams SHALL be able to send messages to this team
- **AND** the team SHALL appear in the cross-team target dropdown for other teams

#### Scenario: Disabling cross-team messages
- **GIVEN** a team has `allowCrossTeamMessages: true`
- **WHEN** a team admin updates the configuration to set `allowCrossTeamMessages: false`
- **THEN** subsequent cross-team message attempts SHALL be rejected with 403
- **AND** existing cross-team messages SHALL remain in history

### Requirement: Query allowed target teams
The system SHALL provide an API endpoint to list teams that accept cross-team messages.

#### Scenario: Getting list of available target teams
- **WHEN** a user requests `GET /api/teams?acceptsCrossTeamMessages=true`
- **THEN** the system SHALL return a list of teams where `allowCrossTeamMessages: true`
- **AND** the list SHALL exclude the requesting team

### Requirement: Team permission in team list
The system SHALL include cross-team permission status in team information.

#### Scenario: Team list includes cross-team status
- **WHEN** a user requests team information via API
- **THEN** each team object SHALL include `allowCrossTeamMessages: boolean`
- **AND** the field SHALL be visible to all users (not just admins)
