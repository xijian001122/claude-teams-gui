# Team List Realtime Refresh - Design

## Context

This design addresses the real-time team list synchronization issue in Claude Chat. Currently, when Claude creates a new team after the web client has connected, the team does not appear in the sidebar until the application is restarted.

## Goals

1. **Real-time Team Detection**: Broadcast new team creation to all connected WebSocket clients immediately
2. **Automatic UI Update**: Frontend refreshes team list without user intervention
3. **Pattern Consistency**: Follow existing WebSocket event patterns (`team_archived`, `team_instance_changed`)

## Non-Goals

- Modifying team deletion/archival logic (already works)
- Changing the API endpoint structure for teams
- Implementing optimistic UI updates (fetch after broadcast confirmation)

## Decisions

### D1: WebSocket Event Type Definition

**Decision**: Use event type `team_added` with team object payload

**Rationale**:
- Follow existing naming convention (`team_archived`, `team_instance_changed`)
- Include full team object to allow frontend to update state immediately

```typescript
// WebSocket message format
{
  type: 'team_added',
  team: Team  // Full team object from database
}
```

**Alternatives Considered**:
- Event with just team name → Rejected: Requires additional API call to fetch team details
- Optimistic update with partial data → Rejected: UI needs full team info for display

### D2: Broadcast Location

**Decision**: Add broadcast in `FileWatcherService.addDir` handler after `syncTeam()` completes

**Rationale**:
- `syncTeam()` returns the team object with full data
- `FileWatcherService` already has `fastify` reference for WebSocket server
- Consistent with existing pattern in `broadcastTeamInstanceChanged()`

```typescript
// In file-watcher.ts, line 46-52
teamsWatcher.on('addDir', async (path) => {
  const teamName = path.split('/').pop();
  if (teamName && !teamName.startsWith('.')) {
    console.log(`[FileWatcher] New team detected: ${teamName}`);
    this.watchTeam(teamName);
    const team = await this.dataSync.syncTeam(teamName);  // Get team object

    // NEW: Broadcast team_added event
    if (team) {
      this.broadcastTeamAdded(team);
    }
  }
});
```

**Alternatives Considered**:
- Broadcast in `DataSyncService` → Rejected: FileWatcher owns the monitoring responsibility
- Broadcast after database write only → Rejected: Need team object for payload

### D3: Frontend Event Handler

**Decision**: Add `team_added` case in `app.tsx` WebSocket message handler, call `loadTeams()`

**Rationale**:
- Follow existing pattern in `team_archived` handler (lines 118-124)
- `loadTeams()` fetches from API ensuring data consistency
- Simpler than manually adding team to state (avoids sync issues)

```typescript
// In app.tsx, after line 116
if (lastMessage.type === 'team_added' && lastMessage.team) {
  console.log('[App] Team added:', lastMessage.team.name);
  // Reload teams list from API to ensure consistency
  loadTeams();
  loadCrossTeamTargets();  // Also refresh cross-team targets
}
```

**Alternatives Considered**:
- Add team directly to state → Rejected: Could cause stale data if team info differs
- Show notification only → Rejected: User needs to see team in list

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Team sync might be slow | Non-blocking; UI updates when broadcast arrives |
| Multiple rapid team creations | Idempotent; database handles duplicates via `upsertTeam` |
| Client disconnects during creation | Next connection gets full list via API on mount |
| Large team objects in broadcast | Team objects are small (~2KB max); acceptable overhead |

## Implementation Notes

### Backend Changes (file-watcher.ts)

1. Add `broadcastTeamAdded()` method following existing `broadcastTeamInstanceChanged()` pattern
2. Modify `addDir` handler to call broadcast after `syncTeam()` completes

### Frontend Changes (app.tsx)

1. Add new case in WebSocket message handler for `team_added` event type
2. Call `loadTeams()` and `loadCrossTeamTargets()` to refresh lists
