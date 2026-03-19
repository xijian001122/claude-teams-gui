## Context

当前 Claude Chat 使用 `MessageBubble.tsx` 组件展示消息。对于 JSON 类型的消息（`contentType === 'json'`），当前只是简单转换为文本显示，缺乏结构化呈现。

探索文档位于 `openspec/explore/json-beautify-exploration.md`，效果图位于 `demo/json-beautify-panel.html`。

### 当前实现
- 位置：`src/client/components/MessageBubble.tsx`
- 逻辑：硬编码 4 种 JSON 类型的文本转换
- 问题：无语法高亮、无格式化、无折叠、样式简单

### 技术栈约束
- Preact + TypeScript
- TailwindCSS 样式
- 不使用外部 JSON 库（保持轻量）

## Goals / Non-Goals

**Goals:**
- 结构化卡片展示 JSON 消息
- 类型颜色识别（左侧色条）
- 状态徽章（待办/进行中/已完成）
- 可折叠原始 JSON 查看
- CSS 语法高亮
- 支持 8 种消息类型

**Non-Goals:**
- 后端 API 改动
- 交互按钮（批准/拒绝/分配）
- 使用外部 JSON 库
- 暗色/亮色主题自动切换（复用现有主题系统）

## Decisions

### 1. 纯展示方案
**决策**：移除所有需后端支持的交互按钮。
**理由**：
- 权限请求批准需要后端 API 和角色验证
- 当前系统只有 `team-lead` 可批准，但 UI 不区分角色
- 纯展示方案无需后端改动，立即可实施

### 2. 使用简单 CSS 高亮而非外部库
**决策**：用 CSS 类实现 JSON 语法高亮，不使用 prismjs 或 highlight.js。
**理由**：
- 保持依赖最小化
- JSON 语法简单（key/string/number/boolean），CSS 足够
- 避免引入大型库（react-json-view 约 20KB+）

### 3. 组件拆分
**决策**：创建 `JsonMessageCard` 子组件。
**理由**：
- 保持 MessageBubble 简洁
- 便于独立测试和复用
- 分离 JSON 处理逻辑

### 4. 展开状态存储
**决策**：使用组件内部 state 存储展开/折叠状态。
**理由**：
- 纯展示功能，无需全局状态
- 每个卡片独立控制，不影响其他消息

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|----------|
| 长 JSON 导致卡片过高 | 默认折叠，限制最大高度 |
| 暗色主题高亮对比度不足 | 使用 CSS 变量，适配现有主题 |
| 类型扩展困难 | 配置对象映射类型到颜色和图标 |

## Migration Plan

无需迁移，纯新增功能：
1. 添加 `JsonMessageCard` 组件
2. 修改 `MessageBubble` 引入新组件
3. 添加 CSS 样式
4. 无数据迁移或 API 变更

## Open Questions

1. 是否需要全局设置控制默认展开/折叠？
   - 当前方案：默认折叠，用户手动展开
2. 是否需要复制 JSON 功能？
   - 当前方案：暂不实现（需额外权限确认）
