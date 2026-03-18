# Bun Development Runtime

## ADDED Requirements

### Requirement: Server can be started with Bun runtime

The server SHALL be executable with Bun runtime, supporting native TypeScript execution without a separate transpilation step.

#### Scenario: Start server with bun run
- **WHEN** user runs `bun run src/server/cli.ts`
- **THEN** server starts and listens on configured port
- **AND** TypeScript files are executed directly without compilation errors

### Requirement: Server supports hot reload on code changes during development

When running with `bun --hot`, the server SHALL automatically reload when source files are modified, preserving the ability to develop without manual restarts.

#### Scenario: Code change triggers hot reload
- **WHEN** server is running with `bun --hot run src/server/cli.ts`
- **AND** a source file in src/server/ is modified
- **THEN** server automatically reloads within 1-2 seconds
- **AND** existing WebSocket connections are maintained

### Requirement: Server can be started with bun --headless for restart scenarios

The server SHALL accept `--headless` flag to prevent automatically opening a browser window, which is essential when the server is restarted programmatically.

#### Scenario: Start server in headless mode
- **WHEN** user runs `bun run src/server/cli.ts --headless`
- **THEN** server starts without opening a browser window
- **AND** server listens on configured port

### Requirement: Bun runtime is used for development only

The production deployment SHALL continue to use Node.js runtime to ensure stability and compatibility with the deployment environment.

#### Scenario: Development vs production runtime
- **WHEN** running in development (npm run dev:server)
- **THEN** Bun runtime is used via `bun run`
- **WHEN** running in production (npm start)
- **THEN** Node.js runtime is used via `node dist/server/index.js`
