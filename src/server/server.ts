import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import staticPlugin from '@fastify/static';
import { join } from 'path';
import { existsSync } from 'fs';
import { spawn } from 'child_process';
import type { AppConfig } from '@shared/types';
import { DatabaseService } from './db';
import { DataSyncService, FileWatcherService, CleanupService, ConfigService, MemberStatusService } from './services';
import teamRoutes from './routes/teams';
import messageRoutes from './routes/messages';
import archiveRoutes from './routes/archive';
import settingsRoutes from './routes/settings';
import permissionResponseRoutes from './routes/permission-response';
import tasksRoutes, { globalTasksRoutes } from './routes/tasks';

export interface ServerOptions {
  config: AppConfig;
  dataDir: string;
}

export async function createServer(options: ServerOptions) {
  const { config, dataDir } = options;

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
  console.log('[Server] Database initialized');

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
  console.log('[Server] Data sync initialized');

  // Initialize member status service (MUST be before file watcher)
  const memberStatusService = new MemberStatusService();
  console.log('[Server] Member status service initialized');

  // Initialize file watcher
  const fileWatcher = new FileWatcherService({
    claudeTeamsPath: config.teamsPath,
    dataSync,
    onMemberActivity: (teamName, memberName, messageType) => {
      // If it's an idle_notification, mark as idle; otherwise mark as busy
      if (messageType === 'idle_notification') {
        console.log(`[MemberStatus] ${memberName} is now idle`);
        memberStatusService.markIdle(teamName, memberName);
      } else {
        console.log(`[MemberStatus] ${memberName} is busy`);
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
  console.log('[Server] File watcher started');

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
    console.log(`[Server] Initialized ${teams.length} teams with offline status`);
  } catch (err) {
    console.error('[Server] Error initializing team members:', err);
  }

  // Initialize cleanup service
  const cleanupService = new CleanupService(db, {
    retentionDays: config.retentionDays,
    cleanupEnabled: config.cleanupEnabled,
    cleanupTime: config.cleanupTime
  });

  cleanupService.schedule();
  console.log('[Server] Cleanup service scheduled');

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
  });
  console.log('[Server] Config service started');

  // Register routes
  fastify.register(teamRoutes, { prefix: '/api/teams', db });
  fastify.register(messageRoutes, { prefix: '/api/teams', db, dataSync });
  fastify.register(permissionResponseRoutes, { prefix: '/api/teams', db, claudeTeamsPath: config.teamsPath });
  fastify.register(tasksRoutes, { prefix: '/api/teams' });
  fastify.register(globalTasksRoutes, { prefix: '/api' });
  fastify.register(archiveRoutes, { prefix: '/api/archive', db });

  // WebSocket handler - @fastify/websocket v10 passes socket directly
  fastify.register(async (fastify) => {
    fastify.get('/ws', { websocket: true }, (socket: any, _req: any) => {
      console.log('[WebSocket] Client connected');

      if (!socket || typeof socket.on !== 'function') {
        console.error('[WebSocket] Invalid socket object');
        return;
      }

      socket.on('message', (message: any) => {
        try {
          const data = JSON.parse(message.toString());

          switch (data.type) {
            case 'join_team':
              // Client joining a team room
              console.log(`[WebSocket] Client joined team: ${data.team}`);
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
                  console.error('[WebSocket] Error initializing team members:', err);
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
              console.log(`[WebSocket] Client left team: ${data.team}`);
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
              console.log(`[WebSocket] Marked read: ${data.messageId}`);
              break;

            case 'send_cross_team_message':
              // Handle cross-team message via WebSocket
              console.log(`[WebSocket] Cross-team message from ${data.fromTeam} to ${data.toTeam}`);
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
                  console.error('[WebSocket] Error sending cross-team message:', err);
                  socket.send(JSON.stringify({
                    type: 'error',
                    error: 'Failed to send cross-team message'
                  }));
                }
              })();
              break;
          }
        } catch (err) {
          console.error('[WebSocket] Error handling message:', err);
        }
      });

      socket.on('close', () => {
        console.log('[WebSocket] Client disconnected');
      });
    });
  });

  // Serve static files (frontend build)
  const clientDistPath = join(__dirname, '../../client/dist');
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
      timestamp: new Date().toISOString()
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
    console.log('[Server] Shutting down...');

    fileWatcher.stop();
    configService.stopWatching();
    cleanupService.stop();
    db.close();

    await fastify.close();
    console.log('[Server] Shutdown complete');

    if (restart) {
      console.log('[Server] Restarting...');
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
