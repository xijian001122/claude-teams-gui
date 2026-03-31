/**
 * Session Reader Service
 *
 * Reads member session registration files and conversation history
 * from the Claude Teams filesystem structure.
 *
 * Session discovery strategy (in order):
 * 1. Read sessions/<member>.json registration file (fastest)
 * 2. Check config.json leadSessionId (team-lead scenario)
 * 3. Scan jsonl files by teamName + agentName (fallback)
 */
export interface MemberSession {
    memberName: string;
    teamName: string;
    sessionId: string;
    cwd?: string;
    agentId?: string;
    agentType?: string;
    startedAt?: number;
    registeredAt: string;
}
export interface ConversationMessage {
    role: 'user' | 'assistant';
    type: 'text' | 'tool_use' | 'tool_result' | 'thinking';
    content: string;
    timestamp: string;
    toolName?: string;
    toolInput?: object;
    /** Who actually sent this message (e.g., "team-lead", "user") */
    senderName?: string;
}
export interface MemberConversation {
    memberName: string;
    sessionId: string | null;
    messages: ConversationMessage[];
}
export interface SessionReaderOptions {
    /** Override teams path for testing */
    teamsPath?: string;
}
/**
 * Session Reader Service
 */
export declare class SessionReaderService {
    private teamsPath;
    constructor(options?: SessionReaderOptions);
    /**
     * Get the registered session info for a member
     */
    getMemberSession(teamName: string, memberName: string): MemberSession | null;
    /**
     * Get the conversation history for a member
     * @param teamName - Team name
     * @param memberName - Member name
     * @param limit - Maximum number of messages to return (most recent)
     * @returns Conversation with messages, or null if session not found
     */
    getMemberConversation(teamName: string, memberName: string, limit?: number): MemberConversation | null;
    /**
     * Resolve session ID using three-tier strategy:
     * 1. Registration file
     * 2. Team config leadSessionId (for team-lead)
     * 3. Jsonl scan fallback
     */
    private resolveSessionId;
    /**
     * Resolve cwd for a member
     */
    private resolveCwd;
    /**
     * Get cwd from team config for a member
     */
    private getCwdFromConfig;
    /**
     * Get leadSessionId from team config
     */
    private getLeadSessionId;
    /**
     * Find session ID by scanning jsonl files for matching teamName + agentName.
     * Only reads the first 4KB of each file for performance.
     * Returns the most recent matching session ID.
     */
    findSessionByJsonlScan(teamName: string, memberName: string, cwd: string): string | null;
    /**
     * Parse user message content and handle special types:
     * - tool_result JSON arrays → extract result text
     * - <teammate-message> → extract actual message content
     * - <local-command-stdout>, <local-command-caveat>, <command-name> → filter out
     * - plain text → pass through
     */
    private parseUserContent;
    /**
     * Parse <teammate-message> tags and extract content.
     * Handles both self-closing format and content format.
     */
    private parseTeammateMessages;
    /**
     * Parse tool_result JSON arrays and extract readable content.
     * Input: [{"tool_use_id":"...", "type":"tool_result", "content":[{"type":"text","text":"..."}]}]
     */
    private parseToolResults;
    /**
     * Extract content blocks from assistant message content array.
     * Converts content blocks into separate ConversationMessage entries:
     * - text blocks → type: 'text'
     * - tool_use blocks → type: 'tool_use' with toolName and toolInput
     * - thinking blocks → type: 'thinking'
     */
    private extractContentBlocks;
    /**
     * List all registered sessions for a team
     */
    listMemberSessions(teamName: string): MemberSession[];
}
export default SessionReaderService;
//# sourceMappingURL=session-reader.d.ts.map