## 1. Implementation

- [x] 1.1 Verify `db.updateTeamActivity()` method exists in `src/server/db/index.ts`
- [x] 1.2 Update `sendMessage()` in `data-sync.ts` to call `db.updateTeamActivity(teamName, message.timestamp)`
- [x] 1.3 Update `sendCrossTeamMessage()` to update both source and target team's `lastActivity`

## 2. Verification

- [x] 2.1 Test regular message updates team's `lastActivity`
- [x] 2.2 Test cross-team message updates both teams' `lastActivity`
- [x] 2.3 Verify team list displays updated time after sending message
