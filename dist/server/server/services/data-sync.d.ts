import type { Message, Team } from '@shared/types';
import { DatabaseService } from '../db';
export interface DataSyncOptions {
    claudeTeamsPath: string;
    dataDir: string;
    db: DatabaseService;
    fastify: any;
}
export declare class DataSyncService {
    private db;
    private fastify;
    private claudeTeamsPath;
    private dataDir;
    constructor(options: DataSyncOptions);
    /**
     * Initialize sync by scanning existing teams
     */
    init(): Promise<void>;
    /**
     * Scan for available teams
     */
    private scanTeams;
    /**
     * Sync a single team
     */
    syncTeam(teamName: string): Promise<Team | null>;
    /**
     * Broadcast members_updated event to WebSocket clients
     */
    private broadcastMembersUpdated;
    /**
     * Extract members from config and discover from inboxes
     */
    private extractMembers;
    /**
     * Sync messages from all inboxes
     */
    private syncTeamMessages;
    /**
     * Sync a single inbox file
     */
    private syncInbox;
    /**
     * Convert Claude message format to our format
     */
    private convertToMessage;
    /**
     * Broadcast new messages to all WebSocket clients
     */
    private broadcastNewMessages;
    /**
     * Send a message from user
     */
    sendMessage(teamName: string, to: string | null, content: string, contentType?: string): Promise<Message>;
    /**
     * Send a cross-team message to another team
     */
    sendCrossTeamMessage(fromTeam: string, toTeam: string, content: string, contentType?: string): Promise<{
        success: boolean;
        message?: Message;
        error?: string;
    }>;
    /**
     * Write message to Claude's inbox file
     */
    private writeToClaudeInbox;
    /**
     * Handle team deletion (archive)
     */
    handleTeamDeleted(teamName: string): Promise<void>;
    /**
     * Archive team data
     */
    private archiveTeamData;
}
export default DataSyncService;
//# sourceMappingURL=data-sync.d.ts.map