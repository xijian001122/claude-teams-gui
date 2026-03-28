# Tasks: 修复 team_added 事件

## Task 1: 添加 team_added 事件处理

**File**: `src/client/hooks/useWebSocket.ts`

**Changes**:
在 `ws.onmessage` 的 try 块中添加：

```typescript
if (data.type === 'team_added' && data.team) {
  setLastMessage({
    timestamp: Date.now(),
    type: data.type,
    team: data.team.name
  });
}
```

**Location**: 在 `task_created` 处理之后添加

---

## Task 2: 测试验证

1. 启动 GUI 服务
2. 打开 Web 界面
3. 在另一个终端创建新团队
4. 验证 Web 界面自动刷新显示新团队
