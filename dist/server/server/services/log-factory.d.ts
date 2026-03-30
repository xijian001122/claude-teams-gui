/**
 * Pino 日志工厂
 * 创建具有 Logback 风格格式化的 Logger 实例
 */
import { type Logger } from 'pino';
import type { LogConfig } from '@shared/types';
/**
 * 模块标识配置
 */
export interface ModuleConfig {
    /** 功能区名称，如 DataSync、FileWatcher */
    module: string;
    /** 文件路径缩写，如 s.s.data-sync */
    shorthand: string;
}
/**
 * 日志工厂配置
 */
export interface LogFactoryConfig extends LogConfig {
    /** 日志目录路径 */
    logDir: string;
    /** 是否在终端着色（仅开发模式） */
    colorize?: boolean;
}
/**
 * 默认日志配置
 */
export declare const DEFAULT_LOG_FACTORY_CONFIG: LogFactoryConfig;
/**
 * 创建 Logger 实例
 */
export declare function createLogger(moduleConfig: ModuleConfig): Logger;
/**
 * 初始化日志工厂
 */
export declare function initLogFactory(config: LogFactoryConfig): void;
/**
 * 更新日志配置
 */
export declare function updateLogConfig(updates: Partial<LogFactoryConfig>): void;
/**
 * 关闭日志工厂
 */
export declare function closeLogFactory(): void;
/**
 * 创建 Fastify logger
 */
export declare function createFastifyLogger(): Logger;
/**
 * 获取全局配置
 */
export declare function getGlobalConfig(): LogFactoryConfig | null;
declare const _default: {
    createLogger: typeof createLogger;
    initLogFactory: typeof initLogFactory;
    updateLogConfig: typeof updateLogConfig;
    closeLogFactory: typeof closeLogFactory;
    createFastifyLogger: typeof createFastifyLogger;
    getGlobalConfig: typeof getGlobalConfig;
};
export default _default;
//# sourceMappingURL=log-factory.d.ts.map