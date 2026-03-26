## Context

当前 Claude Chat 的任务系统使用文件系统存储任务（`~/.claude/tasks/<team-name>/`），前端需要轮询或手动刷新才能获取最新任务状态。Claude Code 2.1.84 新增了 `TaskCreated hook`，可以在任务创建时触发自定义脚本。

**技术约束**:
- 后端使用 Fastify + WebSocket
- 前端使用 Preact + 自定义 WebSocket hook
- Hook 脚本运行在 Claude Code 端，需要调用后端 API

## Goals / Non-Goals

**Goals:**
- 实现任务创建时的实时通知
- WebSocket 推送 `task_created` 事件到所有连接的客户端
- 前端自动更新任务列表，无需手动刷新

**Non-Goals:**
- 任务更新/删除的实时通知（可后续扩展）
- 跨团队任务通知
- 离线消息队列

## Decisions

### 1. Hook 触发机制

**决定**: 使用 HTTP POST 调用后端 API

**理由**:
- Hook 脚本独立于 Claude Chat 后端进程
- HTTP 调用简单可靠，便于调试
- 可复用现有的 API 基础设施

**替代方案**:
- 直接 WebSocket 连接：增加复杂度，需要管理连接生命周期
- 文件监听：轮询延迟高，资源消耗大

### 2. 事件广播策略

**决定**: 广播到所有连接的客户端，由前端过滤

**理由**:
- 实现简单，后端无需维护团队-客户端映射
- 前端已有团队过滤逻辑
- 消息体小，带宽影响可忽略

### 3. 前端状态更新

**决定**: 直接追加到任务列表，避免全量刷新

**理由**:
- 减少不必要的 API 调用
- 保留用户当前的滚动位置和选中状态
- 体验更流畅

## Architecture

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│  Claude Code    │      │  Claude Chat    │      │   Browser UI    │
│  TaskCreate     │      │    Backend      │      │   (Preact)      │
└────────┬────────┘      └────────┬────────┘      └────────┬────────┘
         │                        │                        │
         │ 1. TaskCreate 调用     │                        │
         │                        │                        │
         │ 2. Hook 触发           │                        │
         │    task-created.js     │                        │
         │                        │                        │
         │ 3. HTTP POST           │                        │
         │ ──────────────────────▶│                        │
         │   /api/hooks/          │                        │
         │   task-created         │                        │
         │                        │                        │
         │                        │ 4. WebSocket 广播      │
         │                        │ ──────────────────────▶│
         │                        │   task_created 事件    │
         │                        │                        │
         │                        │                        │ 5. 更新任务列表
         │                        │                        │
```

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|----------|
| Hook 脚本调用失败 | 添加重试逻辑，记录错误日志 |
| WebSocket 断开 | 前端自动重连，重连后主动拉取最新任务 |
| 重复通知 | 使用任务 ID 去重 |

## Migration Plan

1. **Phase 1**: 部署后端 API 和 WebSocket 广播
2. **Phase 2**: 部署前端监听逻辑
3. **Phase 3**: 配置 Hook 脚本

无需数据迁移，纯增量功能。
