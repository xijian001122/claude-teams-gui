import { watch, FSWatcher } from 'chokidar';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import type { AppConfig, ConfigChange } from '@shared/types';
import { DEFAULT_CONFIG } from '@shared/constants';
import { createLogger } from './log-factory';

// Module logger
const log = createLogger({ module: 'ConfigService', shorthand: 's.s.config' });

// Configuration keys that require server restart when changed
const RESTART_REQUIRED_KEYS = ['port', 'host', 'dataDir', 'teamsPath'] as const;
const RUNTIME_CONFIG_KEYS = ['retentionDays', 'theme', 'desktopNotifications', 'soundEnabled', 'cleanupEnabled', 'cleanupTime'] as const;

/**
 * Expand path with ~ to user directory
 */
function expandHomeDir(path: string): string {
  if (path.startsWith('~/') || path === '~') {
    return join(homedir(), path.slice(1));
  }
  return path;
}

export class ConfigService {
  private config: AppConfig;
  private configPath: string;
  private watcher: FSWatcher | null = null;
  private writeTimeout: NodeJS.Timeout | null = null;
  private pendingChanges: ConfigChange[] = [];
  private onChangeCallback?: (changes: ConfigChange[]) => void;
  private isWriting = false; // Prevent callback loops after file writes

  constructor(configPath: string, initialConfig?: AppConfig) {
    this.configPath = configPath;
    this.config = initialConfig || this.loadConfig();
  }

  private loadConfig(): AppConfig {
    let config: AppConfig = { ...DEFAULT_CONFIG };
    let hasMissingFields = false;

    try {
      if (existsSync(this.configPath)) {
        const raw = readFileSync(this.configPath, 'utf8');
        const fileConfig = JSON.parse(raw);

        // Merge config, missing fields get defaults
        config = { ...DEFAULT_CONFIG, ...fileConfig };

        // Check for missing fields
        for (const key of Object.keys(DEFAULT_CONFIG)) {
          if (!(key in fileConfig)) {
            hasMissingFields = true;
            log.warn(`Missing field '${String(key)}' in config file, will add with default value`);
          }
        }
      } else {
        hasMissingFields = true;
        log.warn(`Config file not found at ${this.configPath}, will create with defaults`);
      }
    } catch (err) {
      log.warn(`Failed to load config from ${this.configPath}: ${err}`);
      hasMissingFields = true;
    }

    // Write back if missing fields
    if (hasMissingFields) {
      try {
        this.isWriting = true;
        writeFileSync(this.configPath, JSON.stringify(config, null, 2));
        setTimeout(() => { this.isWriting = false; }, 100);
        log.info('Config file updated with default values');
      } catch (err) {
        this.isWriting = false;
        log.error(`Failed to write default config: ${err}`);
      }
    }

    // Expand ~ in paths
    config.dataDir = expandHomeDir(config.dataDir);
    config.teamsPath = expandHomeDir(config.teamsPath);

    return config;
  }

  startWatching(onChange?: (changes: ConfigChange[]) => void): void {
    this.onChangeCallback = onChange;

    this.watcher = watch(this.configPath, {
      persistent: true,
      ignoreInitial: true
    });

    this.watcher.on('change', () => {
      // Ignore our own writes to avoid callback loops
      if (this.isWriting) {
        this.isWriting = false;
        return;
      }

      const newConfig = this.loadConfig();
      const changes = this.detectChanges(this.config, newConfig);

      if (changes.length > 0) {
        this.config = newConfig;
        this.trackPendingChanges(changes);
        this.onChangeCallback?.(changes);
      }
    });

    log.info('Started watching config file');
  }

  stopWatching(): void {
    this.watcher?.close();
    this.watcher = null;
    log.debug('Stopped watching config file');
  }

  getConfig(): AppConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<AppConfig>): ConfigChange[] {
    const oldConfig = { ...this.config };
    this.config = { ...this.config, ...updates };

    const changes = this.detectChanges(oldConfig, this.config);

    if (changes.length > 0) {
      this.trackPendingChanges(changes);
      // Notify callback immediately (don't wait for file write)
      this.onChangeCallback?.(changes);
    }

    this.writeDebounced();

    return changes;
  }

  private detectChanges(oldConfig: AppConfig, newConfig: AppConfig): ConfigChange[] {
    const changes: ConfigChange[] = [];
    const allKeys = [...RESTART_REQUIRED_KEYS, ...RUNTIME_CONFIG_KEYS] as (keyof AppConfig)[];

    for (const key of allKeys) {
      if (oldConfig[key] !== newConfig[key]) {
        changes.push({
          key,
          oldValue: oldConfig[key],
          newValue: newConfig[key],
          requiresRestart: this.isRestartRequired(String(key))
        });
      }
    }

    return changes;
  }

  private isRestartRequired(key: string): boolean {
    return (RESTART_REQUIRED_KEYS as readonly string[]).includes(key);
  }

  private trackPendingChanges(changes: ConfigChange[]): void {
    for (const change of changes) {
      const existing = this.pendingChanges.findIndex(c => c.key === change.key);
      if (existing >= 0) {
        this.pendingChanges[existing] = change;
      } else {
        this.pendingChanges.push(change);
      }
    }
  }

  private writeDebounced(): void {
    if (this.writeTimeout) {
      clearTimeout(this.writeTimeout);
    }

    this.writeTimeout = setTimeout(() => {
      try {
        this.isWriting = true;
        writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
        // Brief delay before resetting flag to ensure chokidar event is ignored
        setTimeout(() => {
          this.isWriting = false;
        }, 100);
      } catch (err) {
        this.isWriting = false;
        log.error(`Failed to write config: ${err}`);
      }
    }, 300);
  }

  needsRestart(): boolean {
    return this.pendingChanges.some(c => c.requiresRestart);
  }

  getPendingChanges(): ConfigChange[] {
    return [...this.pendingChanges];
  }

  clearPendingChanges(): void {
    this.pendingChanges = [];
  }
}
