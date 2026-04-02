## 1. 数据库 Schema 扩展

- [x] 1.1 在 `src/server/db/schema.sql` 中为 messages 表添加新字段：`source TEXT DEFAULT 'inbox'`、`msg_type TEXT DEFAULT 'text'`、`member_name TEXT`、`tool_name TEXT`、`tool_input TEXT`、`session_id TEXT`
- [x] 1.2 在 `DatabaseService` 中添加 ALTER TABLE 迁移逻辑，确保已有数据库平滑升级
- [x] 1.3 创建 `jsonl_file_tracker` 表，字段：`file_path TEXT PRIMARY KEY`、`team_name TEXT`、`agent_name TEXT`、`byte_offset INTEGER`、`last_modified TEXT`

## 2. JSONL 解析服务

- [x] 2.1 创建 `src/server/services/jsonl-sync-service.ts`，实现 JSONL 文件全量扫描逻辑：扫描 `~/.claude/projects/` 下所有 `.jsonl` 文件
- [x] 2.2 实现 JSONL 行解析器：解析每行 JSON，根据 `type` 字段过滤（保留 text/thinking/tool_use/tool_result/queue_operation，跳过 progress/system/file-history-snapshot/last-prompt）
- [x] 2.3 实现 content 数组拆分逻辑：将 assistant/user 消息的 content 数组拆分为独立记录，正确映射 msg_type、tool_name、tool_input
- [x] 2.4 实现 queue-operation XML 内容解析：提取 `<summary>` 和 `<status>` 字段
- [x] 2.5 实现 teamName/agentName 映射：解析 JSONL 行中的 `teamName` 和 `agentName`，跳过非团队会话文件
- [x] 2.6 实现偏移量管理：从 `jsonl_file_tracker` 读取/更新每个文件的已读取字节位置

## 3. 增量监听与实时推送

- [x] 3.1 使用 chokidar 监听已知团队相关的 JSONL 文件变更
- [x] 3.2 实现增量读取逻辑：从偏移量位置读取新增行，解析后写入数据库
- [x] 3.3 实现文件截断检测：当文件大小小于已记录偏移量时，重新全量读取该文件
- [x] 3.4 集成 WebSocket 推送：JSONL 增量消息写入数据库后，通过 `new_session_messages` 事件推送给已加入对应团队的前端客户端

## 4. 后端 API 适配

- [x] 4.1 修改 `GET /api/teams/:team/messages` 端点：查询不再区分 source，返回统一消息流按 timestamp 排序
- [x] 4.2 添加 `?source=session` 查询参数支持：按 source 过滤消息
- [x] 4.3 添加 `?member=xxx` 查询参数支持：按 member_name 过滤消息（供 MemberConversationPanel 使用）
- [x] 4.4 确保消息查询结果包含新增的 `source`、`msg_type`、`member_name`、`tool_name`、`tool_input` 字段

## 5. 前端类型与 API 适配

- [x] 5.1 更新 `src/shared/types.ts` 中的 Message 类型定义，添加 `source`、`msgType`、`memberName`、`toolName`、`toolInput`、`sessionId` 字段
- [x] 5.2 更新 API 客户端，确保查询消息时传递新字段到前端

## 6. 前端渲染升级

- [x] 6.1 修改 `MessageBubble` 组件：根据 `msgType` 选择不同渲染分支（text/thinking/tool_use/tool_result/queue_operation）
- [x] 6.2 实现 thinking 消息渲染：💭 图标 + 折叠区域，默认折叠
- [x] 6.3 实现 tool_use 消息渲染：🔧 + tool_name + 简要参数，默认折叠
- [x] 6.4 实现 tool_result 消息渲染：📋 工具返回内容，默认折叠
- [x] 6.5 实现 queue_operation 消息渲染：⚙️ 后台任务通知
- [x] 6.6 实现 session 消息视觉隔离：对 source=session 的消息添加成员头像色左边框

## 7. ChatArea 简化与集成

- [x] 7.1 确认 ChatArea 无需移除额外合并逻辑（代码库已回退干净）
- [x] 7.2 确保消息列表直接渲染 API 返回的统一消息流，按 timestamp 排序
- [x] 7.3 验证 WebSocket new_session_messages 事件触发消息重新加载

## 8. MemberConversationPanel 适配

- [x] 8.1 修改 MemberConversationPanel 使用 `?member=xxx&source=session` 参数过滤消息
- [x] 8.2 确保面板中消息渲染复用 MemberConversationPanel 的现有渲染逻辑（ToolUseCard/ThinkingBlock/ToolResultCard）

## 9. 服务启动集成

- [x] 9.1 在服务启动流程中集成 JSONL 全量扫描（异步执行，不阻塞启动）
- [x] 9.2 在服务启动完成后启动 chokidar 增量监听
- [x] 9.3 添加日志：记录全量扫描的文件数量、消息数量、耗时

## 10. 构建验证

- [x] 10.1 运行 `npm run build` 确保前后端编译通过
- [x] 10.2 启动服务验证：JSONL 数据正常回填到数据库 ✓ (session 消息已出现在 API 响应中)
- [ ] 10.3 前端验证：团队聊天窗显示统一消息流，各 msg_type 渲染正确
