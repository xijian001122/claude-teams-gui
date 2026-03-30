import { schedule } from 'node-cron';
import { subDays, formatISO } from 'date-fns';
import { createLogger } from './log-factory';
// Module logger
const log = createLogger({ module: 'Cleanup', shorthand: 's.s.cleanup' });
export class CleanupService {
    db;
    config;
    scheduledTask;
    constructor(db, config) {
        this.db = db;
        this.config = config;
    }
    /**
     * Schedule cleanup task
     */
    schedule() {
        if (!this.config.cleanupEnabled) {
            log.info('Cleanup is disabled');
            return;
        }
        const [hour, minute] = this.config.cleanupTime.split(':');
        const cronExpr = `${minute} ${hour} * * *`;
        this.scheduledTask = schedule(cronExpr, () => {
            this.runCleanup();
        });
        log.info(`Scheduled daily at ${this.config.cleanupTime}`);
    }
    /**
     * Stop scheduled task
     */
    stop() {
        if (this.scheduledTask) {
            this.scheduledTask.stop();
            this.scheduledTask = null;
        }
    }
    /**
     * Update config and reschedule if needed
     */
    updateConfig(newConfig) {
        const oldConfig = { ...this.config };
        this.config = { ...this.config, ...newConfig };
        // If cleanup time changed or enabled status changed, reschedule
        if (oldConfig.cleanupTime !== this.config.cleanupTime ||
            oldConfig.cleanupEnabled !== this.config.cleanupEnabled) {
            this.stop();
            this.schedule();
            log.info('Config updated and rescheduled');
        }
    }
    /**
     * Run cleanup immediately
     */
    async runCleanup() {
        log.info('Running cleanup task...');
        const startTime = Date.now();
        const results = {
            deleted: 0,
            archived: 0
        };
        try {
            // 1. Clean up old messages from active teams
            const msgDeleted = await this.cleanupActiveTeams();
            results.deleted += msgDeleted;
            // 2. Clean up archived teams
            const teamsArchived = await this.cleanupArchivedTeams();
            results.archived += teamsArchived;
            // 3. Clean up orphan attachments
            await this.cleanupOrphanAttachments();
        }
        catch (err) {
            log.error(`Error during cleanup: ${err}`);
        }
        const duration = Date.now() - startTime;
        log.info(`Completed in ${duration}ms. Deleted: ${results.deleted}, Archived: ${results.archived}`);
        return results;
    }
    /**
     * Clean up old messages from active teams
     */
    async cleanupActiveTeams() {
        const cutoff = subDays(new Date(), this.config.retentionDays);
        const cutoffStr = formatISO(cutoff);
        const deleted = await this.db.deleteOldMessages(cutoffStr);
        if (deleted > 0) {
            log.info(`Deleted ${deleted} old messages from active teams`);
        }
        return deleted;
    }
    /**
     * Clean up archived teams
     */
    async cleanupArchivedTeams() {
        const teams = await this.db.getArchivedTeams();
        let archived = 0;
        for (const team of teams) {
            const expireAt = subDays(new Date(), -this.config.retentionDays); // Add days
            if (new Date() > expireAt) {
                await this.permanentlyDeleteTeam(team.name);
                archived++;
            }
        }
        if (archived > 0) {
            log.info(`Permanently deleted ${archived} archived teams`);
        }
        return archived;
    }
    /**
     * Permanently delete a team and its data
     */
    async permanentlyDeleteTeam(teamName) {
        // Delete from database
        await this.db.deleteTeam(teamName);
        // Note: Files are kept in archive directory for manual cleanup
        log.info(`Permanently deleted team: ${teamName}`);
    }
    /**
     * Clean up orphan attachments
     */
    async cleanupOrphanAttachments() {
        // Implementation depends on attachment storage strategy
        // For now, just log
        log.debug('Orphan attachment cleanup not implemented');
    }
}
export default CleanupService;
//# sourceMappingURL=cleanup.js.map