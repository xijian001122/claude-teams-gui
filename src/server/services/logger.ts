import { createWriteStream, WriteStream } from 'fs';
import { mkdir, stat, readdir, rename, unlink } from 'fs/promises';
import { join } from 'path';
import { format } from 'date-fns';

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
  maxSize: number;  // MB
  maxDays: number;  // 天
}

/**
 * 默认日志配置
 */
export const DEFAULT_LOG_CONFIG: LogConfig = {
  enabled: true,
  level: 'info',
  maxSize: 10,      // 10MB
  maxDays: 7        // 7天
};

/**
 * 原始 console 方法存储
 */
interface OriginalConsole {
  log: typeof console.log;
  info: typeof console.info;
  error: typeof console.error;
  warn: typeof console.warn;
}

/**
 * LoggerService - 结构化日志服务
 * 拦截 console 方法并写入文件，支持日志轮转
 */
export class LoggerService {
  private logDir: string;
  private config: LogConfig;
  private originalConsole: OriginalConsole;
  private currentDate: string;
  private isInitialized = false;
  private isDestroyed = false;

  // 当前日志文件流
  private consoleStream: WriteStream | null = null;
  private infoStream: WriteStream | null = null;
  private errorStream: WriteStream | null = null;

  // 缓冲
  private buffer: string[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private readonly BUFFER_SIZE = 100;
  private readonly FLUSH_INTERVAL = 1000; // 1秒

  constructor(logDir: string, config?: Partial<LogConfig>) {
    this.logDir = logDir;
    this.config = { ...DEFAULT_LOG_CONFIG, ...config };
    this.currentDate = format(new Date(), 'yyyy-MM-dd');
    this.originalConsole = {
      log: console.log,
      info: console.info,
      error: console.error,
      warn: console.warn
    };
  }

  /**
   * 初始化日志服务
   */
  async init(): Promise<void> {
    if (this.isInitialized || this.isDestroyed) {
      return;
    }

    // 确保日志目录存在
    await this.ensureLogDir();

    // 打开日志文件流
    await this.openStreams();

    // 拦截 console 方法
    this.interceptConsole();

    // 启动定时刷新
    this.startFlushTimer();

    // 执行初始清理（删除过期日志）
    await this.cleanupOldLogs();

    this.isInitialized = true;
    this.originalConsole.log('[LoggerService] Initialized');
  }

  /**
   * 销毁日志服务
   */
  destroy(): void {
    if (this.isDestroyed) {
      return;
    }

    this.isDestroyed = true;

    // 停止刷新定时器
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }

    // 刷新缓冲区
    this.flushSync();

    // 恢复原始 console 方法
    this.restoreConsole();

    // 关闭文件流
    this.closeStreams();

    this.originalConsole.log('[LoggerService] Destroyed');
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<LogConfig>): void {
    const oldEnabled = this.config.enabled;
    this.config = { ...this.config, ...config };

    // 如果禁用了日志，恢复原始 console
    if (oldEnabled && !this.config.enabled) {
      this.restoreConsole();
    }
    // 如果启用了日志，重新拦截
    else if (!oldEnabled && this.config.enabled && this.isInitialized) {
      this.interceptConsole();
    }

    this.originalConsole.log('[LoggerService] Config updated:', this.config);
  }

  /**
   * 获取当前配置
   */
  getConfig(): LogConfig {
    return { ...this.config };
  }

  /**
   * 确保日志目录存在
   */
  private async ensureLogDir(): Promise<void> {
    try {
      await mkdir(this.logDir, { recursive: true });
    } catch (err) {
      this.originalConsole.error('[LoggerService] Failed to create log directory:', err);
    }
  }

  /**
   * 打开日志文件流
   */
  private async openStreams(): Promise<void> {
    const dateStr = format(new Date(), 'yyyy-MM-dd');

    // 检查是否需要轮转（日期变化）
    if (dateStr !== this.currentDate) {
      await this.rotateByDate();
      this.currentDate = dateStr;
    }

    const consolePath = join(this.logDir, 'console.log');
    const infoPath = join(this.logDir, 'info.log');
    const errorPath = join(this.logDir, 'error.log');

    this.consoleStream = createWriteStream(consolePath, { flags: 'a' });
    this.infoStream = createWriteStream(infoPath, { flags: 'a' });
    this.errorStream = createWriteStream(errorPath, { flags: 'a' });
  }

