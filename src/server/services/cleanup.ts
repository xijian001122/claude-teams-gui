import { schedule } from 'node-cron';
import { subDays, formatISO } from 'date-fns';
import type { DatabaseService } from '../db';

export interface CleanupConfig {
  retentionDays: number;
  cleanupEnabled: boolean;
  cleanupTime: string;
}

export class CleanupService {
  private db: DatabaseService;
  private config: CleanupConfig;
  private scheduledTask: any;

  constructor(db: DatabaseService, config: CleanupConfig) {
    this.db = db;
    this.config = config;
  }

  /**
   * Schedule cleanup task
   */
  schedule(): void {
    if (!this.config.cleanupEnabled) {
      console.log('[Cleanup] Cleanup is disabled');
      return;
    }

    const [hour, minute] = this.config.cleanupTime.split(':');
    const cronExpr = `${minute} ${hour} * * *`;

    this.scheduledTask = schedule(cronExpr, () => {
      this.runCleanup();
    });

    console.log(`[Cleanup] Scheduled daily at ${this.config.cleanupTime}`);
  }

  /**
   * Stop scheduled task
   */
  stop(): void {
    if (this.scheduledTask) {
      this.scheduledTask.stop();
      this.scheduledTask = null;
    }
  }

  /**
   * Update config and reschedule if needed
   */
  updateConfig(newConfig: Partial<CleanupConfig>): void {
    const oldConfig = { ...this.config };
    this.config = { ...this.config, ...newConfig };

    // If cleanup time changed or enabled status changed, reschedule
    if (
      oldConfig.cleanupTime !== this.config.cleanupTime ||
      oldConfig.cleanupEnabled !== this.config.cleanupEnabled
    ) {
      this.stop();
      this.schedule();
      console.log('[Cleanup] Config updated and rescheduled');
    }
  }

  /**
   * Run cleanup immediately
   */
  async runCleanup(): Promise<{ deleted: number; archived: number }> {
    console.log('[Cleanup] Running cleanup task...');
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

    } catch (err) {
      console.error('[Cleanup] Error during cleanup:', err);
    }

    const duration = Date.now() - startTime;
    console.log(`[Cleanup] Completed in ${duration}ms. Deleted: ${results.deleted}, Archived: ${results.archived}`);

    return results;
  }

  /**
   * Clean up old messages from active teams
   */
  private async cleanupActiveTeams(): Promise<number> {
    const cutoff = subDays(new Date(), this.config.retentionDays);
    const cutoffStr = formatISO(cutoff);

    const deleted = await this.db.deleteOldMessages(cutoffStr);

    if (deleted > 0) {
      console.log(`[Cleanup] Deleted ${deleted} old messages from active teams`);
    }

    return deleted;
  }

  /**
   * Clean up archived teams
   */
  private async cleanupArchivedTeams(): Promise<number> {
    const teams = await this.db.getArchivedTeams();
    let archived = 0;

    for (const team of teams) {
      const archivedAt = new Date(team.archived_at);
      const expireAt = subDays(new Date(), -this.config.retentionDays); // Add days

      if (new Date() > expireAt) {
        await this.permanentlyDeleteTeam(team.name);
        archived++;
      }
    }

    if (archived > 0) {
      console.log(`[Cleanup] Permanently deleted ${archived} archived teams`);
    }

    return archived;
  }

  /**
   * Permanently delete a team and its data
   */
  private async permanentlyDeleteTeam(teamName: string): Promise<void> {
    // Delete from database
    await this.db.deleteTeam(teamName);

    // Note: Files are kept in archive directory for manual cleanup
    console.log(`[Cleanup] Permanently deleted team: ${teamName}`);
  }

  /**
   * Clean up orphan attachments
   */
  private async cleanupOrphanAttachments(): Promise<void> {
    // Implementation depends on attachment storage strategy
    // For now, just log
    console.log('[Cleanup] Orphan attachment cleanup not implemented');
  }
}

export default CleanupService;
