## ADDED Requirements

### Requirement: Task creation persists to filesystem

When a task is created via API, the system SHALL write the task data to `~/.claude/tasks/<team-name>/<task-id>.json`.

#### Scenario: Create new task
- **WHEN** client calls `POST /api/teams/:name/tasks` with valid task data
- **THEN** system creates a JSON file at `~/.claude/tasks/<team-name>/<task-id>.json`
- **AND** returns the created task with HTTP 201

#### Scenario: Task file format
- **WHEN** a task is persisted
- **THEN** the file SHALL contain valid JSON with all Task fields
- **AND** include `id`, `subject`, `status`, `createdAt`, `updatedAt` timestamps

### Requirement: Task update persists to filesystem

When a task is updated via API, the system SHALL update the corresponding JSON file.

#### Scenario: Update task status
- **WHEN** client calls `PUT /api/teams/:name/tasks/:id` with `{ "status": "completed" }`
- **THEN** system updates the task file
- **AND** returns the updated task with HTTP 200

#### Scenario: Update non-existent task
- **WHEN** client calls `PUT /api/teams/:name/tasks/:id` with invalid task ID
- **THEN** system returns HTTP 404 with error message

### Requirement: Task deletion removes from filesystem

When a task is deleted via API, the system SHALL remove the JSON file or mark status as deleted.

#### Scenario: Delete task
- **WHEN** client calls `DELETE /api/teams/:name/tasks/:id`
- **THEN** system sets task status to "deleted"
- **AND** returns HTTP 200

#### Scenario: Delete non-existent task
- **WHEN** client calls `DELETE /api/teams/:name/tasks/:id` with invalid task ID
- **THEN** system returns HTTP 404

### Requirement: Atomic file writes

Task file writes SHALL be atomic to prevent data corruption.

#### Scenario: Concurrent write protection
- **WHEN** multiple processes write to the same task file
- **THEN** the final file SHALL contain valid JSON from one of the writes
- **AND** no partial writes SHALL occur
