## ADDED Requirements

### Requirement: SubagentStart Hook Registration
The system SHALL register a subagent's session information when the SubagentStart hook fires.

#### Scenario: Subagent registers session successfully
- **WHEN** a subagent starts with agent_id "developer@fhd-app-team" and session_id "abc-123"
- **THEN** the system writes a registration file to `~/.claude/teams/fhd-app-team/sessions/developer.json`
- **AND** the file contains `{ memberName: "developer", teamName: "fhd-app-team", sessionId: "abc-123", registeredAt: "<timestamp>" }`

#### Scenario: Subagent overwrites previous registration
- **WHEN** a subagent with the same member name restarts
- **THEN** the previous registration file is overwritten with new session info

### Requirement: Session Registration File Format
The system SHALL store session registration in a standardized JSON format.

#### Scenario: Registration file contains all required fields
- **WHEN** a session is registered
- **THEN** the registration file includes:
  - `memberName`: The member's name from config.json
  - `teamName`: The team name
  - `agentId`: The full agent_id from hook
  - `agentType`: The agent type (builder/validator/general-purpose/etc)
  - `sessionId`: The Claude session ID
  - `cwd`: The current working directory
  - `registeredAt`: ISO 8601 timestamp

### Requirement: Team and Member Name Resolution
The system SHALL resolve team name and member name from the agent_id or cwd.

#### Scenario: Resolve from agent_id format
- **WHEN** agent_id is "developer@fhd-app-team"
- **THEN** memberName is "developer" and teamName is "fhd-app-team"

#### Scenario: Resolve from config.json when agent_id lacks team
- **WHEN** agent_id is "agent-uuid-123" (no @ separator)
- **THEN** the system searches `~/.claude/teams/*/config.json` for matching cwd
- **AND** extracts member name and team name from the match
