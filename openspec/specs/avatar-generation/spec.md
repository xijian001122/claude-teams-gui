## ADDED Requirements

### Requirement: System generates consistent avatar color from member name

The system SHALL generate a deterministic avatar color for any member name using a hash-based algorithm. The same name MUST always produce the same color across sessions, teams, and server restarts.

#### Scenario: Same name produces same color
- **WHEN** generating avatar color for "frontend-dev" multiple times
- **THEN** system returns the same hex color value each time

#### Scenario: Different names produce different colors
- **WHEN** generating avatar colors for "frontend-dev" and "backend-dev"
- **THEN** system returns visually distinct colors (different hues)

#### Scenario: Unknown name still gets a color
- **WHEN** generating avatar color for a new role like "ml-engineer"
- **THEN** system returns a valid hex color without fallback to default

### Requirement: Avatar colors are visually distinct and readable

The system SHALL generate colors with:
- Saturation between 60-70% for vibrant appearance
- Lightness at 50% for good contrast with white text
- Colors distributed across the full hue spectrum (0-360°)

#### Scenario: Colors have good saturation
- **WHEN** generating any avatar color
- **THEN** saturation is in the range of 60-70%

#### Scenario: Colors have good lightness
- **WHEN** generating any avatar color
- **THEN** lightness is at 50%

### Requirement: System extracts avatar letter from member name

The system SHALL extract a single uppercase letter from the member name to display on the avatar. The letter SHALL be the first character of the first word (split by hyphen).

#### Scenario: Single word name
- **WHEN** extracting letter from "tester"
- **THEN** system returns "T"

#### Scenario: Hyphenated name
- **WHEN** extracting letter from "frontend-dev"
- **THEN** system returns "F"

#### Scenario: Multi-part hyphenated name
- **WHEN** extracting letter from "team-lead-assistant"
- **THEN** system returns "T"

### Requirement: Avatar generation works without external dependencies

The avatar generation functions SHALL be pure functions with no database, file system, or network dependencies. All inputs come from function parameters.

#### Scenario: No database required
- **WHEN** calling generateAvatarColor with a name
- **THEN** function returns color without any database query

#### Scenario: No state required
- **WHEN** calling avatar generation functions in any order
- **THEN** results depend only on input, not on previous calls
