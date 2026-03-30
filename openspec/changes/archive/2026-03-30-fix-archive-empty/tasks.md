## 1. 归档数据导出

- [x] 1.1 修改 `src/server/services/data-sync.ts` 的 `archiveTeamData` 方法
  - 从数据库读取团队信息和消息
  - 写入 `team.json`（团队元信息）
  - 写入 `messages.json`（所有消息记录）
- [x] 1.2 在 `archiveTeamData` 中添加空目录清理逻辑
  - 扫描 `~/.claude-chat/archive/` 下的空目录并删除

## 2. 永久删除清理

- [x] 2.1 修改 `src/server/routes/archive.ts` 的 DELETE 路由
  - 删除匹配 `<name>-*` 模式的归档目录
  - 需要传入 `dataDir` 参数到路由

## 3. 验证

- [x] 3.1 重启服务后验证归档文件正确生成
- [x] 3.2 验证空归档目录已清理
