# 样式指南 - TailwindCSS

## 设计原则

1. **实用类优先**：优先使用 TailwindCSS 实用类
2. **避免自定义 CSS**：仅在必要时添加自定义样式
3. **深色模式支持**：所有组件必须支持深色模式
4. **响应式设计**：使用断点前缀适配不同屏幕

## 颜色系统

### 背景色
```tsx
// 卡片背景
<div className="bg-white dark:bg-gray-800">

// 次级背景
<div className="bg-gray-50 dark:bg-gray-900">

// 悬停背景
<div className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600">
```

### 文字颜色
```tsx
// 主文字
<p className="text-gray-900 dark:text-white">

// 次级文字
<p className="text-gray-600 dark:text-gray-400">

// 辅助文字
<span className="text-gray-500 dark:text-gray-500">

// 强调文字
<span className="text-blue-500">
```

### 强调色
```tsx
// 主按钮
<button className="bg-blue-500 hover:bg-blue-600 text-white">

// 次级按钮
<button className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600">

// 成功
<span className="text-green-500 bg-green-100 dark:bg-green-900">

// 警告
<span className="text-yellow-500 bg-yellow-100 dark:bg-yellow-900">

// 错误
<span className="text-red-500 bg-red-100 dark:bg-red-900">
```

## 布局

### Flexbox
```tsx
// 水平居中
<div className="flex items-center justify-center">

// 两端对齐
<div className="flex items-center justify-between">

// 垂直布局
<div className="flex flex-col">

// 间距
<div className="flex gap-2">        // 0.5rem
<div className="flex gap-4">        // 1rem
<div className="flex space-x-2">    // 子元素水平间距
<div className="flex space-y-4">    // 子元素垂直间距
```

### Grid
```tsx
// 2列网格
<div className="grid grid-cols-2 gap-4">

// 3列响应式
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// 自适应列
<div className="grid grid-cols-[auto_1fr_auto]">
```

### 容器
```tsx
// 最大宽度容器
<div className="max-w-7xl mx-auto px-4">

// 固定宽度
<div className="w-64">  // 16rem
<div className="w-96">  // 24rem

// 全宽
<div className="w-full">
```

## 间距

### 内边距 (Padding)
```tsx
<div className="p-4">   // 1rem 各方向
<div className="px-4">  // 水平 1rem
<div className="py-2">  // 垂直 0.5rem
<div className="pt-8">  // 上 2rem
<div className="pb-4">  // 下 1rem
```

### 外边距 (Margin)
```tsx
<div className="m-4">   // 1rem 各方向
<div className="mx-auto">  // 水平居中
<div className="mt-2">  // 上 0.5rem
<div className="mb-4">  // 下 1rem
```

## 边框和圆角

### 圆角
```tsx
<div className="rounded">      // 0.25rem
<div className="rounded-lg">   // 0.5rem
<div className="rounded-xl">   // 0.75rem
<div className="rounded-full"> // 完全圆形
```

### 边框
```tsx
<div className="border border-gray-200 dark:border-gray-700">
<div className="border-b border-gray-100">
<div className="border-l-4 border-blue-500">  // 左边框强调
```

## 阴影

```tsx
<div className="shadow-sm">    // 轻微阴影
<div className="shadow">       // 标准阴影
<div className="shadow-md">    // 中等阴影
<div className="shadow-lg">    // 较大阴影
<div className="shadow-xl">    // 大阴影
```

## 响应式设计

### 断点
```tsx
// sm: 640px
// md: 768px
// lg: 1024px
// xl: 1280px

// 响应式隐藏
<div className="hidden md:block">  // 中屏及以上显示
<div className="md:hidden">        // 中屏以下显示

// 响应式布局
<div className="flex flex-col md:flex-row">

// 响应式间距
<div className="p-4 md:p-6 lg:p-8">
```

## 交互状态

### 悬停
```tsx
<button className="bg-blue-500 hover:bg-blue-600">
<div className="text-gray-600 hover:text-gray-900">
```

### 焦点
```tsx
<input className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
<button className="focus:outline-none focus:ring-2 focus:ring-blue-500">
```

### 禁用
```tsx
<button className="disabled:opacity-50 disabled:cursor-not-allowed">
<input className="disabled:bg-gray-100">
```

### 激活
```tsx
<button className="active:scale-95">
```

## 动画

### 过渡
```tsx
<div className="transition-colors duration-200">
<div className="transition-all duration-300">
<div className="transition-transform hover:scale-105">
```

### 内置动画
```tsx
<div className="animate-spin">      // 旋转
<div className="animate-ping">      // 脉冲
<div className="animate-pulse">     // 淡入淡出
<div className="animate-bounce">    // 弹跳
```

## 常用组件模式

### 卡片
```tsx
<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
    Title
  </h3>
  <p className="text-gray-600 dark:text-gray-400 mt-2">
    Content
  </p>
</div>
```

### 按钮
```tsx
// 主按钮
<button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
  Submit
</button>

// 次级按钮
<button className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600">
  Cancel
</button>

// 图标按钮
<button className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
  <Icon />
</button>
```

### 输入框
```tsx
<input
  type="text"
  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
  placeholder="Enter text..."
/>
```

### 徽章
```tsx
<span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
  Badge
</span>
```

### 分割线
```tsx
<hr className="border-gray-200 dark:border-gray-700" />
```

## 消息气泡样式规范

### 发送者名称
```tsx
// 发送者名称样式 - 确保可读性
<div className="text-base text-gray-700 dark:text-gray-300 mb-1.5 font-semibold">
  {member.displayName}
</div>
```

**字体大小规范**：
| 元素 | 类名 | 大小 | 用途 |
|------|------|------|------|
| 发送者名称 | `text-base` | 16px | 主要标识，需清晰可读 |
| 跨团队指示器 | `text-base` | 16px | 重要提示，需突出显示 |
| 消息内容 | `text-sm` | 14px | 正文内容 |
| 时间戳 | `text-xs` | 12px | 辅助信息 |

### 跨团队消息指示器
```tsx
// 跨团队消息来源/目标指示
<div className="flex items-center gap-2 mb-2 text-base text-gray-500">
  <span className="inline-flex items-center px-3 py-1.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200 font-medium">
    <Icon icon="arrow-left" size={16} className="mr-2" />
    来自: {crossTeamSource}
  </span>
</div>
```

**设计原则**：
- 字体大小：`text-base` (16px) 确保可读性
- 图标大小：`size={16}` 与文字协调
- 内边距：`px-3 py-1.5` 足够的点击区域
- 字重：`font-medium` 或 `font-semibold` 增强辨识度

### @ 提及标签
```tsx
// @ 提及样式
<span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600">
  @{displayTarget}
</span>
```

### 时间戳
```tsx
// 时间戳样式
<div className="text-xs mt-1 text-gray-400">
  {formatTime(message.timestamp)}
</div>
```

## 避免的模式

### ❌ 避免内联样式
```tsx
// ❌ 不好
<div style={{ backgroundColor: 'red', padding: '16px' }}>

// ✅ 好
<div className="bg-red-500 p-4">
```

### ❌ 避免过度使用 !important
```tsx
// ❌ 不好
<div className="!text-red-500">

// ✅ 使用更高特异性的类或重新设计
```

### ❌ 避免随意添加自定义 CSS
```tsx
// ❌ 不好
<style>
  .my-custom-class { ... }
</style>

// ✅ 使用 Tailwind 配置扩展或内联组件样式
```
