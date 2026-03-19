## Summary

This change is a **bug fix** and does not introduce new capabilities or modify existing requirements.

### No New Specifications Required

The `interactive-permission-auth` feature was previously implemented with correct specifications. This change fixes an implementation defect where:

1. The frontend `handlePermissionResponse` function was missing the required `agent_id` parameter
2. The backend API correctly validates for `agent_id`, causing requests to fail with 400 error

### Files Affected

- `src/client/app.tsx` - Adding `agent_id` to API call
- `src/client/components/JsonMessageCard.tsx` - Passing `agent_id` through callback

### Reference

See `proposal.md` and `design.md` for details on the bug and fix implementation.
