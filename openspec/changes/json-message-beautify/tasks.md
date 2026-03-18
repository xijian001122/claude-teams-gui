## 1. Setup

- [ ] 1.1 复制效果图 CSS 变量和样式到项目样式文件
- [ ] 1.2 创建 `JsonMessageCard` 组件文件结构

## 2. Core Component Implementation

- [ ] 2.1 实现 `JsonMessageCard` 主组件框架
- [ ] 2.2 实现消息类型到颜色/图标的配置映射
- [ ] 2.3 实现卡片头部（类型图标、标题、状态徽章）
- [ ] 2.4 实现卡片内容区（字段、描述、元信息）
- [ ] 2.5 实现原始 JSON 展开/折叠功能

## 3. Syntax Highlighting

- [ ] 3.1 实现 JSON 语法高亮 CSS 类
- [ ] 3.2 实现 `formatJsonWithHighlight` 函数

## 4. MessageBubble Integration

- [ ] 4.1 修改 `MessageBubble.tsx` 检测 JSON 消息类型
- [ ] 4.2 集成 `JsonMessageCard` 组件
- [ ] 4.3 确保非 JSON 消息保持原有展示

## 5. Type Support

- [ ] 5.1 支持 `idle_notification` 类型展示
- [ ] 5.2 支持 `permission_request` 类型展示
- [ ] 5.3 支持 `task_assignment` 类型展示
- [ ] 5.4 支持 `task_completed` 类型展示
- [ ] 5.5 支持 `shutdown_request` 类型展示
- [ ] 5.6 支持 `shutdown_response` 类型展示

## 6. Testing & Verification

- [ ] 6.1 在浏览器中验证各类型卡片展示效果
- [ ] 6.2 验证展开/折叠功能正常
- [ ] 6.3 验证语法高亮显示正确
- [ ] 6.4 验证暗色/亮色主题适配
