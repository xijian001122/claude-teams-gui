# Port Hot Reload

## ADDED Requirements

### Requirement: Port and host configuration changes take effect without server restart

When a client updates the `port` or `host` configuration via the settings API, the server SHALL immediately begin listening on the new port/host without shutting down or restarting the server process. All existing server state (database connections, WebSocket connections, message cache) SHALL be preserved.

#### Scenario: Port change via API
- **WHEN** client sends PUT /api/settings with `{ "port": 9858 }`
- **THEN** server stops listening on old port and begins listening on port 9858
- **AND** server broadcasts `server_reloaded` event to all WebSocket clients with `newPort: 9858`

#### Scenario: Host change via API
- **WHEN** client sends PUT /api/settings with `{ "host": "0.0.0.0" }`
- **THEN** server rebinds to 0.0.0.0 (all interfaces)
- **AND** server broadcasts `server_reloaded` event with `newHost: "0.0.0.0"`

#### Scenario: Combined port and host change
- **WHEN** client sends PUT /api/settings with `{ "port": 9858, "host": "0.0.0.0" }`
- **THEN** server rebinds to new address
- **AND** broadcasts single `server_reloaded` event with both newPort and newHost

### Requirement: Server notifies clients before reloading

Before the server closes its listening socket, it SHALL broadcast a `server_reloading` event to all connected WebSocket clients. This gives clients advance notice to prepare for disconnection.

#### Scenario: Client receives server_reloading event
- **WHEN** server is about to reload port/host
- **THEN** server sends `server_reloading` event with `newPort` and `newHost` values
- **AND** server waits at least 500ms before closing the socket

### Requirement: Server broadcasts server_reloaded event after successful reload

After successfully rebinding to the new port/host, the server SHALL broadcast a `server_reloaded` event containing the new connection information.

#### Scenario: Client receives server_reloaded event
- **WHEN** server successfully reloads to new port/host
- **THEN** server sends `server_reloaded` event with `newPort` and `newHost`
- **AND** event is sent to all connected WebSocket clients

### Requirement: Port binding failure is handled gracefully

If the new port cannot be bound (e.g., port already in use), the server SHALL broadcast an error event and continue operating on the original port.

#### Scenario: Port binding fails - port in use
- **WHEN** server attempts to reload to a port that is already in use
- **THEN** server broadcasts `server_reload_error` event with `{ "error": "Port already in use", "port": <attempted_port> }`
- **AND** server continues operating on the original port/host
- **AND** configuration file is NOT updated with the failed port value

### Requirement: Existing WebSocket clients reconnect after reload

After receiving `server_reloaded` event, WebSocket clients SHALL disconnect from the old server address and establish a new connection to the new port/host.

#### Scenario: WebSocket client reconnects after server reload
- **WHEN** client receives `server_reloaded` event with `newPort` and `newHost`
- **THEN** client disconnects current WebSocket connection
- **AND** client establishes new WebSocket connection to `ws://{newHost}:{newPort}/ws`

### Requirement: API clients use new server address after reload

API clients SHALL use the new server port/host from the `server_reloaded` event or localStorage for subsequent API requests.

#### Scenario: API client uses updated port
- **WHEN** client receives `server_reloaded` event
- **THEN** client stores new port/host in localStorage
- **AND** subsequent API requests use the new address
- **AND** client falls back to localStorage value if server event is missed
