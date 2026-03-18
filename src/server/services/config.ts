import { watch, FSWatcher } from 'chokidar';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import type { AppConfig, ConfigChange } from '@shared/types';
import { DEFAULT_CONFIG } from '@shared/constants';

// Configuration keys that require server restart when changed
const RESTART_REQUIRED_KEYS = ['port', 'host', 'dataDir', 'teamsPath'] as const;
const RUNTIME_CONFIG_KEYS = ['retentionDays', 'theme', 'desktopNotifications', 'soundEnabled', 'cleanupEnabled', 'cleanupTime'] as const;

/**
 * 展开路径中的 ~ 为用户目录
 */
function expandHomeDir(path: string): string {
  if (path.startsWith('~/') || path === '~') {
    return join(homedir(), path.slice(1));
  }
  return path;
}

type RestartRequiredKey = typeof RESTART_REQUIRED_KEYS[number];
type RuntimeConfigKey = typeof RUNTIME_CONFIG_KEYS[number];

export class ConfigService {
  private config: AppConfig;
  private configPath: string;
  private watcher: FSWatcher | null = null;
  private writeTimeout: NodeJS.Timeout | null = null;
  private pendingChanges: ConfigChange[] = [];
  private onChangeCallback?: (changes: ConfigChange[]) => void;
  private isWriting = false; // 防止文件写入后重复触发回调

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

        // 合并配置，缺失字段会从 DEFAULT_CONFIG 获取
        config = { ...DEFAULT_CONFIG, ...fileConfig };

        // 检测是否有缺失的字段需要补全
        for (const key of Object.keys(DEFAULT_CONFIG)) {
          if (!(key in fileConfig)) {
            hasMissingFields = true;
            console.warn(`[ConfigService] Missing field '${String(key)}' in config file, will add with default value`);
          }
        }
      } else {
        hasMissingFields = true;
        console.warn(`[ConfigService] Config file not found at ${this.configPath}, will create with defaults`);
      }
    } catch (err) {
      console.warn(`[ConfigService] Failed to load config from ${this.configPath}:`, err);
      hasMissingFields = true;
    }

    // 如果有缺失字段，立即写回以确保配置完整
    if (hasMissingFields) {
      try {
        this.isWriting = true;
        writeFileSync(this.configPath, JSON.stringify(config, null, 2));
        setTimeout(() => { this.isWriting = false; }, 100);
        console.log('[ConfigService] Config file updated with default values');
      } catch (err) {
        this.isWriting = false;
        console.error('[ConfigService] Failed to write default config:', err);
      }
    }

    // 展开路径中的 ~
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
      // 忽略自己写入的变化，避免重复广播
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
  }

  stopWatching(): void {
    this.watcher?.close();
    this.watcher = null;
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
      // 立即通知回调（不等待文件写入），确保前端即时收到反馈
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
        // 短暂延迟后重置标志，确保 chokidar 事件已被忽略
        setTimeout(() => {
          this.isWriting = false;
        }, 100);
      } catch (err) {
        this.isWriting = false;
        console.error('Failed to write config:', err);
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
