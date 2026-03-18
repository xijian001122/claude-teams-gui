## ADDED Requirements

### Requirement: 实时接收成员在线状态
系统 SHALL 通过 WebSocket 实时接收成员在线/离线状态变更。

#### Scenario: 成员上线通知
- **WHEN** 团队成员上线时
- **THEN** 系统通过 WebSocket 接收 member_online 事件
- **AND** 更新本地成员列表状态
- **AND** 在线人数增加 1

#### Scenario: 成员离线通知
- **WHEN** 团队成员离线时
- **THEN** 系统通过 WebSocket 接收 member_offline 事件
- **AND** 更新本地成员列表状态
- **AND** 在线人数减少 1

### Requirement: 状态变更实时同步
系统 SHALL 实时接收成员状态变更（在线/离开/忙碌）。

#### Scenario: 状态变更通知
- **WHEN** 成员状态从"在线"变为"离开"
- **THEN** 系统通过 WebSocket 接收 member_status_change 事件
- **AND** 更新本地成员状态显示

### Requirement: 重连时同步完整状态
系统 SHALL 在 WebSocket 重连后同步完整的成员状态列表。

#### Scenario: 断线重连
- **WHEN** WebSocket 连接断开后重新连接
- **THEN** 系统请求完整的成员状态列表
- **AND** 更新本地状态以匹配服务器状态

#### Scenario: 断线期间状态指示
- **WHEN** WebSocket 连接断开时
- **THEN** 系统显示连接断开指示器
- **AND** 成员状态显示为"未知"或最后一次已知状态
