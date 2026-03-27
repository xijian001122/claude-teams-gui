import { watch } from 'chokidar';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { DEFAULT_CONFIG } from '@shared/constants';
// Configuration keys that require server restart when changed
const RESTART_REQUIRED_KEYS = ['port', 'host', 'dataDir', 'teamsPath'];
const RUNTIME_CONFIG_KEYS = ['retentionDays', 'theme', 'desktopNotifications', 'soundEnabled', 'cleanupEnabled', 'cleanupTime'];
/**
 * 展开路径中的 ~ 为用户目录
 */
function expandHomeDir(path) {
    if (path.startsWith('~/') || path === '~') {
        return join(homedir(), path.slice(1));
    }
    return path;
}
export class ConfigService {
    config;
    configPath;
    watcher = null;
    writeTimeout = null;
    pendingChanges = [];
    onChangeCallback;
    isWriting = false; // 防止文件写入后重复触发回调
    constructor(configPath, initialConfig) {
        this.configPath = configPath;
        this.config = initialConfig || this.loadConfig();
    }
    loadConfig() {
        let config = { ...DEFAULT_CONFIG };
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
            }
            else {
                hasMissingFields = true;
                console.warn(`[ConfigService] Config file not found at ${this.configPath}, will create with defaults`);
            }
        }
        catch (err) {
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
            }
            catch (err) {
                this.isWriting = false;
                console.error('[ConfigService] Failed to write default config:', err);
            }
        }
        // 展开路径中的 ~
        config.dataDir = expandHomeDir(config.dataDir);
        config.teamsPath = expandHomeDir(config.teamsPath);
        return config;
    }
    startWatching(onChange) {
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
    stopWatching() {
        this.watcher?.close();
        this.watcher = null;
    }
    getConfig() {
        return { ...this.config };
    }
    updateConfig(updates) {
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
    detectChanges(oldConfig, newConfig) {
        const changes = [];
        const allKeys = [...RESTART_REQUIRED_KEYS, ...RUNTIME_CONFIG_KEYS];
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
    isRestartRequired(key) {
        return RESTART_REQUIRED_KEYS.includes(key);
    }
    trackPendingChanges(changes) {
        for (const change of changes) {
            const existing = this.pendingChanges.findIndex(c => c.key === change.key);
            if (existing >= 0) {
                this.pendingChanges[existing] = change;
            }
            else {
                this.pendingChanges.push(change);
            }
        }
    }
    writeDebounced() {
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
            }
            catch (err) {
                this.isWriting = false;
                console.error('Failed to write config:', err);
            }
        }, 300);
    }
    needsRestart() {
        return this.pendingChanges.some(c => c.requiresRestart);
    }
    getPendingChanges() {
        return [...this.pendingChanges];
    }
    clearPendingChanges() {
        this.pendingChanges = [];
    }
}
//# sourceMappingURL=config.js.map