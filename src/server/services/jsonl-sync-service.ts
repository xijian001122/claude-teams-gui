/**
 * JSONL Sync Service
 *
 * Syncs JSONL session files into the unified messages table.
 * Uses Redis-like strategy: full scan (RDB) on startup + incremental watch (AOF).
 *
 * Skipped types: progress, system, file-history-snapshot, last-prompt
 * Kept types: text, thinking, tool_use, tool_result, queue_operation
 */

import { watch, FSWatcher } from 'chokidar';
import { join, basename } from 'path';
import { existsSync, readFileSync, readdirSync, statSync, openSync, readSync, closeSync } from 'fs';
import { homedir } from 'os';
import type { DatabaseService } from '../db';
import type { FastifyInstance } from 'fastify';
import { createLogger } from './log-factory';

const log = createLogger({ module: 'JsonlSync', shorthand: 's.s.jsonl-sync' });
const wsLog = createLogger({ module: 'WebSocket', shorthand: 's.ws' });

/** Types to skip during parsing */
const SKIP_TYPES = new Set(['progress', 'system', 'file-history-snapshot', 'last-prompt']);

/** Parsed result from a single JSONL line */
interface ParsedEntry {
  teamName: string;
  agentName: string;
  sessionId: string;
  timestamp: string;
  role: 'user' | 'assistant';
  msgType: 'text' | 'thinking' | 'tool_use' | 'tool_result' | 'queue_operation';
  content: string;
  toolName?: string;
  toolInput?: string;
}

/** File tracker record */
interface FileTracker {
  filePath: string;
  teamName: string;
  agentName: string;
  byteOffset: number;
  lastModified: string;
}

export interface JsonlSyncOptions {
  db: DatabaseService;
  fastify: FastifyInstance;
  teamsPath?: string;
}

export class JsonlSyncService {
  private db: DatabaseService;
  private fastify: FastifyInstance;
  private teamsPath: string;
  private watcher: FSWatcher | null = null;
  /** Map of tracked files: filePath → FileTracker */
  private trackedFiles: Map<string, FileTracker> = new Map();
  /** Cache: teamName → { leadMemberName, agentNames[] } */
  private teamMemberCache: Map<string, { leadName: string; agents: Map<string, string> }> = new Map();

  constructor(options: JsonlSyncOptions) {
    this.db = options.db;
    this.fastify = options.fastify;
    this.teamsPath = options.teamsPath || join(homedir(), '.claude', 'teams');
  }

  // ─── Full Scan (RDB) ───

  /**
   * Full scan all JSONL files under ~/.claude/projects/
   * Called on startup. Async — does not block.
   */
  async fullScan(): Promise<{ files: number; messages: number; elapsed: number }> {
    const start = Date.now();
    let totalMessages = 0;
    let totalFiles = 0;

    const projectsDir = join(homedir(), '.claude', 'projects');
    if (!existsSync(projectsDir)) {
      log.info('No projects directory, skipping JSONL scan');
      return { files: 0, messages: 0, elapsed: 0 };
    }

    // Load existing tracker state from DB
    await this.loadTrackerState();

    // Find all JSONL files
    const jsonlFiles = this.findAllJsonlFiles(projectsDir);
    log.info(`Found ${jsonlFiles.length} JSONL files to scan`);

    for (const filePath of jsonlFiles) {
      try {
        const count = await this.processFile(filePath);
        if (count > 0) {
          totalFiles++;
          totalMessages += count;
        }
      } catch (err) {
        log.error(`Error processing ${filePath}: ${err}`);
      }
    }

    const elapsed = Date.now() - start;
    log.info(`Full scan complete: ${totalFiles} files, ${totalMessages} messages, ${elapsed}ms`);
    return { files: totalFiles, messages: totalMessages, elapsed };
  }

  /**
   * Process a single JSONL file: parse lines, extract messages, write to DB
   */
  private async processFile(filePath: string): Promise<number> {
    const stat = statSync(filePath);
    const tracked = this.trackedFiles.get(filePath);
    let startOffset = 0;

    // Check if we need to re-read from beginning (file truncated or new)
    if (tracked) {
      if (stat.size < tracked.byteOffset) {
        // File was truncated, re-read from beginning
        log.info(`File truncated: ${filePath}, re-reading from start`);
        startOffset = 0;
      } else {
        startOffset = tracked.byteOffset;
      }
    }

    // Read from offset
    const fd = openSync(filePath, 'r');
    const bytesToRead = stat.size - startOffset;
    if (bytesToRead <= 0) {
      closeSync(fd);
      return 0;
    }

    const buf = Buffer.alloc(bytesToRead);
    const bytesRead = readSync(fd, buf, 0, bytesToRead, startOffset);
    closeSync(fd);

    const text = buf.toString('utf8', 0, bytesRead);
    const lines = text.split('\n');

    let messagesInserted = 0;
    let fileTeamName = tracked?.teamName || '';
    let fileAgentName = tracked?.agentName || '';
    let fileSessionId = '';
    let foundTeamInfo = false;

    // First pass: find teamName if not yet known
    // agentName can be empty for team-lead sessions (user terminal input)
    if (!tracked) {
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const entry = JSON.parse(line);
          if (entry.teamName) {
            fileTeamName = entry.teamName;
            fileAgentName = entry.agentName || ''; // Empty = team-lead/user session
            fileSessionId = entry.sessionId || '';
            foundTeamInfo = true;
            break;
          }
        } catch { /* skip */ }
      }

