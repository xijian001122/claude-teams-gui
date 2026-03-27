/**
 * Session Summary Service
 *
 * Generates Markdown session summaries for teams
 */
/**
 * Session summary options
 */
export interface SessionSummaryOptions {
    /** Override teams path for testing */
    teamsPath?: string;
}
/**
 * Session Summary Service
 */
export declare class SessionSummaryService {
    private teamsPath;
    private taskStorage;
    constructor(options?: SessionSummaryOptions);
    /**
     * Generate a session summary for a team
     */
    generateSessionSummary(teamName: string): Promise<string>;
    /**
     * Calculate task statistics
     */
    private calculateStats;
    /**
     * Generate Markdown content
     */
    private generateMarkdown;
    /**
     * Escape special Markdown characters
     */
    private escapeMarkdown;
    /**
     * Ensure directory exists
     */
    private ensureDir;
}
export default SessionSummaryService;
//# sourceMappingURL=session-summary.d.ts.map