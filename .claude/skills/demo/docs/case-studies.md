# 案例研究

本文档收集了实际项目中使用效果图技能的案例，提供完整的设计思路和实现参考。

## 案例索引

| 案例 | 描述 | 关键技术 |
|------|------|---------|
| [消息"发给谁"指示器](#消息发给谁指示器) | 消息目标接收者的 UI 展示 | 内嵌标签、上方提示、侧边标签 |
| [在线成员展示](#在线成员展示) | 团队成员在线状态的展示方式 | 下拉面板、头像云、状态标签 |

---

## 消息"发给谁"指示器

### 背景

在团队聊天中，消息可能是发给所有人的（公开消息），也可能是发给特定人的（定向消息）。需要一个清晰的 UI 来区分这两种情况。

### 设计目标

1. 用户一眼就能看出消息是发给谁的
2. 不干扰消息内容的阅读
3. 在移动端和桌面端都能很好显示
4. 与现有 MessageBubble 组件设计兼容

### 方案对比

| 方案 | 样式 | 优点 | 缺点 | 适用场景 |
|------|------|------|------|---------|
| 内嵌标签 | 气泡内顶部显示 | 视觉集中，关联紧密 | 占用气泡空间 | 定向消息较多 |
| 上方提示 | 气泡上方小字 | 简洁清晰 | 可能被忽略 | 追求简洁 |
| 侧边标签 | 气泡旁边标签 | 可展示更多信息 | 占用横向空间 | 宽屏桌面 |

### 推荐方案：内嵌标签

```html
<style>
    .to-badge-inline {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 11px;
        padding: 2px 8px;
        border-radius: 12px;
        margin-bottom: 6px;
    }
    .message-row:not(.self) .to-badge-inline {
        background: #e0e7ff;
        color: #4338ca;
    }
    .message-row.self .to-badge-inline {
        background: rgba(255,255,255,0.3);
        color: rgba(255,255,255,0.95);
    }
</style>

<!-- 使用示例 -->
<div class="bubble">
    <div class="to-badge-inline">
        <span>→</span>
        <span>发送给 @team-lead</span>
    </div>
    <div>消息内容...</div>
</div>
```

### 推荐理由

1. 与当前 MessageBubble 组件设计兼容性好
2. 用户一眼就能看出消息是发给谁的
3. 不会破坏现有的消息布局
4. 在移动端和桌面端都能很好显示

### 演示文件

- `demo/message-to-comparison.html` - 完整的三方案对比演示

---

## 在线成员展示

### 背景

在团队协作中，用户需要快速了解当前有哪些成员在线，以便决定是否发送即时消息或等待对方回复。

### 设计目标

1. 快速了解在线人数
2. 查看具体在线成员
3. 了解成员状态（在线/离开/忙碌）
4. 感知实时变化

### 方案对比

| 方案 | 样式 | 优点 | 缺点 | 推荐指数 |
|------|------|------|------|---------|
| 下拉面板 | 点击展开列表 | 成熟交互，信息完整 | 需要点击操作 | ⭐⭐⭐⭐⭐ |
| 头像云 | 重叠头像显示 | Discord 风格，视觉吸引 | 大团队时拥挤 | ⭐⭐⭐⭐ |
| 状态标签 | 彩色标签分组 | 支持筛选，适合大团队 | 缺少具体成员 | ⭐⭐⭐ |
| 时间线 | 按活动时间排序 | 适合分布式团队 | 不直观 | ⭐⭐ |
| 环形进度 | 在线比例图表 | 数据可视化风格 | 信息量少 | ⭐⭐ |

### 推荐方案：下拉面板（主）+ 头像云（辅）

**小团队（≤5人）**：使用头像云，简洁直观

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
    .avatar-item {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .avatar-item.online {
        box-shadow: 0 0 0 2px #22c55e;
    }
</style>
```

**大团队（>5人）**：使用下拉面板，信息完整

```html
<style>
    .online-panel {
        position: absolute;
        top: 100%;
        right: 0;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.15);
        min-width: 200px;
        padding: 12px;
    }
    .member-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px;
        border-radius: 6px;
    }
    .member-item:hover {
        background: #f3f4f6;
    }
</style>
```

### 在线指示器动画

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
    0% { transform: scale(1); opacity: 1; }
    100% { transform: scale(1.5); opacity: 0; }
}
```

> **设计说明**：2 秒周期符合人类感知的舒适节奏，不会过快（显得焦虑）也不会过慢（失去动态感）。

### 演示文件

- `demo/online-members-comparison.html` - 五种方案的并排对比（推荐）

> **整合规范**：所有方案整合在一个文件中，支持锚点导航快速跳转。

---

## 创建新案例

当创建新的效果图案例时，请遵循以下结构：

```markdown
## 案例名称

### 背景
描述为什么需要这个功能/组件。

### 设计目标
1. 目标1
2. 目标2
3. 目标3

### 方案对比
| 方案 | 样式 | 优点 | 缺点 | 适用场景 |
|------|------|------|------|---------|
| ... | ... | ... | ... | ... |

### 推荐方案
说明推荐哪个方案及其理由。

### 代码示例
提供关键代码片段。

### 演示文件
列出相关的演示 HTML 文件。
```

## 相关文档

- [效果图模板](templates.md) - 标准模板和代码片段
- [样式指南](styling.md) - CSS 变量和组件样式
