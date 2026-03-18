## MODIFIED Requirements

### Requirement: 在 header 显示在线人数
系统 SHALL 在聊天区域 header 显示当前团队的在线人数，并支持点击展开成员列表。

#### Scenario: 显示在线人数
- **WHEN** 用户查看聊天区域 header
- **THEN** 显示 "X 人在线" 文本
- **AND** 文本可点击

#### Scenario: 在线人数实时更新
- **WHEN** 成员上线或离线时
- **THEN** 在线人数立即更新
- **AND** 无需刷新页面

#### Scenario: 点击入口展开面板
- **WHEN** 用户点击在线人数文本
- **THEN** 展开在线成员下拉面板
- **AND** 面板显示在 header 下方

## ADDED Requirements

### Requirement: 在线人数指示器视觉反馈
系统 SHALL 为在线人数指示器提供悬停和点击的视觉反馈。

#### Scenario: 悬停反馈
- **WHEN** 鼠标悬停在线人数指示器上
- **THEN** 背景色变化
- **AND** 显示手型光标

#### Scenario: 展开状态指示
- **WHEN** 面板展开时
- **THEN** 在线人数指示器显示展开箭头（向上）
- **AND** 背景色保持高亮状态
