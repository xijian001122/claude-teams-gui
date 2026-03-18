# 测试文档

## 测试结构

```
tests/
├── unit/                    # 单元测试
│   └── config-service.test.ts
├── integration/             # 集成测试
│   └── config-sync.test.ts
├── e2e/                     # 端到端测试
│   └── config-ui.spec.ts
└── fixtures/                # 测试数据
    └── test-config.json
```

## 运行测试

### 单元测试
```bash
npm run test tests/unit/config-service.test.ts
```

### 集成测试
```bash
npm run test tests/integration/config-sync.test.ts
```

### E2E 测试
```bash
npm run test:e2e tests/e2e/config-ui.spec.ts
```

## 测试覆盖范围

### ConfigService 单元测试
- ✅ 配置加载和验证
- ✅ 配置更新逻辑
- ✅ 变化检测（detectChanges）
- ✅ 重启需求判断（needsRestart）
- ✅ 待处理变化追踪（getPendingChanges）
- ⏳ 文件监听（需要集成测试环境）
- ⏳ 防抖写入（需要集成测试环境）

### 集成测试
- ⏳ 文件变化自动检测（100ms 内）
- ⏳ API 更新触发文件写入（300ms 防抖）
- ⏳ WebSocket config_updated 事件广播
- ⏳ 多次快速更新的防抖验证
- ⏳ 无效 JSON 错误处理

### E2E 测试
- ⏳ 侧边栏重启徽章显示
- ⏳ WebSocket 事件触发前端状态更新
- ⏳ 完整的配置更新流程

## 测试数据

### 配置分类

**需要重启的配置**：
- `port`
- `host`
- `dataDir`
- `teamsPath`

**可热加载的配置**：
- `theme`
- `retentionDays`
- `desktopNotifications`
- `soundEnabled`
- `cleanupEnabled`
- `cleanupTime`

## 已知问题

### settingsRoutes 未集成 ConfigService
**问题**：当前 `src/server/routes/settings.ts` 未使用 ConfigService
**影响**：
- PUT /api/settings 不会持久化到文件
- 不会触发 WebSocket config_updated 事件
- pendingRestart 状态不会更新

**解决方案**：将 configService 传递给 settingsRoutes，