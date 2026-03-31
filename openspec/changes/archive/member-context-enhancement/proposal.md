## Why

成员上下文面板存在多个关键问题：team-lead 上下文不可查看；成员 session 注册依赖手动执行（AI 会忘记）；对话内容缺少 tool_use 和 thinking 展示导致上下文不完整；面板窗口太小且无 Markdown 渲染。这些问题使得用户无法有效监控和干预团队成员的工作状态。

## What Changes

- **后端 session 自动发现**：当 `sessions/<member>.json` 不存在时，直接扫描 jsonl 文件按 `teamName + agentName` 匹配，无需注册文件
- **team-lead 上下文可查看**：利用团队 config 中的 `leadSessionId` 直接定位 team-lead 的对话
- **对话内容类型扩展**：后端提取 `tool_use`（工具名、输入参数）和 `thinking`（思考过程），前端用折叠卡片渲染
- **Markdown 渲染**：assistant 消息使用 Markdown 渲染，支持代码块语法高亮
- **面板窗口放大**：宽度从 700px 扩大到 900px，支持可拖拽调整或全屏
- **上下文面板发消息**：在面板底部增加输入框，可直接向成员 inbox 发送消息

## Capabilities

### New Capabilities
- `session-auto-discovery`: 后端无注册文件时自动扫描 jsonl 发现成员 session，支持 team-lead 直接查看
- `context-panel-messaging`: 上下文面板中发送消息到成员 inbox，实现直接干预

### Modified Capabilities
- `context-panel-display`: 面板 UI 放大、Markdown 渲染、tool_use/thinking 折叠卡片展示

## Impact

- **后端**：`session-reader.ts`（核心改动）— 增加 jsonl 扫描 fallback、team-lead 支持、消息类型扩展
- **后端路由**：`member-session.ts` — 可能需要新端点或参数调整
- **前端**：`MemberConversationPanel.tsx`（大幅重写）— Markdown 渲染、工具卡片、发消息输入框
- **依赖**：需要引入 Markdown 渲染库（如 `marked` + `highlight.js`）
- **API 变更**：`ConversationMessage` 类型需要扩展 role 和新增 tool_use/thinking 字段
