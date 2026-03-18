# Bun Port Hot Reload - Implementation Tasks

## 1. Backend: Server Reload Mechanism

- [ ] 1.1 Add `reload(newPort: number, newHost: string)` method to `server.ts`
- [ ] 1.2 Implement socket close and re-listen in `reload()` method
- [ ] 1.3 Add `server_reloading` event broadcast before socket close
- [ ] 1.4 Add `server_reloaded` event broadcast after successful reload
- [ ] 1.5 Add `server_reload_error` event for port binding failures
- [ ] 1.6 Wrap reload logic in try/catch with graceful error handling
- [ ] 1.7 Keep old socket open if reload fails (do not break existing connection)

## 2. Backend: ConfigService Updates

- [ ] 2.1 Move `port` and `host` from `RESTART_REQUIRED_KEYS` to `HOT_RELOAD_KEYS` in `config.ts`
- [ ] 2.2 Verify `needsRestart()` correctly identifies only `dataDir` and `teamsPath` changes

## 3. Backend: Settings Routes Integration

- [ ] 3.1 Modify settings PUT handler to call `server.reload()` for port/host changes
- [ ] 3.2 Pass new port and host from config to reload method
- [ ] 3.3 Keep `restart()` call only for `dataDir` and `teamsPath` changes

## 4. Frontend: WebSocket Reconnection

- [ ] 4.1 Add `server_reloading` event handler in `useWebSocket.ts`
- [ ] 4.2 Add `server_reloaded` event handler to trigger reconnection
- [ ] 4.3 Add `server_reload_error` event handler for error display
- [ ] 4.4 Implement disconnect and reconnect logic with new port/host
- [ ] 4.5 Store new port/host in localStorage on `server_reloaded`

## 5. Frontend: API Port Selection

- [ ] 5.1 Add `getBackendPort()` function to `api.ts` with priority: event > localStorage > env > default
- [ ] 5.2 Update all API calls to use dynamic port from `getBackendPort()`
- [ ] 5.3 Verify `VITE_BACKEND_PORT` still works as build-time fallback

## 6. DevOps: Bun Runtime Integration

- [ ] 6.1 Update `package.json` scripts: add `bun:dev` script using `bun --hot run`
- [ ] 6.2 Update `dev:server` script to use Bun
- [ ] 6.3 Update `dev` script to use `bun:dev` for server
- [ ] 6.4 Verify `bun --version` works and bun is available

## 7. Documentation

- [ ] 7.1 Update CLAUDE.md with Bun runtime information
- [ ] 7.2 Update development commands if changed

## 8. Testing & Verification

- [ ] 8.1 Test port change hot-reload (e.g., 4558 → 9858)
- [ ] 8.2 Test host change hot-reload (e.g., localhost → 0.0.0.0)
- [ ] 8.3 Test combined port and host change
- [ ] 8.4 Test port binding failure (port already in use) error handling
- [ ] 8.5 Test WebSocket reconnection after hot-reload
- [ ] 8.6 Test API requests use new port after hot-reload
- [ ] 8.7 Verify bun --hot auto-reload on code changes works
- [ ] 8.8 Verify production build still works with Node.js runtime
