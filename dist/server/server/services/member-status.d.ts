/**
 * Member Status Service
 * Tracks member activity with state machine:
 * - busy (red): Member sent a message recently
 * - idle (green): Member sent idle_notification
 * - occupied (yellow): Member has been busy for 5+ minutes
 * - offline (gray): No status change for 30+ minutes
 */
import type { MemberStatusInfo } from '@shared/types';
export type MemberStatus = 'busy' | 'idle' | 'occupied' | 'offline';
export declare class MemberStatusService {
    private stateMap;
    /**
     * Mark member as busy (they sent a message)
     */
    markBusy(teamName: string, memberName: string): void;
    /**
     * Mark member as idle (they sent idle_notification)
     */
    markIdle(teamName: string, memberName: string): void;
    /**
     * Initialize a member as offline (for team join)
     * Only initializes if the member doesn't exist yet - won't overwrite existing state
     */
    initMemberOffline(teamName: string, memberName: string): void;
    /**
     * Set member state
     */
    private setMemberState;
    /**
     * Get member statuses for a team (with computed status based on time)
     */
    getMemberStatuses(teamName: string): MemberStatusInfo[];
    /**
     * Compute actual status based on time elapsed
     */
    private computeStatus;
    /**
     * Check if status should be updated (for periodic checks)
     * Returns members whose status needs to be recalculated
     */
    checkStatusUpdates(teamName: string): string[];
    /**
     * Update status for a member after transition
     */
    private updateComputedStatus;
    /**
     * Remove a member from tracking
     */
    removeMember(teamName: string, memberName: string): void;
    /**
     * Remove all members for a team
     */
    removeTeam(teamName: string): void;
    /**
     * Get all tracked teams
     */
    getTrackedTeams(): string[];
    /**
     * Periodic check - update statuses and return all current statuses
     * Call this every few seconds to recalculate occupied/offline states
     */
    tick(teamName: string): MemberStatusInfo[];
}
export default MemberStatusService;
//# sourceMappingURL=member-status.d.ts.map