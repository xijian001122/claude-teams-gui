# Demo 效果图快速参考

本文档提供常用的效果图模板和代码片段，用于快速生成 UI 设计原型。

## 完整效果图模板

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>UI 设计方案</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f5f5;
            padding: 40px;
            line-height: 1.6;
        }

        .container {
            max-width: 800px;
            margin: 0 auto;
        }

        h1 {
            text-align: center;
            margin-bottom: 40px;
            color: #333;
        }

        /* 设计卡片 */
        .design-card {
            background: white;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 32px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .design-title {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 8px;
            color: #1a1a1a;
        }

        .design-desc {
            color: #666;
            margin-bottom: 20px;
            font-size: 14px;
        }

        /* 对比表格 */
        .compare-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 16px;
        }

        .compare-table th,
        .compare-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e0e0e0;
        }

        .compare-table th {
            background: #f5f5f5;
            font-weight: 600;
        }

        .pros { color: #059669; }
        .cons { color: #dc2626; }
        .highlight {
            background: #fef3c7;
            padding: 2px 6px;
            border-radius: 4px;
        }

        /* 推荐框 */
        .recommend-box {
            background: #f0fdf4;
            border-left: 4px solid #22c55e;
            padding: 16px;
            border-radius: 4px;
            margin-top: 16px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>UI 设计方案标题</h1>

        <!-- 设计方案卡片 -->
        <div class="design-card">
            <div class="design-title">方案 1：标题</div>
            <div class="design-desc">方案描述</div>
            <!-- 交互式演示区域 -->
        </div>

        <!-- 对比表格 -->
        <div class="design-card">
            <div class="design-title">方案对比</div>
            <table class="compare-table">
                <thead>
                    <tr>
                        <th>方案</th>
                        <th>优点</th>
                        <th>缺点</th>
                        <th>适用场景</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>方案1</strong></td>
                        <td class="pros">优点</td>
                        <td class="cons">缺点</td>
                        <td>场景</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- 推荐方案 -->
        <div class="design-card">
            <div class="design-title">推荐方案</div>
            <div class="design-desc">推荐 <span class="highlight">方案 X</span></div>
            <div class="recommend-box">
                <strong>推荐理由：</strong>
                <ul style="margin: 8px 0 0 20px; color: #166534;">
                    <li>理由1</li>
                    <li>理由2</li>
                </ul>
            </div>
        </div>
    </div>
</body>
</html>
```

## 聊天消息组件模板

### 消息气泡样式

```html
<style>
    /* 聊天界面模拟 */
    .chat-mock {
        background: #f8f9fa;
        border-radius: 8px;
        padding: 20px;
        border: 1px solid #e0e0e0;
    }

    .chat-header {
        text-align: center;
        padding-bottom: 16px;
        border-bottom: 1px solid #e0e0e0;
        margin-bottom: 20px;
        color: #666;
        font-size: 14px;
    }

    /* 消息行 */
    .message-row {
        display: flex;
        margin-bottom: 16px;
        align-items: flex-start;
    }
    .message-row.self {
        flex-direction: row-reverse;
    }

    /* 头像 */
    .avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 600;
        font-size: 14px;
        margin: 0 12px;
        flex-shrink: 0;
    }
    .avatar.user { background: #3b82f6; }
    .avatar.agent { background: #10b981; }

    /* 消息内容 */
    .message-content { max-width: 70%; }
    .sender-name {
        font-size: 12px;
        color: #666;
        margin-bottom: 4px;
        margin-left: 4px;
    }
    .message-row.self .sender-name {
        text-align: right;
        margin-right: 4px;
    }

    /* 气泡 */
    .bubble {
        padding: 10px 14px;
        border-radius: 16px;
        font-size: 14px;
        line-height: 1.5;
    }
    .message-row:not(.self) .bubble {
        background: white;
        color: #1a1a1a;
        border-bottom-left-radius: 4px;
        box-shadow: 0 1px 2px rgba(0,0,0,0.1);
    }
    .message-row.self .bubble {
        background: #3b82f6;
        color: white;
        border-bottom-right-radius: 4px;
    }

    /* 时间戳 */
    .timestamp {
        font-size: 11px;
        color: #999;
        margin-top: 4px;
        margin-left: 4px;
    }
    .message-row.self .timestamp {
        text-align: right;
        margin-right: 4px;
    }
</style>
```

### 消息行模板

```html
<!-- 自己发的消息 -->
<div class="message-row self">
    <div class="avatar user">我</div>
    <div class="message-content">
        <div class="sender-name">我</div>
        <div class="bubble">消息内容</div>
        <div class="timestamp">14:30</div>
    </div>
</div>

<!-- 别人发的消息 -->
<div class="message-row">
    <div class="avatar agent">A</div>
    <div class="message-content">
        <div class="sender-name">agent-name</div>
        <div class="bubble">消息内容</div>
        <div class="timestamp">14:31</div>
    </div>
</div>
```

## 标签/徽章模板

```html
<style>
    /* 内嵌标签 */
    .badge-inline {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 11px;
        padding: 2px 8px;
        border-radius: 12px;
        margin-bottom: 6px;
    }
    .badge-inline.primary {
        background: #e0e7ff;
        color: #4338ca;
    }
    .badge-inline.secondary {
        background: rgba(255,255,255,0.3);
        color: rgba(255,255,255,0.95);
    }

    /* 上方提示文字 */
    .label-above {
        font-size: 11px;
        color: #888;
        margin-bottom: 4px;
        display: flex;
        align-items: center;
        gap: 4px;
    }

    /* 侧边标签 */
    .badge-side {
        font-size: 11px;
        padding: 2px 8px;
        border-radius: 4px;
        background: #f0f0f0;
        color: #666;
        white-space: nowrap;
    }
</style>
```

## 在线状态指示器

```html
<style>
    .status-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        position: relative;
    }
    .status-dot.online { background: #22c55e; }
    .status-dot.away { background: #eab308; }
    .status-dot.busy { background: #ef4444; }
    .status-dot.offline { background: #9ca3af; }

    /* 脉冲动画 */
    .status-dot.online::after {
        content: '';
        position: absolute;
        inset: -2px;
        border-radius: 50%;
        border: 2px solid #22c55e;
        animation: pulse 2s ease-out infinite;
    }

    @keyframes pulse {
        0% { transform: scale(1); opacity: 1; }
        100% { transform: scale(1.5); opacity: 0; }
    }
</style>
```

## 头像云组件

```html
<style>
    .avatar-cloud {
        display: flex;
        flex-direction: row-reverse;
        justify-content: flex-end;
    }

    .avatar-cloud .avatar-item {
        margin-left: -8px;
        transition: transform 0.2s;
    }
    .avatar-cloud .avatar-item:hover {
        transform: translateY(-4px);
        z-index: 10;
    }

    .avatar-cloud .avatar-item:first-child {
        margin-left: 0;
    }

    .avatar-item {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 600;
        color: white;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
</style>

<div class="avatar-cloud">
    <div class="avatar-item" style="background: #3b82f6;">A</div>
    <div class="avatar-item" style="background: #10b981;">B</div>
    <div class="avatar-item" style="background: #f59e0b;">C</div>
</div>
```

## 状态标签组件

```html
<style>
    .status-chips {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
    }

    .status-chip {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.2s;
    }

    .status-chip.online {
        background: #dcfce7;
        color: #166534;
    }
    .status-chip.away {
        background: #fef3c7;
        color: #92400e;
    }
    .status-chip.busy {
        background: #fee2e2;
        color: #991b1b;
    }
    .status-chip.offline {
        background: #f3f4f6;
        color: #4b5563;
    }

    .status-chip:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }
</style>

<div class="status-chips">
    <div class="status-chip online">
        <span class="status-dot online"></span>
        <span>3 在线</span>
    </div>
    <div class="status-chip away">
        <span class="status-dot away"></span>
        <span>1 离开</span>
    </div>
</div>
```

## 文件命名规范

| 类型 | 命名格式 | 示例 |
|------|---------|------|
| 多方案对比 | `{feature}-comparison.html` | `online-members-comparison.html` |
| 单方案详细 | `{feature}-{variant}.html` | `online-members-panel.html` |
| 组件演示 | `{component}.html` | `avatar-cloud.html` |

## 多方案整合规范

**重要**：当需要展示多个设计方案时，**必须**整合到一个 demo 文件中，而非创建多个独立文件。

### 整合结构

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>{功能名称} UI 设计方案</title>
    <!-- 样式定义 -->
</head>
<body>
    <div class="container">
        <h1>标题</h1>

        <!-- 导航锚点 -->
        <nav class="toc">
            <a href="#方案1">方案1</a> |
            <a href="#方案2">方案2</a> |
            <a href="#对比">方案对比</a>
        </nav>

        <!-- 多个设计方案卡片 -->
        <section id="方案1" class="design-card">...</section>
        <section id="方案2" class="design-card">...</section>
        <section id="方案3" class="design-card">...</section>

        <!-- 统一对比表格 -->
        <section id="对比" class="design-card">
            <table class="compare-table">...</table>
        </section>

        <!-- 推荐方案 -->
        <section class="design-card">
            <div class="recommend-box">...</div>
        </section>
    </div>
</body>
</html>
```

### 整合优点

1. **一次查看所有方案** - 无需切换多个文件
2. **便于对比分析** - 所有方案在同一视图中
3. **减少文件数量** - 保持 demo 目录整洁
4. **支持锚点导航** - 快速跳转到特定方案

### 锚点导航样式

```css
.toc {
    background: #f8f9fa;
    padding: 12px 16px;
    border-radius: 8px;
    margin-bottom: 24px;
    text-align: center;
}
.toc a {
    color: #3b82f6;
    text-decoration: none;
    margin: 0 8px;
}
.toc a:hover {
    text-decoration: underline;
}
```

## 演示文件

- `demo/message-to-comparison.html` - 消息"发给谁" UI 方案对比（推荐）
- `demo/online-members-comparison.html` - 在线成员展示方案对比（推荐）

👉 [查看案例研究](docs/case-studies.md) 了解更多实际案例
