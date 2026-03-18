# JSON 消息美化功能探索记录

**探索日期**: 2026-03-18
**探索模式**: opsx:explore
**探索主题**: 优化界面上美化 JSON 的功能

---

## 1. 现状分析

### 1.1 当前实现位置

```
src/client/components/MessageBubble.tsx:23-46
```

### 1.2 当前支持的 JSON 消息类型

| 类型 | 当前显示 | 实际字段 |
|------|---------|---------|
| `idle_notification` | 💤 Agent 进入空闲状态 | `from`, `timestamp` |
| `permission_request` | 🔒 Agent 请求权限 | `agent_id`, `description`, `tool`, `prompt` |
| `task_assignment` | 📋 任务分配: subject | `subject`, `description`, `taskId` |
| `task_completed` | ✅ 任务完成: subject | `subject`, `taskId`, `result` |

### 1.3 当前实现的问题

```
┌─────────────────────────────────────────────────────────────┐
│                    formatMessageContent()                    │
├─────────────────────────────────────────────────────────────┤
│  问题1: 硬编码类型 - 只支持 4 种特定 JSON 类型                │
│  问题2: 无语法高亮 - JSON 代码块没有颜色区分                  │
│  问题3: 无格式化 - 长 JSON 没有缩进/换行                      │
│  问题4: 无折叠功能 - 大型 JSON 无法展开/折叠                  │
│  问题5: 样式简单 - 系统消息只有灰色斜体                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. 未实现的消息类型

### 2.1 文档中已定义但未支持的消息类型

根据 `.claude/skills/agent-teams/docs/` 中的文档，以下类型尚未在 UI 中实现：

| 类型 | 建议显示 | 实际字段 |
|------|---------|---------|
| `shutdown_request` | 🔌 关闭请求 | `reason`, `request_id` |
| `shutdown_response` | ✅/❌ 关闭响应 | `approve`, `reason`, `request_id` |
| `plan_approval_request` | 📝 计划审批 | `request_id`, `plan_summary` |
| `plan_approval_response` | ✅/❌ 审批结果 | `approve`, `feedback`, `request_id` |

### 2.2 消息来源

- `shutdown_request` 和 `shutdown_response` 定义在：
  - `.claude/skills/agent-teams/docs/messaging.md:45-83`
  - `.claude/skills/agent-teams/SKILL.md:188-190`
  - `.claude/skills/agent-teams/QUICK_REF.md:614-616`

---

## 3. UI 设计效果图

### 3.1 效果图文件位置

```
demo/json-beautify-panel.html
```

### 3.2 设计要点

```
┌─────────────────────────────────────────────────────────────┐
│                        设计原则                              │
├─────────────────────────────────────────────────────────────┤
│  1. 卡片化布局                                               │
│     • 每种 JSON 消息使用独立卡片                             │
│     • 圆角边框 + 微妙阴影                                    │
│     • 左侧彩色条纹标识类型                                   │
│                                                             │
│  2. 状态徽章                                                 │
│     • 🟡 进行中  🟢 成功  🔴 失败  ⏳ 等待中                 │
│     • 右上角显示，一眼可见                                   │
│                                                             │
│  3. 信息层级                                                 │
│     • 标题 → 关键字段 → 详细描述 → 操作按钮                  │
│     • 使用嵌套框展示结构化数据                               │
│                                                             │
│  4. 交互按钮（可选）                                         │
│     • 权限请求: 批准/拒绝                                    │
│     • 任务分配: 开始/查看详情                                │
│     • 关闭请求: 同意/拒绝                                    │
│                                                             │
│  5. 主题适配                                                 │
│     • 使用 CSS 变量适配亮色/暗色主题                         │
│     • 卡片背景: var(--bg-secondary)                          │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 类型颜色映射

