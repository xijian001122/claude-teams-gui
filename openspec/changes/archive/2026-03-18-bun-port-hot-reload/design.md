## Context

The Claude Agent GUI server currently uses `spawn()` to restart itself when configuration changes require a restart (port, host). However:

1. **Restart fails in dev mode**: `spawn(node, ['src/server/cli.ts'])` fails because Node can't execute TypeScript directly
2. **Restart is slow**: Spawning a new process takes seconds
3. **Restart is unreliable**: The spawn logic doesn't properly handle tsx/bun runtimes

The architecture separates config keys into:
- `RESTART_REQUIRED_KEYS = ['port', 'host', 'dataDir', 'teamsPath']`
- `HOT_RELOAD_KEYS = ['retentionDays', 'theme', 'desktopNotifications', ...]`

Currently `port` and `host` require restart, but they don't need to - Fastify can close and reopen its listening socket.

## Goals / Non-Goals

**Goals:**
- Implement hot-reload for `port` and `host` configuration changes (no process restart)
- Migrate development runtime to Bun for native TypeScript execution
- Ensure frontend reconnects seamlessly after port/host changes
- Handle port binding errors gracefully (e.g., port already in use)

**Non-Goals:**
- Hot-reload for `dataDir` or `teamsPath` (these require full restart - rare configuration)
- Docker/containerization (out of scope for this change)
- Bun in production (only development runtime changes)

## Decisions

### Decision 1: Bun for Development Runtime

**Choice**: Use `bun --hot run src/server/cli.ts` instead of `tsx watch src/server/cli.ts`

**Rationale**:
- Bun natively executes TypeScript without transpilation (faster startup)
- `bun --hot` auto-reloads on code changes (equivalent to tsx watch)
- Eliminates spawn TypeScript execution issues entirely
- Bun already installed in environment

**Alternatives considered**:
- Fix tsx spawn logic: Fragile, still slow restart
- Node.js production + tsx dev: Inconsistent runtimes

### Decision 2: Fastify Socket Re-binding for Hot-Reload

**Choice**: Close existing socket and re-listen on new port

```typescript
// In server.ts
async reload(newPort: number, newHost: string) {
  // 1. Notify clients
  this.broadcast({ type: 'server_reloading', newPort, newHost });

  // 2. Stop accepting new connections
  await new Promise(resolve => this.fastify.server.close(resolve));

  // 3. Re-bind to new port/host
  await this.fastify.listen({ port: newPort, host: newHost });

  // 4. Notify clients to reconnect
  this.broadcast({ type: 'server_reloaded', newPort, newHost });
}
```

**Rationale**:
- Fastify's server can be closed and reopened
- No process restart needed - maintains all in-memory state
- Millisecond-level reconfiguration vs seconds for restart

**Alternatives considered**:
- Double-listen (old + new port simultaneously): Complex cleanup, clients may connect to wrong port
- Proxy approach: Additional complexity, more resources

### Decision 3: ConfigService Classification

**Choice**: Move `port` and `host` from `RESTART_REQUIRED_KEYS` to hot-reload keys

```typescript
// config.ts
const HOT_RELOAD_KEYS = ['port', 'host', 'retentionDays', 'theme', ...]
const RESTART_REQUIRED_KEYS = ['dataDir', 'teamsPath']  // Only these need restart
```

**Rationale**:
- Port/host changes can be hot-reloaded (no state loss needed)
- dataDir/teamsPath require restart (database path, file watcher change)

### Decision 4: Frontend Reconnection Strategy

**Choice**: Client-side reconnection with localStorage fallback

```typescript
// useWebSocket.ts - getBackendPort() priority:
// 1. newServerPort (from server_reloaded event)
// 2. localStorage.getItem('serverPort')
// 3. import.meta.env.VITE_BACKEND_PORT
// 4. Default port
```

**Rationale**:
- Server tells client new port via event (authoritative)
- localStorage persists across page refreshes
- VITE_BACKEND_PORT as build-time fallback
- Env var with actual runtime port takes precedence

## Risks / Trade-offs

| Risk | Impact | Mitigation |
|------|--------|------------|
| Port already in use | Hot-reload fails, server may become unreachable | Try/catch with error broadcast, keep old socket open, notify client |
| WebSocket clients disconnect | Brief interruption during reload | Notify before close (`server_reloading`), clients auto-reconnect |
| 0.0.0.0 vs localhost binding | Clients may need different host to connect | Broadcast both newPort and newHost, client uses newHost |
| Bun runtime issues | Stability concerns | Bun 1.x is production-ready; fallback to node if issues |

## Migration Plan

1. **Phase 1**: Backend changes (server.ts, config.ts)
   - Add `reload()` method to server
   - Update ConfigService classification
   - Update settings routes to call reload

2. **Phase 2**: Frontend changes
   - Update useWebSocket.ts to handle `server_reloaded`
   - Update api.ts with dynamic port selection
   - Test reconnection flow

3. **Phase 3**: Dev workflow update
   - Update package.json scripts
   - Update documentation (CLAUDE.md)

4. **Verification**
   - Test port change hot-reload
   - Test host change hot-reload
   - Test 0.0.0.0 binding change
   - Test reconnect after hot-reload
   - Verify bun --hot works for code changes

## Open Questions

1. **Should we also support hot-reload for dataDir/teamsPath?**
   - Would require reinitializing database connection and file watcher
   - Complex state management - defer for now
   - Users rarely change these settings

2. **Bun for production or only development?**
   - Proposal: Bun for dev only, Node.js for production
   - Bun production readiness improving but Node.js more battle-tested
   - Can revisit later if Bun shows stability

3. **Error handling when port binding fails?**
   - If new port fails, should we:
     A) Keep old server running and broadcast error
     B) Retry with incremented port
     C) Full restart
   - Decision: Option A - graceful degradation
