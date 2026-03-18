## ADDED Requirements

### Requirement: Config file hot reload
The system SHALL monitor the configuration file for changes and automatically reload configuration when the file is modified externally.

#### Scenario: External config file modification detected
- **WHEN** user manually edits `~/.claude-chat/config.json` with a text editor
- **THEN** system detects the file change within 100ms
- **AND** system parses and validates the new configuration
- **AND** system applies hot-reloadable settings immediately
- **AND** system marks restart-required settings as pending

#### Scenario: Invalid JSON in config file
- **WHEN** config file contains invalid JSON syntax
- **THEN** system logs a warning message
- **AND** system continues using the last valid configuration
- **AND** system does NOT crash

### Requirement: Config persistence on API update
The system SHALL persist configuration changes made via the settings API to the config file.

#### Scenario: API update triggers file write
- **WHEN** client calls `PUT /api/settings` with new configuration values
- **THEN** system updates the in-memory configuration
- **AND** system writes the configuration to `~/.claude-chat/config.json` within 300ms (debounced)
- **AND** file is formatted with 2-space indentation

#### Scenario: Multiple rapid API updates
- **WHEN** client calls `PUT /api/settings` multiple times within 300ms
- **THEN** system only writes to file once after the debounce period
- **AND** file contains the final configuration state

### Requirement: Config change WebSocket notification
The system SHALL notify all connected clients when configuration changes occur.

#### Scenario: WebSocket config_updated event
- **WHEN** configuration is updated (via API or file)
- **THEN** system broadcasts a WebSocket message with type `config_updated`
- **AND** message includes:
  - `changes`: array of changed keys with old/new values
  - `pendingRestart`: boolean indicating if restart is needed

#### Scenario: Client receives config notification
- **WHEN** client receives `config_updated` WebSocket event
- **THEN** client updates local configuration state
- **AND** if `pendingRestart` is true, client shows restart indicator

### Requirement: Config classification
The system SHALL classify configuration keys into restart-required and hot-reloadable categories.

#### Scenario: Restart-required settings
- **WHEN** any of these settings change: `port`, `host`, `dataDir`, `teamsPath`
- **THEN** system sets `pendingRestart` flag to true
- **AND** changes do NOT take effect until service restart

#### Scenario: Hot-reloadable settings
- **WHEN** any of these settings change: `retentionDays`, `theme`, `desktopNotifications`, `soundEnabled`, `cleanupEnabled`, `cleanupTime`
- **THEN** changes take effect immediately
- **AND** dependent services are notified of the change

### Requirement: Frontend restart indicator
The frontend SHALL display a visual indicator when configuration changes require service restart.

#### Scenario: Sidebar badge display
- **WHEN** `pendingRestart` is true
- **THEN** sidebar "Settings" tab displays a red badge with text "需重启" or a red dot
- **AND** badge uses pulse animation to draw attention

#### Scenario: Settings page notice bar
- **WHEN** user navigates to Settings page while `pendingRestart` is true
- **THEN** page displays a warning notice bar at the top
- **AND** notice bar includes "Restart Now" button
- **AND** notice bar includes "Later" dismiss option

### Requirement: Config change confirmation dialog
The frontend SHALL display a confirmation dialog when user initiates a restart from the UI.

#### Scenario: Restart confirmation dialog
- **WHEN** user clicks "Restart Now" button
- **THEN** system displays a modal dialog showing:
  - List of changed configuration items
  - Old value → New value comparison
  - Warning message about restart requirement
- **AND** dialog has "Cancel" and "Confirm Restart" buttons

#### Scenario: Config diff display
- **WHEN** confirmation dialog is shown
- **THEN** each changed item displays:
  - Configuration key name (localized)
  - Struck-through old value
  - New value in highlight color
