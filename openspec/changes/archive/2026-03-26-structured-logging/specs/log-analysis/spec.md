## ADDED Requirements

### Requirement: Log analysis slash command
The system SHALL provide a `/log-fix` command to analyze error logs.

#### Scenario: Analyze recent errors
- **WHEN** a user invokes `/log-fix`
- **THEN** the system SHALL read the most recent entries from error.log
- **AND** the system SHALL identify distinct error patterns
- **AND** the system SHALL provide a summary of errors found
- **AND** the system SHALL suggest possible root causes

#### Scenario: Output error summary
- **WHEN** `/log-fix` is invoked
- **THEN** the system SHALL output:
  - Total error count in the past 24 hours
  - List of unique error messages
  - Frequency of each error type
  - Suggested fixes for common errors

### Requirement: Error categorization
The system SHALL categorize errors by type for easier diagnosis.

#### Scenario: Categorize database errors
- **GIVEN** an error contains "SQLITE" or "database"
- **WHEN** `/log-fix` processes the error
- **THEN** it SHALL categorize the error as "Database"
- **AND** suggest checking database connectivity or schema

#### Scenario: Categorize network errors
- **GIVEN** an error contains "ECONNREFUSED" or "timeout" or "fetch"
- **WHEN** `/log-fix` processes the error
- **THEN** it SHALL categorize the error as "Network"
- **AND** suggest checking service endpoints or connectivity

#### Scenario: Categorize permission errors
- **GIVEN** an error contains "EACCES" or "permission" or "EPERM"
- **WHEN** `/log-fix` processes the error
- **THEN** it SHALL categorize the error as "Permission"
- **AND** suggest checking file or resource permissions

### Requirement: Command output format
The system SHALL provide clear, actionable output from the log analysis.

#### Scenario: Format output for readability
- **WHEN** `/log-fix` completes analysis
- **THEN** the output SHALL be formatted as:
  ```
  ## Log Analysis Report

  ### Summary
  - Total errors: N
  - Time range: last 24 hours

  ### Error Breakdown
  1. [Database] N errors: <error message>
     - Suggestion: <fix recommendation>

  2. [Network] N errors: <error message>
     - Suggestion: <fix recommendation>
  ```
