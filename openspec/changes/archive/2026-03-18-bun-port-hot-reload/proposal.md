## Why

The current restart mechanism for port/host configuration changes fails in development mode because `spawn()` tries to run TypeScript files directly with Node.js, which cannot execute `.ts` files. Even with tsx detection, the process restart is slow (seconds) and unreliable. We need a true hot-reload mechanism that changes the listening port without restarting the process.

## What Changes

1. **Migrate server runtime to Bun**
   - Replace `npm run dev:server` (tsx) with `bun --hot run` for development
   - Bun natively executes TypeScript without compilation step
   - `bun --hot` provides automatic reload on file changes (code, not config)

2. **Implement port/host hot-reload**
   - Add `server.reload(port, host)` method that closes existing socket and re-listens
   - Change `port` and `host` from `RESTART_REQUIRED_KEYS` to hot-reload capable
   - Configuration changes for port/host take effect immediately without process restart

3. **Update frontend reconnection logic**
   - Handle `server_reloaded` WebSocket event with new port/host
   - Disconnect and reconnect WebSocket and API clients to new address
   - Persist server address in localStorage for fallback

4. **Remove spawn-based restart for port changes**
   - The `shutdown(true)` restart path no longer needed for port/host changes
   - Keep process restart only for truly required changes (dataDir, teamsPath - rare)

## Capabilities

### New Capabilities

- `port-hot-reload`: Dynamic port/host configuration without service restart
  - Allows real-time port binding changes via API
  - Broadcasts `server_reloaded` event to notify clients
  - Handles 0.0.0.0 vs localhost binding changes
  - Error handling when port is already in use

- `bun-dev-runtime`: Bun as development runtime with hot reload
  - Native TypeScript execution without transpilation step
  - `bun --hot` for automatic reload on code changes
  - Falls back to `bun run` for production

### Modified Capabilities

- (none)

## Impact

- **server.ts**: Add `reload(port, host)` method, modify shutdown logic
- **settings.ts**: Call `reload()` instead of `restart()` for port/host changes
- **useWebSocket.ts**: Handle `server_reloaded` event, implement reconnection
- **api.ts**: Dynamic port selection from localStorage/event
- **package.json**: Add bun scripts, update dev:server command
- **Dependencies**: None added (bun already available in environment)
