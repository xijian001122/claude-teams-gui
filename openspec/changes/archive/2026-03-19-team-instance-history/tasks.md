## 1. Database Schema Changes

- [x] 1.1 Add `team_instance_id` column to messages table
- [x] 1.2 Add `source_project` column to messages table
- [x] 1.3 Add `team_instance_id` column to teams table
- [x] 1.4 Update DatabaseService.rowToMessage() to include new fields
- [x] 1.5 Update DatabaseService.rowToTeam() to include teamInstance

## 2. Backend: Team Instance Detection

- [x] 2.1 Create utility function to get directory birth time (with mtime fallback)
- [x] 2.2 Update DataSyncService.syncTeam() to extract and store teamInstance
- [x] 2.3 Update DataSyncService.syncTeam() to extract sourceProject from cwd
- [x] 2.4 Update message insert to include teamInstance and sourceProject

## 3. Backend: FileWatcher Events

- [x] 3.1 Update FileWatcherService to detect team directory recreation
- [x] 3.2 Add `team_instance_changed` WebSocket event emission
- [x] 3.3 Update FileWatcherService to send oldInstance and newInstance in event

## 4. Frontend: WebSocket Event Handling

- [ ] 4.1 Add `team_instance_changed` event handler in app.tsx
- [ ] 4.2 Clear messages Map entry when team instance changes
- [ ] 4.3 Trigger reload of team messages on instance change

## 5. Frontend: Instance-Aware Message Display

- [ ] 5.1 Update Message type to include teamInstance
- [ ] 5.2 Modify message grouping logic in ChatArea to group by instance
- [ ] 5.3 Add visual divider component between instances
- [ ] 5.4 Implement "show history" toggle for historical instances
- [ ] 5.5 Style divider with "团队已重建" label and timestamp

## 6. API: Instance-Aware Message Queries

- [x] 6.1 Update GET /api/teams/:name/messages to support `?instance=` filter
- [x] 6.2 Update GET /api/teams/:name/messages to return instance metadata
- [x] 6.3 Modify loadMessages() to pass current teamInstance

## 7. Testing

- [x] 7.1 Write unit test for directory birth time extraction
- [x] 7.2 Write unit test for sourceProject extraction from cwd
- [x] 7.3 Test team recreation triggers new instance
- [ ] 7.4 Test frontend displays divider between instances (pending frontend implementation)
- [x] 7.5 Test instance filter in messages API
