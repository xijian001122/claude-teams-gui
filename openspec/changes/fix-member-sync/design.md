# Design: 修复成员列表同步

## Context

当前 Claude Teams GUI 通过 `data-sync.ts` 同步团队数据，存在两个问题：

1. **config.json 损坏风险**：外部程序（Claude Code CLI）可能在写入时出错，导致 JSON 格式损坏
2. **成员列表不更新**：`extractMembers()` 只从 `config.members` 读取，无法发现新创建的 agent

## Goals / Non-Goals

**Goals:**
- 自动修复损坏的 config.json
- 从 inboxes 目录动态发现新成员
- 实时广播成员更新到前端

**Non-Goals:**
- 不修改 Claude Code CLI 的行为
- 不修改 config.json 的写入逻辑

## Decisions

### 1. Config 备份策略

**决定**：首次成功读取后保存到 `config.backup.json`

**理由**：
- 简单可靠，无需额外存储
- 备份与原文件同目录，易于管理
- 每次成功读取都更新备份，保持最新

**替代方案**：
- 内存缓存 → 重启后丢失
- 专用备份目录 → 过度复杂

### 2. 成员发现策略

**决定**：扫描 `inboxes/*.json` 文件名，与 `config.members` 合并

**理由**：
- inbox 文件名即成员名，天然对应
- 文件存在意味着成员活跃
- 非侵入式，不修改原 config

**实现**：
```typescript
private async discoverMembers(teamName: string, configMembers: TeamMember[]): Promise<TeamMember[]> {
  const inboxesPath = join(this.claudeTeamsPath, teamName, 'inboxes');
  const memberMap = new Map<string, TeamMember>();

  // Add config members first
  for (const m of configMembers) {
    memberMap.set(m.name, m);
  }

  // Discover from inbox files
  if (existsSync(inboxesPath)) {
    const files = await readdir(inboxesPath);
    for (const file of files.filter(f => f.endsWith('.json'))) {
      const memberName = file.replace('.json', '');
      if (!memberMap.has(memberName)) {
        memberMap.set(memberName, {
          name: memberName,
          displayName: memberName,
          role: 'discovered',
          color: generateAvatarColor(memberName),
          avatarLetter: extractAvatarLetter(memberName),
          isOnline: true
        });
      }
    }
  }

  return Array.from(memberMap.values());
}
```

### 3. WebSocket 事件设计

**决定**：新增 `members_updated` 事件类型

**格式**：
```json
{
  "type": "members_updated",
  "team": "team-name",
  "members": [...]
}
```

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|---------|
| 备份可能也损坏 | 只有成功解析后才更新备份 |
| 扫描 inboxes 增加延迟 | 只在 syncTeam 时执行，不是高频操作 |
| 发现的成员缺少 role 信息 | 使用 'discovered' 作为默认 role |
