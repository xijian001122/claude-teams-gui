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

import { join } from 'path';
import { existsSync, readFileSync, readdirSync, openSync, readSync, closeSync, statSync } from 'fs';
import { homedir } from 'os';
import { createLogger } from './log-factory';

// Module logger
const log = createLogger({ module: 'SessionReader', shorthand: 's.s.session-reader' });

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
 * Calculate project hash from cwd (same algorithm as Claude Code)
 * e.g., /mnt/e/work/Project/fhd-cloud-plus -> -mnt-e-work-Project-fhd-cloud-plus
 */
function calculateProjectHash(cwd: string): string {
  return '-' + cwd.replace(/[/\\]/g, '-').replace(/^-/, '');
}

/**
 * Session Reader Service
 */
export class SessionReaderService {
  private teamsPath: string;

  constructor(options?: SessionReaderOptions) {
    this.teamsPath = options?.teamsPath || join(homedir(), '.claude', 'teams');
  }

  /**
   * Get the registered session info for a member
   */
  getMemberSession(teamName: string, memberName: string): MemberSession | null {
    const sessionFile = join(this.teamsPath, teamName, 'sessions', `${memberName}.json`);

    if (!existsSync(sessionFile)) {
      return null;
    }

    try {
      const content = readFileSync(sessionFile, 'utf-8');
      return JSON.parse(content) as MemberSession;
    } catch (err) {
      log.error(`Error reading session file ${sessionFile}: ${err}`);
      return null;
    }
  }

  /**
   * Get the conversation history for a member
   * @param teamName - Team name
   * @param memberName - Member name
   * @param limit - Maximum number of messages to return (most recent)
   * @returns Conversation with messages, or null if session not found
   */
  getMemberConversation(teamName: string, memberName: string, limit: number = 50): MemberConversation | null {
    const sessionId = this.resolveSessionId(teamName, memberName);

    if (!sessionId) {
      log.warn(`No session found for ${memberName}@${teamName}`);
      return {
        memberName,
        sessionId: null,
        messages: []
      };
    }

    const cwd = this.resolveCwd(teamName, memberName);
    if (!cwd) {
      log.warn(`No cwd for ${memberName}@${teamName}`);
      return {
        memberName,
        sessionId,
        messages: []
      };
    }

    const projectHash = calculateProjectHash(cwd);
    const convFile = join(homedir(), '.claude', 'projects', projectHash, `${sessionId}.jsonl`);

    if (!existsSync(convFile)) {
      log.warn(`Conversation file not found: ${convFile}`);
      return {
        memberName,
        sessionId,
        messages: []
      };
    }

    try {
      const content = readFileSync(convFile, 'utf-8');
      const messages: ConversationMessage[] = [];

      for (const line of content.split('\n')) {
        if (!line.trim()) continue;

        try {
          const entry = JSON.parse(line);

          if (entry.type === 'user') {
            const content_value = entry.message?.content;
            const contentStr = typeof content_value === 'string' ? content_value : JSON.stringify(content_value);
            const parsed = this.parseUserContent(contentStr, entry.timestamp || '');
            messages.push(...parsed);
          } else if (entry.type === 'assistant') {
            const content_value = entry.message?.content;
            const extracted = this.extractContentBlocks(content_value, entry.timestamp || '');
            messages.push(...extracted);
          }
        } catch {
          // Skip malformed lines
        }
      }

      // Return the most recent N messages
      return {
        memberName,
        sessionId,
        messages: messages.slice(-limit)
      };
    } catch (err) {
      log.error(`Error reading conversation file ${convFile}: ${err}`);
      return {
        memberName,
        sessionId,
        messages: []
      };
    }
  }

