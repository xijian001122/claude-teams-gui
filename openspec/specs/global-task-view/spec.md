## ADDED Requirements

### Requirement: List all tasks across teams

The system SHALL provide an API endpoint to retrieve tasks from all teams.

#### Scenario: Get all tasks
- **WHEN** client calls `GET /api/tasks`
- **THEN** system returns an array of tasks from all teams
- **AND** each task includes `teamName` field identifying its source team

#### Scenario: Empty task list
- **WHEN** no tasks exist in any team
- **THEN** system returns empty array `{ "success": true, "data": { "tasks": [] } }`

### Requirement: Filter tasks by status

The system SHALL support filtering tasks by their status.

#### Scenario: Filter by single status
- **WHEN** client calls `GET /api/tasks?status=in_progress`
- **THEN** system returns only tasks with status "in_progress"

#### Scenario: Filter by multiple statuses
- **WHEN** client calls `GET /api/tasks?status=pending,in_progress`
- **THEN** system returns tasks with status "pending" OR "in_progress"

#### Scenario: Invalid status filter
- **WHEN** client calls `GET /api/tasks?status=invalid_status`
- **THEN** system returns empty array (no matches)

### Requirement: Include task counts by status

The API response SHALL include summary counts of tasks by status.

#### Scenario: Task counts in response
- **WHEN** client calls `GET /api/tasks`
- **THEN** response includes `counts` object:
  ```json
  {
    "counts": {
      "total": 10,
      "pending": 3,
      "in_progress": 2,
      "completed": 4,
      "deleted": 1
    }
  }
  ```
