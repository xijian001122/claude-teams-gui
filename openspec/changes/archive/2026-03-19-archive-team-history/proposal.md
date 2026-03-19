## Why

当 Claude Code 关闭团队时，团队目录会被删除，导致用户无法查看该团队的历史消息记录。虽然消息已持久化到 SQLite 数据库，但前端缺少归档团队的 UI 入口，用户无法访问这些历史数据。

## UI 效果图

![归档功能 UI 效果图](../../../demo/archive-team-history-ui.png)

效果图展示三个关键交互状态：
1. **折叠状态（默认）**：侧边栏底部显示"归档"按钮，显示归档团队数量
2. **展开列表**：显示所有已归档团队，每项带归档日期
3. **只读浏览**：顶部黄色提示横幅，底部输入框禁用

## What Changes

- 侧边栏底部新增"归档"区域，展示所有已归档团队列表（带归档日期）
- 点击归档团队可查看其历史消息，进入只读模式
- 只读模式显示提示横幅，输入框禁用，防止误操作
- `app.tsx` 在启动时加载归档团队列表，并监听 `team_archived` WebSocket 事件实时更新
- 侧边栏归档区域支持折叠/展开，默认折叠

## Capabilities

### New Capabilities

- `archived-team-viewer`: 归档团队查看功能——在侧边栏展示已归档团队列表，支持点击进入只读浏览模式查看历史消息

### Modified Capabilities

（无现有规范需要修改）

## Impact

- **前端文件**：`src/client/app.tsx`、`src/client/components/Sidebar.tsx`、`src/client/components/ChatArea.tsx`
- **API**：`GET /api/archive` 已实现，前端需开始调用
- **WebSocket**：`team_archived` 事件已定义，前端需处理以实时刷新归档列表
- **无后端变更**：后端 API、数据库、文件监听均已完整实现
