## ADDED Requirements

### Requirement: Config backup on successful read
系统在成功读取 `config.json` 后，SHALL 自动创建 `config.backup.json` 备份文件。

#### Scenario: Successful read creates backup
- **WHEN** config.json 读取成功
- **THEN** 系统创建 config.backup.json 包含相同内容

### Requirement: Auto-recovery from backup
当 `config.json` 解析失败时，系统 SHALL 自动尝试从 `config.backup.json` 恢复。

#### Scenario: Corrupted config recovers from backup
- **WHEN** config.json 解析失败且 config.backup.json 存在
- **THEN** 系统读取 config.backup.json
- **AND** 恢复 config.json 为备份内容

#### Scenario: No backup available
- **WHEN** config.json 解析失败且 config.backup.json 不存在
- **THEN** 系统返回 null 并记录错误日志
