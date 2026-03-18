## ADDED Requirements

### Requirement: Send cross-team messages
The system SHALL allow users to send messages from one team to another using the `to` field with `team:<teamName>` format.

#### Scenario: Sending message to another team
- **WHEN** a user sends a POST request to `/api/teams/:name/messages` with `to: "team:developer"`
- **THEN** the system SHALL validate that the target team exists and accepts cross-team messages
- **AND** the system SHALL store the message in the source team's outbox
- **AND** the system SHALL store the message in the target team's inbox
- **AND** the system SHALL broadcast the message via WebSocket to the target team's connected clients

#### Scenario: Rejecting cross-team message when target team disabled
- **WHEN** a user sends a message with `to: "team:developer"` and the developer team has `allowCrossTeamMessages: false`
- **THEN** the system SHALL return a 403 Forbidden error with message "Cross-team messaging is disabled for target team"

#### Scenario: Rejecting message to non-existent team
- **WHEN** a user sends a message with `to: "team:nonexistent"`
- **THEN** the system SHALL return a 404 Not Found error

### Requirement: Receive cross-team messages
The system SHALL deliver cross-team messages to the target team in real-time via WebSocket.

#### Scenario: Receiving cross-team message in real-time
- **WHEN** a cross-team message is sent from team-load to developer
- **AND** a user is connected to the developer team via WebSocket
- **THEN** the user SHALL receive a `cross_team_message` event with the message data including `originalTeam: "team-load"`

#### Scenario: Loading cross-team message history
- **WHEN** a user requests messages for their team via `GET /api/teams/:name/messages`
- **THEN** the response SHALL include cross-team messages where `originalTeam` differs from the requested team
- **AND** each cross-team message SHALL include the `originalTeam` field

### Requirement: Prevent circular message loops
The system SHALL prevent cross-team messages from being relayed back to their original team.

#### Scenario: Blocking relay back to original team
- **GIVEN** a message was originally sent from team-load with `originalTeam: "team-load"`
- **WHEN** someone attempts to forward it back to team-load
- **THEN** the system SHALL reject the request with 400 Bad Request

### Requirement: Track message origin
The system SHALL track the original source team for all cross-team messages.

#### Scenario: Storing original team information
- **WHEN** a cross-team message is created
- **THEN** the message SHALL include an `originalTeam` field set to the source team name
- **AND** the message SHALL include a `to` field with value `team:<targetTeam>`
