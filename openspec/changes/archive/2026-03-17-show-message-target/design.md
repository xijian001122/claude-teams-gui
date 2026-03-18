## Context

The MessageBubble component currently displays:
- Sender avatar
- Sender name (for incoming messages)
- Message content (with markdown support)
- Timestamp

The `Message` type already includes a `to` field that can contain a member name when the message is directed at a specific person. However, this information is not visually presented in the UI.

### Discovery: Inbox-based Recipient Detection

Claude Teams stores messages in `inboxes/<member>.json` files. **Key insight**: Each inbox file only contains messages intended for that member. This allows us to infer the `to` field:

```
developer.json  →  all messages in this file have to="developer"
tester.json     →  all messages in this file have to="tester"
team-lead.json  →  all messages in this file have to="team-lead"
```

**Sync Logic Update:**
```typescript
// If sender is NOT the inbox owner → message is TO the inbox owner
const actualTo = (actualFrom !== inbox) ? inbox : null;
```

This means:
- `developer.json` containing a message from `team-lead` → `to: "developer"`
- `tester.json` containing a message from `developer` → `to: "tester"`
- Messages where sender === inbox owner are treated as broadcasts (`to: null`)

## Goals / Non-Goals

**Goals:**
- Display the target recipient (@username) inside the message bubble when a message has a specific `to` field
- Use inline badge style at the top of the message bubble
- Different styling for messages directed at the current user vs others
- Keep the design clean and unobtrusive
- Support both light and dark themes

**Non-Goals:**
- No backend changes required
- No message data structure changes
- No new API endpoints
- No click actions on the target badge (for now)
- No message filtering by target

## Decisions

### 1. Badge position: Top of message bubble, above content
**Rationale:**
- Keeps the indicator close to the message content
- Consistent with common chat app patterns (WeChat, Slack)
- Doesn't interfere with avatar or sender name display

**Alternative considered:** Side badge - rejected because it takes horizontal space and may look crowded

### 2. Badge style: Small inline label with @ symbol
**Design:**
```
┌─────────────────────┐
│ @team-lead          │  ← Badge at top
│ 消息内容...          │
└─────────────────────┘
```

**Colors:**
- For others: Light blue background (#e0f2fe) with blue text (#0369a1)
- For self: Light green background (#dcfce7) with green text (#15803d)
- In dark mode: Darker versions of the same colors

### 3. Badge content format: @username
**Examples:**
- `@team-lead` - message sent to team-lead
- `@你` - message sent to current user (localized "you")
- No badge - public message (to: null)

### 4. Self-detection logic
Compare `message.to` with the current user's identifier ('user' by default)

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Badge may clutter short messages | Keep badge very small (11px font, minimal padding) |
| Users may not notice the badge | Use distinct colors for self-targeted messages |
| Long usernames may overflow | Truncate with ellipsis if too long |
| Accessibility concerns | Ensure color contrast meets WCAG AA |

## Migration Plan

1. Update MessageBubble component
2. Test with existing messages (should show no badge for public messages)
3. Test with @mentions (should show badge)
4. Deploy - no database migration needed

## Open Questions

None - straightforward UI enhancement.
