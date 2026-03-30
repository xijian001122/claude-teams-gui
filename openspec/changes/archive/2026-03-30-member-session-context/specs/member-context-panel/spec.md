## ADDED Requirements

### Requirement: Display Member Conversation Panel
The system SHALL provide a UI component to display a member's conversation history.

#### Scenario: Renders conversation with user/assistant distinction
- **WHEN** user clicks "View Context" button on member
- **THEN** a panel opens showing conversation history
- **AND** user messages are displayed on a right-aligned or avatar/icon style
- **AND** assistant messages are displayed in a left-aligned, different style

#### Scenario: Shows loading state
- **WHEN** conversation data is being fetched
- **THEN** a loading spinner is displayed

#### Scenario: Shows error when session not registered
- **WHEN** member has not registered a session
- **THEN** panel shows "Session not registered" message
- **AND** no conversation history is displayed

### Requirement: Auto-refresh Conversation
The system SHALL automatically refresh conversation data at configurable intervals.

#### Scenario: Refreshes at interval
- **WHEN** auto-refresh is enabled (default: every 5 seconds)
- **THEN** conversation data is fetched periodically
- **AND** UI updates without user action

#### Scenario: Toggle auto-refresh
- **WHEN** user toggles auto-refresh checkbox
- **THEN** periodic fetching is enabled or disabled

### Requirement: Limit Conversation Length
    system SHALL limit the number of messages displayed to prevent performance issues.

#### Scenario: Default limit of- **WHEN** no limit parameter is specified
- **THEN** only the most recent 50 messages are displayed

#### Scenario: Custom limit
- **WHEN** limit parameter is set to 100
- **THEN** the most recent 100 messages are displayed
