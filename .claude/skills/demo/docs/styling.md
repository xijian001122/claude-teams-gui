# 样式指南

本文档定义了效果图生成时使用的 CSS 变量和组件样式规范，确保所有效果图风格一致。

## 颜色系统

### 主色调

```css
:root {
    /* 品牌色 */
    --color-primary: #3b82f6;
    --color-primary-light: #60a5fa;
    --color-primary-dark: #2563eb;

    /* 成功色 */
    --color-success: #22c55e;
    --color-success-light: #4ade80;
    --color-success-bg: #dcfce7;

    /* 警告色 */
    --color-warning: #eab308;
    --color-warning-light: #facc15;
    --color-warning-bg: #fef3c7;

    /* 错误色 */
    --color-error: #ef4444;
    --color-error-light: #f87171;
    --color-error-bg: #fee2e2;

    /* 中性色 */
    --color-gray-50: #f9fafb;
    --color-gray-100: #f3f4f6;
    --color-gray-200: #e5e7eb;
    --color-gray-300: #d1d5db;
    --color-gray-400: #9ca3af;
    --color-gray-500: #6b7280;
    --color-gray-600: #4b5563;
    --color-gray-700: #374151;
    --color-gray-800: #1f2937;
    --color-gray-900: #111827;
}
```

### 语义化颜色

```css
:root {
    /* 文字颜色 */
    --text-primary: #1a1a1a;
    --text-secondary: #666666;
    --text-tertiary: #999999;
    --text-inverse: #ffffff;

    /* 背景颜色 */
    --bg-primary: #ffffff;
    --bg-secondary: #f5f5f5;
    --bg-tertiary: #f8f9fa;

    /* 边框颜色 */
    --border-light: #e0e0e0;
    --border-default: #d1d5db;
    --border-dark: #9ca3af;
}
```

### 头像颜色

```css
:root {
    --avatar-blue: #3b82f6;
    --avatar-green: #10b981;
    --avatar-purple: #8b5cf6;
    --avatar-orange: #f59e0b;
    --avatar-red: #ef4444;
    --avatar-pink: #ec4899;
    --avatar-teal: #14b8a6;
    --avatar-indigo: #6366f1;
}
```

### 状态颜色

```css
:root {
    --status-online: #22c55e;
    --status-away: #eab308;
    --status-busy: #ef4444;
    --status-offline: #9ca3af;
}
```

## 间距系统

```css
:root {
    --spacing-xs: 4px;
    --spacing-sm: 8px;
    --spacing-md: 12px;
    --spacing-lg: 16px;
    --spacing-xl: 24px;
    --spacing-2xl: 32px;
    --spacing-3xl: 40px;
}
```

## 圆角系统

```css
:root {
    --radius-sm: 4px;
    --radius-md: 8px;
    --radius-lg: 12px;
    --radius-xl: 16px;
    --radius-full: 9999px;
}
```

## 阴影系统

```css
:root {
    --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
    --shadow-md: 0 2px 8px rgba(0,0,0,0.1);
    --shadow-lg: 0 4px 16px rgba(0,0,0,0.15);
    --shadow-xl: 0 8px 32px rgba(0,0,0,0.2);
}
```

## 字体系统

```css
:root {
    --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    --font-mono: 'SF Mono', Monaco, 'Cascadia Code', monospace;

    --font-size-xs: 11px;
    --font-size-sm: 12px;
    --font-size-base: 14px;
    --font-size-lg: 16px;
    --font-size-xl: 18px;
    --font-size-2xl: 24px;

    --font-weight-normal: 400;
    --font-weight-medium: 500;
    --font-weight-semibold: 600;
    --font-weight-bold: 700;

    --line-height-tight: 1.25;
    --line-height-normal: 1.5;
    --line-height-relaxed: 1.75;
}
```

## 组件样式

### 设计卡片

