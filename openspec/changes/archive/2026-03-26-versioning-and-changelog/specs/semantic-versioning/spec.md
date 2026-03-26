## ADDED Requirements

### Requirement: Version number format
The system SHALL use semantic versioning with format `v{major}.{minor}.{patch}` where major, minor, patch are non-negative integers.

#### Scenario: Standard version format
- **WHEN** a new version is created
- **THEN** the version tag SHALL be in format `v1.2.3`

### Requirement: Minor version increment
The system SHALL automatically increment the minor version when a `feat:` commit is detected.

#### Scenario: Feature commit increments minor
- **WHEN** a commit with message `feat: add new login screen` is merged
- **THEN** the minor version SHALL be incremented by 1 and patch reset to 0

### Requirement: Patch version increment
The system SHALL automatically increment the patch version when a `fix:` commit is detected.

#### Scenario: Fix commit increments patch
- **WHEN** a commit with message `fix: resolve login bug` is merged
- **THEN** the patch version SHALL be incremented by 1

### Requirement: Major version increment
The system SHALL increment the major version when a commit contains `BREAKING CHANGE:` or `!:` in the footer.

#### Scenario: Breaking change increments major
- **WHEN** a commit with message `feat!: change API format` is merged
- **THEN** the major version SHALL be incremented by 1 and minor, patch reset to 0

### Requirement: Git tag creation
The system SHALL create a Git tag in format `v{version}` for each release.

#### Scenario: Tag created on release
- **WHEN** `npm run release` is executed successfully
- **THEN** a Git tag `v1.2.3` SHALL be created at the current commit
