## 1. app.tsx — 状态与数据加载

- [x] 1.1 新增 `archivedTeams` 状态（`useState<Team[]>([])`）
- [x] 1.2 新增 `loadArchivedTeams()` 函数，调用 `GET /api/archive` 并写入状态
- [x] 1.3 在 `useEffect` 初始化时调用 `loadArchivedTeams()`
- [x] 1.4 在 WebSocket `team_archived` 事件处理中调用 `loadArchivedTeams()` 刷新归档列表
- [x] 1.5 将 `archivedTeams` 作为 prop 传递给 `Sidebar` 和 `ChatArea`

## 2. Sidebar.tsx — 归档团队列表 UI

- [x] 2.1 接收 `archivedTeams: Team[]` prop
- [x] 2.2 替换硬编码"2 个团队"为 `archivedTeams.length` 的动态显示
- [x] 2.3 实现展开后渲染归档团队列表，每项显示团队名称和归档日期
- [x] 2.4 点击归档团队条目调用 `onSelectTeam`（或新增 `onSelectArchivedTeam`）选中该团队

## 3. ChatArea.tsx — 只读模式

- [x] 3.1 接收 `archivedTeams: Team[]` prop
- [x] 3.2 根据 `selectedTeam` 是否在 `archivedTeams` 中判断只读模式
- [x] 3.3 只读模式下，聊天区域顶部渲染黄色只读提示横幅（"此团队已归档，仅供查看"）
- [x] 3.4 只读模式下，底部 `InputBox` 组件传入 `disabled` prop 禁用输入
