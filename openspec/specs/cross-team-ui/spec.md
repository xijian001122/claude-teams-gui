## ADDED Requirements

### Requirement: Display source team indicator
The system SHALL display a visual indicator on cross-team messages showing their source team.

#### Scenario: Incoming cross-team message display
- **GIVEN** a message with `originalTeam: "team-load"` is displayed in the developer team chat
- **WHEN** the message is rendered in the chat area
- **THEN** the message bubble SHALL display a badge showing "From: team-load" with the source team's color

#### Scenario: Outgoing cross-team message display
- **GIVEN** a message with `to: "team:developer"` is sent from team-load
- **WHEN** the message is displayed in team-load's chat
- **THEN** the message bubble SHALL display a badge showing "To: developer" with the target team's color

### Requirement: Cross-team message compose UI
The system SHALL provide a way to specify a target team when composing a message.

#### Scenario: Selecting target team in compose box
- **GIVEN** the user is composing a message in team-load
- **WHEN** the user clicks a "Send to team" button in the input box
- **THEN** a dropdown SHALL appear listing teams that accept cross-team messages
- **AND** the user SHALL be able to select a target team or "Current team only"

#### Scenario: Visual feedback for cross-team selection
- **GIVEN** the user has selected "developer" as the target team
- **WHEN** the message input is displayed
- **THEN** the input box SHALL show a visual indicator that the message will be sent to developer team
- **AND** the send button SHALL reflect the cross-team action

### Requirement: Cross-team message filtering
The system SHALL allow users to filter messages by cross-team status.

#### Scenario: Filtering to show only cross-team messages
- **GIVEN** the user is viewing a team's chat
- **WHEN** the user selects "Cross-team only" from the filter menu
- **THEN** only messages where `originalTeam` differs from the current team SHALL be displayed

#### Scenario: Filtering to exclude cross-team messages
- **GIVEN** the user is viewing a team's chat
- **WHEN** the user selects "Team only" from the filter menu
- **THEN** only messages where `originalTeam` equals the current team OR is null SHALL be displayed
