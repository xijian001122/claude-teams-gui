# 日志格式规范

## Logback 风格格式

日志输出采用 Logback 风格，便于阅读和日志分析：

```
YYYY-MM-DD HH:mm:ss [Module] LEVEL  shorthand
- 内容
```

## 格式分解

### 第一行：标题行

| 字段 | 格式 | 示例 |
|------|------|------|
| 时间日期 | `YYYY-MM-DD HH:mm:ss` | `2026-03-30 14:07:37` |
| 模块名 | `[Module]` | `[DataSync]` |
| 日志级别 | `LEVEL` | `INFO` |
| 缩写路径 | `shorthand` | `s.s.data-sync` |

### 第二行：内容行

以 `- ` 开头，后跟日志内容：

```
- Synced 15/20 messages from member-1
```

## 多行内容处理

当内容包含换行符时，每行都加 `- ` 前缀：

```
2026-03-30 14:07:37 [DataSync] ERROR  s.s.data-sync
- 连接失败
- Error: ECONNREFUSED
- at TCPConnectWrap.afterConnect...
```

## 级别对齐

日志级别固定宽度 5 字符，左对齐：

| 级别 | 输出 |
|------|------|
| DEBUG | `DEBUG` |
| INFO | `INFO ` |
| WARN | `WARN ` |
| ERROR | `ERROR` |

## 完整示例

```
2026-03-30 14:07:37 [Server] INFO  s.server
- Database initialized

2026-03-30 14:07:37 [DataSync] INFO  s.s.data-sync
- Found 7 teams

2026-03-30 14:07:37 [FileWatcher] INFO  s.s.file-watcher
- Started watching

2026-03-30 14:07:37 [WebSocket] INFO  s.ws
- Client connected

2026-03-30 14:07:38 [DataSync] ERROR  s.s.data-sync
- Sync failed
- Error: Timeout after 30s
```

## 与旧格式对比

| 旧格式 | 新格式 |
|--------|--------|
| `[2026-03-28T07:30:52.123Z] [INFO] [DataSync] 消息` | `2026-03-28 15:30:52 [DataSync] INFO  s.s.data-sync`<br>`- 消息` |

新格式优势：
- 本地时间更易读
- 模块名更突出
- 内容独立一行更清晰
- shorthand 便于定位代码

## 相关文档

- [模块命名规范](module-naming.md)
- [日志级别使用](log-levels.md)
