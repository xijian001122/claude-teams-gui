# Team List Realtime Refresh

## Problem

When Claude creates a new team after the web application has started, the team list does not automatically refresh to show the new team. Users must restart the entire application to see newly created teams.

### Root Cause Analysis

```
Current Flow (Broken):
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│ Claude creates  │─────▶│ FileWatcher    │─────▶│ DataSync       │
│ new team        │      │ detects addDir  │      │ syncTeam()     │
└─────────────────┘      └─────────────────┘      └────────┬────────┘
                                                          │
                                                          ▼
                                                 ┌─────────────────┐
                                                 │ SQLite Database │
                                                 │ upsertTeam()    │
                                                 └─────────────────┘
                                                          │
                                                          │ ❌ No WebSocket broadcast
                                                          ▼
                                                 ┌─────────────────┐
                                                 │ Frontend        │
                                                 │ Shows old list  │
                                                 └─────────────────┘
```

**Key Findings**:
1. `FileWatcherService` (file-watcher.ts:46-52) detects new team directories and calls `dataSync.syncTeam()`
2. Team data is successfully written to SQLite database via `upsertTeam()`
3. **Missing**: No WebSocket broadcast to notify connected clients
4. Frontend (`app.tsx`) only loads teams on initial mount and handles `team_archived` events but not `team_added`

## Solution

Add WebSocket broadcast for new team creation, following the existing pattern used for `team_archived` and `team_instance_changed` events.

### Modified Flow

```
Fixed Flow:
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│ Claude creates  │─────▶│ FileWatcher    │─────▶│ DataSync       │
│ new team        │      │ detects addDir  │      │ syncTeam()     │
└─────────────────┘      └────────┬────────┘      └────────┬────────┘
                                  │                        │
                                  │                        ▼
                                  │               ┌─────────────────┐
                                  │               │ SQLite Database │
                                  │               │ upsertTeam()    │
                                  │               └────────┬────────┘
                                  │                        │
                                  ▼                        │
                         ┌─────────────────┐              │
                         │ broadcastTeam   │◀─────────────┘
                         │ Added() ✅       │
                         └────────┬────────┘
                                  │ WebSocket broadcast team_added
                                  ▼
                         ┌─────────────────┐
                         │ Frontend        │
                         │ loadTeams() ✅   │
                         └─────────────────┘
```

## Scope

### In Scope
- Add `team_added` WebSocket event broadcast from backend
- Add `team_added` event handler in frontend to refresh team list
- Follow existing patterns (`team_archived`, `team_instance_changed`)

### Out of Scope
- Team deletion detection (already handled via `unlinkDir`)
- Team member changes (already handled via `member_status`)
- Cross-team message targets refresh (separate concern)

## Impact

### Affected Files
| File | Change Type |
|------|-------------|
| `src/server/services/file-watcher.ts` | Add broadcast method |
| `src/client/app.tsx` | Add event handler |

### Dependencies
- Existing WebSocket infrastructure (`@fastify/websocket`)
- Existing team loading API (`/api/teams`)

### Risk Assessment
- **Low Risk**: Following established patterns in codebase
- **No Breaking Changes**: Adding new event type, not modifying existing ones
- **Backward Compatible**: Clients without the handler simply ignore the event

## Success Criteria

1. When Claude creates a new team, web clients receive `team_added` WebSocket event
2. Frontend automatically refreshes team list without manual intervention
3. No restart required to see new teams
4. Existing functionality remains unchanged
