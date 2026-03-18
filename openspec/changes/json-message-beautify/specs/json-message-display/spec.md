## ADDED Requirements

### Requirement: JSON message card display
The system SHALL display JSON messages as structured cards with visual hierarchy.

#### Scenario: Idle notification display
- **WHEN** a message with type `idle_notification` is received
- **THEN** the system displays a card with purple left border, agent name, status badge, and expand/collapse JSON toggle

#### Scenario: Permission request display
- **WHEN** a message with type `permission_request` is received
- **THEN** the system displays a card with orange left border, description, tool name, request ID, and expand/collapse JSON toggle

#### Scenario: Task assignment display
- **WHEN** a message with type `task_assignment` is received
- **THEN** the system displays a card with blue left border, subject, description, assignee, deadline, and expand/collapse JSON toggle

#### Scenario: Task completed display
- **WHEN** a message with type `task_completed` is received
- **THEN** the system displays a card with green left border, subject, completion details, and expand/collapse JSON toggle

#### Scenario: Shutdown request display
- **WHEN** a message with type `shutdown_request` is received
- **THEN** the system displays a card with gray left border, reason, waiting members list, and expand/collapse JSON toggle

#### Scenario: Shutdown response display
- **WHEN** a message with type `shutdown_response` is received
- **THEN** the system displays a card with green (approved) or red (rejected) left border, request ID, status, and expand/collapse JSON toggle

### Requirement: JSON syntax highlighting
The system SHALL display raw JSON with syntax highlighting when expanded.

#### Scenario: Expanded JSON syntax highlighting
- **WHEN** user clicks "查看原始 JSON" toggle
- **THEN** the JSON expands with keys in blue, strings in green, numbers in red, booleans in yellow

#### Scenario: Collapsed JSON default state
- **WHEN** a JSON message card is first rendered
- **THEN** the raw JSON section is collapsed by default

### Requirement: Type color mapping
The system SHALL use consistent color coding for message types.

#### Scenario: Type color identification
- **WHEN** any JSON message is displayed
- **THEN** the left border color matches the message type: idle=purple, permission=orange, task=blue, shutdown=gray, response=green/red

### Requirement: Status badges
The system SHALL display status badges for applicable message types.

#### Scenario: Pending status badge
- **WHEN** a permission request or shutdown request is displayed
- **THEN** a yellow "待处理"/"等待响应" badge is shown

#### Scenario: Active status badge
- **WHEN** an idle notification or task assignment is displayed
- **THEN** a blue "等待中"/"进行中" badge is shown

#### Scenario: Success status badge
- **WHEN** a task completion or approved response is displayed
- **THEN** a green "已完成"/"已同意" badge is shown

#### Scenario: Error status badge
- **WHEN** a rejected shutdown response is displayed
- **THEN** a red "已拒绝" badge is shown
