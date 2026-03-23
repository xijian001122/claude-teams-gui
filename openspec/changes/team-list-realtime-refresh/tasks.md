# Tasks: Team List Realtime Refresh

## 1. Backend - WebSocket Broadcast

- [ ] 1.1 Add `broadcastTeamAdded()` method to FileWatcherService
  - Follow existing `broadcastTeamInstanceChanged()` pattern
  - Accept team object as parameter
  - Broadcast to all connected WebSocket clients
  - Log broadcast count

- [ ] 1.2 Modify `addDir` event handler to call broadcast
  - Call `syncTeam()` with await to get team object
  - Call `broadcastTeamAdded()` if team is returned
  - Handle async/await properly

## 2. Frontend - Event Handler

- [ ] 2.1 Add `team_added` case to WebSocket message handler in app.tsx
  - Add new case in `useEffect` for `lastMessage`
  - Log received event
  - Call `loadTeams()` to refresh team list
  - Call `loadCrossTeamTargets()` to update cross-team messaging targets

## 3. Testing

- [ ] 3.1 Manual testing
  - Start application
  - Create new team via Claude
  - Verify team appears in web UI without restart
  - Verify team appears in cross-team target list

## 4. Documentation

- [ ] 4.1 Update WebSocket protocol documentation
  - Document new `team_added` event type
  - Add to message format specification
