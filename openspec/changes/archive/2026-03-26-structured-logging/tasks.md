## 1. LoggerService 核心实现

- [ ] 1.1 创建 `src/server/services/logger.ts` 服务类
- [ ] 1.2 实现 console 方法拦截（log, error, warn, info）
- [ ] 1.3 实现日志级别路由（console.log → 全部，info.log → INFO，error.log → ERROR）
- [ ] 1.4 实现日志文件写入逻辑

## 2. 日志轮转系统

- [ ] 2.1 实现大小检测与轮转（达到 10MB 时触发）
- [ ] 2.2 实现日期检测与轮转（跨日期时触发）
- [ ] 2.3 实现轮转文件命名（console-001.log, console-002.log）
- [ ] 2.4 实现历史日志目录创建（`logs/YYYY-MM-DD/`）
- [ ] 2.5 实现日志保留与清理（超过 7 天自动删除）

## 3. 配置系统集成

- [ ] 3.1 扩展 `config.json` 接口支持日志配置
- [ ] 3.2 实现配置加载与验证
- [ ] 3.3 实现配置热重载机制

## 4. 服务集成

- [ ] 4.1 在 `server.ts` 初始化 LoggerService
- [ ] 4.2 注册到 services/index.ts 导出
- [ ] 4.3 确保日志目录创建（`~/.claude-chat/logs/`）

## 5. Web UI 配置面板

- [ ] 5.1 创建日志配置面板组件
- [ ] 5.2 实现日志级别选择 UI
- [ ] 5.3 实现大小阈值和保留天数配置 UI
- [ ] 5.4 连接配置 API（读取/保存）

## 6. 日志分析命令

- [ ] 6.1 创建 `/log-fix` slash 命令
- [ ] 6.2 实现 error.log 读取与解析
- [ ] 6.3 实现错误分类（Database/Network/Permission）
- [ ] 6.4 生成分析报告与修复建议

## 7. 测试与验证

- [ ] 7.1 单元测试：LoggerService 核心方法
- [ ] 7.2 单元测试：日志轮转逻辑
- [ ] 7.3 集成测试：日志文件生成与轮转
- [ ] 7.4 手动验证：日志配置 UI 功能
