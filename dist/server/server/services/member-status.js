/**
 * Member Status Service
 * Tracks member activity with state machine:
 * - busy (red): Member sent a message recently
 * - idle (green): Member sent idle_notification
 * - occupied (yellow): Member has been busy for 5+ minutes
 * - offline (gray): No status change for 30+ minutes
 */
// Time thresholds
const BUSY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes: busy → occupied
const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes: idle/occupied → offline
const INIT_GRACE_PERIOD_MS = 2000; // 2 seconds: grace period after init before tick takes over
export class MemberStatusService {
    // Map<teamName, Map<memberName, MemberState>>
    stateMap = new Map();
    /**
     * Mark member as busy (they sent a message)
     */
    markBusy(teamName, memberName) {
        const now = Date.now();
        this.setMemberState(teamName, memberName, 'busy', now);
    }
    /**
     * Mark member as idle (they sent idle_notification)
     */
    markIdle(teamName, memberName) {
        const now = Date.now();
        this.setMemberState(teamName, memberName, 'idle', now);
    }
    /**
     * Initialize a member as offline (for team join)
     * Only initializes if the member doesn't exist yet - won't overwrite existing state
     */
    initMemberOffline(teamName, memberName) {
        const now = Date.now();
        if (!this.stateMap.has(teamName)) {
            this.stateMap.set(teamName, new Map());
        }
        const teamMap = this.stateMap.get(teamName);
        // Only initialize if member doesn't exist yet - don't overwrite existing state
        if (teamMap.has(memberName)) {
            return;
        }
        teamMap.set(memberName, {
            lastActivityAt: now,
            statusChangedAt: now - IDLE_TIMEOUT_MS - 1000, // Old enough to be immediately offline
            currentStatus: 'offline',
            initializedAt: now
        });
    }
    /**
     * Set member state
     */
    setMemberState(teamName, memberName, status, timestamp) {
        if (!this.stateMap.has(teamName)) {
            this.stateMap.set(teamName, new Map());
        }
        const teamMap = this.stateMap.get(teamName);
        const existing = teamMap.get(memberName);
        teamMap.set(memberName, {
            lastActivityAt: timestamp,
            statusChangedAt: timestamp,
            currentStatus: status,
            initializedAt: existing?.initializedAt || timestamp
        });
    }
    /**
     * Get member statuses for a team (with computed status based on time)
     */
    getMemberStatuses(teamName) {
        const teamMap = this.stateMap.get(teamName);
        if (!teamMap) {
            return [];
        }
        const now = Date.now();
        const statuses = [];
        teamMap.forEach((state, memberName) => {
            const computedStatus = this.computeStatus(state, now);
            statuses.push({
                memberName,
                status: computedStatus,
                lastActivityAt: state.lastActivityAt,
                statusChangedAt: state.statusChangedAt
            });
        });
        // Sort: busy first, then occupied, idle, offline
        const sortOrder = { busy: 0, occupied: 1, idle: 2, offline: 3 };
        statuses.sort((a, b) => {
            const orderDiff = sortOrder[a.status] - sortOrder[b.status];
            if (orderDiff !== 0)
                return orderDiff;
            return b.lastActivityAt - a.lastActivityAt;
        });
        return statuses;
    }
    /**
     * Compute actual status based on time elapsed
     */
    computeStatus(state, now) {
        const timeSinceActivity = now - state.lastActivityAt;
        const timeSinceStatusChange = now - state.statusChangedAt;
        const timeSinceInit = now - state.initializedAt;
        // During grace period after init, keep the initialized status
        if (timeSinceInit < INIT_GRACE_PERIOD_MS) {
            return state.currentStatus;
        }
        // Check if should go offline (30 min since any status change)
        if (timeSinceStatusChange >= IDLE_TIMEOUT_MS) {
            return 'offline';
        }
        // Check if should go from busy to occupied (5 min of busy)
        if (state.currentStatus === 'busy' && timeSinceActivity >= BUSY_TIMEOUT_MS) {
            return 'occupied';
        }
        // occupied → idle after 30 seconds (user requested "超过30秒自动变空闲")
        if (state.currentStatus === 'occupied' && timeSinceStatusChange >= 30 * 1000) {
            return 'idle';
        }
        // For occupied and idle, they stay until 30 min timeout
        if (state.currentStatus === 'occupied' || state.currentStatus === 'idle') {
            return state.currentStatus;
        }
        return state.currentStatus;
    }
    /**
     * Check if status should be updated (for periodic checks)
     * Returns members whose status needs to be recalculated
     */
    checkStatusUpdates(teamName) {
        const teamMap = this.stateMap.get(teamName);
        if (!teamMap) {
            return [];
        }
        const now = Date.now();
        const membersToUpdate = [];
        teamMap.forEach((state, memberName) => {
            const computedStatus = this.computeStatus(state, now);
            if (computedStatus !== state.currentStatus) {
                membersToUpdate.push(memberName);
            }
        });
        return membersToUpdate;
    }
    /**
     * Update status for a member after transition
     */
    updateComputedStatus(teamName, memberName) {
        const teamMap = this.stateMap.get(teamName);
        if (!teamMap)
            return;
        const state = teamMap.get(memberName);
        if (!state)
            return;
        const now = Date.now();
        const newStatus = this.computeStatus(state, now);
        if (newStatus !== state.currentStatus) {
            state.currentStatus = newStatus;
            state.statusChangedAt = now;
        }
    }
    /**
     * Remove a member from tracking
     */
    removeMember(teamName, memberName) {
        const teamMap = this.stateMap.get(teamName);
        if (teamMap) {
            teamMap.delete(memberName);
        }
    }
    /**
     * Remove all members for a team
     */
    removeTeam(teamName) {
        this.stateMap.delete(teamName);
    }
    /**
     * Get all tracked teams
     */
    getTrackedTeams() {
        return Array.from(this.stateMap.keys());
    }
    /**
     * Periodic check - update statuses and return all current statuses
     * Call this every few seconds to recalculate occupied/offline states
     */
    tick(teamName) {
        // Update any members whose status has changed
        const membersToUpdate = this.checkStatusUpdates(teamName);
        for (const memberName of membersToUpdate) {
            this.updateComputedStatus(teamName, memberName);
        }
        // Return current statuses
        return this.getMemberStatuses(teamName);
    }
}
export default MemberStatusService;
//# sourceMappingURL=member-status.js.map