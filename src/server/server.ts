import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import staticPlugin from '@fastify/static';
import { join, dirname } from 'path';
import { existsSync } from 'fs';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
import type { AppConfig } from '@shared/types';
import { DatabaseService } from './db';
import { DataSyncService, FileWatcherService, CleanupService, ConfigService, MemberStatusService } from './services';
import { createLogger, initLogFactory, closeLogFactory, updateLogConfig } from './services/log-factory';
import teamRoutes from './routes/teams';
import messageRoutes from './routes/messages';
import archiveRoutes from './routes/archive';
import settingsRoutes from './routes/settings';
import permissionResponseRoutes from './routes/permission-response';
import tasksRoutes, { globalTasksRoutes } from './routes/tasks';
import { logsRoutes, hooksRoutes } from './routes';
import memberSessionRoutes from './routes/member-session';
import { commandsRoutes } from './routes/commands';

export interface ServerOptions {
  config: AppConfig;
  dataDir: string;
}

export async function createServer(options: ServerOptions) {
  const { config, dataDir } = options;

  // Initialize Pino logger factory first
  const logDir = join(dataDir, 'logs');
  initLogFactory({
    enabled: config.logConfig?.enabled ?? true,
    level: config.logConfig?.level ?? 'info',
    maxSize: config.logConfig?.maxSize ?? 10,
    maxDays: config.logConfig?.maxDays ?? 7,
    logDir,
    colorize: process.env.NODE_ENV !== 'production'
  });

  // Create module logger
  const log = createLogger({ module: 'Server', shorthand: 's.server' });

  // Create Fastify instance
  const fastify = Fastify({
    logger: {
      level: 'info'
    }
  });

  // Register plugins
  await fastify.register(cors, {
    origin: true,
    credentials: true
  });

  await fastify.register(websocket);

  // Initialize database
  const db = new DatabaseService(dataDir);
  log.info('Database initialized');

  // Initialize config service (but don't start watching yet)
  const configPath = join(dataDir, 'config.json');
  const configService = new ConfigService(configPath, config);

  // Initialize data sync service
  const dataSync = new DataSyncService({
    claudeTeamsPath: config.teamsPath,
    dataDir,
    db,
    fastify
  });

  await dataSync.init();
  log.info('Data sync initialized');

  // Initialize member status service (MUST be before file watcher)
  const memberStatusService = new MemberStatusService();
  log.info('Member status service initialized');

  // Create MemberStatus logger
  const memberStatusLog = createLogger({ module: 'MemberStatus', shorthand: 's.mstatus' });

  // Initialize file watcher
  const fileWatcher = new FileWatcherService({
    claudeTeamsPath: config.teamsPath,
    dataSync,
    fastify,
    onMemberActivity: (teamName, memberName, messageType) => {
      // If it's an idle_notification, mark as idle; otherwise mark as busy
      if (messageType === 'idle_notification') {
        memberStatusLog.info(`${memberName} is now idle`);
        memberStatusService.markIdle(teamName, memberName);
      } else {
        memberStatusLog.info(`${memberName} is busy`);
        memberStatusService.markBusy(teamName, memberName);
      }

      // Broadcast updated status to all clients
      if (fastify.websocketServer) {
        const statuses = memberStatusService.getMemberStatuses(teamName);
        fastify.websocketServer.clients.forEach((client: any) => {
          if (client.readyState === 1) {
            client.send(JSON.stringify({
              type: 'member_status',
              team: teamName,
              members: statuses
            }));
          }
        });
      }
    }
  });

  await fileWatcher.start();
  log.info('File watcher started');

  // Initialize all existing team members as offline (FileWatcher ignoreInitial doesn't detect them)
  try {
    const teams = await db.getTeams();
    for (const team of teams) {
      if (team.members) {
        for (const member of team.members) {
          memberStatusService.initMemberOffline(team.name, member.name);
        }
      }
    }
    log.info(`Initialized ${teams.length} teams with offline status`);
  } catch (err) {
    log.error(`Error initializing team members: ${err}`);
  }

  // Initialize cleanup service
  const cleanupService = new CleanupService(db, {
    retentionDays: config.retentionDays,
    cleanupEnabled: config.cleanupEnabled,
    cleanupTime: config.cleanupTime
  });

  cleanupService.schedule();
  log.info('Cleanup service scheduled');

  // Now start config watching (after cleanupService is created)
  configService.startWatching((changes) => {
    // Broadcast config changes via WebSocket
    if (fastify.websocketServer) {
      const pendingRestart = configService.needsRestart();
      fastify.websocketServer.clients.forEach((client: any) => {
        if (client.readyState === 1) {
          client.send(JSON.stringify({
            type: 'config_updated',
            changes,
            pendingRestart
          }));
        }
      });
    }

    // Update cleanup service if config changed
    const relevantChanges = changes.filter(c =>
      ['retentionDays', 'cleanupEnabled', 'cleanupTime'].includes(c.key)
    );
    if (relevantChanges.length > 0) {
      const currentConfig = configService.getConfig();
      cleanupService.updateConfig({
        retentionDays: currentConfig.retentionDays,
        cleanupEnabled: currentConfig.cleanupEnabled,
        cleanupTime: currentConfig.cleanupTime
      });
    }

    // Update log factory if log config changed
    const logConfigChange = changes.find(c => c.key === 'logConfig');
    if (logConfigChange) {
      updateLogConfig(logConfigChange.newValue);
    }
  });
  log.info('Config service started');

  // Register routes
  fastify.register(teamRoutes, { prefix: '/api/teams', db });
  fastify.register(messageRoutes, { prefix: '/api/teams', db, dataSync });
  fastify.register(permissionResponseRoutes, { prefix: '/api/teams', db, claudeTeamsPath: config.teamsPath });
  fastify.register(tasksRoutes, { prefix: '/api/teams' });
  fastify.register(globalTasksRoutes, { prefix: '/api' });
  fastify.register(archiveRoutes, { prefix: '/api/archive', db, dataDir });
  fastify.register(logsRoutes, { prefix: '/api/logs', configService });
  fastify.register(hooksRoutes, { prefix: '/api/hooks', fastify });
  fastify.register(memberSessionRoutes, { prefix: '/api/teams', teamsPath: config.teamsPath, db });
  fastify.register(commandsRoutes, { prefix: '/api/commands' });

  // Create WebSocket logger
  const wsLog = createLogger({ module: 'WebSocket', shorthand: 's.ws' });

  // WebSocket handler - @fastify/websocket v10 passes socket directly
  fastify.register(async (fastify) => {
    fastify.get('/ws', { websocket: true }, (socket: any, _req: any) => {
      wsLog.info('Client connected');

      if (!socket || typeof socket.on !== 'function') {
        wsLog.error('Invalid socket object');
        return;
      }

      socket.on('message', (message: any) => {
        try {
          const data = JSON.parse(message.toString());

          switch (data.type) {
            case 'join_team':
              // Client joining a team room
              wsLog.info(`Client joined team: ${data.team}`);
              // Initialize all team members as offline (they'll be updated as they have activity)
              (async () => {
                try {
                  const team = await db.getTeam(data.team);
                  if (team?.members) {
                    for (const member of team.members) {
                      memberStatusService.initMemberOffline(data.team, member.name);
                    }
                  }
                } catch (err) {
                  wsLog.error(`Error initializing team members: ${err}`);
                }

                // Broadcast current status
                const statuses = memberStatusService.getMemberStatuses(data.team);
                if (fastify.websocketServer) {
                  fastify.websocketServer.clients.forEach((client: any) => {
                    if (client.readyState === 1) {
                      client.send(JSON.stringify({
                        type: 'member_status',
                        team: data.team,
                        members: statuses
                      }));
                    }
                  });
                }
              })();
              break;

            case 'leave_team':
              wsLog.info(`Client left team: ${data.team}`);
              break;

            case 'typing':
              // Broadcast typing indicator
              if (fastify.websocketServer) {
                fastify.websocketServer.clients.forEach((client: any) => {
                  if (client !== socket && client.readyState === 1) {
                    client.send(JSON.stringify({
                      type: 'typing',
                      team: data.team,
                      from: data.from
                    }));
                  }
                });
              }
              break;

            case 'mark_read':
              // Mark messages as read
              wsLog.debug(`Marked read: ${data.messageId}`);
              break;

            case 'send_cross_team_message':
              // Handle cross-team message via WebSocket
              wsLog.info(`Cross-team message from ${data.fromTeam} to ${data.toTeam}`);
              (async () => {
                try {
                  const result = await dataSync.sendCrossTeamMessage(
                    data.fromTeam,
                    data.toTeam,
                    data.content,
                    data.contentType || 'text'
                  );

                  if (!result.success) {
                    socket.send(JSON.stringify({
                      type: 'error',
                      error: result.error
                    }));
                  }
                } catch (err) {
                  wsLog.error(`Error sending cross-team message: ${err}`);
                  socket.send(JSON.stringify({
                    type: 'error',
                    error: 'Failed to send cross-team message'
                  }));
                }
              })();
              break;
          }
        } catch (err) {
          wsLog.error(`Error handling message: ${err}`);
        }
      });

      socket.on('close', () => {
        wsLog.info('Client disconnected');
      });
    });
  });

  // Serve static files (frontend build)
  // Support both development mode and plugin mode
  const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT;
  const clientDistPath = pluginRoot
    ? join(pluginRoot, 'dist', 'client')
    : join(__dirname, '../../client');

  log.info(`Serving frontend from ${clientDistPath}${pluginRoot ? ' (plugin)' : ' (development)'}`);

  if (existsSync(clientDistPath)) {
    fastify.register(staticPlugin, {
      root: clientDistPath,
      prefix: '/'
    });

    // SPA fallback
    fastify.setNotFoundHandler(async (request, reply) => {
      if (request.url.startsWith('/api') || request.url.startsWith('/ws')) {
        reply.status(404).send({ error: 'Not found' });
      } else {
        await reply.sendFile('index.html', clientDistPath);
      }
    });
  }

  // Health check
  fastify.get('/health', async () => {
    return {
      status: 'ok',
      timestamp: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
    };
  });

  // Restart handler for settings route
  const handleRestart = async () => {
    // Get the new config before restart
    const currentConfig = configService.getConfig();

    // Broadcast restart notification to all WebSocket clients with new connection info
    if (fastify.websocketServer) {
      fastify.websocketServer.clients.forEach((client: any) => {
        if (client.readyState === 1) {
          client.send(JSON.stringify({
            type: 'server_restarting',
            message: 'Server is restarting, please reconnect...',
            newPort: currentConfig.port,
            newHost: currentConfig.host
          }));
        }
      });
    }

    // Wait a moment for messages to be sent
    await new Promise(resolve => setTimeout(resolve, 500));

    await shutdown(true);
  };

  // Update settings routes with restart handler
  fastify.register(settingsRoutes, {
    prefix: '/api/settings',
    configService,
    onRestart: handleRestart
  });

  // Graceful shutdown
  const shutdown = async (restart = false) => {
    log.info('Shutting down...');

    fileWatcher.stop();
    configService.stopWatching();
    cleanupService.stop();
    closeLogFactory();
    db.close();

    await fastify.close();
    log.info('Shutdown complete');

    if (restart) {
      log.info('Restarting...');
      // Spawn a new process, filtering out port/host args to read from config file
      const nodePath = process.execPath;
      const scriptPath = process.argv[1];
      const originalArgs = process.argv.slice(2);

      // Filter out port/host related arguments so new process reads from config
      const filteredArgs = originalArgs.filter((arg, index, arr) => {
        // Remove --port, -p, --host, -h and their values
        if (arg === '--port' || arg === '-p' || arg === '--host' || arg === '-h') {
          return false;
        }
        // Remove the value after --port or -p
        if (index > 0 && (arr[index - 1] === '--port' || arr[index - 1] === '-p' ||
            arr[index - 1] === '--host' || arr[index - 1] === '-h')) {
          return false;
        }
        return true;
      });

      // Ensure headless to avoid opening browser on restart
      const args = [...filteredArgs, '--headless'];

      spawn(nodePath, [scriptPath, ...args], {
        detached: true,
        stdio: 'inherit',
        env: { ...process.env, CLAUDE_CHAT_RESTART: '1' }
      }).unref();
    }

    process.exit(0);
  };

  process.on('SIGINT', () => shutdown(false));
  process.on('SIGTERM', () => shutdown(false));

  return { fastify, db, dataSync, fileWatcher, cleanupService, memberStatusService };
}

export default createServer;
