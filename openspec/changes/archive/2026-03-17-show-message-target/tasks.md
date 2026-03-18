## 0. Backend Sync Enhancement (Inbox-based Recipient Detection)

- [x] 0.1 Discover that inbox filename indicates message recipient
- [x] 0.2 Update `convertToMessage()` in data-sync.ts to infer `to` field from inbox filename
- [x] 0.3 Logic: `to = (sender !== inbox) ? inbox : null`
- [x] 0.4 Verify with API: 196/200 messages now have correct `to` field

## 1. MessageBubble Component Updates

- [x] 1.1 Add target recipient badge rendering logic in MessageBubble
- [x] 1.2 Implement @username badge styling (light blue background)
- [x] 1.3 Implement @你 badge styling (light green background) for current user
- [x] 1.4 Add logic to detect if message is for current user (to === 'user')
- [x] 1.5 Position badge at top of message bubble, above content
- [x] 1.6 Add truncate logic for long usernames (>20 chars)
- [x] 1.7 Ensure badge doesn't show when to is null or undefined

## 2. Styling and Theming

- [x] 2.1 Add CSS classes for target badge in light theme
- [x] 2.2 Add CSS classes for self-target badge in light theme
- [x] 2.3 Add CSS classes for target badge in dark theme
- [x] 2.4 Add CSS classes for self-target badge in dark theme
- [x] 2.5 Ensure color contrast meets accessibility standards

## 3. Testing

- [x] 3.1 Test message with specific target shows @username badge
- [x] 3.2 Test message to current user shows @你 badge with green style
- [x] 3.3 Test public message (to: null) shows no badge
- [ ] 3.4 Test long username is truncated with ellipsis
- [ ] 3.5 Test styling in both light and dark themes
- [ ] 3.6 Test in different screen sizes

## 4. Documentation

- [ ] 4.1 Update component documentation for MessageBubble
- [ ] 4.2 Add example screenshots to PR description
