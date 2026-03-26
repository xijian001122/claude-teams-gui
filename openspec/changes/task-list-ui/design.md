## Context

Claude Agent GUI 是一个 Web UI 应用，用于查看 Agent Teams 的协作消息。当前任务管理功能只能在终端中通过 TaskList/TaskCreate/TaskUpdate 工具操作，用户无法在 Web UI 中查看任务状态。

任务数据存储在 `~/.claude/tasks/<team-name>/` 目录下的 JSON 文件中，需要通过后端 API 暴露给前端。

## Goals / Non-Goals

**Goals:**
- 在 Web UI 中展示当前团队的任务列表
- 显示任务 ID、名称、负责人、状态
- 显示任务依赖关系（blocked by）
- 实时刷新任务状态

**Non-Goals:**
- 在 Web UI 中创建/编辑/删除任务（后续扩展）
- 任务分配功能（后续扩展）
- 任务搜索和过滤（后续扩展）

## Decisions

### D1: 后端 API 设计

**Decision**: 创建 `GET /api/teams/:name/tasks` API 端点读取任务文件

**Rationale**:
- 任务数据存储在文件系统中，不需要数据库迁移
- 与现有 API 风格一致（RESTful）
- 简单直接，易于实现

**API 响应格式**:
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": "1",
        "subject": "实现登录功能",
        "owner": "developer",
        "status": "completed",
        "blockedBy": []
      },
      {
        "id": "2",
        "subject": "编写单元测试",
        "owner": "tester",
        "status": "pending",
        "blockedBy": ["1"]
      }
    ]
  }
}
```

**Alternatives Considered**:
- WebSocket 推送任务状态 → Rejected: 初期不需要实时性，API 轮询足够
- 数据库存储任务 → Rejected: 任务已存储在文件中，无需迁移

### D2: 前端组件位置

**Decision**: 使用悬浮抽屉（Floating Drawer）在右下角，点击团队时显示该团队的任务

**Rationale**:
- 任务与团队强关联，点击团队自动加载该团队任务
- 不占用 Sidebar 空间，不影响团队列表浏览
- 切换团队时自动更新任务状态，无需额外同步逻辑
- 类似主流 IM 的未读消息浮窗设计

**交互流程**:
```
1. 用户在 Sidebar 点击团队 → 选中团队
2. 右下角悬浮按钮显示任务数量徽章
3. 点击悬浮按钮 → 展开任务抽屉
4. 抽屉显示当前选中团队的任务列表
5. 切换团队 → 抽屉自动更新为新团队的任务
```

**布局设计**:
```
┌─────────────────────────────────────────────────────────┐
│ Sidebar                    │  Chat Area                 │
│ ┌─────────────────────┐    │  ┌─────────────────────┐   │
│ │ Claude Teams        │    │  │                     │   │
│ │ [新建团队]          │    │  │   聊天消息区域      │   │
│ │ ┌─────────────────┐ │    │  │                     │   │
│ │ │ ▶ 团队A (3任务) │ │    │  │                     │   │
│ │ │   团队B          │ │    │  │                     │   │
│ │ │   团队C          │ │    │  └─────────────────────┘   │
│ │ └─────────────────┘ │    │                            │
│ │ [设置]              │    │              ┌──────────┐  │
│ └─────────────────────┘    │              │ 📋 (3)  │  │ ← 悬浮按钮
│                            │              └────┬─────┘  │
└────────────────────────────┼───────────────────┼────────┘
                             │         点击展开   │
                             │                   ▼
                             │  ┌─────────────────────────┐
                             │  │ 团队A 任务列表     [×]  │
                             │  ├─────┬─────────┬─────────┤
                             │  │ #   │ 任务    │ 状态    │
                             │  ├─────┼─────────┼─────────┤
                             │  │ 1   │ 实现功能│ ✅      │
                             │  │ 2   │ 编写测试│ ⏳等待#1│
                             │  └─────┴─────────┴─────────┘
                             │  └─────────────────────────┘
```

**Alternatives Considered**:
- Tab 切换 → Rejected: 切换团队时需要额外同步任务状态，交互割裂
- Sidebar 底部面板 → Rejected: 占用团队列表空间，影响浏览体验
- 独立页面 → Rejected: 任务与团队相关，需要在聊天时可见

### D3: 任务状态展示

**Decision**: 使用图标和颜色区分状态

| 状态 | 图标 | 颜色 | 说明 |
|------|------|------|------|
| pending | ⏳ | gray | 等待中 |
| in_progress | 🔄 | blue | 进行中 |
| completed | ✅ | green | 已完成 |
| blocked | 🚫 | red | 被阻塞 |

**依赖关系展示**:
- 在状态列显示 `⏳#1` 表示等待任务 #1 完成
- 点击可跳转到依赖任务（后续扩展）

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| 任务文件可能被外部修改 | API 层做数据校验，无效数据返回空列表 |
| 大量任务时性能问题 | 添加分页支持（后续扩展） |
| 任务状态更新不及时 | 添加手动刷新按钮 |

## Implementation Notes

### 后端实现

1. 创建 `src/server/routes/tasks.ts` 路由文件
2. 实现 `readTasksFromFiles()` 函数读取 `~/.claude/tasks/<team-name>/` 目录
3. 在 `server.ts` 中注册路由

### 前端实现

1. 在 `src/shared/types.ts` 添加 Task 类型
2. 创建 `src/client/components/TaskPanel.tsx` 组件
3. 在 `src/client/components/Sidebar.tsx` 中添加任务面板
4. 在 `src/client/app.tsx` 中添加任务状态管理
