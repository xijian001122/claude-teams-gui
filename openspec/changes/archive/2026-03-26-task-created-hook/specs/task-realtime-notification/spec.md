## ADDED Requirements

### Requirement: Task creation triggers WebSocket broadcast

When a task is created via TaskCreate tool, the system SHALL broadcast a `task_created` WebSocket event to all connected clients.

#### Scenario: Task created broadcasts to all clients
- **WHEN** TaskCreate tool is called and succeeds
- **THEN** system sends WebSocket message with type `task_created`
- **AND** message includes task object with `id`, `subject`, `status`, `owner`, `teamName`

#### Scenario: Multiple clients receive notification
- **GIVEN** two browser clients are connected via WebSocket
- **WHEN** a new task is created
- **THEN** both clients receive the `task_created` event

### Requirement: Hook endpoint receives task creation events

The system SHALL provide an HTTP endpoint for Claude Code hooks to notify about task creation.

#### Scenario: Hook endpoint accepts task data
- **WHEN** POST request is sent to `/api/hooks/task-created`
- **AND** request body contains `{ "taskId": "123", "teamName": "my-team" }`
- **THEN** system returns HTTP 200
- **AND** system broadcasts WebSocket event

#### Scenario: Invalid request returns error
- **WHEN** POST request is sent to `/api/hooks/task-created`
- **AND** request body is missing required fields
- **THEN** system returns HTTP 400 with error message

### Requirement: Frontend updates task list on event

The frontend SHALL automatically update the task list when receiving `task_created` WebSocket event.

#### Scenario: Task appears in list without refresh
- **GIVEN** user is viewing task panel
- **WHEN** `task_created` event is received for current team
- **THEN** new task is added to the task list
- **AND** no page refresh is required

#### Scenario: Task for different team is ignored
- **GIVEN** user is viewing team "team-a"
- **WHEN** `task_created` event is received for team "team-b"
- **THEN** task list remains unchanged
- **AND** no visual update occurs

### Requirement: Duplicate notifications are prevented

The frontend SHALL prevent duplicate tasks from multiple notifications.

#### Scenario: Same task ID received twice
- **GIVEN** task list already contains task with ID "123"
- **WHEN** another `task_created` event arrives with same task ID
- **THEN** task list remains unchanged
- **AND** no duplicate entry is created
