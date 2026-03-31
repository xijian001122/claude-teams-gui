## 1. 后端：消息类型扩展

- [x] 1.1 扩展 `ConversationMessage` 接口，新增 `type: 'text' | 'tool_use' | 'thinking'`、`toolName?`、`toolInput?` 字段（`session-reader.ts`）
- [x] 1.2 修改 `extractTextContent()` → `extractContentBlocks()`，将 assistant 的 content 数组拆分为多条 `ConversationMessage`（text / tool_use / thinking）
- [x] 1.3 更新 `MemberConversation` 接口的 `messages` 类型适配新结构

## 2. 后端：Session 自动发现

- [x] 2.1 新增 `findSessionByJsonlScan(teamName, memberName, cwd)` 方法：扫描 `projects/<hash>/*.jsonl` 首行匹配 `teamName + agentName`
- [x] 2.2 修改 `getMemberSession()`：先读注册文件 → 再查 `config.leadSessionId`（team-lead） → 最后 jsonl 扫描 fallback
- [x] 2.3 确保只读每个 jsonl 首行（`readSync` 4KB），不读全文件

## 3. 前端：Markdown 渲染

- [x] 3.1 安装 `marked` 和 `highlight.js` 依赖
- [x] 3.2 创建 `MarkdownRenderer` 组件，处理 Markdown 渲染 + 代码高亮 + XSS 防护
- [x] 3.3 assistant 的 `text` 类型消息使用 `MarkdownRenderer` 渲染，user 消息保持纯文本

## 4. 前端：Tool Use 和 Thinking 渲染

- [x] 4.1 创建 `ToolUseCard` 组件：可折叠卡片，显示工具图标 + 工具名 + 输入参数 JSON
- [x] 4.2 创建 `ThinkingBlock` 组件：淡灰色折叠区域，标注 "思考过程"
- [x] 4.3 修改 `MemberConversationPanel` 消息渲染逻辑，按 `msg.type` 分别渲染 text / tool_use / thinking

## 5. 前端：面板 UI 增强

- [x] 5.1 面板宽度从 `w-[700px]` 改为 `w-[900px]`
- [x] 5.2 移除 `truncateContent()` 500 字符截断，改为 CSS `max-height: 300px` + `overflow-y: auto`
- [x] 5.3 添加消息计数统计（文本条数、工具调用次数）

## 6. 前端：面板发消息

- [x] 6.1 在面板 footer 添加消息输入框 + 发送按钮
- [x] 6.2 调用 `POST /api/teams/:team/messages` 发送消息，`to` 设为成员名
- [x] 6.3 发送成功后清空输入框并自动刷新对话，失败显示错误提示
- [x] 6.4 team-lead 面板也支持发消息（`to` 设为 `team-lead`）
