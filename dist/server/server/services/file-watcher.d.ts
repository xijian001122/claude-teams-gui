import type { DataSyncService } from './data-sync';
import type { FastifyInstance } from 'fastify';
export interface FileWatcherOptions {
    claudeTeamsPath: string;
    dataSync: DataSyncService;
    fastify: FastifyInstance;
    onMemberActivity?: (teamName: string, memberName: string, messageType?: string) => void;
}
export declare class FileWatcherService {
    private watchers;
    private teamInstances;
    private claudeTeamsPath;
    private dataSync;
    private fastify;
    private onMemberActivity?;
    constructor(options: FileWatcherOptions);
    /**
     * Start watching all team directories
     */
    start(): Promise<void>;
    /**
     * Watch a specific team's inboxes
     */
    private watchTeam;
    /**
     * Stop watching a team
     */
    private unwatchTeam;
    /**
     * Broadcast team_instance_changed event to WebSocket clients
     */
    private broadcastTeamInstanceChanged;
    /**
     * Broadcast team_added event to WebSocket clients
     */
    private broadcastTeamAdded;
    /**
     * Stop all watchers
     */
    stop(): void;
}
export default FileWatcherService;
//# sourceMappingURL=file-watcher.d.ts.map