  /**
   * Resolve session ID using three-tier strategy:
   * 1. Registration file
   * 2. Team config leadSessionId (for team-lead)
   * 3. Jsonl scan fallback
   */
  private resolveSessionId(teamName: string, memberName: string): string | null {
    // Tier 1: Registration file
    const session = this.getMemberSession(teamName, memberName);
    if (session?.sessionId) {
      return session.sessionId;
    }

    // Tier 2: Team config leadSessionId (team-lead scenario)
    const configSessionId = this.getLeadSessionId(teamName);
    if (configSessionId && memberName === 'team-lead') {
      return configSessionId;
    }

    // Tier 3: Jsonl scan fallback
    const cwd = this.getCwdFromConfig(teamName, memberName);
    if (cwd) {
      const scannedId = this.findSessionByJsonlScan(teamName, memberName, cwd);
      if (scannedId) {
        return scannedId;
      }
    }

    return null;
  }

  /**
   * Resolve cwd for a member
   */
  private resolveCwd(teamName: string, memberName: string): string | null {
    const session = this.getMemberSession(teamName, memberName);
    if (session?.cwd) {
      return session.cwd;
    }
    return this.getCwdFromConfig(teamName, memberName);
  }

  /**
   * Get cwd from team config for a member
   */
  private getCwdFromConfig(teamName: string, memberName: string): string | null {
    const configFile = join(this.teamsPath, teamName, 'config.json');
    if (!existsSync(configFile)) return null;

    try {
      const config = JSON.parse(readFileSync(configFile, 'utf-8'));
      const member = config.members?.find((m: any) => m.name === memberName);
      return member?.cwd || config.members?.[0]?.cwd || null;
    } catch {
      return null;
    }
  }

  /**
   * Get leadSessionId from team config
   */
  private getLeadSessionId(teamName: string): string | null {
    const configFile = join(this.teamsPath, teamName, 'config.json');
    if (!existsSync(configFile)) return null;

    try {
      const config = JSON.parse(readFileSync(configFile, 'utf-8'));
      return config.leadSessionId || null;
    } catch {
      return null;
    }
  }

  /**
   * Find session ID by scanning jsonl files for matching teamName + agentName.
   * Only reads the first 4KB of each file for performance.
   * Returns the most recent matching session ID.
   */
  findSessionByJsonlScan(teamName: string, memberName: string, cwd: string): string | null {
    const projectsDir = join(homedir(), '.claude', 'projects');
    if (!existsSync(projectsDir)) return null;

    const hash = calculateProjectHash(cwd);
    const projectDir = join(projectsDir, hash);
    if (!existsSync(projectDir)) return null;

    let bestMatch: string | null = null;
    let bestTime = 0;

    try {
      const files = readdirSync(projectDir).filter(f => f.endsWith('.jsonl'));

      for (const f of files) {
        try {
          const fd = openSync(join(projectDir, f), 'r');
          const buf = Buffer.alloc(16384); // Read more to cover header entries
          const bytesRead = readSync(fd, buf, 0, 16384, 0);
          closeSync(fd);

          // Check first 20 lines for teamName/agentName match
          // (first line may be file-history-snapshot without identity fields)
          const text = buf.toString('utf8', 0, bytesRead);
          const lines = text.split('\n');
          let matched = false;

          for (let i = 0; i < Math.min(lines.length, 20); i++) {
            const line = lines[i].trim();
            if (!line) continue;
            try {
              const entry = JSON.parse(line);
              if (entry.teamName === teamName && entry.agentName === memberName) {
                matched = true;
                break;
              }
            } catch {
              // Skip malformed lines
            }
          }

          if (matched) {
            const stat = statSync(join(projectDir, f));
            if (stat.mtimeMs > bestTime) {
              bestMatch = f.replace('.jsonl', '');
              bestTime = stat.mtimeMs;
            }
          }
        } catch {
          // Skip unreadable or malformed files
        }
      }
    } catch (err) {
      log.error(`Error scanning jsonl files in ${projectDir}: ${err}`);
    }

    if (bestMatch) {
      log.info(`Jsonl scan found session ${bestMatch} for ${memberName}@${teamName}`);
    }

    return bestMatch;
  }

