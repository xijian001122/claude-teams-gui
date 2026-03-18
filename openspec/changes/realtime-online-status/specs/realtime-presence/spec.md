## ADDED Requirements

### requirement: Member online status is broadcast in real-time

The system SHALL broadcast member online/offline status changes via WebSocket to all connected clients.

 the events SHALL be `member_online` and `member_offline`.

#### scenario: Member becomes online
- **WHEN** a member's `isActive` status changes to true
- **THEN** system broadcasts `member_online` event to all WebSocket clients

#### scenario: Member becomes offline
- **WHEN** a member's `isActive` status changes to false
- **THEN** system broadcasts `member_offline` event to all WebSocket clients

