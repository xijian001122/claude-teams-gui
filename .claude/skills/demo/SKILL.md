---
name: demo
description: UI 效果图生成技能 - 创建交互式 HTML 原型、设计方案对比演示、UI 组件可视化
---

# Demo 效果图生成技能

**作用**: 快速生成 UI 设计方案的交互式 HTML 原型，支持多种方案对比、样式演示和文档说明

**触发关键词**: 效果图、原型、UI 演示、设计方案、可视化、demo、prototype

## 核心规范速查

| 规范 | 说明 | 详细文档 |
|------|------|---------|
| 效果图模板 | 标准效果图结构和样式 | [docs/templates.md](docs/templates.md) |
| 案例研究 | 完整案例的参考实现 | [docs/case-studies.md](docs/case-studies.md) |
| 样式规范 | CSS 变量和组件样式 | [docs/styling.md](docs/styling.md) |

## 效果图文件位置

所有生成的效果图文件保存到: `demo/` 目录

```
demo/
├── feature-name-comparison.html   # 多方案对比
├── feature-name-panel.html        # 单个方案详细版
└── ...
```

## 快速检查清单

- [ ] 使用标准 HTML 模板结构
- [ ] 多方案整合到一个文件（不创建多个独立文件）
- [ ] 包含锚点导航（超过3个方案时）
- [ ] 提供方案对比表格
- [ ] 添加推荐方案说明
- [ ] 使用语义化 CSS 类名

## 标准效果图结构

### 1. 基础结构
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>标题</title>
    <style>
        /* 基础重置 + 主题变量 + 组件样式 */
    </style>
</head>
<body>
    <div class="container">
        <h1>标题</h1>
        <!-- 设计方案卡片 -->
        <!-- 对比表格 -->
        <!-- 推荐方案 -->
    </div>
</body>
</html>
```

### 2. 设计方案卡片
```html
<div class="design-card">
    <div class="design-title">方案标题</div>
    <div class="design-desc">方案描述</div>
    <div class="chat-mock">
        <!-- 交互式演示 -->
    </div>
</div>
```

### 3. 对比表格
```html
<table class="compare-table">
    <thead><tr><th>方案</th><th>优点</th><th>缺点</th></tr></thead>
    <tbody><!-- 数据行 --></tbody>
</table>
```

## 多方案整合规范

**重要**：当需要展示多个设计方案时，**必须**整合到一个 demo 文件中。

```html
<!-- 导航锚点 -->
<nav class="toc">
    <a href="#方案1">方案1</a> | <a href="#方案2">方案2</a> | <a href="#对比">对比</a>
</nav>

<!-- 多个方案整合在一个文件中 -->
<section id="方案1" class="design-card">...</section>
<section id="方案2" class="design-card">...</section>
<section id="对比" class="design-card">...</section>
```

👉 [查看 QUICK_REF.md](QUICK_REF.md#多方案整合规范) 了解完整规范

## 常用模式索引

- [消息"发给谁"指示器](docs/case-studies.md#消息发给谁指示器) - 消息目标展示
- [在线成员展示](docs/case-studies.md#在线成员展示) - 成员列表 UI

## 详细文档索引

### 核心流程
- [效果图模板](docs/templates.md) - 完整模板和代码片段
- [案例研究](docs/case-studies.md) - 实际案例参考

### 样式规范
- [样式指南](docs/styling.md) - CSS 变量和组件样式

## 相关技能

- **frontend-dev**: 前端开发，将效果图转化为实际组件
- **project-arch**: 项目架构，了解目录结构

---

**最后更新**: 2026-03-18 (v1.1.0)
**维护者**: 开发团队
