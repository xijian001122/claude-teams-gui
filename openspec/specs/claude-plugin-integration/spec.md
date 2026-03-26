## ADDED Requirements

### Requirement: Plugin directory structure
The project SHALL have a `.claude-plugin/` directory containing `plugin.json` file.

#### Scenario: Plugin directory exists
- **WHEN** user installs the plugin via `claude plugin install`
- **THEN** Claude SHALL find `.claude-plugin/plugin.json` in the repository root

### Requirement: Plugin metadata format
The `plugin.json` file SHALL contain `name`, `description`, and `author` fields following Claude plugin specification.

#### Scenario: Valid plugin.json
- **WHEN** Claude reads the plugin metadata
- **THEN** the file SHALL contain valid JSON with required fields:
  - `name`: string (plugin identifier)
  - `description`: string (brief description)
  - `author`: object with `name` field

### Requirement: Hooks configuration format
The `hooks/hooks.json` file SHALL follow Claude hooks specification with `${CLAUDE_PLUGIN_ROOT}` variable for paths.

#### Scenario: Valid hooks.json format
- **WHEN** Claude loads hooks configuration
- **THEN** the file SHALL use this format:
  ```json
  {
    "description": "string",
    "hooks": {
      "EventName": [
        {
          "hooks": [
            {
              "type": "command",
              "command": "node ${CLAUDE_PLUGIN_ROOT}/hooks/script.js",
              "timeout": number
            }
          ]
        }
      ]
    }
  }
  ```

### Requirement: Installation command support
The plugin SHALL be installable via `claude plugin install github:xijian001122/claude-teams-gui`.

#### Scenario: GitHub installation
- **WHEN** user runs `claude plugin install github:xijian001122/claude-teams-gui`
- **THEN** Claude SHALL clone the repository and register the plugin

### Requirement: README installation documentation
The README SHALL include clear instructions for plugin installation.

#### Scenario: README contains plugin installation section
- **WHEN** user reads README.md
- **THEN** there SHALL be a section explaining:
  - How to install via `claude plugin install`
  - What hooks are included
  - How to verify installation
