## 1. 基础设施

- [ ] 1.1 创建 `src/server/services/log-factory.ts` - Logger 工厂函数
- [ ] 1.2 创建 `src/server/services/log-transport.ts` - 自定义 Transport（文件写入 + 格式化 + 轮转）
- [ ] 1.3 更新 `src/server/services/index.ts` - 导出新 log 模块

## 2. 核心服务迁移

- [ ] 2.1 迁移 `src/server/server.ts` - 使用新的 log-factory
- [ ] 2.2 迁移 `src/server/cli.ts` - CLI 日志调用
- [ ] 2.3 迁移 `src/server/services/data-sync.ts` - ~30 处 console.log
- [ ] 2.4 迁移 `src/server/services/file-watcher.ts` - ~20 处 console.log
- [ ] 2.5 迁移 `src/server/services/cleanup.ts` - ~10 处 console.log
- [ ] 2.6 迁移 `src/server/services/config.ts` - ~5 处 console.log
- [ ] 2.7 迁移 `src/server/services/task-storage.ts` - ~5 处 console.log
- [ ] 2.8 迁移 `src/server/services/session-summary.ts` - ~2 处 console.log

## 3. 数据库层迁移

- [ ] 3.1 迁移 `src/server/db/index.ts` - 数据库日志

## 4. 路由层迁移

- [ ] 4.1 迁移 `src/server/routes/hooks.ts`
- [ ] 4.2 迁移 `src/server/routes/tasks.ts`
- [ ] 4.3 迁移 `src/server/routes/settings.ts`
- [ ] 4.4 迁移 `src/server/routes/permission-response.ts`

## 5. 清理与验证

- [ ] 5.1 删除旧 `src/server/services/logger.ts`
- [ ] 5.2 更新 `src/server/services/index.ts` - 移除 LoggerService 导出
- [ ] 5.3 验证日志格式输出正确
- [ ] 5.4 验证日志轮转功能正常
- [ ] 5.5 更新 CLAUDE.md 版本号
