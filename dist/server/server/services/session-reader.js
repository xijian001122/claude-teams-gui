/**
 * Session Reader Service
 *
 * Reads member session registration files and conversation history
 * from the Claude Teams filesystem structure.
 */
import { join } from 'path';
import { existsSync, readFileSync, readdirSync } from 'fs';
import { homedir } from 'os';
import { createLogger } from './log-factory';
// Module logger
const log = createLogger({ module: 'SessionReader', shorthand: 's.s.session-reader' });
/**
 * Calculate project hash from cwd (same algorithm as Claude Code)
 * e.g., /mnt/e/work/Project/fhd-cloud-plus -> -mnt-e-work-Project-fhd-cloud-plus
 */
function calculateProjectHash(cwd) {
    return '-' + cwd.replace(/[/\\]/g, '-').replace(/^-/, '');
}
/**
 * Session Reader Service
 */
export class SessionReaderService {
    teamsPath;
    constructor(options) {
        this.teamsPath = options?.teamsPath || join(homedir(), '.claude', 'teams');
    }
    /**
     * Get the registered session info for a member
     */
    getMemberSession(teamName, memberName) {
        const sessionFile = join(this.teamsPath, teamName, 'sessions', `${memberName}.json`);
        if (!existsSync(sessionFile)) {
            return null;
        }
        try {
            const content = readFileSync(sessionFile, 'utf-8');
            return JSON.parse(content);
        }
        catch (err) {
            log.error(`Error reading session file ${sessionFile}: ${err}`);
            return null;
        }
    }
    /**
     * Get the conversation history for a member
     * @param teamName - Team name
     * @param memberName - Member name
     * @param limit - Maximum number of messages to return (most recent)
     * @returns Conversation or null if session not registered
     */
    getMemberConversation(teamName, memberName, limit = 50) {
        const session = this.getMemberSession(teamName, memberName);
        if (!session) {
            return null;
        }
        // Calculate project hash from cwd
        if (!session.cwd) {
            log.warn(`No cwd in session for ${memberName}@${teamName}`);
            return {
                memberName,
                sessionId: session.sessionId,
                messages: []
            };
        }
        const projectHash = calculateProjectHash(session.cwd);
        const convFile = join(homedir(), '.claude', 'projects', projectHash, `${session.sessionId}.jsonl`);
        if (!existsSync(convFile)) {
            log.warn(`Conversation file not found: ${convFile}`);
            return {
                memberName,
                sessionId: session.sessionId,
                messages: []
            };
        }
        try {
            const content = readFileSync(convFile, 'utf-8');
            const messages = [];
            for (const line of content.split('\n')) {
                if (!line.trim())
                    continue;
                try {
                    const entry = JSON.parse(line);
                    // Only extract user and assistant messages
                    if (entry.type === 'user') {
                        const content_value = entry.message?.content;
                        messages.push({
                            role: 'user',
                            content: typeof content_value === 'string' ? content_value : JSON.stringify(content_value),
                            timestamp: entry.timestamp || ''
                        });
                    }
                    else if (entry.type === 'assistant') {
                        const content_value = entry.message?.content;
                        messages.push({
                            role: 'assistant',
                            content: this.extractTextContent(content_value),
                            timestamp: entry.timestamp || ''
                        });
                    }
                }
                catch {
                    // Skip malformed lines
                }
            }
            // Return the most recent N messages
            return {
                memberName,
                sessionId: session.sessionId,
                messages: messages.slice(-limit)
            };
        }
        catch (err) {
            log.error(`Error reading conversation file ${convFile}: ${err}`);
            return {
                memberName,
                sessionId: session.sessionId,
                messages: []
            };
        }
    }
    /**
     * Extract text content from assistant message content array
     */
    extractTextContent(content) {
        if (!content || !Array.isArray(content)) {
            return typeof content === 'string' ? content : '';
        }
        return content
            .filter((block) => block.type === 'text')
            .map((block) => block.text)
            .join('\n');
    }
    /**
     * List all registered sessions for a team
     */
    listMemberSessions(teamName) {
        const sessionsDir = join(this.teamsPath, teamName, 'sessions');
        if (!existsSync(sessionsDir)) {
            return [];
        }
        try {
            const files = readdirSync(sessionsDir).filter(f => f.endsWith('.json'));
            const sessions = [];
            for (const file of files) {
                try {
                    const content = readFileSync(join(sessionsDir, file), 'utf-8');
                    sessions.push(JSON.parse(content));
                }
                catch {
                    // Skip invalid files
                }
            }
            return sessions;
        }
        catch (err) {
            log.error(`Error listing sessions for team ${teamName}: ${err}`);
            return [];
        }
    }
}
export default SessionReaderService;
//# sourceMappingURL=session-reader.js.map