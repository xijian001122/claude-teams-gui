## Why

Currently, Claude Chat only supports communication within a single team. Teams operate in isolation and cannot send messages to each other. Users need the ability for cross-team collaboration - for example, team-load should be able to send messages directly to the developer team. This enables better coordination between different AI agent teams working on related tasks.

## What Changes

- **Add target team support to messages**: Extend the message data model to support specifying a target team for cross-team communication
- **New cross-team messaging API**: Add REST API endpoints for sending messages to other teams
- **WebSocket protocol extension**: Add new event types for cross-team message delivery and notifications
- **UI indicators for cross-team messages**: Display visual indicators in the chat interface showing when a message is from another team or sent to another team
- **Cross-team message history**: Support retrieving cross-team messages in the message history
- **Permission model**: Basic permission check to ensure teams can communicate (opt-in configuration per team)

## Capabilities

### New Capabilities
- `cross-team-messaging`: Core cross-team message sending and receiving functionality
- `cross-team-ui`: UI components for displaying and composing cross-team messages
- `team-permissions`: Team-level permission configuration for cross-team communication

### Modified Capabilities
- `message-routing`: Extended to support routing messages to different teams

## Impact

- **API Changes**: New endpoints for cross-team messaging (`POST /api/teams/:name/cross-messages`)
- **WebSocket Protocol**: New event types `cross_team_message`, `cross_team_message_sent`
- **Database Schema**: Messages table may need `targetTeam` column for outgoing cross-team messages
- **UI Changes**: MessageBubble component to show source/target team indicators
- **Configuration**: New team config options for cross-team communication permissions
