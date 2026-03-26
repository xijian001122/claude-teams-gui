## 1. Hook 脚本开发

- [ ] 1.1 创建 `.claude/hooks/task-created.js` Hook 脚本
- [ ] 1.2 实现 Hook 脚本读取任务信息并调用后端 API
- [ ] 1.3 添加错误处理和日志记录

## 2. 后端 API 开发

- [ ] 2.1 创建 `POST /api/hooks/task-created` API 端点
- [ ] 2.2 实现 WebSocket `task_created` 事件广播
- [ ] 2.3 添加请求验证和错误处理
- [ ] 2.4 在 `server.ts` 中注册路由

## 3. 前端 WebSocket 集成

- [ ] 3.1 在 `useWebSocket` hook 中添加 `task_created` 事件监听
- [ ] 3.2 实现任务列表自动更新逻辑
- [ ] 3.3 添加任务 ID 去重逻辑
- [ ] 3.4 实现团队过滤（只显示当前团队的任务）

## 4. 测试

- [ ] 4.1 编写 Hook 脚本单元测试
- [ ] 4.2 编写 API 端点测试
- [ ] 4.3 编写前端事件处理测试
- [ ] 4.4 E2E 测试：任务创建到前端显示流程

## 5. 文档

- [ ] 5.1 更新 CLAUDE.md 添加 Hook 配置说明
- [ ] 5.2 更新 websocket-protocol 技能文档
