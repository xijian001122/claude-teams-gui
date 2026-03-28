## ADDED Requirements

### Requirement: Discover members from inbox files
系统 SHALL 扫描 `inboxes/*.json` 文件名来发现未在 `config.members` 中定义的成员。

#### Scenario: New member discovered from inbox file
- **WHEN** `inboxes/frontend-dev.json` 存在
- **AND** `config.members` 不包含 `frontend-dev`
- **THEN** 系统将 `frontend-dev` 添加到成员列表
- **AND** 角色 field 设置为 `discovered`

#### Scenario: Multiple new members discovered
- **WHEN** `inboxes/` 包含 `agent1.json`, `agent2.json`, `agent3.json`
- **AND** `config.members` 只包含 `team-lead`
- **THEN** 成员列表包含所有四个成员

### Requirement: Broadcast members_updated event
当发现新成员时，系统 SHALL 通过 WebSocket 广播 `members_updated` 事件。

#### Scenario: WebSocket broadcast on new member
- **WHEN** 系统发现新成员
- **THEN** 广播 `{ type: "members_updated", team: "team-name", members: [...] }`

#### Scenario: Frontend updates member list
- **WHEN** 前端收到 `members_updated` 事件
- **THEN** 更新 `team.members` 状态
- **AND** 重新渲染成员头像列表
