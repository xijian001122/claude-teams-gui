## ADDED Requirements

### Requirement: Send message from context panel
上下文面板底部 SHALL 提供输入框和发送按钮，允许用户直接向该成员发送消息。

#### Scenario: Send message to member
- **WHEN** 用户在上下文面板输入框中输入文本并点击发送
- **THEN** 系统调用 `POST /api/teams/:team/messages`，`to` 字段设为成员名，消息写入成员 inbox

#### Scenario: Send message to team-lead
- **WHEN** 用户在 team-lead 的上下文面板中发送消息
- **THEN** 消息通过现有消息链路发送，`to` 设为 `team-lead`

#### Scenario: Message sent confirmation
- **WHEN** 消息发送成功
- **THEN** 输入框清空，面板自动刷新显示新消息，显示短暂成功提示

#### Scenario: Message send failure
- **WHEN** 消息发送失败
- **THEN** 输入框保留文本，显示错误提示，用户可重试
