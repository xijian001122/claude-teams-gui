import type { Message, Team } from '@shared/types';
export declare class DatabaseService {
    private db;
    constructor(dataDir: string);
    private initSchemaSync;
    insertMessage(message: Message & {
        team?: string;
    }): Promise<void>;
    insertMessageIfNew(message: Message & {
        team?: string;
    }): Promise<boolean>;
    getMessages(team: string, options?: {
        before?: string;
        limit?: number;
        to?: string;
        instance?: string;
    }): Promise<Message[]>;
    getMessageCount(team: string): Promise<number>;
    updateMessage(id: string, updates: Partial<Message>): Promise<void>;
    updatePermissionRequestStatus(team: string, requestId: string, status: 'approved' | 'rejected'): Promise<void>;
    fixNullTeamInstance(teamName: string): Promise<number>;
    upsertTeam(team: Team): Promise<void>;
    getTeams(status?: 'active' | 'archived', acceptsCrossTeamMessages?: boolean): Promise<Team[]>;
    getTeam(name: string): Promise<Team | null>;
    updateTeamStatus(name: string, status: 'active' | 'archived', archivedAt?: string): Promise<void>;
    updateTeamActivity(name: string, lastActivity: string): Promise<void>;
    updateTeamCrossTeamPermission(name: string, allow: boolean): Promise<void>;
    deleteTeam(name: string): Promise<void>;
    deleteOldMessages(cutoffDate: string): Promise<number>;
    getArchivedTeams(): Promise<Array<{
        name: string;
        archived_at: string;
    }>>;
    private rowToMessage;
    private rowToTeam;
    close(): void;
}
export default DatabaseService;
//# sourceMappingURL=index.d.ts.map