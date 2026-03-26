## Context

项目当前有 `hooks/` 目录，但不符合 Claude 插件标准格式。需要调整为可以被 `claude plugin install github:xijian001122/claude-teams-gui` 一键安装的格式。

Claude 插件标准结构参考官方插件 `hookify`、`plugin-dev` 等。

## Goals / Non-Goals

**Goals:**
- 支持通过 `claude plugin install` 安装
- 符合 Claude 插件目录结构规范
- Hook 脚本使用 `${CLAUDE_PLUGIN_ROOT}` 环境变量
- 提供清晰的安装文档

**Non-Goals:**
- 不修改现有 hook 脚本逻辑
- 不添加新的 hook 类型
- 不发布到官方 marketplace（仅 GitHub 安装）

## Decisions

### 目录结构

**决定**: 采用标准 Claude 插件目录结构

```
claude-teams-gui/
├── .claude-plugin/
│   └── plugin.json           # 插件元信息
├── hooks/
│   ├── hooks.json            # Hook 配置（标准格式）
│   ├── session-start.js      # SessionStart hook
│   └── task-created.js       # 自定义 hook（通过 HTTP 触发）
└── README.md                 # 包含安装说明
```

**理由**: 这是 Claude 官方插件的标准格式，确保兼容性。

### hooks.json 格式

**决定**: 使用标准 Claude hooks.json 格式

```json
{
  "description": "Claude Teams GUI hooks",
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node ${CLAUDE_PLUGIN_ROOT}/hooks/session-start.js",
            "timeout": 30
          }
        ]
      }
    ]
  }
}
```

**理由**:
- 使用 `${CLAUDE_PLUGIN_ROOT}` 确保路径可移植
- 标准 hook 类型支持 `PreToolUse`, `PostToolUse`, `SessionStart`, `Stop` 等

### task-created hook 处理

**决定**: 保留 task-created.js 但通过 HTTP API 触发

**理由**: `TaskCreated` 不是 Claude 标准 hook 事件，需要通过项目内部的 HTTP API `/api/hooks/task-created` 触发，由 GUI 服务端广播。

## Risks / Trade-offs

- [Risk] `${CLAUDE_PLUGIN_ROOT}` 环境变量在旧版 Claude Code 中可能不支持
  - **Mitigation**: 文档说明最低版本要求
- [Risk] 用户可能混淆项目安装和插件安装
  - **Mitigation**: README 中清晰区分两种安装方式

## Migration Plan

1. 创建 `.claude-plugin/plugin.json`
2. 更新 `hooks/hooks.json` 格式
3. 更新 hook 脚本使用 `${CLAUDE_PLUGIN_ROOT}`
4. 更新 README 添加插件安装说明
5. 测试 `claude plugin install github:xijian001122/claude-teams-gui`
