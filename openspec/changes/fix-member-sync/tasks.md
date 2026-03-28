## 1. Config 自动恢复

- [x] 1.1 在 `data-sync.ts` 成功读取 config.json 后保存到 `config.backup.json`
- [x] 1.2 解析失败时尝试读取 `config.backup.json`
- [x] 1.3 恢复成功后重写 `config.json` 文件

## 2. Inbox 成员发现

- [x] 2.1 在 `syncTeam()` 中扫描 `inboxes/*.json` 文件名
- [x] 2.2 合并 config.members 和 inbox 发现的成员
- [x] 2.3 为发现的成员生成头像颜色和字母

## 3. WebSocket 广播更新

- [x] 3.1 当成员列表变化时广播 `members_updated` 事件
- [x] 3.2 前端 `useWebSocket.ts` 处理 `members_updated` 事件
- [x] 3.3 前端 `app.tsx` 更新团队成员状态

## 4. 测试与发布

- [ ] 4.1 测试 config 损坏恢复功能
- [ ] 4.2 测试新成员发现功能
- [ ] 4.3 更新版本号并发布
