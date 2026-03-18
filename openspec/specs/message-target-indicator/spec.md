## ADDED Requirements

### Requirement: Display message target recipient in bubble
The system SHALL display a visual indicator inside the message bubble showing the intended recipient when a message has a specific `to` field.

#### Scenario: Message with specific target displays @username badge
- **GIVEN** a message with `to: "team-lead"` is displayed
- **WHEN** the message bubble is rendered
- **THEN** a badge showing "@team-lead" SHALL appear at the top of the bubble
- **AND** the badge SHALL be styled with a light background color

#### Scenario: Message to current user displays distinctive badge
- **GIVEN** a message with `to: "user"` is displayed to the current user
- **WHEN** the message bubble is rendered
- **THEN** a badge showing "@你" (or "@you") SHALL appear
- **AND** the badge SHALL use a distinctive color (green) to indicate it's for the current user

#### Scenario: Public message does not display target badge
- **GIVEN** a message with `to: null` is displayed
- **WHEN** the message bubble is rendered
- **THEN** no target recipient badge SHALL be displayed
- **AND** the message SHALL appear as a regular public message

### Requirement: Style message target badges consistently
The system SHALL use consistent styling for message target badges across light and dark themes.

#### Scenario: Badge styling in light theme
- **GIVEN** the application is in light theme
- **WHEN** a message target badge is displayed
- **THEN** for other recipients: background SHALL be light blue (#e0f2fe) with blue text (#0369a1)
- **AND** for current user: background SHALL be light green (#dcfce7) with green text (#15803d)

#### Scenario: Badge styling in dark theme
- **GIVEN** the application is in dark theme
- **WHEN** a message target badge is displayed
- **THEN** the badge SHALL use darker color variants that maintain contrast

### Requirement: Badge formatting rules
The system SHALL format the target recipient display according to consistent rules.

#### Scenario: Long usernames are truncated
- **GIVEN** a message has a target with a very long username (over 20 characters)
- **WHEN** the badge is displayed
- **THEN** the username SHALL be truncated with ellipsis (e.g., "@verylonguserna...")

#### Scenario: Badge is positioned at top of bubble
- **GIVEN** any message with a target recipient
- **WHEN** the message bubble is rendered
- **THEN** the badge SHALL appear at the top of the bubble content
- **AND** the badge SHALL have appropriate margin below it before the message content
