## ADDED Requirements

### Requirement: Get Member Session Info
The system SHALL provide an API to retrieve a member's registered session information.

#### Scenario: Returns session when registered
- **WHEN** GET `/api/teams/fhd-app-team/members/developer/session` is called
- **AND** session is registered at `~/.claude/teams/fhd-app-team/sessions/developer.json`
- **THEN** response is 200 with `{ memberName, teamName, sessionId, cwd, registeredAt }`

#### Scenario: Returns 404 when not registered
- **WHEN** GET `/api/teams/fhd-app-team/members/developer/session` is called
- **AND** no session file exists
- **THEN** response is 404 with `{ error: "Session not registered" }`

### Requirement: Get Member Conversation History
The system SHALL provide an API to retrieve a member's conversation history from their session.

#### Scenario: Returns conversation messages
- **WHEN** GET `/api/teams/fhd-app-team/members/developer/conversation?limit=50` is called
- **AND** session is registered with sessionId "abc-123"
- **AND** conversation file exists at `~/.claude/projects/<hash>/abc-123.jsonl`
- **THEN** response is 200 with:
  ```json
  {
    "memberName": "developer",
    "sessionId": "abc-123",
    "messages": [
      { "role": "user", "content": "...", "timestamp": "..." },
      { "role": "assistant", "content": "...", "timestamp": "..." }
    ]
  }
  ```

#### Scenario: Returns 404 when session not registered
- **WHEN** no session registration exists
- **THEN** response is 404 with `{ error: "Session not registered" }`

#### Scenario: Returns 404 when conversation file not found
- **WHEN** session is registered but `.jsonl` file doesn't exist
- **THEN** response is 404 with `{ error: "Conversation not found" }`

#### Scenario: Limits returned messages
- **WHEN** `limit=10` query parameter is provided
- **THEN** only the 10 most recent messages are returned

### Requirement: JSONL Parsing
The system SHALL correctly parse Claude's JSONL conversation format.

#### Scenario: Extracts user and assistant messages
- **WHEN** parsing a JSONL file with entries of type "user" and "assistant"
- **THEN** only user and assistant messages are included in the response
- **AND** other entry types (tool_use, system, etc) are filtered out

#### Scenario: Extracts text content from assistant message
- **WHEN** assistant message has content array with `{ type: "text", text: "..." }` blocks
- **THEN** the text from all text blocks is concatenated

#### Scenario: Handles malformed lines gracefully
- **WHEN** a line in JSONL file cannot be parsed
- **THEN** the line is skipped without error
- **AND** parsing continues with next line
