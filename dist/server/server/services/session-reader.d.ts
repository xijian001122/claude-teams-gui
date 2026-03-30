/**
 * Session Reader Service
 *
 * Reads member session registration files and conversation history
 * from the Claude Teams filesystem structure.
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
    content: string;
    timestamp: string;
}
export interface MemberConversation {
    memberName: string;
    sessionId: string;
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
     * @returns Conversation or null if session not registered
     */
    getMemberConversation(teamName: string, memberName: string, limit?: number): MemberConversation | null;
    /**
     * Extract text content from assistant message content array
     */
    private extractTextContent;
    /**
     * List all registered sessions for a team
     */
    listMemberSessions(teamName: string): MemberSession[];
}
export default SessionReaderService;
//# sourceMappingURL=session-reader.d.ts.map