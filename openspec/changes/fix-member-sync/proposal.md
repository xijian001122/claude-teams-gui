# Proposal: 修复成员列表同步

## Why

当团队成员通过 Claude Code CLI 创建后，`config.json` 的 `members` 字段可能不会及时更新，导致 GUI 聊天界面无法显示新成员。同时，`config.json` 可能被损坏（如末尾出现多余的 `} ] }`），导致服务重启后无法读取团队配置。

## What Changes

1. **Config 备份与自动恢复**
   - 首次成功读取 `config.json` 时，保存到 `config.backup.json`
   - 后续读取失败时，自动从备份恢复

2. **从 inboxes 目录发现成员**
   - 扫描 `inboxes/*.json` 文件名
   - 发现不在 `config.members` 中的新成员
   - 合并到成员列表中

3. **WebSocket 广播成员更新**
   - 当发现新成员时，广播 `members_updated` 事件
   - 前端实时更新成员列表，无需刷新

## Capabilities

### New Capabilities
- `config-auto-recovery`: config.json 损坏时自动从备份恢复
- `inbox-member-discovery`: 从 inbox 文件名发现团队成员

### Modified Capabilities
- `team-sync`: 增加从 inboxes 目录发现成员的逻辑

## Impact

- `src/server/services/data-sync.ts` - 主要修改
- `src/server/services/file-watcher.ts` - 广播成员更新事件
- `src/client/hooks/useWebSocket.ts` - 处理 members_updated 事件
- `src/client/app.tsx` - 更新团队成员状态
