## ADDED Requirements

### Requirement: Permission request card displays action buttons
The system SHALL render "Approve" and "Reject" buttons within the `permission_request` JSON message card when the request status is "pending".

#### Scenario: Display buttons for pending request
- **WHEN** a `permission_request` message with `status: "pending"` (or no status) is rendered
- **THEN** the card displays two buttons: "✓ Approve" and "✗ Reject"
- **AND** the buttons are styled with distinct colors (green for approve, red for reject)

#### Scenario: Hide buttons for resolved request
- **WHEN** a `permission_request` message with `status: "approved"` or `status: "rejected"` is rendered
- **THEN** the card displays a status badge instead of buttons
- **AND** the badge shows "✓ Approved" or "✗ Rejected" with the response timestamp

### Requirement: Clicking approve sends permission response
The system SHALL send a `permission_response` message when the user clicks the "Approve" button.

#### Scenario: User approves permission request
- **WHEN** user clicks the "Approve" button on a permission request card
- **THEN** the system sends a POST request to `/teams/{teamName}/permission-response`
- **AND** the request body contains `request_id`, `approve: true`, and `timestamp`
- **AND** the UI immediately updates to show "Approved" status
- **AND** the buttons are disabled to prevent duplicate clicks

### Requirement: Clicking reject sends permission response
The system SHALL send a `permission_response` message when the user clicks the "Reject" button.

#### Scenario: User rejects permission request
- **WHEN** user clicks the "Reject" button on a permission request card
- **THEN** the system sends a POST request to `/teams/{teamName}/permission-response`
- **AND** the request body contains `request_id`, `approve: false`, and `timestamp`
- **AND** the UI immediately updates to show "Rejected" status
- **AND** the buttons are disabled to prevent duplicate clicks

### Requirement: Permission response updates original message
The system SHALL update the original `permission_request` message's content to reflect the response.

#### Scenario: Message updated after response
- **WHEN** a permission response is successfully sent
- **THEN** the original `permission_request` message content is updated
- **AND** the content includes `status` field set to "approved" or "rejected"
- **AND** the content includes `response` object with `approved` boolean and `timestamp`

### Requirement: Backend forwards permission response to agent
The system SHALL forward the `permission_response` to the requesting agent's inbox.

#### Scenario: Response forwarded to agent inbox
- **WHEN** the backend receives a `permission_response` POST request
- **THEN** the system writes a `permission_response` message to the requesting agent's inbox JSON file
- **AND** the message follows the format: `{ type: "permission_response", request_id, subtype: "success", response: { updated_input, permission_updates } }`

## MODIFIED Requirements

### Requirement: JSON message card supports interactive elements
The `JsonMessageCard` component SHALL support rendering interactive elements based on message type and state.

#### Scenario: Render interactive permission request
- **WHEN** `JsonMessageCard` receives a `permission_request` type message
- **THEN** it renders the message details (agent, description, tool, etc.)
- **AND** it renders action buttons if status is pending
- **AND** it accepts an `onPermissionResponse` callback prop
- **AND** it calls the callback when buttons are clicked
