## MODIFIED Requirements

### Requirement: Panel width and content display
面板宽度 SHALL 从 700px 增大到 900px，消息内容 SHALL 不截断（移除 500 字符限制），长消息使用 CSS `max-height` + `overflow-y: auto` 处理。

#### Scenario: Long assistant message
- **WHEN** assistant 消息内容超过 2000 字符
- **THEN** 消息区域最大高度 300px，超出部分可滚动查看，不截断文本

## ADDED Requirements

### Requirement: Markdown rendering for assistant messages
assistant 消息 SHALL 使用 Markdown 渲染，支持代码块语法高亮、列表、表格、链接等。

#### Scenario: Code block rendering
- **WHEN** assistant 消息包含代码块（\`\`\`language ... \`\`\`）
- **THEN** 代码块以等宽字体渲染，带语法高亮和复制按钮

#### Scenario: Markdown list and table
- **WHEN** assistant 消息包含 Markdown 列表或表格
- **THEN** 正确渲染为 HTML 列表或表格样式

### Requirement: Tool use display
系统 SHALL 展示 assistant 消息中的 `tool_use` 内容块，以可折叠卡片形式显示工具名和输入参数。

#### Scenario: Tool use block rendering
- **WHEN** assistant 消息包含 `type: "tool_use"` 内容块
- **THEN** 显示工具调用卡片，包含工具图标、工具名称（如 "Read"、"Bash"）、输入参数摘要

#### Scenario: Tool use card collapse/expand
- **WHEN** 用户点击工具调用卡片
- **THEN** 卡片展开显示完整输入参数（JSON 格式），再次点击折叠

### Requirement: Thinking block display
系统 SHALL 以淡色折叠区域展示 assistant 消息中的 `thinking` 内容块。

#### Scenario: Thinking block rendering
- **WHEN** assistant 消息包含 `type: "thinking"` 内容块
- **THEN** 显示浅灰色折叠区域，标注 "思考过程"，点击展开查看

### Requirement: Message type extension in backend
后端 SHALL 扩展 `ConversationMessage` 类型，新增 `type` 字段区分 `text`、`tool_use`、`thinking`，以及 `toolName`、`toolInput` 字段。

#### Scenario: Assistant message with mixed content blocks
- **WHEN** assistant 消息包含 `[{type: "text"}, {type: "tool_use"}, {type: "thinking"}]` 三个内容块
- **THEN** 后端拆分为 3 条 `ConversationMessage`，分别标记 type 为 `text`、`tool_use`、`thinking`
