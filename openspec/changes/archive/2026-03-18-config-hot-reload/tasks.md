## 1. Backend - ConfigService Foundation

- [x] 1.1 Create `src/server/services/config.ts` with ConfigService class
- [x] 1.2 Implement config file loading with validation and error handling
- [x] 1.3 Add chokidar file watcher for config.json
- [x] 1.4 Implement debounced config file writing
- [x] 1.5 Define RESTART_REQUIRED_KEYS and HOT_RELOAD_KEYS constants
- [x] 1.6 Implement `needsRestart()` method to check if pending changes require restart
- [x] 1.7 Add `getPendingChanges()` method to return list of pending config changes

## 2. Backend - Service Integration

- [x] 2.1 Modify `src/server/server.ts` to use ConfigService instead of raw config object
- [x] 2.2 Update `src/server/routes/settings.ts` to use ConfigService.save()
- [x] 2.3 Add `/api/settings/pending` endpoint to return pending restart state
- [x] 2.4 Add `/api/settings/restart-info` endpoint to return changed config items
- [x] 2.5 Wire up CleanupService to respond to config changes (retentionDays, cleanupTime)

## 3. Backend - WebSocket Protocol

- [x] 3.1 Add `config_updated` event type to WebSocket protocol
- [x] 3.2 Implement WebSocket broadcast when config changes (from file or API)
- [x] 3.3 Include `pendingRestart` flag in config_updated payload
- [x] 3.4 Include `changes` array with key/oldValue/newValue/requiresRestart in payload

## 4. Frontend - State Management

- [ ] 4.1 Add `pendingConfigRestart` state to App component
- [ ] 4.2 Add WebSocket handler for `config_updated` event
- [ ] 4.3 Store pending changes in state for dialog display
- [ ] 4.4 Pass `pendingConfigRestart` prop to Sidebar component

## 5. Frontend - Sidebar Indicator

- [ ] 5.1 Add restart badge component to Sidebar settings tab
- [ ] 5.2 Show badge only when `pendingConfigRestart` is true
- [ ] 5.3 Add pulse animation to badge
- [ ] 5.4 (Optional) Add hover-to-show restart button variant

## 6. Frontend - Settings Page

- [ ] 6.1 Create or update Settings page component
- [ ] 6.2 Add warning notice bar at top of page when `pendingConfigRestart` is true
- [ ] 6.3 Add "(需重启)" label to restart-required form fields
- [ ] 6.4 Add "Restart Now" and "Later" buttons to notice bar
- [ ] 6.5 Implement config form with proper field types (input, select, toggle)

## 7. Frontend - Restart Confirmation Dialog

- [ ] 7.1 Create ConfigChangeDialog component
- [ ] 7.2 Display config diff with old → new value comparison
- [ ] 7.3 Add "Cancel" and "Confirm Restart" buttons
- [ ] 7.4 Show restart warning message
- [ ] 7.5 (Phase 2) Implement actual restart API call (or show manual restart instructions)

## 8. Testing & Polish

- [ ] 8.1 Add unit tests for ConfigService
- [ ] 8.2 Test file watcher with external editor modifications
- [ ] 8.3 Test WebSocket config_updated event delivery
- [ ] 8.4 Verify all config fields persist correctly
- [ ] 8.5 Test invalid JSON handling
- [ ] 8.6 Update shared types.ts with new config-related types
