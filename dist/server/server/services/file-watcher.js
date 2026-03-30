import { watch } from 'chokidar';
import { join, basename } from 'path';
import { readFileSync, existsSync } from 'fs';
import { getDirectoryBirthTime, extractProjectFromCwd } from '../utils/file-stats';
import { createLogger } from './log-factory';
// Module loggers
const log = createLogger({ module: 'FileWatcher', shorthand: 's.s.file-watcher' });
const wsLog = createLogger({ module: 'WebSocket', shorthand: 's.ws' });
export class FileWatcherService {
    watchers = new Map();
    teamInstances = new Map(); // Track current instance ID for each team
    claudeTeamsPath;
    dataSync;
    fastify;
    onMemberActivity;
    constructor(options) {
        this.claudeTeamsPath = options.claudeTeamsPath;
        this.dataSync = options.dataSync;
        this.fastify = options.fastify;
        this.onMemberActivity = options.onMemberActivity;
    }
    /**
     * Start watching all team directories
     */
    async start() {
        if (!this.claudeTeamsPath) {
            log.warn('No Claude teams path configured');
            return;
        }
        // Watch for new teams
        const teamsWatcher = watch(this.claudeTeamsPath, {
            persistent: true,
            ignoreInitial: true,
            depth: 0
        });
        teamsWatcher.on('addDir', async (path) => {
            const teamName = basename(path);
            if (teamName && !teamName.startsWith('.')) {
                log.info(`New team detected: ${teamName}`);
                // Wait a short delay for config.json to be written
                await new Promise(resolve => setTimeout(resolve, 200));
                // Sync team first, then set up watcher
                const team = await this.dataSync.syncTeam(teamName);
                if (team) {
                    this.watchTeam(teamName);
                    this.broadcastTeamAdded(team);
                }
            }
        });
        teamsWatcher.on('unlinkDir', (path) => {
            const teamName = basename(path);
            if (teamName) {
                log.info(`Team deleted: ${teamName}`);
                this.unwatchTeam(teamName);
                this.dataSync.handleTeamDeleted(teamName);
            }
        });
        this.watchers.set('__teams__', teamsWatcher);
        // Watch existing teams
        const { readdir } = await import('fs/promises');
        try {
            const entries = await readdir(this.claudeTeamsPath, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.isDirectory() && !entry.name.startsWith('.')) {
                    this.watchTeam(entry.name);
                }
            }
        }
        catch {
            // Directory doesn't exist yet
        }
        log.info('Started watching');
    }
    /**
     * Watch a specific team's inboxes
     */
    watchTeam(teamName) {
        // Prevent duplicate watchers
        if (this.watchers.has(teamName)) {
            return;
        }
        const teamPath = join(this.claudeTeamsPath, teamName);
        const inboxesPath = join(teamPath, 'inboxes');
        // Track team instance
        const currentInstance = getDirectoryBirthTime(teamPath);
        const oldInstance = this.teamInstances.get(teamName);
        if (oldInstance && oldInstance !== currentInstance) {
            // Team directory was recreated - instance changed!
            log.info(`Team instance changed: ${teamName} (${oldInstance} -> ${currentInstance})`);
            // Extract source project from config
            let sourceProject;
            const configPath = join(teamPath, 'config.json');
            if (existsSync(configPath)) {
                try {
                    const config = JSON.parse(readFileSync(configPath, 'utf8'));
                    if (config.members && config.members.length > 0) {
                        sourceProject = extractProjectFromCwd(config.members[0].cwd);
                    }
                }
                catch (err) {
                    log.error(`Error reading team config: ${err}`);
                }
            }
            // Broadcast team_instance_changed event
            this.broadcastTeamInstanceChanged(teamName, oldInstance, currentInstance, sourceProject || 'unknown');
        }
        // Update tracked instance
        this.teamInstances.set(teamName, currentInstance);
        // Only watch inbox if it exists
        if (!existsSync(inboxesPath)) {
            log.debug(`Inbox directory does not exist yet for ${teamName}, watching team directory for inbox creation`);
            // Watch the team directory for when inboxes is created
            const teamDirWatcher = watch(teamPath, {
                persistent: true,
                ignoreInitial: true,
                depth: 0
            });
            teamDirWatcher.on('addDir', async (newDirPath) => {
                const dirName = basename(newDirPath);
                if (dirName === 'inboxes') {
                    log.info(`Inboxes directory created for ${teamName}, setting up inbox watcher`);
                    teamDirWatcher.close();
                    this.watchers.delete(`${teamName}_dir`);
                    // Re-watch to set up inbox watcher
                    this.watchTeam(teamName);
                }
            });
            this.watchers.set(`${teamName}_dir`, teamDirWatcher);
            return;
        }
        let watcher;
        try {
            watcher = watch(`${inboxesPath}/*.json`, {
                persistent: true,
                ignoreInitial: true
            });
        }
        catch (err) {
            log.error(`Failed to create watcher for ${teamName}: ${err}`);
            return;
        }
        watcher.on('change', async (filePath) => {
            const fileName = basename(filePath);
            const member = fileName.replace('.json', '');
            log.debug(`Inbox changed: ${teamName}/${member}`);
            // Sync the changed inbox
            try {
                await this.dataSync.syncTeam(teamName);
                log.trace(`syncTeam completed for ${teamName}`);
            }
            catch (err) {
                log.error(`syncTeam failed for ${teamName}: ${err}`);
            }
            // Read the latest message to check its type
            let messageType;
            try {
                const inboxPath = join(this.claudeTeamsPath, teamName, 'inboxes', fileName);
                const content = readFileSync(inboxPath, 'utf-8');
                const messages = JSON.parse(content);
                if (Array.isArray(messages) && messages.length > 0) {
                    const latestMessage = messages[messages.length - 1];
                    // Try to parse the text field if it contains JSON
                    if (latestMessage.text) {
                        try {
                            const parsed = JSON.parse(latestMessage.text);
                            messageType = parsed.type;
                        }
                        catch {
                            // Not JSON, ignore
                        }
                    }
                    // Also check direct type field
                    if (!messageType && latestMessage.type) {
                        messageType = latestMessage.type;
                    }
                }
            }
            catch (err) {
                log.error(`Error reading inbox: ${err}`);
            }
            // Update member activity status
            if (this.onMemberActivity) {
                this.onMemberActivity(teamName, member, messageType);
            }
        });
        this.watchers.set(teamName, watcher);
    }
    /**
     * Stop watching a team
     */
    unwatchTeam(teamName) {
        const watcher = this.watchers.get(teamName);
        if (watcher) {
            watcher.close();
            this.watchers.delete(teamName);
        }
        // Clean up instance tracking
        this.teamInstances.delete(teamName);
    }
    /**
     * Broadcast team_instance_changed event to WebSocket clients
     */
    broadcastTeamInstanceChanged(teamName, oldInstance, newInstance, sourceProject) {
        const wsServer = this.fastify.websocketServer;
        if (!wsServer || !wsServer.clients) {
            return;
        }
        const eventData = JSON.stringify({
            type: 'team_instance_changed',
            team: teamName,
            oldInstance,
            newInstance,
            sourceProject
        });
        let sentCount = 0;
        wsServer.clients.forEach((client) => {
            if (client.readyState === 1) { // WebSocket.OPEN
                client.send(eventData);
                sentCount++;
            }
        });
        wsLog.debug(`Broadcasted team_instance_changed to ${sentCount} clients`);
    }
    /**
     * Broadcast team_added event to WebSocket clients
     */
    broadcastTeamAdded(team) {
        const wsServer = this.fastify.websocketServer;
        if (!wsServer || !wsServer.clients) {
            return;
        }
        const eventData = JSON.stringify({
            type: 'team_added',
            team
        });
        let sentCount = 0;
        wsServer.clients.forEach((client) => {
            if (client.readyState === 1) { // WebSocket.OPEN
                client.send(eventData);
                sentCount++;
            }
        });
        wsLog.debug(`Broadcasted team_added (${team.name}) to ${sentCount} clients`);
    }
    /**
     * Stop all watchers
     */
    stop() {
        for (const [name, watcher] of this.watchers) {
            watcher.close();
            log.debug(`Stopped watching: ${name}`);
        }
        this.watchers.clear();
    }
}
export default FileWatcherService;
//# sourceMappingURL=file-watcher.js.map