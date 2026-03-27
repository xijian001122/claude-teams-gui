/**
 * 日志级别
 */
export type LogLevel = 'error' | 'info' | 'console';
/**
 * 日志配置
 */
export interface LogConfig {
    enabled: boolean;
    level: LogLevel;
    maxSize: number;
    maxDays: number;
}
/**
 * 默认日志配置
 */
export declare const DEFAULT_LOG_CONFIG: LogConfig;
/**
 * LoggerService - 结构化日志服务
 * 拦截 console 方法并写入文件，支持日志轮转
 */
export declare class LoggerService {
    private logDir;
    private config;
    private originalConsole;
    private currentDate;
    private isInitialized;
    private isDestroyed;
    private consoleStream;
    private infoStream;
    private errorStream;
    private buffer;
    private flushInterval;
    private readonly BUFFER_SIZE;
    private readonly FLUSH_INTERVAL;
    constructor(logDir: string, config?: Partial<LogConfig>);
    /**
     * 初始化日志服务
     */
    init(): Promise<void>;
    /**
     * 销毁日志服务
     */
    destroy(): void;
    /**
     * 更新配置
     */
    updateConfig(config: Partial<LogConfig>): void;
    /**
     * 获取当前配置
     */
    getConfig(): LogConfig;
    /**
     * 确保日志目录存在
     */
    private ensureLogDir;
    /**
     * 打开日志文件流
     */
    private openStreams;
    /**
     * 关闭日志文件流
     */
    private closeStreams;
    /**
     * 拦截 console 方法
     */
    private interceptConsole;
    /**
     * 恢复原始 console 方法
     */
    private restoreConsole;
    /**
     * 写入日志
     */
    private writeLog;
    /**
     * 检查并执行轮转
     */
    private checkRotation;
    /**
     * 按日期轮转
     */
    private rotateByDate;
    /**
     * 按大小轮转
     */
    private rotateBySize;
    /**
     * 获取历史目录中的下一个序号
     */
    private getNextIndex;
    /**
     * 移动当前日志到历史目录
     */
    private moveToHistory;
    /**
     * 清理过期日志
     */
    private cleanupOldLogs;
    /**
     * 删除目录及其内容
     */
    private deleteDirectory;
    /**
     * 启动定时刷新
     */
    private startFlushTimer;
    /**
     * 刷新缓冲区到文件
     */
    private flush;
    /**
     * 同步刷新缓冲区（用于销毁时）
     */
    private flushSync;
}
export default LoggerService;
//# sourceMappingURL=logger.d.ts.map