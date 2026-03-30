## 1. Hook 脚本

- [x] 1.1 Create `hooks/subagent-register.js` script
- [x] 1.2 Parse SubagentStart hook data from stdin
- [x] 1.3 Resolve team name and member name from agent_id or cwd
- [x] 1.4 Write session registration to `~/.claude/teams/<team>/sessions/<member>.json`
- [x] 1.5 Add error handling and logging

## 2. Hook 配置

- [x] 2.1 Update `hooks/hooks.json` to SubagentStart hook entry
- [x] 2.2 Configure hook to execute `subagent-register.js`
- [x] 2.3 Set timeout to 10 seconds

## 3. 后端 API

- [x] 3.1 Create `src/server/routes/member-session.ts` route file
- [x] 3.2 Implement `GET /api/teams/:team/members/:member/session` endpoint
- [x] 3.3 Implement `GET /api/teams/:team/members/:member/conversation` endpoint
- [x] 3.4 Add JSONL parsing with error handling
- [x] 3.5 Register routes in server

## 4. 模块导出

- [x] 4.1 Create `src/server/services/session-reader.ts` service
- [x] 4.2 Implement `getMemberSession(team, member)` function
- [x] 4.3 Implement `getMemberConversation(team, member, limit)` function
- [x] 4.4 Add project hash calculation
- [x] 4.5 Add JSONl streaming parser

## 5. 前端组件

- [x] 5.1 Create `src/client/components/MemberConversationPanel.tsx` component
- [x] 5.2 Add conversation display with user/assistant distinction
- [x] 5.3 Add loading and error states
- [x] 5.4 Add auto-refresh toggle
- [x] 5.5 Style with TailwindCSS

## 6. 集成

- [x] 6.1 Add "View Context" button to member list UI
- [x] 6.2 Wire up panel state management
- [x] 6.3 Test end-to-end flow