  /**
   * Parse user message content and handle special types:
   * - tool_result JSON arrays → extract result text
   * - <teammate-message> → extract actual message content
   * - <local-command-stdout>, <local-command-caveat>, <command-name> → filter out
   * - plain text → pass through
   */
  private parseUserContent(content: string, timestamp: string): ConversationMessage[] {
    const trimmed = content.replace(/^\s+/, '');

    // Filter out internal command messages
    if (trimmed.includes('<local-command-stdout') ||
        trimmed.includes('<local-command-caveat') ||
        trimmed.includes('<command-name') ||
        trimmed.includes('<command-message')) {
      return [];
    }

    // Handle <teammate-message> tags - extract actual message content with sender info
    if (trimmed.includes('<teammate-message')) {
      return this.parseTeammateMessages(trimmed, timestamp);
    }

    // Handle tool_result JSON arrays
    if (trimmed.startsWith('[{') && trimmed.includes('"tool_use_id"') && trimmed.includes('"tool_result"')) {
      return this.parseToolResults(trimmed, timestamp);
    }

    // Handle raw text block arrays [{"type":"text","text":"..."}]
    if (trimmed.startsWith('[{') && trimmed.includes('"type":"text"') && trimmed.includes('"text"')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          const textContent = parsed
            .filter((b: any) => b.type === 'text' && b.text)
            .map((b: any) => b.text)
            .join('\n');
          if (textContent) {
            return [{ role: 'user', type: 'text', content: textContent, timestamp }];
          }
        }
      } catch { /* fall through */ }
    }

    // Default: plain text
    return [{ role: 'user', type: 'text', content, timestamp }];
  }

  /**
   * Parse <teammate-message> tags and extract content.
   * Handles both self-closing format and content format.
   */
  private parseTeammateMessages(content: string, timestamp: string): ConversationMessage[] {
    const results: ConversationMessage[] = [];

    // Match all teammate-message blocks
    const regex = /<teammate-message[^>]*teammate_id="([^"]*)"[^>]*>([\s\S]*?)<\/teammate-message>/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
      const senderName = match[1]; // e.g., "team-lead"
      let innerContent = match[2].trim();

      // Try to parse inner content as JSON (task_assignment, etc.)
      try {
        const parsed = JSON.parse(innerContent);
        if (parsed.type === 'task_assignment') {
          const summary = parsed.subject || innerContent;
          results.push({
            role: 'user',
            type: 'text',
            content: `📋 任务分配: ${summary}`,
            timestamp,
            senderName
          });
          continue;
        }
        if (parsed.type && typeof parsed.type === 'string') {
          // Skip other internal JSON types
          continue;
        }
      } catch {
        // Not JSON, treat as text
      }

      // Check if inner content has a summary attribute
      const summaryMatch = content.match(/summary="([^"]*)"/);
      const summaryText = summaryMatch ? summaryMatch[1] : '';

      if (innerContent) {
        // Clean up the content
        const cleaned = innerContent
          .replace(/📋\s*OpenSpec 变更[\s\S]*?(?=\n\n|$)/, '')
          .replace(/🔧\s*开始前[\s\S]*?(?=\n\n|$)/, '')
          .replace(/⚠️\s*注意事项[\s\S]*?(?=\n\n|完成后|$)/, '')
          .replace(/完成后 TaskUpdate[\s\S]*$/, '')
          .trim();

        if (cleaned) {
          results.push({
            role: 'user',
            type: 'text',
            content: summaryText ? `**${summaryText}**\n\n${cleaned}` : cleaned,
            timestamp,
            senderName
          });
        } else if (summaryText) {
          results.push({
            role: 'user',
            type: 'text',
            content: summaryText,
            timestamp,
            senderName
          });
        }
      }
    }

    return results;
  }

  /**
   * Parse tool_result JSON arrays and extract readable content.
   * Input: [{"tool_use_id":"...", "type":"tool_result", "content":[{"type":"text","text":"..."}]}]
   */
  private parseToolResults(content: string, timestamp: string): ConversationMessage[] {
    try {
      const parsed = JSON.parse(content);
      if (!Array.isArray(parsed)) return [];

      const results: ConversationMessage[] = [];

      for (const item of parsed) {
        if (item.type !== 'tool_result' || !item.content) continue;

        // Extract text from content blocks
        const textParts: string[] = [];
        const contentBlocks = Array.isArray(item.content) ? item.content : [item.content];

        for (const block of contentBlocks) {
          if (typeof block === 'string') {
            textParts.push(block);
          } else if (block?.type === 'text' && block.text) {
            // The text might be a JSON string itself
            let text = block.text;
            try {
              const innerParsed = JSON.parse(text);
              if (typeof innerParsed === 'object' && innerParsed !== null) {
                // Format nicely - extract key info
                if (innerParsed.success !== undefined) {
                  const summary = innerParsed.message || (innerParsed.success ? '成功' : '失败');
                  textParts.push(`**${summary}**`);
                  if (innerParsed.routing) {
                    const r = innerParsed.routing;
                    if (r.summary) textParts.push(`> ${r.summary}`);
                    if (r.content) textParts.push(r.content);
                  } else if (innerParsed.error) {
                    textParts.push(`错误: ${innerParsed.error}`);
                  } else {
                    // Generic object display
                    textParts.push('```json\n' + JSON.stringify(innerParsed, null, 2) + '\n```');
                  }
                } else {
                  textParts.push('```json\n' + JSON.stringify(innerParsed, null, 2) + '\n```');
                }
              } else {
                textParts.push(String(innerParsed));
              }
            } catch {
              textParts.push(text);
            }
          }
        }

        if (textParts.length > 0) {
          results.push({
            role: 'user',
            type: 'tool_result',
            content: textParts.join('\n'),
            timestamp
          });
        }
      }

      return results;
    } catch {
      // If parsing fails, return as plain text
      return [{ role: 'user', type: 'text', content, timestamp }];
    }
  }

  /**
   * Extract content blocks from assistant message content array.
   * Converts content blocks into separate ConversationMessage entries:
   * - text blocks → type: 'text'
   * - tool_use blocks → type: 'tool_use' with toolName and toolInput
   * - thinking blocks → type: 'thinking'
   */
  private extractContentBlocks(content: unknown, timestamp: string): ConversationMessage[] {
    if (!content) return [];
    if (typeof content === 'string') {
      return [{ role: 'assistant', type: 'text', content, timestamp }];
    }
    if (!Array.isArray(content)) return [];

    const results: ConversationMessage[] = [];

    for (const block of content as any[]) {
      if (!block || typeof block !== 'object') continue;

      switch (block.type) {
        case 'text':
          if (block.text) {
            // Strip <!-- NOTIFY ... --> blocks from assistant text
            const cleanedText = block.text.replace(/<!--\s*NOTIFY[\s\S]*?-->/g, '').trim();
            if (cleanedText) {
              results.push({
                role: 'assistant',
                type: 'text',
                content: cleanedText,
                timestamp
              });
            }
          }
          break;

        case 'tool_use':
          results.push({
            role: 'assistant',
            type: 'tool_use',
            content: block.name || '',
            timestamp,
            toolName: block.name,
            toolInput: block.input
          });
          break;

        case 'thinking':
          if (block.thinking) {
            results.push({
              role: 'assistant',
              type: 'thinking',
              content: block.thinking,
              timestamp
            });
          }
          break;
      }
    }

    // If no blocks were extracted, try plain text fallback
    if (results.length === 0) {
      const text = typeof content === 'string' ? content : '';
      if (text) {
        results.push({ role: 'assistant', type: 'text', content: text, timestamp });
      }
    }

    return results;
  }

  /**
   * List all registered sessions for a team
   */
  listMemberSessions(teamName: string): MemberSession[] {
    const sessionsDir = join(this.teamsPath, teamName, 'sessions');

    if (!existsSync(sessionsDir)) {
      return [];
    }

    try {
      const files = readdirSync(sessionsDir).filter(f => f.endsWith('.json'));
      const sessions: MemberSession[] = [];

      for (const file of files) {
        try {
          const content = readFileSync(join(sessionsDir, file), 'utf-8');
          sessions.push(JSON.parse(content) as MemberSession);
        } catch {
          // Skip invalid files
        }
      }

      return sessions;
    } catch (err) {
      log.error(`Error listing sessions for team ${teamName}: ${err}`);
      return [];
    }
  }
}

export default SessionReaderService;
