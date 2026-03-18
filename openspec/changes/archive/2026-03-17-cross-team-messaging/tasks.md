## 1. Database Schema Updates

- [x] 1.1 Add `originalTeam` column to messages table (nullable string, for cross-team tracking)
- [x] 1.2 Add `allowCrossTeamMessages` column to teams table (boolean, default false)
- [x] 1.3 Create database migration script

## 2. Shared Types Updates

- [x] 2.1 Update `Message` interface to include `originalTeam?: string` field
- [x] 2.2 Update `Team` interface to include `allowCrossTeamMessages: boolean`
- [x] 2.3 Update `SendMessageBody` to document `to: "team:<name>"` format
- [x] 2.4 Add new WebSocket event types: `cross_team_message`, `cross_team_message_sent`
- [x] 2.5 Update `ServerToClientEvents` interface with cross-team events

## 3. Backend - Core Cross-Team Messaging

- [x] 3.1 Update DatabaseService to support `originalTeam` in message queries
- [x] 3.2 Add `allowCrossTeamMessages` to team configuration in DatabaseService
- [x] 3.3 Implement cross-team message validation (target team exists, accepts messages)
- [x] 3.4 Implement message storage in both source and target team inboxes
- [x] 3.5 Add circular message prevention (block relay back to original team)

## 4. Backend - API Endpoints

- [x] 4.1 Update `POST /api/teams/:name/messages` to handle `to: "team:<name>"` format
- [x] 4.2 Add validation for cross-team messages (403 if target disabled)
- [x] 4.3 Update `GET /api/teams` to support `?acceptsCrossTeamMessages=true` filter
- [x] 4.4 Include `allowCrossTeamMessages` in team response objects
- [x] 4.5 Update `GET /api/teams/:name/messages` to return `originalTeam` field

## 5. Backend - WebSocket Protocol

- [x] 5.1 Add `cross_team_message` event type to WebSocket handler
- [x] 5.2 Implement broadcast of cross-team messages to target team clients
- [x] 5.3 Include `originalTeam` in cross-team message payload
- [x] 5.4 Add `cross_team_message_sent` confirmation event for sender

## 6. Frontend - State Management

- [x] 6.1 Update message types in frontend to include `originalTeam`
- [x] 6.2 Update team types to include `allowCrossTeamMessages`
- [x] 6.3 Add state for available cross-team targets

## 7. Frontend - API Client

- [x] 7.1 Update sendMessage API to support cross-team `to` parameter
- [x] 7.2 Add getCrossTeamTargets API to fetch teams accepting cross-team messages
- [x] 7.3 Update message fetching to handle `originalTeam` field

## 8. Frontend - UI Components - Message Display

- [x] 8.1 Update `MessageBubble` component to show "From: <team>" badge for incoming cross-team messages
- [x] 8.2 Update `MessageBubble` component to show "To: <team>" badge for outgoing cross-team messages
- [x] 8.3 Style badges with team colors from configuration

## 9. Frontend - UI Components - Compose Interface

- [x] 9.1 Add team selector dropdown to `InputBox` component
- [x] 9.2 Fetch and display teams with `allowCrossTeamMessages: true`
- [x] 9.3 Add visual indicator when a target team is selected
- [x] 9.4 Update send handler to include `to: "team:<name>"` when cross-team selected

## 10. Frontend - WebSocket Handling

- [x] 10.1 Add handler for `cross_team_message` event in `useWebSocket` hook
- [x] 10.2 Update message state when cross-team message received
- [x] 10.3 Show notification for incoming cross-team messages

## 11. Testing

- [ ] 11.1 Add unit tests for cross-team message validation logic
- [ ] 11.2 Add unit tests for circular message prevention
- [ ] 11.3 Add integration tests for cross-team message API
- [ ] 11.4 Add WebSocket tests for cross-team events
- [ ] 11.5 Add frontend component tests for MessageBubble team indicators

## 12. Documentation

- [ ] 12.1 Update API documentation with cross-team message format
- [ ] 12.2 Update WebSocket protocol documentation
- [ ] 12.3 Add user guide for cross-team messaging feature
