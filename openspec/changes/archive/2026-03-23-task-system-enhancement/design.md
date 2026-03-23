## Context

当前 Claude Chat 项目已实现基本的任务列表 UI（TaskPanel 组件），但任务数据来源于内存中的 TaskList API，而非文件系统。这导致：
- 任务无法在 Web UI 中持久展示
- 无法查看其他团队的任务
- 无法追踪任务历史变更
- 团队关闭后无法回顾任务执行情况

**约束**:
- 任务文件存储在 `~/.claude/tasks/<team-name>/` 目录
- 现有 `GET /api/teams/:name/tasks` 端点仅读取文件系统
- 前端使用 Preact + TailwindCSS
- 后端使用 Fastify + SQLite（但任务数据不存入 SQLite）

## Goals / Non-Goals

**Goals:**
- 修复任务持久化：TaskCreate 调用后任务写入文件系统
- 全局任务视图：展示所有团队的任务列表
- 任务历史记录：追踪状态变更和负责人变化
- 会话摘要：团队关闭时生成任务执行报告

**Non-Goals:**
- 不实现任务的复杂过滤和搜索功能
- 不实现任务分配的工作流自动化
- 不修改 Claude Code 核心的 TaskList API

## Decisions

### D1: 任务持久化使用文件系统而非数据库

**选择**: 任务数据存储为 JSON 文件，不存入 SQLite

**原因**:
- 与 Claude Code 原生行为一致（`~/.claude/tasks/<team>/`）
- 简化实现，无需数据迁移
- 保持与 Claude Code CLI 的兼容性

**替代方案**:
- SQLite 存储：需要数据同步，增加复杂度

### D2: 任务 API 采用 RESTful 风格

**选择**: 新增 POST/PUT/DELETE 端点

```
POST   /api/teams/:name/tasks      - 创建任务
PUT    /api/teams/:name/tasks/:id  - 更新任务
DELETE /api/teams/:name/tasks/:id  - 删除任务
GET    /api/tasks                  - 全局任务视图（支持 ?status= 过滤）
```

**原因**:
- 符合现有 API 风格
- 支持前端 CRUD 操作
- 全局视图独立于团队路由

### D3: 历史记录内嵌在任务对象中

**选择**: 在 Task 类型中增加 `history` 数组字段

```typescript
interface TaskHistoryEntry {
  timestamp: string;
  field: 'status' | 'owner' | 'subject' | 'description';
  oldValue: string | null;
  newValue: string;
  changedBy?: string;
}

interface Task {
  // ... 现有字段
  history?: TaskHistoryEntry[];
}
```

**原因**:
- 简单实现，无需额外表或文件
- 历史与任务紧密关联
- 易于前端展示

### D4: 会话摘要使用 Markdown 格式

**选择**: 生成 Markdown 文件保存到团队目录

**文件位置**: `~/.claude/teams/<team-name>/session-summary-<timestamp>.md`

**内容结构**:
```markdown
# 会话任务摘要 - <team-name>

生成时间: 2026-03-23 15:30:00

## 任务统计
- 总任务数: 10
- 已完成: 7
- 进行中: 2
- 等待中: 1

## 已完成任务
| ID | 任务 | 负责人 |
|----|------|--------|
| 1  | 实现登录功能 | frontend-dev |
| ...

## 未完成任务
| ID | 任务 | 状态 | 阻塞 |
|----|------|------|------|
| 8  | 修复样式问题 | in_progress | - |
| 9  | 编写测试 | pending | #8 |
```

**原因**:
- Markdown 可读性强
- 可直接在 CLI 或 Web 中展示
- 易于版本控制

## Risks / Trade-offs

### R1: 文件系统并发写入风险

**风险**: 多个进程同时写入任务文件可能导致数据丢失

**缓解措施**:
- 使用原子写入（先写临时文件，再 rename）
- 添加文件锁机制（低优先级，按需实现）

### R2: 历史记录增长

**风险**: 长时间运行的任务历史记录会增长

**缓解措施**:
- 历史记录限制最近 100 条
- 归档时清理历史记录

### R3: 全局任务视图性能

**风险**: 团队数量多时，扫描所有目录可能较慢

**缓解措施**:
- 实现缓存机制
- 支持分页（后续版本）
