## ADDED Requirements

### Requirement: Team list avatar uses hash-based color

The system SHALL generate team avatar colors using the same hash-based algorithm used for member avatars. Team name SHALL be the input for color generation, ensuring consistent colors across sessions.

#### Scenario: Team avatar color is deterministic
- **WHEN** displaying a team in the sidebar
- **THEN** the avatar color is generated from `generateAvatarColor(team.name)`

#### Scenario: Same team name produces same color
- **WHEN** the same team is displayed in different sessions or after restart
- **THEN** the avatar color remains identical

### Requirement: Team list displays smart historical time format

The system SHALL display team last activity time using a smart format based on how recent the activity was:
- Today: "今天 HH:mm"
- Yesterday: "昨天 HH:mm"
- Older: "M月D日 HH:mm"

#### Scenario: Activity from today
- **WHEN** team last activity is on the current day
- **THEN** system displays "今天" followed by the time (e.g., "今天 14:30")

#### Scenario: Activity from yesterday
- **WHEN** team last activity was on the previous day
- **THEN** system displays "昨天" followed by the time (e.g., "昨天 18:45")

#### Scenario: Activity from earlier
- **WHEN** team last activity was more than one day ago
- **THEN** system displays the date and time (e.g., "3月15日 09:00")

### Requirement: Online member count accurately reflects member status

The system SHALL calculate online member count based on the `isOnline` property of each team member. The count SHALL include all members where `isOnline === true`.

#### Scenario: Count online members
- **WHEN** displaying team info in the header
- **THEN** the online count equals `team.members.filter(m => m.isOnline).length`

#### Scenario: User member is always online
- **WHEN** the auto-generated "user" member is included in the team
- **THEN** `isOnline` is set to `true`
