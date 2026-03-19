import { watch, FSWatcher } from 'chokidar';
import { join } from 'path';
import { readFileSync } from 'fs';
import type { DataSyncService } from './data-sync';

export interface FileWatcherOptions {
  claudeTeamsPath: string;
  dataSync: DataSyncService;
  onMemberActivity?: (teamName: string, memberName: string, messageType?: string) => void;
}

export class FileWatcherService {
  private watchers: Map<string, FSWatcher> = new Map();
  private claudeTeamsPath: string;
  private dataSync: DataSyncService;
  private onMemberActivity?: (teamName: string, memberName: string, messageType?: string) => void;

  constructor(options: FileWatcherOptions) {
    this.claudeTeamsPath = options.claudeTeamsPath;
    this.dataSync = options.dataSync;
    this.onMemberActivity = options.onMemberActivity;
  }

  /**
   * Start watching all team directories
   */
  async start(): Promise<void> {
    if (!this.claudeTeamsPath) {
      console.log('[FileWatcher] No Claude teams path configured');
      return;
    }

    // Watch for new teams
    const teamsWatcher = watch(this.claudeTeamsPath, {
      persistent: true,
      ignoreInitial: true,
      depth: 0
    });

    teamsWatcher.on('addDir', (path) => {
      const teamName = path.split('/').pop();
      if (teamName && !teamName.startsWith('.')) {
        console.log(`[FileWatcher] New team detected: ${teamName}`);
        this.watchTeam(teamName);
        this.dataSync.syncTeam(teamName);
      }
    });

    teamsWatcher.on('unlinkDir', (path) => {
      const teamName = path.split('/').pop();
      if (teamName) {
        console.log(`[FileWatcher] Team deleted: ${teamName}`);
        this.unwatchTeam(teamName);
        this.dataSync.handleTeamDeleted(teamName);
      }
    });

    this.watchers.set('__teams__', teamsWatcher);

    // Watch existing teams
    const { readdir } = await import('fs/promises');
    try {
      const entries = await readdir(this.claudeTeamsPath, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          this.watchTeam(entry.name);
        }
      }
    } catch {
      // Directory doesn't exist yet
    }

    console.log('[FileWatcher] Started watching');
  }

  /**
   * Watch a specific team's inboxes
   */
  private watchTeam(teamName: string): void {
    const inboxesPath = join(this.claudeTeamsPath, teamName, 'inboxes');

    const watcher = watch(`${inboxesPath}/*.json`, {
      persistent: true,
      ignoreInitial: true
    });

    watcher.on('change', async (filePath) => {
      const fileName = filePath.split('/').pop() || '';
      const member = fileName.replace('.json', '');

      console.log(`[FileWatcher] Inbox changed: ${teamName}/${member}`);

      // Sync the changed inbox
      await this.dataSync.syncTeam(teamName);

      // Read the latest message to check its type
      let messageType: string | undefined;
      try {
        const inboxPath = join(this.claudeTeamsPath, teamName, 'inboxes', fileName);
        const content = readFileSync(inboxPath, 'utf-8');
        const messages = JSON.parse(content);
        if (Array.isArray(messages) && messages.length > 0) {
          const latestMessage = messages[messages.length - 1];
          // Try to parse the text field if it contains JSON
          if (latestMessage.text) {
            try {
              const parsed = JSON.parse(latestMessage.text);
              messageType = parsed.type;
            } catch {
              // Not JSON, ignore
            }
          }
          // Also check direct type field
          if (!messageType && latestMessage.type) {
            messageType = latestMessage.type;
          }
        }
      } catch (err) {
        console.error('[FileWatcher] Error reading inbox:', err);
      }

      // Update member activity status
      if (this.onMemberActivity) {
        this.onMemberActivity(teamName, member, messageType);
      }
    });

    this.watchers.set(teamName, watcher);
  }

  /**
   * Stop watching a team
   */
  private unwatchTeam(teamName: string): void {
    const watcher = this.watchers.get(teamName);
    if (watcher) {
      watcher.close();
      this.watchers.delete(teamName);
    }
  }

  /**
   * Stop all watchers
   */
  stop(): void {
    for (const [name, watcher] of this.watchers) {
      watcher.close();
      console.log(`[FileWatcher] Stopped watching: ${name}`);
    }
    this.watchers.clear();
  }
}

export default FileWatcherService;
