# Claude Agent GUI

Claude Code Teams 可视化聊天界面，提供类似微信的 AI 协作消息体验。

[English](./README.md) | 中文版

---

## 项目背景

当你同时使用多个 Claude Code Teams（如同同时开发多个项目或为不同客户提供服务）时，管理各个团队的 inbox 和消息变得复杂。Claude Agent GUI 通过统一的界面，让你可以在一个应用中实时查看、收发所有团队的消息，并支持桌面通知，再也不会错过重要信息。

---

## 主要特性

| 特性 | 说明 |
|------|------|
| **实时消息** | 基于 WebSocket 的即时消息传递，无需刷新 |
| **团队管理** | 轻松切换不同的 Claude Teams |
| **@提及** | 自动补全的成员提及功能 |
| **主题切换** | 支持浅色/深色模式 |
| **数据持久化** | 独立存储，删除团队后消息仍保留 |
| **归档管理** | 查看已归档团队的聊天记录 |
| **桌面通知** | 新消息时显示系统通知 |

---

## 当前版本

**v0.1.1**

详细更新记录请查看 [CHANGELOG.md](./CHANGELOG.md)。

---

## 作为 Claude 插件安装（推荐）

在 Claude Code 中安装，实现自动启动和实时通知：

### 步骤 1：添加插件市场

```bash
claude plugin marketplace add github:xijian001122/claude-teams-gui
```

### 步骤 2：安装插件

```bash
claude plugin install claude-teams-gui
```

### 包含的 Hooks

| Hook | 描述 |
|------|------|
| `SessionStart` | Claude Code 启动时自动启动 GUI 服务 |
| `TaskCreated` | 任务创建时发送实时通知 |

### 验证安装

```bash
# 列出已安装的插件
claude plugin list

# 查看已配置的市场
claude plugin marketplace list
```

---

## 快速开始

### 前置要求

- Node.js >= 18.0.0
- npm 或 bun

### 安装

```bash
# 从 npm 安装（全局安装）
npm install -g claude-teams-gui

# 或从源码安装
git clone <repository-url>
cd claude-teams-gui
npm install
npm run build
npm link  # 创建全局链接
```

### 启动

```bash
# 方式一：使用全局命令（安装后）
claude-teams-gui

# 方式二：使用 npm 脚本（开发模式）
npm run dev

# 方式三：使用一键启动脚本（推荐）
bash scripts/start.sh
```

启动后，界面自动在浏览器打开，默认地址：`http://localhost:4559`

### 配置

配置文件位于 `~/.claude-chat/config.json`：

```json
{
  "port": 4558,
  "host": "localhost",
  "clientPort": 4559,
  "clientHost": "localhost",
  "dataDir": "~/.claude-chat",
  "teamsPath": "~/.claude/teams",
  "retentionDays": 90,
  "theme": "auto",
  "desktopNotifications": true,
  "soundEnabled": false,
  "cleanupEnabled": true,
  "cleanupTime": "02:00"
}
```

**配置项说明：**

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| `port` | 4558 | 后端服务端口 |
| `clientPort` | 4559 | 前端开发服务器端口 |
| `dataDir` | `~/.claude-chat` | 数据存储目录 |
| `teamsPath` | `~/.claude/teams` | Claude Teams 根目录 |
| `theme` | `auto` | 主题：`light`、`dark` 或 `auto` |
| `desktopNotifications` | `true` | 启用桌面通知 |
| `retentionDays` | 90 | 消息保留天数 |

---

## 功能使用

### 团队管理

Claude Agent GUI 自动发现 `~/.claude/teams/` 下的所有团队。

- **切换团队**：在左侧边栏点击团队名称
- **查看成员**：点击团队名称旁的成员图标
- **已归档团队**：点击"已归档"分组查看

### 发送消息

1. 选择目标团队
2. 在输入框输入消息
3. 按 `Enter` 或点击发送按钮
4. 使用 `@成员名` 提及特定成员

### 主题设置

点击右上角设置图标，选择：
- **浅色模式**：白天使用
- **深色模式**：夜晚使用
- **自动**：跟随系统设置

### 消息通知

- 首次使用时，浏览器会请求通知权限
- 允许后，新消息将在桌面右下角显示通知
- 可在设置中禁用通知