| 消息类型 | 左侧条纹颜色 | Emoji |
|---------|-------------|-------|
| `idle_notification` | 紫色 (#8b5cf6) | 💤 |
| `permission_request` | 橙色 (#f59e0b) | 🔒 |
| `task_assignment` | 蓝色 (#3b82f6) | 📋 |
| `task_completed` | 绿色 (#22c55e) | ✅ |
| `shutdown_request` | 灰色 (#6b7280) | 🔌 |
| `shutdown_response` | 绿色/红色 | ✅/❌ |

---

## 4. 权限请求交互分析

### 4.1 关键发现

**用户角色无法直接批准权限请求，只有 team-lead 角色可以执行批准操作。**

### 4.2 当前流程

```
┌─────────────────────────────────────────────────────────────────┐
│                    permission_request 流程                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Agent 发送 permission_request                               │
│           ↓                                                     │
│  2. 默认收件人: team-lead (data-sync.ts:322)                    │
│           ↓                                                     │
│  3. 消息存入数据库 + 广播给所有 WebSocket 客户端                 │
│           ↓                                                     │
│  4. 前端 MessageBubble.tsx 显示为简单文本                        │
│           ↓                                                     │
│  5. ❌ 没有后端 API 处理批准/拒绝                                │
│  6. ❌ 没有权限验证逻辑                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 权限验证来源

- **记忆库 #5074**: "团队权限请求和 Team-lead 批准工作流"
- **Context7 查询**: `/anthropics/claude-code` (信任度 8.8/10)
- **代码位置**: `src/server/services/data-sync.ts:322`
  ```typescript
  await this.writeToClaudeInbox(teamName, to || 'team-lead', message);
  ```

### 4.4 当前限制

| 问题 | 说明 |
|------|------|
| 收件人硬编码 | `to || 'team-lead'` - 默认发给 team-lead |
| 无后端支持 | 没有 `/api/permission/:id/approve` API |
| 纯展示 | MessageBubble.tsx 只有渲染，无交互逻辑 |
| 角色未验证 | 当前代码不检查点击者是否有权限 |

### 4.5 用户点击批准按钮的效果

```
┌────────────────────────────────────────────────────────────────┐
│                      答案：没有用 ❌                            │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  原因：                                                         │
│                                                                │
│  1. 用户角色是 "user"，不是 "team-lead"                        │
│                                                                │
│  2. 系统设计中只有 team-lead 可以批准权限请求                  │
│                                                                │
│  3. 即使前端显示按钮，后端也没有 API 接收批准操作              │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## 5. 可能的优化方向

### 5.1 方案 A: 纯展示优化（推荐先实现）

- 结构化卡片展示 JSON 消息
- 语法高亮的原始 JSON 代码块
- 状态徽章和类型颜色
- **无交互按钮**

### 5.2 方案 B: 完整交互实现

需要以下改动：

| 组件 | 改动 |
|------|------|
| 后端 API | `POST /api/permissions/:requestId/approve` |
| 权限验证 | 检查 `message.to === currentUser` 或 `currentUserRole === 'team-lead'` |
| 前端交互 | 添加点击处理和 API 调用 |
| 消息状态 | 添加 `approved`/`rejected` 状态 |

---

## 6. 建议的下一步

### 6.1 短期（纯展示）

1. 扩展 MessageBubble.tsx 支持更多 JSON 类型
2. 创建 JSON 消息卡片组件
3. 添加语法高亮的代码块组件
4. 更新 CSS 样式

### 6.2 长期（完整交互）

1. 设计权限请求的数据库模型
2. 实现后端 API 路由
3. 添加角色验证中间件
4. 实现前端交互逻辑
5. 添加 WebSocket 实时状态更新

---

## 7. 相关文件

| 文件 | 说明 |
|------|------|
| `src/client/components/MessageBubble.tsx` | 当前 JSON 处理逻辑 |
| `src/server/services/data-sync.ts` | 消息发送逻辑 |
| `src/shared/types.ts` | 消息类型定义 |
| `src/shared/constants.js` | 角色常量定义 |
| `demo/json-beautify-panel.html` | UI 设计效果图 |

---

## 8. 参考文档

- `.claude/skills/agent-teams/docs/messaging.md` - 消息通信规范
- `.claude/skills/agent-teams/docs/workflow.md` - 工作流程
- `.claude/skills/agent-teams/SKILL.md` - Agent Teams 技能文档
- `.claude/skills/agent-teams/QUICK_REF.md` - 快速参考

---

**探索完成时间**: 2026-03-18
**探索结论**: JSON 美化功能需要扩展支持更多消息类型，权限请求交互需要后端 API 支持
