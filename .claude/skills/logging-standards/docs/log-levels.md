# 日志级别使用

## 级别定义

| 级别 | 数值 | 使用场景 |
|------|------|---------|
| DEBUG | 20 | 详细调试信息 |
| INFO | 30 | 正常业务流程 |
| WARN | 40 | 潜在问题警告 |
| ERROR | 50 | 错误和异常 |

## 使用指南

### DEBUG

**何时使用**：
- 开发调试阶段
- 需要追踪详细执行流程
- 性能分析数据

**示例**：
```typescript
log.debug({ sql, params }, '执行 SQL 查询');
log.debug({ request: req.body }, '收到请求');
```

**注意**：生产环境通常禁用 DEBUG 级别。

### INFO

**何时使用**：
- 服务启动/关闭
- 业务操作完成
- 状态变更

**示例**：
```typescript
log.info('Database initialized');
log.info({ count: results.length }, '同步完成');
log.info({ teamId, memberName }, '成员上线');
```

### WARN

**何时使用**：
- 潜在问题（但不影响运行）
- 降级处理
- 即将废弃的功能

**示例**：
```typescript
log.warn({ field }, '配置字段缺失，使用默认值');
log.warn({ retries }, '连接重试中...');
log.warn('此 API 即将废弃，请使用新版本');
```

### ERROR

**何时使用**：
- 操作失败
- 异常捕获
- 不可恢复的错误

**示例**：
```typescript
log.error({ err }, '数据库连接失败');
log.error({ teamId, err }, '同步失败');
log.error({ code, message }, 'API 错误');
```

## 级别配置

### 配置结构

```typescript
interface LogConfig {
  enabled: boolean;
  level: 'debug' | 'info' | 'warn' | 'error';
  maxSize: number;
  maxDays: number;
}
```

### 级别过滤

| 配置级别 | 输出级别 |
|---------|---------|
| `debug` | DEBUG, INFO, WARN, ERROR |
| `info` | INFO, WARN, ERROR |
| `warn` | WARN, ERROR |
| `error` | ERROR only |

## 最佳实践

### 1. 选择合适的级别

```typescript
// ❌ 错误：正常流程使用 ERROR
log.error('用户登录成功');

// ✅ 正确：正常流程使用 INFO
log.info('用户登录成功');
```

### 2. 包含上下文

```typescript
// ❌ 错误：缺少上下文
log.error('操作失败');

// ✅ 正确：包含关键信息
log.error({ teamId, operation, err }, '操作失败');
```

### 3. 错误日志包含错误对象

```typescript
try {
  await riskyOperation();
} catch (err) {
  // ✅ 包含错误对象，保留堆栈信息
  log.error({ err, context }, '操作失败');
}
```

### 4. 避免敏感信息

```typescript
// ❌ 错误：包含敏感信息
log.info({ password }, '用户登录');

// ✅ 正确：脱敏处理
log.info({ username }, '用户登录');
```
