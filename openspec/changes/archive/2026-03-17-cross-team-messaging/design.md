## Context

Claude Agent GUI currently uses a team-isolated architecture where each team's messages are completely separate. The `Message` type already has a `to` field (string | null) that is used for targeting specific members within a team. We need to extend this to support cross-team communication while maintaining backward compatibility.

Current message flow:
1. Message is created with `from` (sender) and `to` (optional member target)
2. Message is stored in the source team's inbox
3. WebSocket broadcasts to connected clients of that team

For cross-team messaging, we need:
1. A way to specify the target team
2. Message routing between teams
3. Visual distinction in the UI

## Goals / Non-Goals

**Goals:**
- Enable sending messages from one team to another (e.g., team-load → developer)
- Display source/target team indicators in the chat UI
- Maintain backward compatibility with existing single-team messages
- Support cross-team message history and persistence
- Basic opt-in permission model for cross-team communication

**Non-Goals:**
- Real-time bidirectional chat between teams (asynchronous messaging only)
- Complex permission hierarchies or ACLs
- Message threading across teams
- Cross-team member mentions (@team/member syntax)
- End-to-end encryption for cross-team messages

## Decisions

### 1. Use existing `to` field with team: prefix for cross-team targets
**Decision**: Extend the `to` field to support `team:<teamName>` format instead of adding a new `targetTeam` field.

**Rationale**:
- Minimal schema changes
- Backward compatible - existing messages still work
- Simple to parse and understand

**Alternative considered**: Adding `targetTeam` field - rejected because it complicates the data model and requires more migration work.

### 2. Store cross-team messages in both teams' storage
**Decision**: When a cross-team message is sent, store it in the source team's outbox AND the target team's inbox.

**Rationale**:
- Target team can retrieve message history independently
- No need for complex cross-team queries
- Each team has full context of the conversation

**Trade-off**: Duplicate storage, but messages are small and this simplifies querying.

### 3. WebSocket events for real-time delivery
**Decision**: Use new WebSocket event types `cross_team_message` instead of reusing `new_message`.

**Rationale**:
- Clear semantic distinction between intra-team and cross-team messages
- Allows different handling logic on client side
- Easier to implement selective subscriptions

### 4. Visual indicators in MessageBubble component
**Decision**: Add UI badges showing source team for incoming cross-team messages and target team for outgoing cross-team messages.

**Rationale**:
- Immediate visual context for users
- Can be implemented within existing component structure
- Uses existing color system for team identification

### 5. Simple opt-in permission model
**Decision**: Teams have a `allowCrossTeamMessages` boolean config option. Default is false.

**Rationale**:
- Security by default
- Simple to understand and implement
- Can be extended later if needed

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Message duplication across teams | Acceptable trade-off for query simplicity; add cleanup job if storage becomes issue |
| Circular message loops (A→B→A→B) | Add `originalTeam` field to track source; prevent relaying back to origin |
| Confusion about message visibility | Clear UI indicators; documentation about cross-team behavior |
| Performance with many cross-team messages | Pagination on message history; WebSocket room management per team |
| Security concerns (information leakage) | Opt-in permissions; only explicit team-to-team communication allowed |

## Migration Plan

1. **Database**: Add `originalTeam` column to messages table (nullable, for cross-team tracking)
2. **Config**: New teams get `allowCrossTeamMessages: false` by default
3. **Deployment**:
   - Deploy backend changes first (new API endpoints, WebSocket events)
   - Deploy frontend changes after (UI indicators, compose UI)
4. **Rollback**: If issues occur, frontend can hide cross-team UI; backend endpoints remain backward compatible

## Open Questions

1. Should cross-team messages support replies/threads? (Decision: No for MVP)
2. How to handle team deletion when cross-team messages exist? (Decision: Messages remain but show "[Deleted Team]")
3. Should there be a "cross-team inbox" view that aggregates all cross-team messages? (Decision: Future enhancement)
