## ADDED Requirements

### Requirement: Console method interception
The system SHALL intercept all console.log, console.error, console.warn, and console.info calls and route them to the logging service instead of stdout.

#### Scenario: Intercept console.log
- **GIVEN** the logging service is enabled
- **WHEN** code calls `console.log("message")`
- **THEN** the message SHALL be written to the current console.log file
- **AND** the message SHALL NOT appear in stdout

#### Scenario: Intercept console.error
- **GIVEN** the logging service is enabled
- **WHEN** code calls `console.error("error message")`
- **THEN** the message SHALL be written to both console.log and error.log files
- **AND** the message SHALL NOT appear in stdout

#### Scenario: Intercept console.info
- **GIVEN** the logging service is enabled
- **WHEN** code calls `console.info("info message")`
- **THEN** the message SHALL be written to both console.log and info.log files
- **AND** the message SHALL NOT appear in stdout

### Requirement: Log level routing
The system SHALL route messages to appropriate log files based on their level.

#### Scenario: Route to console.log (all levels)
- **WHEN** any console method is called
- **THEN** the message SHALL be appended to the current console.log file
- **AND** console.log SHALL contain all log levels (ERROR, WARN, INFO, DEBUG)

#### Scenario: Route to info.log (INFO only)
- **WHEN** console.info or console.log is called
- **THEN** the message SHALL also be appended to the current info.log file
- **AND** info.log SHALL contain only INFO level messages

#### Scenario: Route to error.log (ERROR only)
- **WHEN** console.error is called
- **THEN** the message SHALL also be appended to the current error.log file
- **AND** error.log SHALL contain only ERROR level messages

### Requirement: Log file naming
The system SHALL use consistent naming for log files.

#### Scenario: Current day log files
- **GIVEN** today is 2026-03-24
- **WHEN** logging a message
- **THEN** the system SHALL write to `~/.claude-chat/logs/console.log`
- **AND** the system SHALL write to `~/.claude-chat/logs/info.log`
- **AND** the system SHALL write to `~/.claude-chat/logs/error.log`

#### Scenario: Historical log directory
- **GIVEN** a log file needs rotation for date 2026-03-23
- **WHEN** rotation occurs
- **THEN** the rotated file SHALL be placed in `~/.claude-chat/logs/2026-03-23/`
- **AND** the file SHALL be named `{type}-NNN.log` (e.g., console-001.log)
