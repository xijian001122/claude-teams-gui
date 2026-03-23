## ADDED Requirements

### Requirement: Track task status changes

The system SHALL record a history entry when a task's status changes.

#### Scenario: Status change creates history
- **WHEN** task status changes from "pending" to "in_progress"
- **THEN** a history entry is appended to `task.history` array:
  ```json
  {
    "timestamp": "2026-03-23T15:30:00Z",
    "field": "status",
    "oldValue": "pending",
    "newValue": "in_progress",
    "changedBy": "frontend-dev"
  }
  ```

### Requirement: Track owner changes

The system SHALL record a history entry when a task's owner changes.

#### Scenario: Owner assignment creates history
- **WHEN** task owner is set from null to "backend-dev"
- **THEN** a history entry is appended with `field: "owner"`

#### Scenario: Owner reassignment creates history
- **WHEN** task owner changes from "frontend-dev" to "bug-fixer"
- **THEN** a history entry records both old and new owner

### Requirement: Track subject and description changes

The system SHALL record a history entry when task subject or description is modified.

#### Scenario: Subject modification
- **WHEN** task subject is updated
- **THEN** a history entry with `field: "subject"` is created

### Requirement: History entries are immutable

Once created, history entries SHALL NOT be modified or deleted.

#### Scenario: No history modification
- **WHEN** task is updated again
- **THEN** new history entry is appended
- **AND** existing history entries remain unchanged

### Requirement: History size limit

The system SHALL limit history entries to prevent unbounded growth.

#### Scenario: History trimming
- **WHEN** history exceeds 100 entries
- **THEN** oldest entries are removed to maintain limit
