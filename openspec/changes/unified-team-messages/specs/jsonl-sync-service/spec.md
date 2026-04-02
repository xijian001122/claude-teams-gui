## ADDED Requirements

### Requirement: 全量扫描 JSONL 文件
系统 SHALL 在服务启动时扫描 `~/.claude/projects/` 下所有 `.jsonl` 文件，解析每行 JSON 中的 `teamName` 和 `agentName` 字段，将属于团队的消息写入 messages 表。

#### Scenario: 启动时发现并加载团队 JSONL 数据
- **WHEN** 服务启动
- **THEN** 系统扫描所有 JSONL 文件，解析含 `teamName` 的行，将消息写入 SQLite，source 设为 `session`

#### Scenario: 跳过非团队 JSONL 文件
- **WHEN** JSONL 文件中所有行都不含 `teamName` 字段
- **THEN** 系统跳过该文件，不写入任何数据

#### Scenario: 过滤元数据类型
- **WHEN** 解析到 `type` 为 `progress`、`system`、`file-history-snapshot`、`last-prompt` 的行
- **THEN** 系统跳过这些行，不写入数据库

#### Scenario: 保留 queue-operation 类型
- **WHEN** 解析到 `type` 为 `queue-operation` 的行
- **THEN** 系统提取 XML 中的 `summary` 和 `status` 字段，写入数据库，msg_type 设为 `queue_operation`

### Requirement: 增量监听 JSONL 文件变更
系统 SHALL 在全量扫描完成后，通过 chokidar 监听已知团队相关的 JSONL 文件变更，仅读取上次偏移量之后的新增内容。

#### Scenario: JSONL 文件追加新内容
- **WHEN** agent 在 JSONL 文件中追加新行
- **THEN** 系统从上次记录的偏移量开始读取新增行，解析后写入数据库并推送给前端

#### Scenario: JSONL 文件被截断或缩小
- **WHEN** 文件当前大小小于已记录的偏移量
- **THEN** 系统对该文件重新执行全量读取，更新偏移量

### Requirement: 偏移量持久化
系统 SHALL 在 `jsonl_file_tracker` 表中持久化每个 JSONL 文件的已读取字节偏移量。

#### Scenario: 记录读取进度
- **WHEN** 成功解析并写入一批 JSONL 消息
- **THEN** 系统更新 `jsonl_file_tracker` 中该文件的偏移量

#### Scenario: 服务重启后恢复进度
- **WHEN** 服务重启执行全量扫描
- **THEN** 系统检查 `jsonl_file_tracker`，对已有记录的文件从偏移量继续读取，对无记录的文件从文件头读取

### Requirement: 消息内容拆分
系统 SHALL 将 JSONL 中 `content` 为数组的 assistant/user 消息拆分为独立的数据库记录。

#### Scenario: assistant 消息包含 text + tool_use
- **WHEN** 解析到 assistant 消息的 content 为 `[{type: "text", text: "..."}, {type: "tool_use", name: "Read", input: {...}}]`
- **THEN** 系统生成两条数据库记录：一条 msg_type=`text`，一条 msg_type=`tool_use` 并填充 tool_name 和 tool_input

#### Scenario: user 消息包含 tool_result
- **WHEN** 解析到 user 消息的 content 为 `[{type: "tool_result", content: "..."}]`
- **THEN** 系统生成一条 msg_type=`tool_result` 的数据库记录

### Requirement: WebSocket 实时推送
系统 SHALL 在 JSONL 增量消息写入数据库后，通过 WebSocket 的 `new_message` 事件推送给前端。

#### Scenario: 新消息推送
- **WHEN** JSONL 增量解析完成并写入数据库
- **THEN** 系统通过 WebSocket 向已加入对应团队的客户端发送 `new_message` 事件，消息体包含 `source`、`msg_type`、`member_name` 等字段
