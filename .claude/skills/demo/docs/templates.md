# 效果图模板规范

本文档定义了 UI 效果图的标准结构和模板规范，确保生成的效果图风格一致、易于维护。

## 标准结构

### 文件头部

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>功能名称 - UI 设计方案</title>
    <style>
        /* 样式内容 */
    </style>
</head>
<body>
    <div class="container">
        <!-- 内容 -->
    </div>
</body>
</html>
```

### 核心布局

```css
/* 基础重置 */
* { margin: 0; padding: 0; box-sizing: border-box; }

/* 页面样式 */
body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #f5f5f5;
    padding: 40px;
    line-height: 1.6;
}

/* 容器 */
.container {
    max-width: 800px;
    margin: 0 auto;
}

/* 标题 */
h1 {
    text-align: center;
    margin-bottom: 40px;
    color: #333;
}
```

## 组件样式

### 设计卡片

用于包裹每个设计方案的容器。

```css
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
```

### 对比表格

用于展示多个方案的优缺点对比。

```css
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
    color: #333;
}

.compare-table td {
    color: #666;
}

/* 语义化颜色 */
.pros { color: #059669; }
.cons { color: #dc2626; }
.highlight {
    background: #fef3c7;
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: 500;
}
```

### 推荐框

用于突出显示推荐方案。

```css
.recommend-box {
    background: #f0fdf4;
    border-left: 4px solid #22c55e;
    padding: 16px;
    border-radius: 4px;
    margin-top: 16px;
}
```

## 聊天组件样式

### 聊天容器

```css
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
```

### 消息行

```css
.message-row {
    display: flex;
    margin-bottom: 16px;
    align-items: flex-start;
}

.message-row.self {
    flex-direction: row-reverse;
}
```

### 头像

```css
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

/* 预设颜色 */
.avatar.user { background: #3b82f6; }
.avatar.agent { background: #10b981; }
.avatar.ai { background: #8b5cf6; }
.avatar.system { background: #6b7280; }
```

### 消息气泡

```css
.message-content {
    max-width: 70%;
}

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

.bubble {
    padding: 10px 14px;
    border-radius: 16px;
    font-size: 14px;
    line-height: 1.5;
    position: relative;
}

/* 收到的消息 */
.message-row:not(.self) .bubble {
    background: white;
    color: #1a1a1a;
    border-bottom-left-radius: 4px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

/* 发送的消息 */
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
```

## 状态指示器样式

### 基础状态点

```css
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
```

### 脉冲动画

```css
.status-dot.online::after {
    content: '';
    position: absolute;
    inset: -2px;
    border-radius: 50%;
    border: 2px solid #22c55e;
    animation: pulse 2s ease-out infinite;
}

@keyframes pulse {
    0% {
        transform: scale(1);
        opacity: 1;
    }
    100% {
        transform: scale(1.5);
        opacity: 0;
    }
}
```

## 文件命名规范

| 文件类型 | 命名格式 | 示例 |
|---------|---------|------|
| 多方案对比 | `{feature}-comparison.html` | `message-to-comparison.html` |
| 单方案详细 | `{feature}-{variant}.html` | `message-to-badge.html` |
| 组件演示 | `{component}.html` | `status-indicator.html` |

## 最佳实践

### 1. 语义化命名
- 使用描述性的类名（如 `.message-row`、`.status-dot`）
- 避免使用无意义的类名（如 `.box1`、`.style2`）

### 2. 注释分组
```css
/* ========== 消息组件 ========== */
.message-row { }
.bubble { }

/* ========== 状态指示器 ========== */
.status-dot { }
```

### 3. 响应式考虑
```css
@media (max-width: 640px) {
    .message-content {
        max-width: 85%;
    }
}
```

### 4. 动画性能
```css
.animated-element {
    transition: transform 0.2s ease;
    /* 使用 transform 而非 left/top */
}
```

## 相关文档

- [案例研究](case-studies.md) - 实际案例参考
- [样式指南](styling.md) - 完整样式规范
