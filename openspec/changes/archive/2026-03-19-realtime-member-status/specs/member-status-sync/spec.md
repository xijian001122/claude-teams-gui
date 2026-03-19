# Member Status Sync

Real-time member status synchronization capability.

## Overview

This capability enables real-time synchronization of member status across all connected clients via WebSocket. Status changes are automatically detected based on message activity and idle notifications, then broadcast to all team members.

## Definitions

- **Member Status**: The current activity state of a team member agent
  - `busy`: Agent sent a message recently (red indicator)
  - `idle`: Agent sent idle_notification (green indicator)
  - `occupied`: Agent has been busy for 5+ minutes (yellow indicator)
  - `offline`: No status change for 30+ minutes (gray indicator)

## State Machine

```
busy → occupied (5 min) → idle (30 sec) → offline (30 min)
idle → offline (30 min)
occupied → idle (30 sec)
```

## ADDED Requirements

### Requirement: Status Detection via Message Activity

The system SHALL detect member status changes based on message activity and idle notifications.

#### Scenario: Agent Becomes Busy on Message
WHEN a message (non-idle_notification) is received from an agent
THEN the system SHALL set that agent's status to `busy`
AND the system SHALL broadcast a `member_status` event to all connected clients

#### Scenario: Agent Becomes Idle on idle_notification
WHEN an idle_notification message is received from an agent
THEN the system SHALL set that agent's status to `idle`
AND the system SHALL broadcast a `member_status` event to all connected clients

#### Scenario: Busy Becomes Occupied After 5 Minutes
WHEN an agent's status is `busy` and 5 minutes have passed
THEN the system SHALL set that agent's status to `occupied`
AND the system SHALL broadcast a `member_status` event to all connected clients

#### Scenario: Occupied Becomes Idle After 30 Seconds
WHEN an agent's status is `occupied` and 30 seconds have passed
THEN the system SHALL set that agent's status to `idle`
AND the system SHALL broadcast a `member_status` event to all connected clients

#### Scenario: Agent Becomes Offline After 30 Minutes
WHEN an agent's status has not changed for 30 minutes
THEN the system SHALL set that agent's status to `offline`
AND the system SHALL broadcast a `member_status` event to all connected clients

### Requirement: WebSocket Status Events

The system SHALL broadcast member status changes via WebSocket.

#### Scenario: Status Change Broadcast
WHEN a member's status changes
THEN the system SHALL send a WebSocket message with type `member_status`
AND the message SHALL include:
  - `team`: Team name
  - `members`: Array of MemberStatusInfo objects

### Requirement: Initial Status Sync

The system SHALL provide complete status on client connection.

#### Scenario: Client Joins Team
WHEN a client joins a team via WebSocket with `join_team` message
THEN the system SHALL initialize all team members as `offline` (if not already tracked)
AND the system SHALL send the current status of all team members
AND the client SHALL display accurate status without refresh

#### Scenario: Member Already Tracked
WHEN a client joins a team and a member is already tracked
THEN the system SHALL NOT overwrite the existing status with `offline`
AND the system SHALL preserve the current tracked status

### Requirement: Periodic Status Recalculation

The system SHALL periodically recalculate member statuses based on elapsed time.

#### Scenario: Tick Updates Occupied/Offline Status
WHEN tick() is called (every 5 seconds)
THEN the system SHALL recalculate statuses for all tracked members
AND the system SHALL transition members based on elapsed time
AND the system SHALL broadcast updated statuses to all connected clients
