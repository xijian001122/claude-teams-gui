import { join } from 'path';
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs';
import { generateAvatarColor, extractAvatarLetter } from '@shared/utils/avatar';
import { getDirectoryBirthTime, extractProjectFromCwd } from '../utils/file-stats';
export class DataSyncService {
    db;
    fastify;
    claudeTeamsPath;
    dataDir;
    constructor(options) {
        this.db = options.db;
        this.fastify = options.fastify;
        this.claudeTeamsPath = options.claudeTeamsPath;
        this.dataDir = options.dataDir;
    }
    /**
     * Initialize sync by scanning existing teams
     */
    async init() {
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
    async scanTeams() {
        const { readdir } = await import('fs/promises');
        try {
            const entries = await readdir(this.claudeTeamsPath, { withFileTypes: true });
            return entries
                .filter(e => e.isDirectory() && !e.name.startsWith('.'))
                .map(e => e.name);
        }
        catch {
            return [];
        }
    }
    /**
     * Sync a single team
     */
    async syncTeam(teamName) {
        const teamPath = join(this.claudeTeamsPath, teamName);
        const configPath = join(teamPath, 'config.json');
        const backupPath = join(teamPath, 'config.backup.json');
        console.log(`[DataSync] Syncing team: ${teamName}, config path: ${configPath}`);
        if (!existsSync(configPath)) {
            console.log(`[DataSync] Config not found for team: ${teamName}`);
            return null;
        }
        // Read team config with error handling and auto-repair
        let config;
        try {
            let configContent = readFileSync(configPath, 'utf8');
            // Remove BOM if present
            if (configContent.charCodeAt(0) === 0xFEFF) {
                configContent = configContent.slice(1);
            }
            console.log(`[DataSync] Config content for ${teamName}: ${configContent.substring(0, 200)}...`);
            config = JSON.parse(configContent);
            // Save backup on successful read
            writeFileSync(backupPath, JSON.stringify(config, null, 2));
        }
        catch (parseErr) {
            console.error(`[DataSync] Failed to parse config.json for team ${teamName}:`, parseErr);
            // Try to restore from backup
            if (existsSync(backupPath)) {
                console.log(`[DataSync] Attempting to restore from backup for ${teamName}`);
                try {
                    const backupContent = readFileSync(backupPath, 'utf8');
                    config = JSON.parse(backupContent);
                    console.log(`[DataSync] Successfully restored config from backup for ${teamName}`);
                    // Restore the main config file
                    writeFileSync(configPath, JSON.stringify(config, null, 2));
                    console.log(`[DataSync] Restored config.json for ${teamName}`);
                }
                catch (backupErr) {
                    console.error(`[DataSync] Failed to restore from backup for ${teamName}:`, backupErr);
                    return null;
                }
            }
            else {
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
        const team = {
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
        await this.db.upsertTeam(team);
        // Broadcast members_updated if we discovered new members
        const configMemberCount = config.members?.length || 0;
        if (team.members.length > configMemberCount + 1) { // +1 for user
            this.broadcastMembersUpdated(teamName, team.members);
        }
        // Sync existing messages (pass instance and project info)
        await this.syncTeamMessages(teamName, teamInstance, sourceProject);
        return team;
    }
    /**
     * Broadcast members_updated event to WebSocket clients
     */
    broadcastMembersUpdated(teamName, members) {
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
        wsServer.clients.forEach((client) => {
            if (client.readyState === 1) { // WebSocket.OPEN
                client.send(eventData);
                sentCount++;
            }
        });
        console.log(`[WebSocket] Broadcasted members_updated (${teamName}) to ${sentCount} clients`);
    }
    /**
     * Extract members from config and discover from inboxes
     */
    async extractMembers(teamName, config) {
        const memberMap = new Map();
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
                    console.log(`[DataSync] Discovered new member from inbox: ${memberName}`);
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
    async syncTeamMessages(teamName, teamInstance, sourceProject) {
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
    async syncInbox(teamName, member, teamInstance, sourceProject) {
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
            const newMessages = [];
            for (let i = 0; i < messages.length; i++) {
                const msg = messages[i];
                // Note: We don't skip user messages here because they might be written
                // directly to inbox files by external systems (like Claude Code CLI).
                // The insertMessageIfNew function will handle duplicates by ID.
                try {
                    const message = this.convertToMessage(teamName, member, i, msg, teamInstance, sourceProject);
                    console.log(`[DataSync] Processing message ${i} from ${member}: id=${message.id}, from=${message.from}`);
                    const inserted = await this.db.insertMessageIfNew(message);
                    console.log(`[DataSync] Insert result for message ${i}: inserted=${inserted}`);
                    if (inserted) {
                        synced++;
                        newMessages.push(message);
                    }
                }
                catch (insertErr) {
                    console.error(`[DataSync] Error inserting message ${i} from ${member}:`, insertErr);
                }
            }
            // Broadcast new messages to WebSocket clients
            console.log(`[DataSync] newMessages count: ${newMessages.length}`);
            if (newMessages.length > 0) {
                this.broadcastNewMessages(teamName, newMessages);
            }
            console.log(`[DataSync] Synced ${synced}/${messages.length} messages from ${member}`);
            return synced;
        }
        catch (err) {
            console.error(`[DataSync] Error syncing inbox ${member}:`, err);
            return 0;
        }
    }
    /**
     * Convert Claude message format to our format
     */
    convertToMessage(team, inbox, index, msg, teamInstance, sourceProject) {
        const isStructured = typeof msg.text === 'string' &&
            (msg.text.startsWith('{') || msg.text.startsWith('['));
        let content = msg.text || msg.message || '';
        let contentType = 'text';
        // Try to parse structured messages
        if (isStructured) {
            try {
                const parsed = JSON.parse(msg.text);
                if (parsed.type === 'task_assignment') {
                    contentType = 'task';
                    content = parsed.subject || parsed.description || content;
                }
            }
            catch {
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
            metadata: msg.summary ? { taskId: msg.summary } : undefined,
            teamInstance,
            sourceProject
        };
    }
    /**
     * Broadcast new messages to all WebSocket clients
     */
    broadcastNewMessages(teamName, messages) {
        const wsServer = this.fastify?.websocketServer;
        if (!wsServer || !wsServer.clients) {
            console.log('[DataSync] WebSocket server not available for broadcast');
            return;
        }
        console.log(`[DataSync] Broadcasting ${messages.length} messages, clients: ${wsServer.clients.size}`);
        for (const message of messages) {
            const broadcastData = JSON.stringify({ type: 'new_message', team: teamName, message });
            let sentCount = 0;
            wsServer.clients.forEach((client) => {
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
    async sendMessage(teamName, to, content, contentType = 'text') {
        // Get team's current teamInstance
        const team = await this.db.getTeam(teamName);
        const teamInstance = team?.teamInstance;
        const message = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            localId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            team: teamName,
            from: 'user',
            fromType: 'user',
            to,
            content,
            contentType: contentType,
            timestamp: new Date().toISOString(),
            teamInstance
        };
        // Save to database
        this.db.insertMessage({ ...message, team: teamName });
        // Update team activity
        this.db.updateTeamActivity(teamName, message.timestamp);
        // Sync to Claude if team exists
        await this.writeToClaudeInbox(teamName, to || 'team-lead', message);
        // Broadcast to all connected WebSocket clients
        const wsServer = this.fastify?.websocketServer;
        if (wsServer && wsServer.clients) {
            const broadcastData = JSON.stringify({ type: 'new_message', team: teamName, message });
            let sentCount = 0;
            wsServer.clients.forEach((client) => {
                if (client.readyState === 1) { // WebSocket.OPEN
                    client.send(broadcastData);
                    sentCount++;
                }
            });
            console.log(`[WebSocket] Broadcasted message to ${sentCount} clients`);
        }
        else {
            console.log('[WebSocket] No WebSocket server available for broadcast');
        }
        return message;
    }
    /**
     * Send a cross-team message to another team
     */
    async sendCrossTeamMessage(fromTeam, toTeam, content, contentType = 'text') {
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
        const sourceMessage = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            localId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            team: fromTeam,
            from: 'user',
            fromType: 'user',
            to: `team:${toTeam}`,
            content,
            contentType: contentType,
            timestamp,
            originalTeam: fromTeam
        };
        // Create message for target team (inbox view)
        const targetMessage = {
            ...sourceMessage,
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Different ID for target
            localId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            to: null, // In target team, it's a regular message
            originalTeam: fromTeam
        };
        // Save to source team database
        this.db.insertMessage({ ...sourceMessage, team: fromTeam });
        this.db.updateTeamActivity(fromTeam, timestamp);
        // Save to target team database
        this.db.insertMessage({ ...targetMessage, team: toTeam });
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
            wsServer.clients.forEach((client) => {
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
            wsServer.clients.forEach((client) => {
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
    async writeToClaudeInbox(teamName, member, message) {
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
        }
        catch (err) {
            console.error(`[DataSync] Error writing to inbox ${member}:`, err);
        }
    }
    /**
     * Handle team deletion (archive)
     */
    async handleTeamDeleted(teamName) {
        const archivedAt = new Date().toISOString();
        // Update database
        this.db.updateTeamStatus(teamName, 'archived', archivedAt);
        // Move to archive directory
        await this.archiveTeamData(teamName);
        // Notify clients via WebSocket
        const wsServer = this.fastify?.websocketServer;
        if (wsServer && wsServer.clients) {
            const broadcastData = JSON.stringify({ type: 'team_archived', team: teamName });
            wsServer.clients.forEach((client) => {
                if (client.readyState === 1) {
                    client.send(broadcastData);
                }
            });
        }
    }
    /**
     * Archive team data
     */
    async archiveTeamData(teamName) {
        const archiveDir = join(this.dataDir, 'archive', `${teamName}-${Date.now()}`);
        if (!existsSync(archiveDir)) {
            mkdirSync(archiveDir, { recursive: true });
        }
        // Archive logic here - copy DB records, attachments, etc.
        console.log(`[DataSync] Archived team ${teamName} to ${archiveDir}`);
    }
}
export default DataSyncService;
//# sourceMappingURL=data-sync.js.map