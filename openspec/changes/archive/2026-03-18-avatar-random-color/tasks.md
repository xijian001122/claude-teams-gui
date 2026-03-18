## 1. Setup

- [ ] 1.1 Create `src/shared/utils/avatar.ts` with color generation function
- [ ] 1.2 Add HSL to Hex conversion utility function
- [ ] 1.3 Add avatar letter extraction function

## 2. Core Implementation

- [ ] 2.1 Implement `generateAvatarColor(name: string): string`
- [ ] 2.2 Implement `extractAvatarLetter(name: string): string`
- [ ] 2.3 Add unit tests for color generation (same name = same color)
- [ ] 2.4 Add unit tests for letter extraction

## 3. Integration

- [ ] 3.1 Update `DataSyncService.extractMembers()` to use new functions
- [ ] 3.2 Remove hardcoded `AVATAR_COLORS` and `AVATAR_LETTERS` from constants.ts
- [ ] 3.3 Keep minimal fallback in constants.ts for edge cases

## 4. Verification

- [ ] 4.1 Test with existing team members (developer, tester, user)
- [ ] 4.2 Test with new role names (frontend-dev, backend-dev, bug-fixer)
- [ ] 4.3 Verify colors are visually distinct and readable
- [ ] 4.4 Verify colors persist across server restarts
