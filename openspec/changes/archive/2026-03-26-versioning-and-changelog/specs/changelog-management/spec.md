## ADDED Requirements

### Requirement: CHANGELOG.md location
The system SHALL maintain CHANGELOG.md in the project root directory.

#### Scenario: Changelog file exists
- **WHEN** the project is released
- **THEN** CHANGELOG.md SHALL exist in the project root

### Requirement: Changelog format
The system SHALL generate CHANGELOG.md following Keep a Changelog 1.0.0 specification.

#### Scenario: Changelog has standard sections
- **WHEN** CHANGELOG.md is generated
- **THEN** it SHALL contain sections for `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`

### Requirement: Version entries
Each version in CHANGELOG.md SHALL include version number, release date, and change list.

#### Scenario: Version entry structure
- **WHEN** a new version `1.2.0` is released on 2026-03-26
- **THEN** CHANGELOG.md SHALL contain entry with `## [1.2.0] - 2026-03-26` followed by change list

### Requirement: Commit type mapping
The system SHALL map conventional commit types to changelog sections:
- `feat:` → `Added`
- `fix:` → `Fixed`
- `docs:` → `Changed`
- `refactor:` → `Changed`
- `test:` → `Changed`
- `chore:` → `Changed`

#### Scenario: Feature commit appears in Added section
- **WHEN** a commit `feat: add user profile page` is released
- **THEN** it SHALL appear under `## [1.2.0] - Added` section

### Requirement: Release date
The system SHALL use the release execution date as the version date in CHANGELOG.md.

#### Scenario: Date format
- **WHEN** a release is made on March 26, 2026
- **THEN** the changelog entry SHALL use date format `2026-03-26`
