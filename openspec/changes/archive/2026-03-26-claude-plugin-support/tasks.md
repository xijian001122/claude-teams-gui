## 1. 创建插件目录结构

- [x] 1.1 创建 `.claude-plugin/` 目录
- [x] 1.2 创建 `.claude-plugin/plugin.json` 元信息文件

## 2. 更新 hooks 配置

- [x] 2.1 重构 `hooks/hooks.json` 为标准 Claude hook 格式
- [x] 2.2 更新 hook 脚本使用 `${CLAUDE_PLUGIN_ROOT}` 环境变量

## 3. 更新文档

- [x] 3.1 更新 README.md 添加插件安装说明（中英双语）
- [x] 3.2 添加插件功能说明（包含的 hooks 列表）

## 4. 验证

- [x] 4.1 验证目录结构符合 Claude 插件规范
- [x] 4.2 验证 plugin.json 格式正确
