import type { DatabaseService } from '../db';
export interface CleanupConfig {
    retentionDays: number;
    cleanupEnabled: boolean;
    cleanupTime: string;
}
export declare class CleanupService {
    private db;
    private config;
    private scheduledTask;
    constructor(db: DatabaseService, config: CleanupConfig);
    /**
     * Schedule cleanup task
     */
    schedule(): void;
    /**
     * Stop scheduled task
     */
    stop(): void;
    /**
     * Update config and reschedule if needed
     */
    updateConfig(newConfig: Partial<CleanupConfig>): void;
    /**
     * Run cleanup immediately
     */
    runCleanup(): Promise<{
        deleted: number;
        archived: number;
    }>;
    /**
     * Clean up old messages from active teams
     */
    private cleanupActiveTeams;
    /**
     * Clean up archived teams
     */
    private cleanupArchivedTeams;
    /**
     * Permanently delete a team and its data
     */
    private permanentlyDeleteTeam;
    /**
     * Clean up orphan attachments
     */
    private cleanupOrphanAttachments;
}
export default CleanupService;
//# sourceMappingURL=cleanup.d.ts.map