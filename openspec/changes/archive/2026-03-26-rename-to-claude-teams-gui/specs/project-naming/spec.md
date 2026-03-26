## REMOVED Requirements

### Requirement: Project name claude-chat
**Reason**: Project renamed to claude-teams-gui to better reflect its functionality
**Migration**: Use claude-teams-gui as the project name in all references

## ADDED Requirements

### Requirement: Project name claude-teams-gui
The project SHALL be referred to as `claude-teams-gui` in all documentation, configuration, and distribution.

#### Scenario: Package name
- **WHEN** user installs the package via npm
- **THEN** the package name SHALL be `claude-teams-gui`

#### Scenario: Documentation name
- **WHEN** user reads README or documentation
- **THEN** the project SHALL be referred to as `claude-teams-gui`
