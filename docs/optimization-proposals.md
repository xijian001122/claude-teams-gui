# Claude Chat 优化建议

> 基于 Claude Code 2.1.84/2.1.83/2.1.81 更新日志分析
> 生成日期: 2026-03-26

## 概述

本文档记录了基于 Claude Code 最新版本功能的优化建议，旨在提升 Claude Chat 项目的用户体验和开发效率。

---

## 高优先级改进

### 1. TaskCreated Hook 集成 (P0)

**相关新功能**: `TaskCreated hook that fires when a task is created via TaskCreate`

**当前问题**:
- Web UI 需要轮询才能获取新任务
- 任务创建后前端无实时感知

**改进方案**:
```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│   TaskCreate    │─────▶│  TaskCreated    │─────▶│    WebSocket    │
│     工具调用     │      │     Hook        │      │    推送前端      │
└─────────────────┘      └─────────────────┘      └─────────────────┘
```

**实现步骤**:
1. 创建 `.claude/hooks/task-created.js`
2. Hook 触发时调用后端 API
3. 后端通过 WebSocket 广播 `task_created` 事件
4. 前端监听并更新任务列表

**预期效果**: 任务创建后立即显示在 Web UI，无需手动刷新

---

### 2. Idle-Return 状态管理 (P1)

**相关新功能**: `idle-return prompt that nudges users returning after 75+ minutes`

**当前问题**:
- 长时间空闲后，前端状态可能过期
- WebSocket 连接可能断开
- 缓存数据不一致

**改进方案**:
```javascript
// 前端状态管理
const IDLE_THRESHOLD = 75 * 60 * 1000; // 75分钟

// 检测用户返回
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    const idleTime = Date.now() - lastActivityTime;
    if (idleTime > IDLE_THRESHOLD) {
      // 触发状态刷新
      refreshState();
      showWelcomeBackMessage();
    }
  }
});
```

**实现步骤**:
1. 添加 `lastActivity` 时间戳追踪
2. 实现 `visibilitychange` 事件监听
3. 空闲超过 75 分钟时自动刷新状态
4. 显示"欢迎回来"提示横幅

---

### 3. 技能配置外部化 (P2)

**相关新功能**: `Plugin options (manifest.userConfig) now available externally`

**当前问题**:
- 技能配置硬编码在 SKILL.md 中
- 用户无法自定义技能参数
- 不同环境需要修改代码

**改进方案**:
```
┌─────────────────────────────────────────────────────────────────┐
│                    技能配置结构                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  .claude/skills/backend-dev/                                   │
│  ├── SKILL.md                                                  │
│  ├── manifest.json  (新增)                                     │
│  │   └── userConfig:                                           │
│  │       ├── defaultPort:                                      │
│  │       │   type: number                                      │
│  │       │   default: 4558                                     │
│  │       │   description: "后端服务端口"                         │
│  │       └── databasePath:                                     │
│  │           type: string                                      │
│  │           default: "~/.claude-chat/messages.db"             │
│  │           description: "数据库文件路径"                       │
│  └── docs/                                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**可配置的技能参数**:
| 技能 | 参数 | 默认值 |
|------|------|--------|
| backend-dev | defaultPort | 4558 |
| backend-dev | databasePath | ~/.claude-chat/messages.db |
| frontend-dev | defaultPort | 4559 |
| frontend-dev | styleFramework | tailwindcss |
| agent-teams | defaultModel | glm-5 |

---

### 4. 目录变更响应 (P3)

**相关新功能**: `CwdChanged and FileChanged hook events for reactive environment management`

**应用场景**:
- 项目切换时自动重载配置
- 关键文件变更时刷新状态
- 环境变量变化时更新服务

**改进方案**:
```javascript
// .claude/hooks/cwd-changed.js
module.exports = {
  event: 'CwdChanged',
  handler: async ({ oldCwd, newCwd }) => {
    // 检测是否切换到不同项目
    if (isDifferentProject(oldCwd, newCwd)) {
      // 通知前端刷新
      await notifyFrontend('project_changed', { newCwd });
    }
  }
};
```

---

## 中优先级改进

### 5. Token 使用统计页面

**相关新功能**:
- `Token counts ≥1M now display as "1.5m" instead of "1512.6k"`
- `Global system-prompt caching now works when ToolSearch is enabled`

**改进方案**:
在设置页面添加 Token 使用统计标签页：
- 总 token 使用量
- 缓存命中率
- 按会话/天的使用趋势

### 6. 消息历史搜索

**相关新功能**: `transcript search — press / in transcript mode (Ctrl+O) to search`

**改进方案**:
- 在聊天区域添加搜索功能
- 支持关键词高亮
- 支持时间范围过滤

### 7. API 请求追踪

**相关新功能**: `x-client-request-id header to API requests for debugging timeouts`

**改进方案**:
- 后端记录 `x-client-request-id`
- 超时错误显示请求 ID
- 便于问题排查

---

## 低优先级改进

### 8. 快捷键优化

**相关新功能**:
- `Ctrl+L now clears the screen and forces a full redraw`
- `Ctrl+X Ctrl+E as an alias for opening the external editor`

**建议添加的快捷键**:
| 快捷键 | 功能 |
|--------|------|
| `Ctrl+L` | 清理 UI 状态/重绘 |
| `Ctrl+/` | 显示快捷键帮助 |
| `Escape x2` | 清空输入框 |

### 9. 非流式回退优化

**相关新功能**: `Increased non-streaming fallback token cap (21k → 64k) and timeout (120s → 300s)`

**建议**: 监控非流式回退频率，优化提示词减少触发

---

## 实施路线图

```
Phase 1 (Week 1-2):
├── TaskCreated Hook 集成
└── Idle-Return 状态管理

Phase 2 (Week 3-4):
├── 技能配置外部化
└── Token 使用统计

Phase 3 (Week 5-6):
├── 目录变更响应
├── 消息历史搜索
└── 快捷键优化
```

---

## 参考链接

- [Claude Code 2.1.84 Changelog](https://code.claude.com/changelog/2.1.84)
- [Claude Code 2.1.83 Changelog](https://code.claude.com/changelog/2.1.83)
- [Claude Code 2.1.81 Changelog](https://code.claude.com/changelog/2.1.81)
- [Hooks Documentation](https://code.claude.com/docs/en/hooks)
- [Plugin Configuration](https://code.claude.com/docs/en/plugins)
