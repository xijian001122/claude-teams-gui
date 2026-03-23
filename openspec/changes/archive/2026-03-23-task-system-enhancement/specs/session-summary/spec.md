## ADDED Requirements

### Requirement: Generate session summary on team close

When a team session ends, the system SHALL generate a Markdown summary file.

#### Scenario: Summary file creation
- **WHEN** team session ends (TeamDelete or shutdown)
- **THEN** system creates `session-summary-<timestamp>.md` in team directory
- **AND** file contains task statistics and task lists

### Requirement: Summary includes task statistics

The summary SHALL include aggregate task counts.

#### Scenario: Statistics section
- **WHEN** summary is generated
- **THEN** it includes:
  - Total tasks count
  - Completed tasks count
  - In-progress tasks count
  - Pending tasks count
  - Blocked tasks count

### Requirement: Summary lists completed tasks

The summary SHALL list all completed tasks with their details.

#### Scenario: Completed tasks section
- **WHEN** at least one task is completed
- **THEN** summary includes a table with:
  - Task ID
  - Task subject
  - Owner (if assigned)
  - Completion time (from history)

### Requirement: Summary lists incomplete tasks

The summary SHALL list tasks that were not completed.

#### Scenario: Incomplete tasks section
- **WHEN** at least one task is not completed
- **THEN** summary includes a table with:
  - Task ID
  - Task subject
  - Current status
  - Owner (if assigned)
  - Blocked by (if applicable)

### Requirement: Summary format is Markdown

The summary file SHALL use standard Markdown format for readability.

#### Scenario: Markdown structure
- **WHEN** summary is generated
- **THEN** file uses:
  - `#` for main title
  - `##` for sections
  - Tables for task lists
  - ISO 8601 timestamps
