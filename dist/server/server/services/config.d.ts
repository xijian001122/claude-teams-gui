import type { AppConfig, ConfigChange } from '@shared/types';
export declare class ConfigService {
    private config;
    private configPath;
    private watcher;
    private writeTimeout;
    private pendingChanges;
    private onChangeCallback?;
    private isWriting;
    constructor(configPath: string, initialConfig?: AppConfig);
    private loadConfig;
    startWatching(onChange?: (changes: ConfigChange[]) => void): void;
    stopWatching(): void;
    getConfig(): AppConfig;
    updateConfig(updates: Partial<AppConfig>): ConfigChange[];
    private detectChanges;
    private isRestartRequired;
    private trackPendingChanges;
    private writeDebounced;
    needsRestart(): boolean;
    getPendingChanges(): ConfigChange[];
    clearPendingChanges(): void;
}
//# sourceMappingURL=config.d.ts.map