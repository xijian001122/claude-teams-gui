# Claude Code Hooks

## 概述

本目录包含 Claude Code 的钩子脚本，用于在特定事件触发时执行自动化操作。所有钩子使用 JavaScript 编写，确保跨平台兼容性。

## 钩子列表

### skill-forced-eval.js

**触发事件**: `UserPromptSubmit`（用户提交问题时）

**功能**: 强制评估并激活相关技能

**工作原理**:
1. 检测用户输入是否为斜杠命令（如 `/frontend-dev`）
2. 如果是斜杠命令，跳过技能评估（直接放行）
3. 如果是普通问题，注入技能评估指令
4. 要求 AI 评估是否需要激活相关技能
5. 如果需要，强制使用 Skill() 工具激活

**效果**:
- 技能激活率从 ~25% 提升至 90%+
- 确保 AI 在开发时遵循项目规范
- 自动加载正确的技能文档

### session-start.js

**触发事件**: `SessionStart`（会话开始时）

**功能**: 加载项目上下文

**工作原理**:
1. 检测会话来源（startup 新会话 / resume 恢复会话）
2. 新会话：加载项目概述、技能列表、开发命令、代码位置
3. 恢复会话：提供简要提示

### pre-tool-use.js

**触发事件**: `PreToolUse`（工具调用前）

**功能**: 安全验证，阻止危险操作

**工作原理**:
1. 检测 Bash 命令中的危险模式（rm -rf /、fork bomb、mkfs 等）
2. 危险命令直接拒绝执行
3. 关键文件操作（.env、.git、SSH 密钥等）要求用户确认

### post-tool-use.js

**触发事件**: `PostToolUse`（工具调用成功后）

**功能**: 代码验证和提示

**工作原理**:
1. 只处理 Write 和 Edit 工具
2. TypeScript 文件修改后提示运行类型检查
3. CSS 文件修改后检测 TailwindCSS 使用

### stop-hook.js

**触发事件**: `Stop`（Claude 完成响应时）

**功能**: 检查未完成任务

**工作原理**:
1. 检查最后消息中的 TODO、FIXME 等标记
2. 检测到未完成任务时阻止会话结束
3. 提到测试但未运行时提醒运行测试

## 技能评估逻辑

钩子会评估以下技能：

| 技能名 | 触发关键词 |
|--------|-----------|
| `frontend-dev` | 前端、组件、UI、样式、Preact、TailwindCSS |
| `backend-dev` | 后端、API、路由、数据库、SQLite、服务 |
| `websocket-protocol` | WebSocket、实时、消息、连接、事件 |
| `project-arch` | 架构、结构、设计模式、技术栈 |
| `skill-evolution` | 技能系统、新增技能、修改技能 |

## 配置

钩子在 `.claude/settings.local.json` 中注册：

```json
{
  "hooks": {
    "UserPromptSubmit": [
      { "command": "node .claude/hooks/skill-forced-eval.js" }
    ],
    "SessionStart": [
      { "command": "node .claude/hooks/session-start.js" }
    ],
    "PreToolUse": [
      { "command": "node .claude/hooks/pre-tool-use.js" }
    ],
    "PostToolUse": [
      { "command": "node .claude/hooks/post-tool-use.js" }
    ],
    "Stop": [
      { "command": "node .claude/hooks/stop-hook.js" }
    ]
  }
}
```

## 禁用钩子

如果需要临时禁用钩子，可以：
1. 删除 `settings.local.json` 中的对应 `hooks` 配置
2. 或使用斜杠命令直接调用技能（skill-forced-eval.js 会自动跳过）

## 调试

测试钩子是否正常工作：

```bash
# 测试技能评估钩子
node .claude/hooks/skill-forced-eval.js "帮我创建一个按钮组件"

# 测试会话启动钩子
node .claude/hooks/session-start.js '{"source": "startup"}'

# 测试工具执行前钩子 - 危险命令
node .claude/hooks/pre-tool-use.js '{"tool_name": "Bash", "tool_input": {"command": "rm -rf /"}}'

# 测试工具执行后钩子 - TypeScript 文件
node .claude/hooks/post-tool-use.js '{"tool_name": "Write", "tool_input": {"file_path": "test.ts"}}'

# 测试停止钩子 - 检测 TODO
node .claude/hooks/stop-hook.js '{"last_assistant_message": "TODO: 还需要完成", "stop_hook_active": false}'
```

---

**最后更新**: 2026-03-17
