#!/usr/bin/env node

import { Command } from 'commander';
import { join, resolve } from 'path';
import { homedir } from 'os';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import open from 'open';
import { createServer } from './server';
import type { AppConfig } from '@shared/types';
import { DEFAULT_CONFIG } from '@shared/constants';

const program = new Command();

program
  .name('claude-teams-gui')
  .description('Visual chat interface for Claude Code Teams')
  .version('0.1.0');

program
  .option('-p, --port <port>', 'Port to run on')
  .option('-h, --host <host>', 'Host to bind to')
  .option('-d, --data <path>', 'Data directory')
  .option('--teams <path>', 'Claude teams directory')
  .option('--headless', 'Do not open browser', true)
  .option('--no-sync', 'Disable Claude teams sync', false)
  .action(async (options) => {
    try {
      // Resolve paths
      const dataDir = options.data
        ? resolve(options.data)
        : join(homedir(), '.claude-chat');

      const teamsPath = options.teams
        ? resolve(options.teams)
        : join(homedir(), '.claude', 'teams');

      // Ensure data directory exists
      if (!existsSync(dataDir)) {
        mkdirSync(dataDir, { recursive: true });
      }

      // Load or create config
      const configPath = join(dataDir, 'config.json');
      let config: AppConfig;

      if (existsSync(configPath)) {
        const fileConfig = JSON.parse(readFileSync(configPath, 'utf8'));
        config = {
          ...DEFAULT_CONFIG,
          ...fileConfig,
          // 命令行参数优先（如果有显式指定）
          port: options.port ? parseInt(options.port) : (fileConfig.port || DEFAULT_CONFIG.port),
          host: options.host || fileConfig.host || DEFAULT_CONFIG.host,
          dataDir,
          teamsPath
        };
      } else {
        config = {
          ...DEFAULT_CONFIG,
          port: options.port ? parseInt(options.port) : DEFAULT_CONFIG.port,
          host: options.host || DEFAULT_CONFIG.host,
          dataDir,
          teamsPath
        };
        writeFileSync(configPath, JSON.stringify(config, null, 2));
      }

      console.log(`
╔══════════════════════════════════════════════════════════════╗
║                     Claude Chat v0.1.0                       ║
╠══════════════════════════════════════════════════════════════╣
║  Data Directory: ${dataDir.padEnd(46)}║
║  Teams Path:     ${teamsPath.padEnd(46)}║
║  Port:           ${String(config.port).padEnd(46)}║
╚══════════════════════════════════════════════════════════════╝
      `);

      // Create and start server
      const { fastify, memberStatusService } = await createServer({ config, dataDir });

      await fastify.listen({
        port: config.port,
        host: config.host
      });

      // Periodically broadcast member status for all tracked teams
      // Use tick() to recalculate occupied/offline states
      setInterval(() => {
        const teams = memberStatusService?.getTrackedTeams() || [];
        for (const teamName of teams) {
          const statuses = memberStatusService.tick(teamName); // tick() updates state machine
          if (fastify.websocketServer && statuses.length > 0) {
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
      }, 5000); // Broadcast every 5 seconds

      const url = `http://${config.host}:${config.port}`;
      console.log(`✓ Server running at ${url}`);

      // Open browser unless headless
      if (!options.headless) {
        console.log('Opening browser...');
        await open(url);
      }

      console.log('\nPress Ctrl+C to stop\n');

    } catch (err) {
      console.error('Failed to start server:', err);
      process.exit(1);
    }
  });

program
  .command('cleanup')
  .description('Run cleanup task manually')
  .option('-d, --data <path>', 'Data directory')
  .action(async (options) => {
    const dataDir = options.data
      ? resolve(options.data)
      : join(homedir(), '.claude-chat');

    console.log('Running cleanup...');

    // Import and run cleanup
    const { DatabaseService } = await import('./db');
    const { CleanupService } = await import('./services');

    const db = new DatabaseService(dataDir);

    const configPath = join(dataDir, 'config.json');
    const config = existsSync(configPath)
      ? JSON.parse(readFileSync(configPath, 'utf8'))
      : DEFAULT_CONFIG;

    const cleanupService = new CleanupService(db, {
      retentionDays: config.retentionDays || 90,
      cleanupEnabled: true,
      cleanupTime: config.cleanupTime || '02:00'
    });

    const results = await cleanupService.runCleanup();

    console.log(`Cleanup complete: ${results.deleted} messages deleted, ${results.archived} teams archived`);

    db.close();
    process.exit(0);
  });

program.parse();
