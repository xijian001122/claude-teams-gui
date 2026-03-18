# Claude Chat 快速开始

## 安装

### 方式一：npm 全局安装（推荐）

```bash
npm install -g claude-chat
claude-chat
```

### 方式二：使用 npx（无需安装）

```bash
npx claude-chat
```

### 方式三：源码安装

```bash
git clone https://github.com/yourname/claude-chat.git
cd claude-chat
npm install
npm run build
npm start
```

---

## 首次使用

### 1. 启动服务

```bash
$ claude-chat
✓ Server started at http://localhost:3456
✓ WebSocket listening on ws://localhost:3456/ws
✓ Database initialized at ~/.claude-chat/
✓ Auto-detected 2 teams from .claude/teams/

Opening browser...
```

### 2. 界面导航

```
┌─────────────────────────────────────────────────────────────┐
│  Claude Teams                                    [◐] [设置] │
├────────────────┬────────────────────────────────────────────┤
│                │                                            │
│  + 新建团队     │  dev-test-team                        [i]  │
│                ├────────────────────────────────────────────┤
│  ● dev-test    │  ┌───┐                                     │
│    team        │  │ D │ developer                           │
│    3           │  └───┘                                     │
│                │  ┌─────────────────────────┐               │
│  ○ default     │  │ 已就绪，等待任务分配       │               │
│                │  └─────────────────────────┘               │
│  ───────────── │                                            │
│                │                                    ┌───┐   │
│  📦 归档        │                                    │ U │   │
│    2 个团队     │                                    └───┘   │
│                │              ┌─────────────────────┘       │
│                │              │ 收到  继续加油                │
│                │              └────────────────────────      │
│                │                                            │
│                ├────────────────────────────────────────────┤
│                │  ┌────────────────────────────────┐ [发送] │
│                │  │ 输入消息... @                  │        │
│                │  └────────────────────────────────┘        │
│                │                                            │
└────────────────┴────────────────────────────────────────────┘
```

**界面说明：**
- **左侧边栏**: 团队列表，按最后活动时间排序
- **中间主区域**: 当前团队的聊天记录
- **顶部**: 团队名称和主题切换按钮
- **底部**: 消息输入框

---

## 基本操作

### 发送消息

1. 在底部输入框输入消息
2. 按 `Enter` 发送（`Shift+Enter` 换行）
3. 消息会显示在右侧气泡中

### @提及成员

**方式一：输入框 @**
1. 输入 `@` 弹出成员列表
2. 使用 `↑` `↓` 选择成员
3. 按 `Enter` 或 `Tab` 确认

**方式二：点击头像**
1. 点击消息左侧的头像
2. 自动在输入框添加 `@member`

### 切换团队

- 点击左侧团队名称切换
- 未读消息会显示红色数字角标

### 切换主题

- 点击顶部 `◐` 图标切换白天/黑夜模式
- 偏好会自动保存

---

## 命令行参数

```bash
claude-chat [options]

Options:
  -p, --port <port>        指定端口 (默认: 3456)
  -h, --host <host>        指定主机 (默认: localhost)
  -d, --data <path>        数据目录 (默认: ~/.claude-chat)
  --teams <path>           Claude Teams 路径 (默认: ./.claude/teams)
  --headless               仅启动服务器，不打开浏览器
  --no-sync                禁用 Claude Teams 同步
  -v, --version            显示版本号
  --help                   显示帮助

Examples:
  claude-chat --port 8080
  claude-chat --data ~/my-chat-data
  claude-chat --headless
```

---

## Claude Code 集成

如果你在使用 Claude Code，可以直接通过内置命令启动：

```bash
# 在 Claude Code 会话中
/claude-chat

# 指定端口
/claude-chat --port 8080
```

**注意事项：**
- 需要在 `.claude/teams/` 目录所在的项目根目录运行
- 会自动检测并同步现有的 Teams 数据

---

## 配置

配置文件位于 `~/.claude-chat/config.json`：

```json
{
  "port": 3456,
  "host": "localhost",
  "dataDir": "~/.claude-chat",
  "retentionDays": 90,
  "theme": "auto",
  "desktopNotifications": true,
  "soundEnabled": false,
  "cleanupEnabled": true,
  "cleanupTime": "02:00"
}
```

