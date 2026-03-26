# Tasks: Task List UI

## 1. 后端 - API 路由

- [x] 1.1 创建 Task 类型定义
  - 位置: `src/shared/types.ts`
  - 添加 Task 接口和类型字段

- [x] 1.2 创建任务路由文件
  - 位置: `src/server/routes/tasks.ts`
  - 实现 `GET /api/teams/:name/tasks` 端点
  - 读取 `~/.claude/tasks/<team-name>/` 目录下的任务文件
  - 解析 JSON 并返回任务列表

- [x] 1.3 注册任务路由
  - 位置: `src/server/server.ts`
  - 导入 tasks 路由并注册到 Fastify

## 2. 前端 - 组件开发

- [x] 2.1 创建 TaskPanel 组件
  - 位置: `src/client/components/TaskPanel.tsx`
  - 实现可折叠的任务面板
  - 显示任务列表表格
  - 状态图标和颜色区分

- [x] 2.2 添加任务状态管理
  - 位置: `src/client/app.tsx`
  - 导入 TaskPanel 组件
  - 在布局中渲染 TaskPanel

- [x] 2.3 集成样式
  - 位置: `src/client/styles/globals.css`
  - 添加 TaskPanel 完整样式
  - 包含悬浮按钮、抽屉、任务项样式

## 3. 测试

- [ ] 3.1 API 测试
  - 测试 `/api/teams/:name/tasks` 端点
  - 测试无任务时的响应
  - 测试有任务时的响应

## 4. 文档
- [ ] 4.1 更新 README
  - 添加任务列表功能说明
