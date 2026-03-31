import { join } from 'path';
import { readFileSync, existsSync, writeFileSync, mkdirSync, readdirSync, rmSync } from 'fs';
import type { Message, Team, TeamMember } from '@shared/types';
import { DatabaseService } from '../db';
import { generateAvatarColor, extractAvatarLetter } from '@shared/utils/avatar';
import { getDirectoryBirthTime, extractProjectFromCwd } from '../utils/file-stats';
import { createLogger } from './log-factory';

// Module loggers
const log = createLogger({ module: 'DataSync', shorthand: 's.s.data-sync' });
const wsLog = createLogger({ module: 'WebSocket', shorthand: 's.ws' });

export interface DataSyncOptions {
  claudeTeamsPath: string;
  dataDir: string;
  db: DatabaseService;
  fastify: any;
}

export class DataSyncService {
  private db: DatabaseService;
  private fastify: any;
  private claudeTeamsPath: string;
  private dataDir: string;

  constructor(options: DataSyncOptions) {
    this.db = options.db;
    this.fastify = options.fastify;
    this.claudeTeamsPath = options.claudeTeamsPath;
    this.dataDir = options.dataDir;
  }

  /**
   * Initialize sync by scanning existing teams
   */
  async init(): Promise<void> {
    if (!existsSync(this.claudeTeamsPath)) {
      log.info(`Claude teams path not found: ${this.claudeTeamsPath}`);
      return;
    }

    const teams = await this.scanTeams();
    log.info(`Found ${teams.length} teams`);

    for (const teamName of teams) {
      await this.syncTeam(teamName);
    }
  }

  /**
   * Scan for available teams
   */
  private async scanTeams(): Promise<string[]> {
    const { readdir } = await import('fs/promises');

    try {
      const entries = await readdir(this.claudeTeamsPath, { withFileTypes: true });
      return entries
        .filter(e => e.isDirectory() && !e.name.startsWith('.'))
        .map(e => e.name);
    } catch {
      return [];
    }
  }

  /**
   * Sync a single team
   */
  async syncTeam(teamName: string): Promise<Team | null> {
    const teamPath = join(this.claudeTeamsPath, teamName);
    const configPath = join(teamPath, 'config.json');
    const backupPath = join(teamPath, 'config.backup.json');

    log.debug(`Syncing team: ${teamName}`);

    if (!existsSync(configPath)) {
      log.warn(`Config not found for team: ${teamName}`);
      return null;
    }

    // Read team config with error handling and auto-repair
    let config: any;
    try {
      let configContent = readFileSync(configPath, 'utf8');
      // Remove BOM if present
      if (configContent.charCodeAt(0) === 0xFEFF) {
        configContent = configContent.slice(1);
      }
      log.debug(`Config content for ${teamName}: ${configContent.substring(0, 100)}...`);
      config = JSON.parse(configContent);

      // Save backup on successful read
      writeFileSync(backupPath, JSON.stringify(config, null, 2));
    } catch (parseErr) {
      log.error(`Failed to parse config.json for team ${teamName}: ${parseErr}`);

      // Try to restore from backup
      if (existsSync(backupPath)) {
        log.info(`Attempting to restore from backup for ${teamName}`);
        try {
          const backupContent = readFileSync(backupPath, 'utf8');
          config = JSON.parse(backupContent);
          log.info(`Successfully restored config from backup for ${teamName}`);

          // Restore the main config file
          writeFileSync(configPath, JSON.stringify(config, null, 2));
          log.info(`Restored config.json for ${teamName}`);
        } catch (backupErr) {
          log.error(`Failed to restore from backup for ${teamName}: ${backupErr}`);
          return null;
        }
      } else {
        return null;
      }
    }

    // Extract team instance ID from directory birth time
    const teamInstance = getDirectoryBirthTime(teamPath);

    // Extract source project from first member's cwd
    const sourceProject = config.members && config.members.length > 0
      ? extractProjectFromCwd(config.members[0].cwd)
      : undefined;

    // Build team object
    const team: Team = {
      name: teamName,
      displayName: config.name || teamName,
      status: 'active',
      createdAt: new Date(config.createdAt || Date.now()).toISOString(),
      lastActivity: new Date().toISOString(),
      messageCount: 0,
      unreadCount: 0,
      members: await this.extractMembers(teamName, config),
      config: {
        notificationEnabled: true
      },
      allowCrossTeamMessages: config.allowCrossTeamMessages || false,
      teamInstance
    };

    // Save to database
    const existingTeam = await this.db.getTeam(teamName);
    const existingMemberCount = existingTeam?.members?.length || 0;

    await this.db.upsertTeam(team);

    // Broadcast members_updated if we discovered new members
    const newMemberCount = team.members.length;
    log.debug(`Member count: existing=${existingMemberCount}, new=${newMemberCount}`);

    if (newMemberCount > existingMemberCount) {
      log.info(`New members discovered, broadcasting members_updated for ${teamName}`);
      this.broadcastMembersUpdated(teamName, team.members);
    }

    // Sync existing messages (pass instance and project info)
    await this.syncTeamMessages(teamName, teamInstance, sourceProject);

    return team;
  }