  /**
   * 关闭日志文件流
   */
  private closeStreams(): void {
    this.consoleStream?.end();
    this.infoStream?.end();
    this.errorStream?.end();

    this.consoleStream = null;
    this.infoStream = null;
    this.errorStream = null;
  }

  /**
   * 拦截 console 方法
   */
  private interceptConsole(): void {
    if (!this.config.enabled) {
      return;
    }

    const self = this;

    // 拦截 console.log
    console.log = function(...args: any[]) {
      self.originalConsole.log(...args);
      self.writeLog('console', args);
    };

    // 拦截 console.info
    console.info = function(...args: any[]) {
      self.originalConsole.info(...args);
      self.writeLog('info', args);
    };

    // 拦截 console.error
    console.error = function(...args: any[]) {
      self.originalConsole.error(...args);
      self.writeLog('error', args);
    };

    // 拦截 console.warn
    console.warn = function(...args: any[]) {
      self.originalConsole.warn(...args);
      self.writeLog('warn', args);
    };
  }

  /**
   * 恢复原始 console 方法
   */
  private restoreConsole(): void {
    console.log = this.originalConsole.log;
    console.info = this.originalConsole.info;
    console.error = this.originalConsole.error;
    console.warn = this.originalConsole.warn;
  }

  /**
   * 写入日志
   */
  private writeLog(level: string, args: any[]): void {
    if (!this.config.enabled) {
      return;
    }

    // 根据级别过滤
    if (this.config.level === 'error' && level !== 'error') {
      return;
    }
    if (this.config.level === 'info' && level === 'console') {
      return;
    }

    // 格式化日志内容
    const timestamp = new Date().toISOString();
    const message = args.map(arg => {
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg);
        } catch {
          return String(arg);
        }
      }
      return String(arg);
    }).join(' ');

    const logLine = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;

    // 添加到缓冲区
    this.buffer.push(logLine);

    // 检查是否需要立即刷新
    if (this.buffer.length >= this.BUFFER_SIZE) {
      this.flush();
    }

    // 检查是否需要轮转（大小）
    this.checkRotation();
  }

  /**
   * 检查并执行轮转
   */
  private async checkRotation(): Promise<void> {
    try {
      // 检查日期变化
      const currentDateStr = format(new Date(), 'yyyy-MM-dd');
      if (currentDateStr !== this.currentDate) {
        await this.rotateByDate();
        this.currentDate = currentDateStr;
        return;
      }

      // 检查文件大小
      const consolePath = join(this.logDir, 'console.log');
      const stats = await stat(consolePath).catch(() => null);

      if (stats && stats.size >= this.config.maxSize * 1024 * 1024) {
        await this.rotateBySize();
      }
    } catch (err) {
      this.originalConsole.error('[LoggerService] Rotation check failed:', err);
    }
  }

  /**
   * 按日期轮转
   */
  private async rotateByDate(): Promise<void> {
    this.originalConsole.log(`[LoggerService] Rotating logs by date: ${this.currentDate}`);

    // 关闭当前流
    this.closeStreams();

    // 创建历史目录
    const historyDir = join(this.logDir, this.currentDate);
    await mkdir(historyDir, { recursive: true });

    // 获取下一个序号
    const nextIndex = await this.getNextIndex(historyDir);

    // 移动文件
    await this.moveToHistory(historyDir, nextIndex);

    // 重新打开流
    await this.openStreams();

    this.originalConsole.log(`[LoggerService] Date rotation completed`);
  }

  /**
   * 按大小轮转
   */
  private async rotateBySize(): Promise<void> {
    this.originalConsole.log('[LoggerService] Rotating logs by size');

    // 先刷新缓冲区
    await this.flush();

    // 关闭当前流
    this.closeStreams();

    // 创建历史目录（使用当前日期）
    const historyDir = join(this.logDir, this.currentDate);
    await mkdir(historyDir, { recursive: true });

    // 获取下一个序号
    const nextIndex = await this.getNextIndex(historyDir);

    // 移动文件
    await this.moveToHistory(historyDir, nextIndex);

    // 重新打开流
    await this.openStreams();

    this.originalConsole.log('[LoggerService] Size rotation completed');
  }

  /**
   * 获取历史目录中的下一个序号
   */
  private async getNextIndex(historyDir: string): Promise<number> {
    try {
      const files = await readdir(historyDir);
      const indices = files
        .filter(f => f.endsWith('.log'))
        .map(f => {
          const match = f.match(/-(\d{3})\.log$/);
          return match ? parseInt(match[1], 10) : 0;
        });

      return indices.length > 0 ? Math.max(...indices) + 1 : 1;
    } catch {
      return 1;
    }
  }

  /**
   * 移动当前日志到历史目录
   */
  private async moveToHistory(historyDir: string, index: number): Promise<void> {
    const indexStr = String(index).padStart(3, '0');

    const files = [
      { from: 'console.log', to: `console-${indexStr}.log` },
      { from: 'info.log', to: `info-${indexStr}.log` },
      { from: 'error.log', to: `error-${indexStr}.log` }
    ];

    for (const { from, to } of files) {
      const fromPath = join(this.logDir, from);
      const toPath = join(historyDir, to);

      try {
        await rename(fromPath, toPath);
      } catch (err) {
        // 文件可能不存在，忽略错误
      }
    }
  }

  /**
   * 清理过期日志
   */
  private async cleanupOldLogs(): Promise<void> {
    try {
      const entries = await readdir(this.logDir, { withFileTypes: true });
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.maxDays);

      for (const entry of entries) {
        if (entry.isDirectory()) {
          // 检查是否是日期目录
          const dirDate = new Date(entry.name);
          if (!isNaN(dirDate.getTime()) && dirDate < cutoffDate) {
            const dirPath = join(this.logDir, entry.name);
            await this.deleteDirectory(dirPath);
            this.originalConsole.log(`[LoggerService] Cleaned up old logs: ${entry.name}`);
          }
        }
      }
    } catch (err) {
      this.originalConsole.error('[LoggerService] Cleanup failed:', err);
    }
  }

  /**
   * 删除目录及其内容
   */
  private async deleteDirectory(dirPath: string): Promise<void> {
    try {
      const entries = await readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dirPath, entry.name);
        if (entry.isDirectory()) {
          await this.deleteDirectory(fullPath);
        } else {
          await unlink(fullPath);
        }
      }

      // Node.js 18+ 有 rmdir，但这里为了兼容性使用 fs/promises
      const { rmdir } = await import('fs/promises');
      await rmdir(dirPath);
    } catch (err) {
      this.originalConsole.error(`[LoggerService] Failed to delete directory ${dirPath}:`, err);
    }
  }

  /**
   * 启动定时刷新
   */
  private startFlushTimer(): void {
    this.flushInterval = setInterval(() => {
      this.flush();
    }, this.FLUSH_INTERVAL);
  }

  /**
   * 刷新缓冲区到文件
   */
  private async flush(): Promise<void> {
    if (this.buffer.length === 0) {
      return;
    }

    const lines = this.buffer.splice(0, this.buffer.length);
    const content = lines.join('');

    try {
      // 写入 console.log（所有级别）
      if (this.consoleStream) {
        this.consoleStream.write(content);
      }

      // 根据级别写入其他文件
      for (const line of lines) {
        if (line.includes('[INFO]') && this.infoStream) {
          this.infoStream.write(line);
        }
        if (line.includes('[ERROR]') && this.errorStream) {
          this.errorStream.write(line);
        }
      }
    } catch (err) {
      this.originalConsole.error('[LoggerService] Failed to write logs:', err);
    }
  }

  /**
   * 同步刷新缓冲区（用于销毁时）
   */
  private flushSync(): void {
    if (this.buffer.length === 0) {
      return;
    }

    const lines = [...this.buffer];
    this.buffer = [];

    const content = lines.join('');

    try {
      // 同步写入
      const { appendFileSync } = require('fs');

      const consolePath = join(this.logDir, 'console.log');
      appendFileSync(consolePath, content);

      for (const line of lines) {
        if (line.includes('[INFO]')) {
          const infoPath = join(this.logDir, 'info.log');
          appendFileSync(infoPath, line);
        }
        if (line.includes('[ERROR]')) {
          const errorPath = join(this.logDir, 'error.log');
          appendFileSync(errorPath, line);
        }
      }
    } catch (err) {
      this.originalConsole.error('[LoggerService] Failed to flush logs:', err);
    }
  }
}

// 导出单例
export default LoggerService;