---

## 常见问题

<details>
<summary><b>如何修改端口？</b></summary>

修改 `~/.claude-chat/config.json` 中的 `port` 和 `clientPort`：

```json
{
  "port": 8080,
  "clientPort": 8081
}
```

然后重启应用。

</details>

<details>
<summary><b>如何启用/禁用桌面通知？</b></summary>

在设置中切换"桌面通知"开关，或修改配置文件：

```json
{
  "desktopNotifications": false
}
```

</details>

<details>
<summary><b>如何切换主题？</b></summary>

点击右上角设置图标，选择浅色/深色/自动模式。

或修改配置文件：

```json
{
  "theme": "dark"
}
```

</details>

<details>
<summary><b>数据存储在哪里？</b></summary>

- **消息数据**：`~/.claude-chat/messages.db`（SQLite）
- **配置文件**：`~/.claude-chat/config.json`
- **Teams 消息**：`~/.claude/teams/<team-name>/inboxes/*.json`

</details>

<details>
<summary><b>如何查看历史消息？</b></summary>

Claude Agent GUI 自动同步并保存所有消息到本地数据库。滚动聊天区域即可加载历史消息。已归档团队的消息也可在"已归档"分组中查看。

</details>

<details>
<summary><b>消息同步机制是什么？</b></summary>

Claude Agent GUI 通过监视 `~/.claude/teams/` 目录下的 `inboxes/*.json` 文件实现实时同步。当 Claude Code 发送消息时，文件变更触发同步，更新界面显示。

</details>

---

## 开发指南

### 环境要求

- Node.js >= 18.0.0
- Bun（推荐，用于开发模式热重载）

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
# 同时启动前后端（需要 bun）
npm run dev

# 仅后端（热重载）
bun run dev:server

# 仅前端
bun run dev:client
```

### 构建生产版本

```bash
npm run build
```

### 运行测试

```bash
# 单元测试
npm test

# E2E 测试
npm run test:e2e

# 测试覆盖率
npm run test:coverage
```

### 代码质量

```bash
# TypeScript 类型检查
npm run type-check

# ESLint 检查
npm run lint

# ESLint 自动修复
npm run lint:fix

# Prettier 格式化
npm run format
```

---

## 架构

```
┌─────────────────┐     WebSocket      ┌─────────────────┐
│   Browser UI    │ ◄────────────────► │  Node.js Server │
│  (Preact + WS)  │                    │  (Fastify + WS) │
└─────────────────┘                    └────────┬────────┘
                                                │
                    ┌───────────────────────────┼───────────┐
                    │                           │           │
                    ▼                           ▼           ▼
            ┌──────────────┐           ┌──────────────┐ ┌──────────┐
            │   SQLite DB  │           │  Claude FS   │ │  Cleanup │
            │  (messages)  │           │  (sync)      │ │  (cron)  │
            └──────────────┘           └──────────────┘ └──────────┘
```

**技术栈：**

- **前端**：Preact + TailwindCSS + WebSocket
- **后端**：Fastify + SQLite + WebSocket
- **运行时**：Bun（开发）、Node.js（生产）

---

## 文档

- [需求文档](./docs/requirements.md) - 功能需求和用户故事
- [开发指南](./docs/development.md) - 架构和开发详解
- [快速入门](./docs/quickstart.md) - 详细使用说明

---

## 版本管理

本项目使用 [语义化版本 2.0.0](https://semver.org/lang/zh-CN/) 配合 [Conventional Commits](https://www.conventionalcommits.org/zh-CN/v1.0.0/)。

### 版本号规则

| 提交类型 | 版本递增 | 示例 |
|---------|---------|------|
| `feat:` | minor | 0.1.0 → 0.2.0 |
| `fix:` | patch | 0.1.0 → 0.1.1 |
| `BREAKING CHANGE:` | major | 0.1.0 → 1.0.0 |

### 发布流程

```bash
# 创建新版本（根据提交自动递增版本）
npm run release

# 推送标签到远程
git push --follow-tags origin <branch>
```

---

## License

[GPL v3](LICENSE) - 详见 [LICENSE](LICENSE) 文件。