  /**
   * Broadcast members_updated event to WebSocket clients
   */
  private broadcastMembersUpdated(teamName: string, members: TeamMember[]): void {
    const wsServer = this.fastify?.websocketServer;
    if (!wsServer || !wsServer.clients) {
      return;
    }

    const eventData = JSON.stringify({
      type: 'members_updated',
      team: teamName,
      members
    });

    let sentCount = 0;
    wsServer.clients.forEach((client: any) => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(eventData);
        sentCount++;
      }
    });

    wsLog.debug(`Broadcasted members_updated (${teamName}) to ${sentCount} clients`);
  }

  /**
   * Extract members from config and discover from inboxes
   */
  private async extractMembers(teamName: string, config: any): Promise<TeamMember[]> {
    const memberMap = new Map<string, TeamMember>();

    // 1. Add members from config
    if (config.members && Array.isArray(config.members)) {
      for (const m of config.members) {
        const role = m.agentType || m.role || 'default';
        const avatarKey = m.name || role;
        memberMap.set(m.name, {
          name: m.name,
          displayName: m.name,
          role,
          color: generateAvatarColor(avatarKey),
          avatarLetter: extractAvatarLetter(avatarKey),
          isOnline: m.isActive !== false
        });
      }
    }

    // 2. Discover members from inboxes directory
    const inboxesPath = join(this.claudeTeamsPath, teamName, 'inboxes');
    if (existsSync(inboxesPath)) {
      const { readdir } = await import('fs/promises');
      const files = await readdir(inboxesPath);
      const inboxFiles = files.filter(f => f.endsWith('.json'));

      for (const file of inboxFiles) {
        const memberName = file.replace('.json', '');
        if (!memberMap.has(memberName)) {
          // Discovered member not in config
          memberMap.set(memberName, {
            name: memberName,
            displayName: memberName,
            role: 'discovered',
            color: generateAvatarColor(memberName),
            avatarLetter: extractAvatarLetter(memberName),
            isOnline: true
          });
          log.info(`Discovered new member from inbox: ${memberName}`);
        }
      }
    }

    // 3. Add user with consistent color
    memberMap.set('user', {
      name: 'user',
      displayName: 'User',
      role: 'user',
      color: generateAvatarColor('user'),
      avatarLetter: extractAvatarLetter('user'),
      isOnline: true
    });

    return Array.from(memberMap.values());
  }

  /**
   * Sync messages from all inboxes
   */
  private async syncTeamMessages(teamName: string, teamInstance?: string, sourceProject?: string): Promise<number> {
    const inboxesPath = join(this.claudeTeamsPath, teamName, 'inboxes');

    if (!existsSync(inboxesPath)) {
      return 0;
    }

    const { readdir } = await import('fs/promises');
    const files = await readdir(inboxesPath);
    const inboxFiles = files.filter(f => f.endsWith('.json'));

    let totalSynced = 0;

    for (const file of inboxFiles) {
      const member = file.replace('.json', '');
      const count = await this.syncInbox(teamName, member, teamInstance, sourceProject);
      totalSynced += count;
    }

    return totalSynced;
  }

  /**
   * Sync a single inbox file
   */
  private async syncInbox(teamName: string, member: string, teamInstance?: string, sourceProject?: string): Promise<number> {
    const inboxPath = join(this.claudeTeamsPath, teamName, 'inboxes', `${member}.json`);

    if (!existsSync(inboxPath)) {
      log.debug(`Inbox not found: ${inboxPath}`);
      return 0;
    }

    try {
      const messages = JSON.parse(readFileSync(inboxPath, 'utf8'));
      log.debug(`Loading ${messages.length} messages from ${member}.json`);

      if (!Array.isArray(messages)) {
        log.warn(`Messages is not an array for ${member}`);
        return 0;
      }

      let synced = 0;
      const newMessages: Message[] = [];

      for (let i = 0; i < messages.length; i++) {
        const msg = messages[i];

        // Note: We don't skip user messages here because they might be written
        // directly to inbox files by external systems (like Claude Code CLI).
        // The insertMessageIfNew function will handle duplicates by ID.

        try {
          const message = this.convertToMessage(teamName, member, i, msg, teamInstance, sourceProject);
          log.trace(`Processing message ${i} from ${member}: id=${message.id}, from=${message.from}`);
          const inserted = await this.db.insertMessageIfNew(message);
          if (inserted) {
            synced++;
            newMessages.push(message);
          }
        } catch (insertErr) {
          log.error(`Error inserting message ${i} from ${member}: ${insertErr}`);
        }
      }

      // Broadcast new messages to WebSocket clients
      if (newMessages.length > 0) {
        log.debug(`Broadcasting ${newMessages.length} new messages`);
        this.broadcastNewMessages(teamName, newMessages);
      }

      log.debug(`Synced ${synced}/${messages.length} messages from ${member}`);
      return synced;
    } catch (err) {
      log.error(`Error syncing inbox ${member}: ${err}`);
      return 0;
    }
  }

  /**
   * Convert Claude message format to our format
   */
  private convertToMessage(team: string, inbox: string, index: number, msg: any, teamInstance?: string, sourceProject?: string): Message {
    const isStructured = typeof msg.text === 'string' &&
      (msg.text.startsWith('{') || msg.text.startsWith('['));

    let content = msg.text || msg.message || '';
    let contentType: Message['contentType'] = 'text';

    // Try to parse structured messages
    if (isStructured) {
      try {
        const parsed = JSON.parse(msg.text);
        if (parsed.type === 'task_assignment') {
          contentType = 'task';
          content = parsed.subject || parsed.description || content;
        }
      } catch {
        // Not valid JSON, treat as text
      }
    }

    // Determine the actual sender - use msg.from if available, otherwise fall back to inbox name
    const actualFrom = msg.from || inbox;

    // Determine recipient: inbox file name is the recipient
    // If sender is NOT the inbox owner, this message is TO the inbox owner
    const actualTo = (actualFrom !== inbox) ? inbox : null;

    // Use original ID if available (from sendMessage), otherwise generate stable ID
    const stableId = msg._originalId
      || (msg.timestamp
        ? `${team}-${inbox}-${index}-${new Date(msg.timestamp).getTime()}`
        : `${team}-${inbox}-${index}`);

    return {
      id: stableId,
      localId: `${team}-${inbox}-${index}`,
      team,
      from: actualFrom,
      fromType: actualFrom === 'user' ? 'user' : 'agent',
      to: actualTo,
      content,
      contentType,
      timestamp: msg.timestamp || new Date().toISOString(),
      claudeRef: {
        team,
        inboxFile: `${inbox}.json`,
        messageIndex: index,
        timestamp: msg.timestamp || new Date().toISOString()
      },
      metadata: msg.summary ? { taskId: msg.summary } : undefined,
      teamInstance,
      sourceProject
    };
  }

  /**
   * Broadcast new messages to all WebSocket clients
   */
  private broadcastNewMessages(teamName: string, messages: Message[]): void {
    const wsServer = this.fastify?.websocketServer;
    if (!wsServer || !wsServer.clients) {
      wsLog.warn('WebSocket server not available for broadcast');
      return;
    }

    log.debug(`Broadcasting ${messages.length} messages to ${wsServer.clients.size} clients`);

    for (const message of messages) {
      const broadcastData = JSON.stringify({ type: 'new_message', team: teamName, message });
      let sentCount = 0;
      wsServer.clients.forEach((client: any) => {
        if (client.readyState === 1) { // WebSocket.OPEN
          client.send(broadcastData);
          sentCount++;
        }
      });
      wsLog.trace(`Broadcasted synced message to ${sentCount} clients`);
    }
  }

  /**
   * Send a message from user
   */
  async sendMessage(teamName: string, to: string | null, content: string, contentType: string = 'text'): Promise<Message> {
    // Get team's current teamInstance
    const team = await this.db.getTeam(teamName);
    const teamInstance = team?.teamInstance;

    const message: Message = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      localId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      team: teamName,
      from: 'user',
      fromType: 'user',
      to,
      content,
      contentType: contentType as any,
      timestamp: new Date().toISOString(),
      teamInstance
    };

    // Save to database
    this.db.insertMessage({ ...message, team: teamName } as Message);

    // Update team activity
    this.db.updateTeamActivity(teamName, message.timestamp);

    // Sync to Claude if team exists
    await this.writeToClaudeInbox(teamName, to || 'team-lead', message);

    // Broadcast to all connected WebSocket clients
    const wsServer = this.fastify?.websocketServer;
    if (wsServer && wsServer.clients) {
      const broadcastData = JSON.stringify({ type: 'new_message', team: teamName, message });
      let sentCount = 0;
      wsServer.clients.forEach((client: any) => {
        if (client.readyState === 1) { // WebSocket.OPEN
          client.send(broadcastData);
          sentCount++;
        }
      });
      wsLog.debug(`Broadcasted message to ${sentCount} clients`);
    } else {
      wsLog.warn('No WebSocket server available for broadcast');
    }

    return message;
  }

  /**
   * Send a cross-team message to another team
   */
  async sendCrossTeamMessage(fromTeam: string, toTeam: string, content: string, contentType: string = 'text'): Promise<{ success: boolean; message?: Message; error?: string }> {
    // Validate target team exists and accepts cross-team messages
    const targetTeam = await this.db.getTeam(toTeam);
    if (!targetTeam) {
      return { success: false, error: 'Target team not found' };
    }

    if (!targetTeam.allowCrossTeamMessages) {
      return { success: false, error: 'Cross-team messaging is disabled for target team' };
    }

    // Prevent circular messages - check if this would be a relay back
    // For now, we just track original team. More complex circular detection could be added.

    const timestamp = new Date().toISOString();

    // Create message for source team (outbox view)
    const sourceMessage: Message = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      localId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      team: fromTeam,
      from: 'user',
      fromType: 'user',
      to: `team:${toTeam}`,
      content,
      contentType: contentType as any,
      timestamp,
      originalTeam: fromTeam
    };

    // Create message for target team (inbox view)
    const targetMessage: Message = {
      ...sourceMessage,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Different ID for target
      localId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      to: null, // In target team, it's a regular message
      originalTeam: fromTeam
    };

    // Save to source team database
    this.db.insertMessage({ ...sourceMessage, team: fromTeam } as Message);
    this.db.updateTeamActivity(fromTeam, timestamp);

    // Save to target team database
    this.db.insertMessage({ ...targetMessage, team: toTeam } as Message);
    this.db.updateTeamActivity(toTeam, timestamp);

    // Broadcast to source team (confirmation)
    const wsServer = this.fastify?.websocketServer;
    if (wsServer && wsServer.clients) {
      // Send confirmation to source team
      const confirmData = JSON.stringify({
        type: 'cross_team_message_sent',
        team: fromTeam,
        message: sourceMessage,
        targetTeam: toTeam
      });

      wsServer.clients.forEach((client: any) => {
        if (client.readyState === 1) {
          client.send(confirmData);
        }
      });

      // Broadcast to target team
      const broadcastData = JSON.stringify({
        type: 'cross_team_message',
        team: toTeam,
        message: targetMessage,
        originalTeam: fromTeam
      });

      let sentCount = 0;
      wsServer.clients.forEach((client: any) => {
        if (client.readyState === 1) {
          client.send(broadcastData);
          sentCount++;
        }
      });
      wsLog.debug(`Broadcasted cross-team message to ${sentCount} clients in target team ${toTeam}`);
    }

    return { success: true, message: sourceMessage };
  }

  /**
   * Write message to Claude's inbox file
   */
  private async writeToClaudeInbox(teamName: string, member: string, message: Message): Promise<void> {
    const inboxesDir = join(this.claudeTeamsPath, teamName, 'inboxes');
    const inboxPath = join(inboxesDir, `${member}.json`);

    // Ensure inboxes directory exists
    if (!existsSync(inboxesDir)) {
      mkdirSync(inboxesDir, { recursive: true });
    }

    // Create inbox file if it doesn't exist
    let messages: any[] = [];
    if (existsSync(inboxPath)) {
      try {
        const content = readFileSync(inboxPath, 'utf8');
        messages = JSON.parse(content);
        if (!Array.isArray(messages)) {
          messages = [];
        }
      } catch (err) {
        log.warn(`Error reading inbox ${member}, creating new: ${err}`);
        messages = [];
      }
    }

    try {
      messages.push({
        from: 'user',
        text: message.content,
        summary: `Message from user`,
        timestamp: message.timestamp,
        read: false,
        _originalId: message.id
      });

      writeFileSync(inboxPath, JSON.stringify(messages, null, 2));
      log.debug(`Wrote message to inbox: ${member}`);
    } catch (err) {
      log.error(`Error writing to inbox ${member}: ${err}`);
    }
  }

  /**
   * Handle team deletion (archive)
   */
  async handleTeamDeleted(teamName: string): Promise<void> {
    const archivedAt = new Date().toISOString();

    // Update database
    this.db.updateTeamStatus(teamName, 'archived', archivedAt);

    // Move to archive directory
    await this.archiveTeamData(teamName);

    // Notify clients via WebSocket
    const wsServer = this.fastify?.websocketServer;
    if (wsServer && wsServer.clients) {
      const broadcastData = JSON.stringify({ type: 'team_archived', team: teamName });
      wsServer.clients.forEach((client: any) => {
        if (client.readyState === 1) {
          client.send(broadcastData);
        }
      });
    }
  }

  /**
   * Archive team data
   */
  private async archiveTeamData(teamName: string): Promise<void> {
    const archiveDir = join(this.dataDir, 'archive', `${teamName}-${Date.now()}`);

    if (!existsSync(archiveDir)) {
      mkdirSync(archiveDir, { recursive: true });
    }

    try {
      // Get team info from database
      const team = await this.db.getTeam(teamName);
      if (team) {
        // Get all messages for this team
        const messages = await this.db.getMessages(teamName, { limit: 100000 });

        // Write team.json
        const teamData = {
          name: team.name,
          displayName: team.displayName,
          members: team.members,
          config: team.config,
          createdAt: team.createdAt,
          archivedAt: team.archivedAt,
          messageCount: messages.length
        };
        writeFileSync(join(archiveDir, 'team.json'), JSON.stringify(teamData, null, 2));

        // Write messages.json
        writeFileSync(join(archiveDir, 'messages.json'), JSON.stringify(messages, null, 2));

        log.info(`Archived team ${teamName} to ${archiveDir} (${messages.length} messages)`);
      } else {
        log.warn(`Team ${teamName} not found in database, creating empty archive`);
      }
    } catch (err) {
      log.error(`Error archiving team ${teamName}: ${err}`);
    }

    // Clean up empty archive directories
    this.cleanupEmptyArchiveDirs();
  }

  /**
   * Clean up empty archive directories
   */
  private cleanupEmptyArchiveDirs(): void {
    const archiveBase = join(this.dataDir, 'archive');
    if (!existsSync(archiveBase)) {
      return;
    }

    try {
      const entries = readdirSync(archiveBase, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const dirPath = join(archiveBase, entry.name);
          const contents = readdirSync(dirPath);
          if (contents.length === 0) {
            rmSync(dirPath, { recursive: true });
            log.info(`Removed empty archive directory: ${entry.name}`);
          }
        }
      }
    } catch (err) {
      log.error(`Error cleaning up empty archive directories: ${err}`);
    }
  }
}

export default DataSyncService;
