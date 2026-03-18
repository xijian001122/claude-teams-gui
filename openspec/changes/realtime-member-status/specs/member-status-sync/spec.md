# Member Status Sync

Real-time member status synchronization capability.

## Overview

This capability enables real-time synchronization of member status across all connected clients via WebSocket. Status changes are automatically detected based on message activity and broadcast to all team members.

## Definitions

- **Member Status**: The current activity state of a team member agent
  - `busy`: Agent is actively processing a task (red indicator)
  - `idle`: Agent is available but not processing (green indicator)
  - `offline`: Agent process is not running (not displayed)

## ADDED Requirements

### Requirement: Status Detection via Message Activity

The system SHALL detect member status changes based on message activity timestamps.

#### Scenario: Agent Becomes Busy on Message
WHEN a message is received from an agent
THEN the system SHALL set that agent's status to `busy`
AND the system SHALL broadcast a `member_status` event to all connected clients

#### Scenario: Agent Becomes Idle After Timeout
WHEN an agent has not sent any message for 30 seconds
THEN the system SHALL set that agent's status to `idle`
AND the system SHALL broadcast a `member_status` event to all connected clients

### Requirement: WebSocket Status Events

The system SHALL broadcast member status changes via WebSocket.

#### Scenario: Status Change Broadcast
WHEN a member's status changes
THEN the system SHALL send a WebSocket message with type `member_status`
AND the message SHALL include:
  - `team`: Team name
  - `member`: Member name
  - `status`: New status (`busy` | `idle` | `offline`)
  - `task`: Optional task description (when busy)
  - `timestamp`: ISO timestamp

### Requirement: Initial Status Sync

The system SHALL provide complete status on client connection.

#### Scenario: Client Joins Team
WHEN a client joins a team via WebSocket
THEN the system SHALL send the current status of all team members
AND the client SHALL display accurate status without refresh
