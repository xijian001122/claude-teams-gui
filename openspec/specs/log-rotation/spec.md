## ADDED Requirements

### Requirement: Size-based log rotation
The system SHALL rotate log files when they reach the configured maximum size.

#### Scenario: Rotate on size threshold
- **GIVEN** maxSize is 10MB (default)
- **WHEN** console.log reaches 10MB
- **THEN** the system SHALL rotate the file
- **AND** the rotated file SHALL be renamed to `console-001.log`
- **AND** a new console.log SHALL be created for current writes

#### Scenario: Sequential rotation numbers
- **GIVEN** console-001.log already exists
- **WHEN** console.log rotates again
- **THEN** the new file SHALL be named `console-002.log`
- **AND** subsequent rotations SHALL increment the number

### Requirement: Date-based log rotation
The system SHALL create a new set of log files when the date changes.

#### Scenario: Rotate on date change
- **GIVEN** today is 2026-03-24 and current logs are in place
- **WHEN** the date changes to 2026-03-25
- **THEN** the previous console.log SHALL be rotated to `~/.claude-chat/logs/2026-03-24/console-001.log`
- **AND** the previous info.log SHALL be rotated to `~/.claude-chat/logs/2026-03-24/info-001.log`
- **AND** the previous error.log SHALL be rotated to `~/.claude-chat/logs/2026-03-24/error-001.log`
- **AND** new empty log files SHALL be created for 2026-03-25

### Requirement: Log retention
The system SHALL automatically delete log files older than the configured retention period.

#### Scenario: Delete logs older than retention period
- **GIVEN** maxDays is 7 (default)
- **WHEN** a log directory exists for a date older than 7 days
- **THEN** the system SHALL delete that directory and all its contents
- **AND** the deletion SHALL occur on service startup or scheduled cleanup

### Requirement: Rotation file naming
The system SHALL use a consistent naming convention for rotated files.

#### Scenario: Rotated file naming
- **WHEN** a log file is rotated
- **THEN** the file SHALL be named with the pattern `{type}-NNN.log`
- **WHERE** type is console, info, or error
- **AND** NNN is a 3-digit sequential number starting from 001
- **AND** the number SHALL increment for each rotation

### Requirement: Configuration via config.json
The system SHALL read log configuration from config.json.

#### Scenario: Load log configuration
- **GIVEN** config.json contains log settings
- **WHEN** the service starts
- **THEN** the system SHALL load the log configuration
- **AND** apply the settings for maxSize and maxDays

#### Scenario: Default configuration values
- **GIVEN** config.json does not specify log settings
- **WHEN** the service starts
- **THEN** the system SHALL use defaults: maxSize=10MB, maxDays=7
