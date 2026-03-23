## 1. 类型定义和共享模块

- [x] 1.1 扩展 Task 类型，添加 history 字段到 `src/shared/types.ts`
- [x] 1.2 创建 TaskHistoryEntry 接口定义
- [x] 1.3 添加 createdAt/updatedAt 时间戳字段

## 2. 任务持久化服务

- [x] 2.1 创建 `src/server/services/task-storage.ts` 任务文件存储服务
- [x] 2.2 实现 `writeTaskFile()` 原子写入方法
- [x] 2.3 实现 `readTaskFile()` 读取方法
- [x] 2.4 实现 `deleteTaskFile()` 删除方法
- [x] 2.5 实现 `updateTaskWithHistory()` 更新并记录历史

## 3. 任务 API 路由

- [x] 3.1 扩展 `src/server/routes/tasks.ts`，添加 POST 端点
- [x] 3.2 添加 PUT `/:name/tasks/:id` 更新端点
- [x] 3.3 添加 DELETE `/:name/tasks/:id` 删除端点
- [x] 3.4 添加 GET `/api/tasks` 全局任务视图端点
- [x] 3.5 实现状态过滤参数 `?status=`
- [x] 3.6 返回任务统计计数

## 4. 前端 TaskPanel 增强

- [x] 4.1 添加全局视图切换按钮
- [x] 4.2 实现全局任务列表展示
- [x] 4.3 添加任务历史记录展示（展开/折叠）
- [x] 4.4 添加状态过滤下拉菜单
- [x] 4.5 添加任务统计摘要展示

## 5. 会话摘要生成

- [x] 5.1 创建 `src/server/services/session-summary.ts` 服务
- [x] 5.2 实现任务统计计算方法
- [x] 5.3 实现 Markdown 格式化方法
- [x] 5.4 在团队关闭时触发摘要生成
- [x] 5.5 保存摘要文件到团队目录

## 6. 测试

- [ ] 6.1 编写任务持久化 API 单元测试
- [ ] 6.2 编写全局任务视图 API 测试
- [ ] 6.3 编写历史记录功能测试
- [ ] 6.4 编写会话摘要生成测试
- [ ] 6.5 E2E 测试：任务 CRUD 流程

## 7. 文档

- [ ] 7.1 更新 CLAUDE.md 添加任务系统说明
- [ ] 7.2 更新 frontend-dev 技能文档