### 修改配置

**方式一：通过界面**
1. 点击顶部 [设置] 按钮
2. 在弹窗中修改配置
3. 点击保存

**方式二：直接编辑文件**
```bash
vim ~/.claude-chat/config.json
# 修改后重启服务
```

---

## 数据管理

### 数据目录结构

```
~/.claude-chat/
├── config.json              # 配置文件
├── teams/                   # 活跃团队数据
│   ├── dev-test-team/
│   │   ├── messages.db      # SQLite 消息数据库
│   │   ├── metadata.json    # 团队元数据
│   │   └── attachments/     # 附件文件
│   └── default/
│       ├── messages.db
│       └── attachments/
└── archive/                 # 归档团队
    └── dev-test-team-20250317/
        ├── messages.db
        └── attachments/
```

### 备份数据

```bash
# 备份整个数据目录
cp -r ~/.claude-chat ~/claude-chat-backup

# 或导出特定团队
claude-chat export dev-test-team --output ./backup.zip
```

### 恢复数据

```bash
# 恢复备份
cp -r ~/claude-chat-backup ~/.claude-chat

# 或导入导出文件
claude-chat import ./backup.zip
```

### 清理数据

**自动清理：**
- 默认每天凌晨 2 点自动清理
- 保留最近 90 天的数据
- 可在配置中修改 `retentionDays` 和 `cleanupTime`

**手动清理：**
```bash
# 清理过期数据
claude-chat cleanup

# 清理特定团队
claude-chat cleanup --team dev-test-team

# 永久删除归档团队
claude-chat archive delete dev-test-team-20250317
```

---

## 查看归档

当 Claude Team 被删除时，数据会自动归档：

1. 点击左侧边栏底部的 **📦 归档**
2. 查看所有已归档的团队
3. 点击团队名称查看历史记录
4. 支持导出或删除归档

```
┌─────────────────────────────────────────────────────────────┐
│  ← 返回活跃团队    归档团队 (2)                          [◐] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ 📁 dev-test-team-20250317                              │ │
│  │    删除时间: 2025-03-17 14:30                          │ │
│  │    消息数: 1,234 | 最后活动: 2025-03-16                │ │
│  │                                  [查看] [导出] [删除]  │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ⚠️ 归档团队将在 90 天后自动删除（可在设置中调整）          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 故障排除

### 端口被占用

```bash
# 错误：Port 3456 is already in use

# 解决：更换端口
claude-chat --port 8080
```

### 无法检测 Teams

```bash
# 确保在正确的目录运行
pwd  # 应该包含 .claude/teams/

# 或手动指定路径
claude-chat --teams /path/to/.claude/teams
```

### 消息不实时更新

1. 检查 WebSocket 连接状态（浏览器开发者工具）
2. 刷新页面重连
3. 查看服务端日志是否有错误

### 数据库损坏

```bash
# 备份现有数据
cp ~/.claude-chat/teams/dev-test-team/messages.db ~/.claude-chat/teams/dev-test-team/messages.db.bak

# 使用 SQLite 修复
sqlite3 ~/.claude-chat/teams/dev-test-team/messages.db ".recover" | sqlite3 fixed.db
mv fixed.db ~/.claude-chat/teams/dev-test-team/messages.db
```

---

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl/Cmd + K` | 搜索消息 |
| `Ctrl/Cmd + /` | 显示快捷键帮助 |
| `Ctrl/Cmd + Shift + N` | 新建团队 |
| `Ctrl/Cmd + [` | 切换到上一个团队 |
| `Ctrl/Cmd + ]` | 切换到下一个团队 |
| `Escape` | 关闭弹窗/取消输入 |
| `Enter` | 发送消息 |
| `Shift + Enter` | 换行 |
| `@` | 唤起@成员列表 |

---

## 更新

```bash
# 检查更新
claude-chat --version

# 更新到最新版
npm update -g claude-chat

# 或重新安装
npm uninstall -g claude-chat
npm install -g claude-chat
```

---

## 获取帮助

- **GitHub Issues**: https://github.com/yourname/claude-chat/issues
- **文档**: https://github.com/yourname/claude-chat/tree/main/docs
- **Discussions**: https://github.com/yourname/claude-chat/discussions
