## ADDED Requirements

### Requirement: Session auto-discovery via jsonl scanning
后端 SHALL 在 `sessions/<member>.json` 不存在时，自动扫描 `~/.claude/projects/<project-hash>/*.jsonl` 文件，读取首行匹配 `teamName` + `agentName`，找到对应 session ID。

#### Scenario: Member has no registration file
- **WHEN** 调用 `getMemberConversation(team, member)` 且 `sessions/<member>.json` 不存在
- **THEN** 系统扫描 jsonl 文件，找到首行包含匹配 `teamName` 和 `agentName` 的文件，以文件名作为 sessionId 返回对话

#### Scenario: Multiple jsonl files match same member
- **WHEN** 同一个 team + member 匹配到多个 jsonl 文件
- **THEN** 系统选择 mtime 最新（最近修改）的 jsonl 文件

#### Scenario: No matching jsonl found
- **WHEN** 扫描所有 jsonl 后无匹配
- **THEN** 返回空消息列表 `{ memberName, sessionId: null, messages: [] }`

### Requirement: Team-lead context viewable
后端 SHALL 支持查看 team-lead 的对话上下文，使用团队 config 中的 `leadSessionId` 直接定位。

#### Scenario: View team-lead context
- **WHEN** 请求 `team-lead` 成员的上下文
- **THEN** 系统从 `config.json` 的 `leadSessionId` 获取 session ID，直接读取对应 jsonl 文件

#### Scenario: Team-lead leadSessionId missing
- **WHEN** config 中无 `leadSessionId`
- **THEN** 回退到 jsonl 扫描，查找 `agentName` 为 `team-lead` 的文件

### Requirement: Jsonl scan performance
jsonl 扫描 SHALL 仅读取每个文件首行（最多 4KB），不得读取整个文件。

#### Scenario: Large jsonl file scanning
- **WHEN** 目录下有 100+ 个 jsonl 文件
- **THEN** 扫描完成时间 < 200ms，不读取文件完整内容
