import { join } from 'path';
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs';
import type { Message, Team, TeamMember } from '@shared/types';
import { DatabaseService } from '../db';
import { generateAvatarColor, extractAvatarLetter } from '@shared/utils/avatar';

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
      console.log(`[DataSync] Claude teams path not found: ${this.claudeTeamsPath}`);
      return;
    }

    const teams = await this.scanTeams();
    console.log(`[DataSync] Found ${teams.length} teams`);

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

    if (!existsSync(configPath)) {
      return null;
    }

    // Read team config
    const config = JSON.parse(readFileSync(configPath, 'utf8'));

    // Build team object
    const team: Team = {
      name: teamName,
      displayName: config.name || teamName,
      status: 'active',
      createdAt: new Date(config.createdAt || Date.now()).toISOString(),
      lastActivity: new Date().toISOString(),
      messageCount: 0,
      unreadCount: 0,
      members: this.extractMembers(config),
      config: {
        notificationEnabled: true
      },
      allowCrossTeamMessages: config.allowCrossTeamMessages || false
    };

    // Save to database
    await this.db.upsertTeam(team);

    // Sync existing messages
    await this.syncTeamMessages(teamName);

    return team;
  }

  /**
   * Extract members from config
   */
  private extractMembers(config: any): TeamMember[] {
    const members: TeamMember[] = [];

    if (config.members && Array.isArray(config.members)) {
      for (const m of config.members) {
        const role = m.agentType || m.role || 'default';
        // Use member name for avatar generation
        const avatarKey = m.name || role;
        members.push({
          name: m.name,
          displayName: m.name,
          role,
          color: generateAvatarColor(avatarKey),
          avatarLetter: extractAvatarLetter(avatarKey),
          isOnline: m.isActive !== false
        });
      }
    }

    // Add user with consistent color
    members.push({
      name: 'user',
      displayName: 'User',
      role: 'user',
      color: generateAvatarColor('user'),
      avatarLetter: extractAvatarLetter('user'),
      isOnline: true
    });

    return members;
  }

  /**
   * Sync messages from all inboxes
   */
  private async syncTeamMessages(teamName: string): Promise<number> {
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
      const count = await this.syncInbox(teamName, member);
      totalSynced += count;
    }

    return totalSynced;
  }

  /**
   * Sync a single inbox file
   */
  private async syncInbox(teamName: string, member: string): Promise<number> {
    const inboxPath = join(this.claudeTeamsPath, teamName, 'inboxes', `${member}.json`);

    if (!existsSync(inboxPath)) {
      console.log(`[DataSync] Inbox not found: ${inboxPath}`);
      return 0;
    }

    try {
      const messages = JSON.parse(readFileSync(inboxPath, 'utf8'));
      console.log(`[DataSync] Loading ${messages.length} messages from ${member}.json`);

      if (!Array.isArray(messages)) {
        console.log(`[DataSync] Messages is not an array for ${member}`);
        return 0;
      }

      let synced = 0;
      const newMessages: Message[] = [];

      for (let i = 0; i < messages.length; i++) {
        const msg = messages[i];

        // Skip messages that originated from user (already saved via API)
        if (msg.from === 'user') {
          continue;
        }

        try {
          const message = this.convertToMessage(teamName, member, i, msg);
          const inserted = await this.db.insertMessageIfNew(message);
          if (inserted) {
            synced++;
            newMessages.push(message);
          }
        } catch (insertErr) {
          console.error(`[DataSync] Error inserting message ${i} from ${member}:`, insertErr);
        }
      }

      // Broadcast new messages to WebSocket clients
      if (newMessages.length > 0) {
        this.broadcastNewMessages(teamName, newMessages);
      }

      console.log(`[DataSync] Synced ${synced}/${messages.length} messages from ${member}`);
      return synced;
    } catch (err) {
      console.error(`[DataSync] Error syncing inbox ${member}:`, err);
      return 0;
    }
  }

  /**
   * Convert Claude message format to our format
   */
  private convertToMessage(team: string, inbox: string, index: number, msg: any): Message {
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

    // Use stable ID based on team, inbox, index and timestamp to avoid duplicates
    const stableId = msg.timestamp
      ? `${team}-${inbox}-${index}-${new Date(msg.timestamp).getTime()}`
      : `${team}-${inbox}-${index}`;

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
      metadata: msg.summary ? { taskId: msg.summary } : undefined
    };
  }

  /**
   * Broadcast new messages to all WebSocket clients
   */
  private broadcastNewMessages(teamName: string, messages: Message[]): void {
    const wsServer = this.fastify?.websocketServer;
    if (!wsServer || !wsServer.clients) {
      return;
    }

    for (const message of messages) {
      const broadcastData = JSON.stringify({ type: 'new_message', team: teamName, message });
      let sentCount = 0;
      wsServer.clients.forEach((client: any) => {
        if (client.readyState === 1) { // WebSocket.OPEN
          client.send(broadcastData);
          sentCount++;
        }
      });
      console.log(`[WebSocket] Broadcasted synced message to ${sentCount} clients`);
    }
  }

  /**
   * Send a message from user
   */
  async sendMessage(teamName: string, to: string | null, content: string, contentType: string = 'text'): Promise<Message> {
    const message: Message = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      localId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      team: teamName,
      from: 'user',
      fromType: 'user',
      to,
      content,
      contentType: contentType as any,
      timestamp: new Date().toISOString()
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
      console.log(`[WebSocket] Broadcasted message to ${sentCount} clients`);
    } else {
      console.log('[WebSocket] No WebSocket server available for broadcast');
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
      console.log(`[WebSocket] Broadcasted cross-team message to ${sentCount} clients in target team ${toTeam}`);
    }

    return { success: true, message: sourceMessage };
  }

  /**
   * Write message to Claude's inbox file
   */
  private async writeToClaudeInbox(teamName: string, member: string, message: Message): Promise<void> {
    const inboxPath = join(this.claudeTeamsPath, teamName, 'inboxes', `${member}.json`);

    // Only write if the inbox exists
    if (!existsSync(inboxPath)) {
      return;
    }

    try {
      const messages = JSON.parse(readFileSync(inboxPath, 'utf8'));

      if (!Array.isArray(messages)) {
        return;
      }

      messages.push({
        from: 'user',
        text: message.content,
        summary: `Message from user`,
        timestamp: message.timestamp,
        read: false
      });

      writeFileSync(inboxPath, JSON.stringify(messages, null, 2));
    } catch (err) {
      console.error(`[DataSync] Error writing to inbox ${member}:`, err);
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

    // Archive logic here - copy DB records, attachments, etc.
    console.log(`[DataSync] Archived team ${teamName} to ${archiveDir}`);
  }
}

export default DataSyncService;
