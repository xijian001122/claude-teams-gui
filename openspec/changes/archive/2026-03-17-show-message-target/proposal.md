## Why

Currently, when a user sends a message to a specific team member using @mention, there's no visual indication in the chat interface showing who the message is intended for. This creates confusion in group chats where multiple conversations may be happening simultaneously. Users need a clear way to see if a message is directed at them, someone else, or the entire team.

## What Changes

- **Add recipient indicator in MessageBubble**: Display a small inline badge at the top of message bubbles showing the target recipient (e.g., "@team-lead") when a message has a specific `to` field
- **Style distinction for targeted messages**: Use different styling for messages with specific recipients vs public messages
- **Self-target indication**: When a message is sent to the current user, show a distinctive "@你" (you) badge
- **Public message indication**: Optionally show a subtle indicator for messages sent to the entire team (no specific target)
- **Backend compatibility**: No changes needed - the backend already supports the `to` field in messages

## Capabilities

### New Capabilities
- `message-target-indicator`: Visual indicator showing the intended recipient of a message in the chat interface

### Modified Capabilities
- None - this is a UI-only enhancement using existing data

## Impact

- **Frontend Components**: `MessageBubble` component will be modified to display recipient badges
- **Types**: No changes needed - using existing `Message.to` field
- **API**: No changes needed - using existing message data
- **User Experience**: Improved clarity in team conversations, users can quickly identify messages directed at them
