## 1. Frontend Component Changes

- [ ] 1.1 Update `onPermissionResponse` callback signature in `JsonMessageCard.tsx` to accept `agentId` parameter
- [ ] 1.2 Update `PermissionRequestCard` to pass `prData.agent_id` when calling `onPermissionResponse`
- [ ] 1.3 Update `JsonMessageCardProps` interface to reflect new callback signature

## 2. App Layer Changes

- [ ] 2.1 Update `handlePermissionResponse` function signature in `app.tsx` to accept `agentId` parameter
- [ ] 2.2 Add `agent_id: agentId` to the API request body in `handlePermissionResponse`
- [ ] 2.3 Update the `JsonMessageCard` component usage in `ChatArea` to pass `agent_id` from message data

## 3. Verification

- [ ] 3.1 Verify API request includes all three required fields: `request_id`, `approve`, `agent_id`
- [ ] 3.2 Test that clicking Approve button sends correct API request
- [ ] 3.3 Test that clicking Reject button sends correct API request
