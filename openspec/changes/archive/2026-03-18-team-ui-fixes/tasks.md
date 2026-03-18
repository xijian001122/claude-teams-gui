## 1. Avatar Color Fix

- [x] 1.1 Import `generateAvatarColor` in Sidebar.tsx
- [x] 1.2 Replace hardcoded `#3b82f6` with `generateAvatarColor(team.name)`

## 2. Time Format Improvement

- [x] 2.1 Create `formatSmartTime` utility function in Sidebar.tsx
- [x] 2.2 Implement today detection ("今天 HH:mm")
- [x] 2.3 Implement yesterday detection ("昨天 HH:mm")
- [x] 2.4 Implement older date format ("M月D日 HH:mm")
- [x] 2.5 Replace `formatTime` call with `formatSmartTime`

## 3. Online Count Verification

- [x] 3.1 Verify user member is set `isOnline: true` in data-sync.ts
- [x] 3.2 Test online count calculation with multiple team configurations

## 4. Verification

- [x] 4.1 Test avatar colors match between sidebar and chat area
- [x] 4.2 Test time format displays correctly for today/yesterday/older
- [x] 4.3 Test online count reflects actual member status