      if (!foundTeamInfo) {
        // Not a team file, skip
        return 0;
      }
    } else {
      fileSessionId = ''; // Will be filled from entries
    }

    // Second pass: parse and insert messages
    for (const line of lines) {
      if (!line.trim()) continue;

      try {
        const entry = JSON.parse(line);
        const entryType = entry.type;

        // Update session ID from any entry that has it
        if (entry.sessionId && !fileSessionId) {
          fileSessionId = entry.sessionId;
        }

        // Skip non-team info types
        if (SKIP_TYPES.has(entryType)) continue;

        // Extract team info if still missing
        if (!foundTeamInfo && entry.teamName) {
          fileTeamName = entry.teamName;
          fileAgentName = entry.agentName;
          fileSessionId = entry.sessionId || fileSessionId;
          foundTeamInfo = true;
        }

        // Parse entry into messages
        const parsed = this.parseEntry(entry, fileTeamName, fileAgentName, fileSessionId);
        for (const msg of parsed) {
          await this.insertParsedMessage(msg);
          messagesInserted++;
        }
      } catch { /* skip malformed lines */ }
    }

    // Update tracker
    const newOffset = startOffset + bytesRead;
    await this.updateTracker(filePath, fileTeamName, fileAgentName, newOffset, stat.mtime.toISOString());

    return messagesInserted;
  }

  // ─── Parsing ───

  /**
   * Parse a single JSONL entry into one or more ParsedEntry objects
   */
  private parseEntry(entry: any, teamName: string, agentName: string, sessionId: string): ParsedEntry[] {
    const results: ParsedEntry[] = [];
    const timestamp = entry.timestamp || new Date().toISOString();

    if (entry.type === 'queue-operation') {
      const summary = this.extractQueueSummary(entry.content || '');
      results.push({
        teamName,
        agentName,
        sessionId,
        timestamp: entry.timestamp || timestamp,
        role: 'assistant',
        msgType: 'queue_operation',
        content: summary,
      });
      return results;
    }

    if (entry.type === 'user') {
      const content = entry.message?.content;
      if (!content) return results;

      if (typeof content === 'string') {
        // Filter out internal protocol content
        if (this.isUserContentDisplayable(content)) {
          results.push({
            teamName, agentName, sessionId, timestamp,
            role: 'user', msgType: 'text', content,
          });
        }
      } else if (Array.isArray(content)) {
        for (const block of content) {
          if (block.type === 'text' && block.text) {
            if (this.isUserContentDisplayable(block.text)) {
              results.push({
                teamName, agentName, sessionId, timestamp,
                role: 'user', msgType: 'text', content: block.text,
              });
            }
          }
          // Skip tool_result blocks from user — these are internal API responses
        }
      }
      return results;
    }

    if (entry.type === 'assistant') {
      const content = entry.message?.content;
      if (!content) return results;

      if (typeof content === 'string') {
        // Strip NOTIFY blocks
        const cleaned = content.replace(/<!--\s*NOTIFY[\s\S]*?-->/g, '').trim();
        if (cleaned) {
          results.push({
            teamName, agentName, sessionId, timestamp,
            role: 'assistant', msgType: 'text', content: cleaned,
          });
        }
      } else if (Array.isArray(content)) {
        for (const block of content) {
          if (block.type === 'text' && block.text) {
            const cleaned = block.text.replace(/<!--\s*NOTIFY[\s\S]*?-->/g, '').trim();
            if (cleaned) {
              results.push({
                teamName, agentName, sessionId, timestamp,
                role: 'assistant', msgType: 'text', content: cleaned,
              });
            }
          } else if (block.type === 'thinking' && block.thinking) {
            results.push({
              teamName, agentName, sessionId, timestamp,
              role: 'assistant', msgType: 'thinking', content: block.thinking,
            });
          } else if (block.type === 'tool_use') {
            results.push({
              teamName, agentName, sessionId, timestamp,
              role: 'assistant', msgType: 'tool_use',
              content: block.name || '',
              toolName: block.name,
              toolInput: typeof block.input === 'string' ? block.input : JSON.stringify(block.input),
            });
          }
        }
      }
      return results;
    }

    return results;
  }

  /**
   * Extract summary from queue-operation XML content
   */
  private extractQueueSummary(xmlContent: string): string {
    const statusMatch = xmlContent.match(/<status>([^<]+)<\/status>/);
    const summaryMatch = xmlContent.match(/<summary>([^<]+)<\/summary>/);
    const status = statusMatch?.[1] || 'unknown';
    const summary = summaryMatch?.[1] || xmlContent.slice(0, 200);
    return `${summary} (${status})`;
  }

  /**
   * Check if user content is displayable (not internal protocol tags)
   */
  private isUserContentDisplayable(content: string): boolean {
    const trimmed = content.trim();

    // Filter out internal tags
    if (trimmed.includes('<command-name') || trimmed.includes('<command-message') ||
        trimmed.includes('<local-command-stdout') || trimmed.includes('<local-command-caveat')) {
      return false;
    }

    // Filter out teammate-message tags (inter-agent messages synced via inbox)
    if (trimmed.includes('<teammate-message')) {
      return false;
    }

    // Filter out raw tool_result arrays
    if (trimmed.startsWith('[{') && trimmed.includes('"tool_use_id"')) {
      return false;
    }

    // Filter out raw text block arrays
    if (trimmed.startsWith('[{') && trimmed.includes('"type":"text"') && trimmed.includes('"text"')) {
      return false;
    }

    // Filter out interrupted messages
    if (trimmed === '[Request interrupted by user]' || trimmed.startsWith('[Request interrupted')) {
      return false;
    }

    return true;
  }

  // ─── Incremental Watch (AOF) ───

  /**
   * Start watching tracked JSONL files for changes
   */
  startWatching(): void {
    if (this.trackedFiles.size === 0) {
      log.info('No tracked files to watch');
      return;
    }

    const filePaths = Array.from(this.trackedFiles.keys());
    log.info(`Watching ${filePaths.length} JSONL files for changes`);

    this.watcher = watch(filePaths, {
      persistent: true,
      ignoreInitial: true,
    });

    this.watcher.on('change', async (filePath) => {
      log.debug(`JSONL changed: ${filePath}`);
      try {
        const count = await this.processFile(filePath);
        if (count > 0) {
          log.debug(`${count} new messages from ${filePath}`);
          // Broadcast to WebSocket clients
          const tracked = this.trackedFiles.get(filePath);
          if (tracked) {
            this.broadcastNewMessages(tracked.teamName);
          }
        }
      } catch (err) {
        log.error(`Error processing changed file ${filePath}: ${err}`);
      }
    });

    this.watcher.on('error', (err) => {
      log.error(`JSONL watcher error: ${err}`);
    });
  }

  /**
   * Start watching for new JSONL files in a directory
   */
  startDirectoryWatch(): void {
    const projectsDir = join(homedir(), '.claude', 'projects');
    if (!existsSync(projectsDir)) return;

    const dirWatcher = watch(join(projectsDir, '**/*.jsonl'), {
      persistent: true,
      ignoreInitial: true,
      depth: 3,
    });

    dirWatcher.on('add', async (filePath) => {
      log.info(`New JSONL file detected: ${filePath}`);
      try {
        const count = await this.processFile(filePath);
        if (count > 0) {
          const tracked = this.trackedFiles.get(filePath);
          if (tracked) {
            this.broadcastNewMessages(tracked.teamName);
            // Add to watcher
            if (this.watcher) {
              this.watcher.add(filePath);
            }
          }
        }
      } catch (err) {
        log.error(`Error processing new file ${filePath}: ${err}`);
      }
    });

    // Store so we can clean up
    (this as any)._dirWatcher = dirWatcher;
  }

  // ─── WebSocket Broadcast ───

  private broadcastNewMessages(teamName: string): void {
    const wsServer = this.fastify.websocketServer;
    if (!wsServer?.clients) return;

    const eventData = JSON.stringify({
      type: 'new_session_messages',
      team: teamName,
    });

    let sent = 0;
    wsServer.clients.forEach((client: any) => {
      if (client.readyState === 1) {
        client.send(eventData);
        sent++;
      }
    });
    wsLog.debug(`Broadcasted new_session_messages for ${teamName} to ${sent} clients`);
  }

  // ─── DB Helpers ───

  /**
   * Resolve the actual member name from agentName.
   * - Sub-agents: agentName matches a team member directly (e.g. "backend-dev")
   * - Team-lead: agentName is empty → resolve from team config (first member with team-lead role)
   */
  private async resolveMemberName(teamName: string, agentName: string): Promise<string> {
    // If agentName is provided and non-empty, use it directly
    if (agentName) return agentName;

    // Try cache first
    let cache = this.teamMemberCache.get(teamName);
    if (!cache) {
      // Load team from DB and build cache
      const team = await this.db.getTeam(teamName);
      if (team?.members) {
        const agents = new Map<string, string>();
        let leadName = 'team-lead';
        for (const m of team.members) {
          agents.set(m.name, m.name);
          if (m.role === 'team-lead' || m.role === 'lead' || m.name === 'team-lead' || m.name === 'main') {
            leadName = m.name;
          }
        }
        cache = { leadName, agents };
        this.teamMemberCache.set(teamName, cache);
      }
    }

    return cache?.leadName || 'team-lead';
  }

  private async insertParsedMessage(msg: ParsedEntry): Promise<void> {
    // Generate a unique ID based on the content hash
    const id = `session-${msg.sessionId}-${msg.timestamp}-${msg.msgType}-${Math.random().toString(36).slice(2, 8)}`;
    const localId = id;

    // User messages should appear as from 'user', not from agent
    const isUserMsg = msg.role === 'user';
    const resolvedAgent = isUserMsg ? 'user' : await this.resolveMemberName(msg.teamName, msg.agentName);
    const fromMember = resolvedAgent;
    const fromType = isUserMsg ? 'user' : 'agent';

    await (this.db as any).insertSessionMessage({
      id,
      localId,
      team: msg.teamName,
      fromMember,
      fromType,
      toMember: null,
      content: msg.content,
      contentType: 'text',
      timestamp: msg.timestamp,
      source: 'session',
      msgType: msg.msgType,
      memberName: resolvedAgent,
      toolName: msg.toolName || null,
      toolInput: msg.toolInput || null,
      sessionId: msg.sessionId || null,
    });
  }

  private async loadTrackerState(): Promise<void> {
    return new Promise((resolve) => {
      (this.db as any).db.all(
        'SELECT * FROM jsonl_file_tracker',
        [],
        (err: Error | null, rows: any[]) => {
          if (!err && rows) {
            for (const row of rows) {
              this.trackedFiles.set(row.file_path, {
                filePath: row.file_path,
                teamName: row.team_name,
                agentName: row.agent_name,
                byteOffset: row.byte_offset,
                lastModified: row.last_modified,
              });
            }
            log.info(`Loaded ${rows.length} file tracker records`);
          }
          resolve();
        }
      );
    });
  }

  private async updateTracker(filePath: string, teamName: string, agentName: string, byteOffset: number, lastModified: string): Promise<void> {
    const tracker: FileTracker = { filePath, teamName, agentName, byteOffset, lastModified };
    this.trackedFiles.set(filePath, tracker);

    return new Promise((resolve) => {
      (this.db as any).db.run(
        `INSERT INTO jsonl_file_tracker (file_path, team_name, agent_name, byte_offset, last_modified)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(file_path) DO UPDATE SET
           team_name = excluded.team_name,
           agent_name = excluded.agent_name,
           byte_offset = excluded.byte_offset,
           last_modified = excluded.last_modified`,
        [filePath, teamName, agentName, byteOffset, lastModified],
        (err: Error | null) => {
          if (err) log.error(`Failed to update tracker for ${filePath}: ${err}`);
          resolve();
        }
      );
    });
  }

  // ─── Utility ───

  private findAllJsonlFiles(projectsDir: string): string[] {
    const files: string[] = [];

    try {
      const projectDirs = readdirSync(projectsDir, { withFileTypes: true });
      for (const dir of projectDirs) {
        if (!dir.isDirectory()) continue;
        const dirPath = join(projectsDir, dir.name);
        try {
          const entries = readdirSync(dirPath);
          for (const entry of entries) {
            if (entry.endsWith('.jsonl')) {
              files.push(join(dirPath, entry));
            }
          }
          // Check subagents subdirectory
          const subagentsDir = join(dirPath, 'subagents');
          if (existsSync(subagentsDir)) {
            try {
              const subEntries = readdirSync(subagentsDir);
              for (const entry of subEntries) {
                if (entry.endsWith('.jsonl')) {
                  files.push(join(subagentsDir, entry));
                }
              }
            } catch { /* skip */ }
          }
        } catch { /* skip unreadable dirs */ }
      }
    } catch (err) {
      log.error(`Error scanning projects directory: ${err}`);
    }

    return files;
  }

  /**
   * Stop all watchers
   */
  stop(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
    const dirWatcher = (this as any)._dirWatcher;
    if (dirWatcher) {
      dirWatcher.close();
      delete (this as any)._dirWatcher;
    }
  }
}
