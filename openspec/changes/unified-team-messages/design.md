## Context

当前团队聊天窗（ChatArea）只展示 SQLite 数据库中的 agent 间通信消息（来自 `~/.claude/teams/*/inboxes/*.json`），而 agent 的实际操作（工具调用、思考过程、代码修改等）记录在 `~/.claude/projects/` 下的 JSONL 会话文件中，两者完全隔离。

之前尝试在前端层合并两个数据源（useInlineContext hook），但因前端逻辑过于复杂（合并排序、上下文块分组、依赖追踪等问题）导致显示异常，最终回退。

核心思路：**将数据合并从前端下沉到数据库层**，让 SQLite 成为唯一数据源，前端只做渲染。

## Goals / Non-Goals

**Goals:**
- messages 表统一存储 inbox 通信消息和 JSONL 会话消息
- 启动时全量扫描 JSONL 文件回填历史数据
- 运行时通过文件监听实时同步 JSONL 增量内容
- 前端 ChatArea 简化为纯渲染器，不负责数据合并
- MessageBubble 支持渲染 thinking、tool_use、tool_result、queue_operation 类型
- 保留 MemberConversationPanel 提供单一成员视角

**Non-Goals:**
- 不修改 JSONL 文件的生成逻辑（Claude CLI 负责）
- 不支持跨项目消息合并（只处理当前项目相关的 JSONL）
- 不在前端做消息的二次过滤或分组（数据库返回什么就显示什么）
- 不修改现有的 inbox 文件同步逻辑（DataSyncService 和 FileWatcherService 保持不变）

## Decisions

### D1: 数据库方案 — 同一张表扩展字段

**决策**: 在现有 messages 表上 ALTER TABLE 新增字段，不建新表。

**新增字段**:
```
source      TEXT DEFAULT 'inbox'   -- 'inbox' 或 'session'
msg_type    TEXT DEFAULT 'text'    -- text/thinking/tool_use/tool_result/queue_operation
member_name TEXT                   -- agent 名称（session 来源必填）
tool_name   TEXT                   -- 工具名称（tool_use 类型）
tool_input  TEXT                   -- 工具参数 JSON（tool_use 类型）
session_id  TEXT                   -- JSONL 来源的 sessionId
```

**理由**: 单表查询简单，一条 SQL `ORDER BY timestamp` 拿到完整时间线，前端零合并逻辑。旧数据 source 默认 `inbox`，无需迁移数据。

**备选方案**: 两张表（messages + session_messages），前端合并查询。 rejected — 违背"前端简单"的初衷。

### D2: JSONL 同步策略 — Redis 机制（全量 + 增量）

**决策**: 采用类 Redis 的 RDB + AOF 模式：

**全量阶段（启动时）**:
1. 扫描 `~/.claude/projects/` 下所有 `.jsonl` 文件
2. 解析每行 JSON，提取 `teamName` 和 `agentName` 建立映射
3. 过滤掉 progress、system、file-history-snapshot、last-prompt 类型
4. 保留 text、thinking、tool_use、tool_result、queue_operation 类型
5. assistant 消息的 content 数组拆分为独立记录
6. 写入 SQLite，记录每个 JSONL 文件的读取偏移量

**增量阶段（运行时）**:
1. chokidar 监听 `~/.claude/projects/**/*.jsonl` 文件变更
2. 读取上次偏移量到文件末尾的新增行
3. 同样解析、过滤、拆分、写入 SQLite
4. WebSocket 推送新消息给前端

**偏移量存储**: 在 SQLite 中新建 `jsonl_file_tracker` 表，记录每个文件的路径和已读取的字节位置。

**理由**: 全量保证历史数据不丢失，增量保证实时性和性能。偏移量追踪避免重复读取。

### D3: JSONL 消息拆分策略

**决策**: 一行 JSONL 可能包含多个 content block（如 text + thinking + tool_use），每个 block 拆分为独立的数据库记录。

**拆分规则**:
- `type=assistant` + `content[]` → 遍历数组，每个 block 生成一条记录
  - `{type: "text", text: "..."}` → msg_type=`text`
  - `{type: "thinking", thinking: "..."}` → msg_type=`thinking`
  - `{type: "tool_use", name: "Read", input: {...}}` → msg_type=`tool_use`, tool_name=`Read`, tool_input=JSON
- `type=user` + `content[]` → 同理拆分
  - `{type: "tool_result", content: "..."}` → msg_type=`tool_result`
  - `{type: "text", text: "..."}` → msg_type=`text`
- `type=queue-operation` → msg_type=`queue_operation`，从 XML content 中提取 summary

**时间戳**: 同一行 JSONL 拆分出的多条记录共享同一个 timestamp，按 content 数组顺序追加序列号确保排序稳定。

### D4: JSONL 文件发现与团队映射

**决策**: JSONL 文件位于 `~/.claude/projects/<project-hash>/` 下，文件名是 UUID。通过读取文件第一行或包含 `teamName` 的行来确定归属。

**发现策略**:
1. 全量扫描时，解析每行 JSON 的 `teamName` 字段
2. 缓存 `{filePath → {teamName, agentName, lastOffset}}` 映射
3. 对于没有 `teamName` 的 JSONL 文件（非团队会话），跳过不处理
4. 增量阶段只监听已确认属于某团队的文件

### D5: 前端渲染策略

**决策**: ChatArea 不再做任何数据合并，直接渲染从 API 获取的统一消息流。

**消息类型与渲染映射**:
| msg_type | 渲染方式 |
|----------|---------|
| `text` | 普通消息气泡（与现有一致） |
| `thinking` | 💭 图标 + 折叠区域，默认折叠 |
| `tool_use` | 🔧 工具名 + 简要参数，默认折叠 |
| `tool_result` | 📋 工具返回内容，默认折叠 |
| `queue_operation` | ⚙️ 后台任务通知 |

**source 区分**: `source=inbox` 的消息保持现有样式，`source=session` 的消息带成员头像色左边框，视觉区分。

### D6: WebSocket 推送协议

**决策**: 复用现有 `new_message` 事件，消息体增加 `source`、`msg_type`、`member_name` 等新字段。前端无需新增事件监听。

## Risks / Trade-offs

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| JSONL 文件量大，全量扫描耗时长 | 启动时间增加 | 异步扫描，先展示 inbox 消息，JSONL 数据逐步填充 |
| JSONL 文件中非团队会话占大多数 | 扫描效率低 | 首行检查 teamName，无则跳过；缓存已知文件列表 |
| content 数组拆分后消息量大 | 数据库膨胀、前端渲染压力 | 分页查询已有；前端虚拟滚动可后续优化 |
| chokidar 监听大量文件 | 系统资源占用 | 只监听已知团队相关的 JSONL 文件，非全目录监听 |
| 偏移量与文件截断冲突 | 增量读取遗漏或重复 | 每次检查文件大小是否小于已记录偏移量，若小于则重新全量读取该文件 |
