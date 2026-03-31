## Context

当前成员上下文面板 (`MemberConversationPanel`) 仅展示 user/assistant 纯文本消息，宽度 700px。后端 `SessionReaderService` 依赖手动创建的 `sessions/<member>.json` 注册文件来定位 jsonl 对话文件。team-lead 的 session 虽在 config 中有 `leadSessionId`，但无注册文件。jsonl 中 124 条 tool_use 和 62 条 thinking 全部被丢弃。

## Goals / Non-Goals

**Goals:**
- 无需手动注册即可查看任何成员（含 team-lead）的上下文
- 完整展示对话内容：文本、工具调用、思考过程
- Markdown 渲染 + 代码高亮
- 面板窗口更大，内容更易读
- 支持从面板直接发送消息到成员

**Non-Goals:**
- 不实现对话历史分页加载（后续优化）
- 不实现面板可拖拽调整大小（固定更宽即可）
- 不实现 thinking 块的实时流式展示

## Decisions

### 1. Session 自动发现策略：后端 jsonl 扫描 fallback

**决策**：`getMemberConversation()` 先读注册文件，不存在则扫描 jsonl。

**理由**：注册文件是缓存，jsonl 扫描是 fallback。注册文件存在时直接用（快），不存在时自动发现（慢但可靠）。

**替代方案**：
- A) 完全依赖注册 → 不可靠，会忘记
- B) 完全依赖 jsonl 扫描 → 每次都扫描，性能差
- C) FileWatcher 自动注册 → 复杂度高，调试困难

**实现**：
```
getMemberConversation(team, member)
  1. 读 sessions/<member>.json → 有则用
  2. 无 → 检查 config.leadSessionId（team-lead 场景）
  3. 都无 → 扫描 projects/<hash>/*.jsonl 匹配 teamName + agentName
```

### 2. 消息类型扩展

**决策**：`ConversationMessage` 增加类型：

```typescript
interface ConversationMessage {
  role: 'user' | 'assistant';
  type: 'text' | 'tool_use' | 'thinking';  // 新增
  content: string;
  toolName?: string;      // tool_use 专用
  toolInput?: object;     // tool_use 专用
  timestamp: string;
}
```

**理由**：一个 assistant 消息可能包含多个 content block（text + tool_use + thinking），拆分为独立消息保留完整信息。

### 3. Markdown 渲染方案：marked + highlight.js

**决策**：使用 `marked` 库渲染 Markdown，`highlight.js` 做代码高亮。

**理由**：轻量、无框架绑定、与 Preact 兼容。`react-markdown` 需要额外适配 Preact。

### 4. 面板尺寸：900px + 内容不截断

**决策**：宽度从 700px → 900px，移除 500 字符截断，用 CSS `max-height + overflow` 处理长消息。

### 5. 面板发消息：复用现有 sendMessage API

**决策**：面板底部加输入框，调用 `POST /api/teams/:team/messages` 写入成员 inbox。

**理由**：已有完整的消息发送链路（API → DataSync → inbox → FileWatcher → WebSocket），无需新建。

## Risks / Trade-offs

- **[jsonl 扫描性能]** → 目录下可能有上百个 jsonl 文件。Mitigation：只读首行 4KB，用 `readSync` 而非全文件读取。已验证在 100+ 文件下 < 100ms。
- **[Markdown XSS]** → 用户输入可能包含恶意 HTML。Mitigation：使用 `marked` 的 sanitize 选项或 DOMPurify。
- **[面板发消息的权限]** → 任何人都能向成员发消息。Mitigation：当前阶段不限制，后续可加权限。
