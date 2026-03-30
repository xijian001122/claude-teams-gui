# Task List Display Specification

## ADDED Requirements

### Requirement: Task list API endpoint

The system SHALL provide a REST API endpoint to retrieve tasks for a specific team.

#### Scenario: Fetch tasks for a team
- **WHEN** client requests `GET /api/teams/:name/tasks`
- **THEN** system returns a JSON response with task list
- **THEN** response includes task id, subject, owner, status, and blockedBy fields

#### Scenario: Handle non-existent team
- **WHEN** client requests tasks for a team that does not exist
- **THEN** system returns an empty task list

#### Scenario: Handle missing tasks directory
- **WHEN** the tasks directory for a team does not exist
- **THEN** system returns an empty task list

### Requirement: Task data structure

The task data structure SHALL include the following fields:

| Field | Type | Description |
|------|------|-------------|
| id | string | Unique task identifier |
| subject | string | Task title |
| description | string | Detailed task description |
| status | enum | pending, in_progress, completed, deleted |
| owner | string | Agent assigned to the task |
| blockedBy | string[] | List of task IDs this task depends on |

#### Scenario: Task status values
- **WHEN** task is created
- **THEN** status defaults to "pending"
- **WHEN** task is started
- **THEN** status changes to "in_progress"
- **WHEN** task is finished
- **THEN** status changes to "completed"

### Requirement: Task list UI component

The frontend SHALL display a task list panel in the sidebar component.

#### Scenario: Display task list
- **WHEN** user selects a team
- **THEN** task panel shows all tasks for that team
- **THEN** each task row displays id, subject, owner, and status

#### Scenario: Display task status
- **WHEN** task status is "completed"
- **THEN** task row shows green checkmark icon
- **WHEN** task status is "in_progress"
- **THEN** task row shows blue spinner icon
- **WHEN** task status is "pending"
- **THEN** task row shows gray hourglass icon

#### Scenario: Display task dependencies
- **WHEN** a task has dependencies in blockedBy field
- **THEN** task status shows "waiting for #X" indicator
- **THEN** dependency information is visible to user

### Requirement: Collapsible task panel

The task panel SHALL be collapsible to save screen space.

#### Scenario: Collapse task panel
- **WHEN** user clicks collapse button
- **THEN** task panel collapses to a single header row
- **THEN** task count is still visible in collapsed state

#### Scenario: Expand task panel
- **WHEN** user clicks expand button on collapsed panel
- **THEN** task panel expands to show full task list