```css
.design-card {
    background: var(--bg-primary);
    border-radius: var(--radius-lg);
    padding: var(--spacing-xl);
    margin-bottom: var(--spacing-2xl);
    box-shadow: var(--shadow-md);
}

.design-title {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    margin-bottom: var(--spacing-sm);
    color: var(--text-primary);
}

.design-desc {
    color: var(--text-secondary);
    margin-bottom: var(--spacing-lg);
    font-size: var(--font-size-sm);
}
```

### 消息气泡

```css
.bubble {
    padding: 10px var(--spacing-md);
    border-radius: var(--radius-xl);
    font-size: var(--font-size-base);
    line-height: var(--line-height-normal);
}

/* 收到的消息 */
.bubble.received {
    background: var(--bg-primary);
    color: var(--text-primary);
    border-bottom-left-radius: var(--radius-sm);
    box-shadow: var(--shadow-sm);
}

/* 发送的消息 */
.bubble.sent {
    background: var(--color-primary);
    color: var(--text-inverse);
    border-bottom-right-radius: var(--radius-sm);
}
```

### 头像

```css
.avatar {
    width: 36px;
    height: 36px;
    border-radius: var(--radius-full);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-inverse);
    font-weight: var(--font-weight-semibold);
    font-size: var(--font-size-base);
}

.avatar-sm { width: 24px; height: 24px; font-size: var(--font-size-xs); }
.avatar-lg { width: 48px; height: 48px; font-size: var(--font-size-lg); }
```

### 状态指示器

```css
.status-dot {
    width: 10px;
    height: 10px;
    border-radius: var(--radius-full);
    position: relative;
}

.status-dot.online { background: var(--status-online); }
.status-dot.away { background: var(--status-away); }
.status-dot.busy { background: var(--status-busy); }
.status-dot.offline { background: var(--status-offline); }

/* 在线脉冲动画 */
.status-dot.online::after {
    content: '';
    position: absolute;
    inset: -2px;
    border-radius: var(--radius-full);
    border: 2px solid var(--status-online);
    animation: pulse 2s ease-out infinite;
}

@keyframes pulse {
    0% { transform: scale(1); opacity: 1; }
    100% { transform: scale(1.5); opacity: 0; }
}
```

### 标签/徽章

```css
.badge {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-xs);
    font-size: var(--font-size-xs);
    padding: 2px var(--spacing-sm);
    border-radius: var(--radius-full);
}

.badge.primary {
    background: #e0e7ff;
    color: #4338ca;
}

.badge.success {
    background: var(--color-success-bg);
    color: #166534;
}

.badge.warning {
    background: var(--color-warning-bg);
    color: #92400e;
}

.badge.error {
    background: var(--color-error-bg);
    color: #991b1b;
}
```

## 动画规范

### 过渡时间

```css
:root {
    --transition-fast: 0.15s ease;
    --transition-normal: 0.2s ease;
    --transition-slow: 0.3s ease;
}
```

### 常用动画

```css
/* 淡入 */
@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

/* 滑入 */
@keyframes slideIn {
    from { transform: translateY(-10px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
}

/* 脉冲 */
@keyframes pulse {
    0% { transform: scale(1); opacity: 1; }
    100% { transform: scale(1.5); opacity: 0; }
}
```

## 响应式断点

```css
/* 移动端 */
@media (max-width: 640px) {
    .message-content { max-width: 85%; }
    .container { padding: 0 var(--spacing-md); }
}

/* 平板 */
@media (min-width: 641px) and (max-width: 1024px) {
    .message-content { max-width: 75%; }
}

/* 桌面端 */
@media (min-width: 1025px) {
    .message-content { max-width: 70%; }
}
```

## 最佳实践

1. **优先使用 CSS 变量**：保持风格一致性，便于主题切换
2. **语义化命名**：使用 `.status-online` 而非 `.green-dot`
3. **保持简洁**：效果图不需要考虑浏览器兼容性，使用现代 CSS
4. **注释分组**：用注释分隔不同组件的样式
5. **动画克制**：只使用必要的动画，避免过度装饰

## 相关文档

- [效果图模板](templates.md) - 标准模板和代码片段
- [案例研究](case-studies.md) - 实际案例参考
