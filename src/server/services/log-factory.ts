/**
 * Pino 日志工厂
 * 创建具有 Logback 风格格式化的 Logger 实例
 */

import pino, { type Logger, type LoggerOptions } from 'pino';
import { join } from 'path';
import { mkdirSync, createWriteStream, type WriteStream, existsSync, readdirSync, renameSync, statSync, unlinkSync, rmdirSync } from 'fs';
import { homedir } from 'os';
import { format } from 'date-fns';
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
export const DEFAULT_LOG_FACTORY_CONFIG: LogFactoryConfig = {
  enabled: true,
  level: 'info',
  maxSize: 10,
  maxDays: 7,
  logDir: '',
  colorize: false
};

/**
 * ANSI 颜色代码
 */
const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
  cyan: '\x1b[36m'
};

/**
 * 日志级别颜色映射
 */
const LEVEL_COLORS: Record<string, string> = {
  ERROR: COLORS.red,
  WARN: COLORS.yellow,
  INFO: COLORS.green,
  DEBUG: COLORS.blue,
  TRACE: COLORS.gray
};

// 日志级别数值映射
const LEVEL_VALUES: Record<string, number> = {
  error: 50,
  warn: 40,
  info: 30,
  debug: 20,
  trace: 10
};

// 全局工厂配置
let globalConfig: LogFactoryConfig | null = null;

// 全局日志流
let consoleStream: WriteStream | null = null;
let infoStream: WriteStream | null = null;
let errorStream: WriteStream | null = null;
let currentDate: string = '';
let buffer: string[] = [];
let flushInterval: NodeJS.Timeout | null = null;
const BUFFER_SIZE = 100;
const FLUSH_INTERVAL = 1000;

/**
 * 扩展路径中的 ~ 为用户目录
 */
function expandHomeDir(path: string): string {
  if (path.startsWith('~/') || path === '~') {
    return join(homedir(), path.slice(1));
  }
  return path;
}

/**
 * 格式化时间戳为本地时间
 */
function formatTimestamp(time: number | string | Date): string {
  const date = time instanceof Date ? time : new Date(time);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  const second = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

/**
 * 格式化日志内容
 * 所有内容都在换行后以 `- ` 开头
 */
function formatContent(content: string): string {
  if (!content) return '';
  const lines = content.split('\n');
  return '\n' + lines.map(line => `- ${line}`).join('\n');
}

/**
 * 创建日志格式化函数
 */
function createFormatter(module: string, shorthand: string, colorize: boolean) {
  return (level: string, time: number | string, msg: string): string => {
    const timestamp = formatTimestamp(time);
    const levelName = level.toUpperCase().padEnd(5);
    const formattedMsg = formatContent(msg);

    if (colorize && process.stdout.isTTY) {
      const levelColor = LEVEL_COLORS[level.toUpperCase()] || COLORS.reset;
      const moduleColor = COLORS.cyan;
      return `${timestamp} ${moduleColor}[${module}]${COLORS.reset} ${levelColor}${levelName}${COLORS.reset} ${COLORS.gray}${shorthand}${COLORS.reset}${formattedMsg}\n`;
    }

    return `${timestamp} [${module}] ${levelName} ${shorthand}${formattedMsg}\n`;
  };
}

/**
 * 确保日志目录存在
 */
function ensureLogDir(logDir: string): void {
  const expanded = expandHomeDir(logDir);
  if (!existsSync(expanded)) {
    mkdirSync(expanded, { recursive: true });
  }
}

/**
 * 打开日志流
 */
function openStreams(): void {
  if (!globalConfig) return;

  const logDir = expandHomeDir(globalConfig.logDir);
  ensureLogDir(logDir);

  currentDate = format(new Date(), 'yyyy-MM-dd');

  consoleStream = createWriteStream(join(logDir, 'console.log'), { flags: 'a' });
  infoStream = createWriteStream(join(logDir, 'info.log'), { flags: 'a' });
  errorStream = createWriteStream(join(logDir, 'error.log'), { flags: 'a' });
}

/**
 * 关闭日志流
 */
function closeStreams(): void {
  consoleStream?.end();
  infoStream?.end();
  errorStream?.end();
  consoleStream = null;
  infoStream = null;
  errorStream = null;
}

/**
 * 刷新缓冲区
 */
function flush(): void {
  if (buffer.length === 0) return;

  const lines = buffer.splice(0, buffer.length);

  for (const line of lines) {
    try {
      consoleStream?.write(line);

      if (line.includes(' INFO ') || line.includes(' WARN ')) {
        infoStream?.write(line);
      }
      if (line.includes(' ERROR ') || line.includes(' FATAL ')) {
        errorStream?.write(line);
      }
    } catch {
      // 忽略错误
    }
  }
}

/**
 * 检查日志轮转
 */
function checkRotation(): void {
  if (!globalConfig) return;

  const dateStr = format(new Date(), 'yyyy-MM-dd');

  // 日期变化
  if (dateStr !== currentDate) {
    rotateByDate();
    currentDate = dateStr;
    return;
  }

  // 检查大小
  const logDir = expandHomeDir(globalConfig.logDir);
  const consolePath = join(logDir, 'console.log');
  try {
    if (existsSync(consolePath)) {
      const stats = statSync(consolePath);
      if (stats.size >= globalConfig.maxSize * 1024 * 1024) {
        rotateBySize();
      }
    }
  } catch {
    // 忽略错误
  }
}

/**
 * 按日期轮转
 */
function rotateByDate(): void {
  flush();
  closeStreams();

  const logDir = expandHomeDir(globalConfig!.logDir);
  const historyDir = join(logDir, currentDate);
  mkdirSync(historyDir, { recursive: true });

  const nextIndex = getNextIndex(historyDir);
  moveToHistory(historyDir, nextIndex);

  openStreams();
}

/**
 * 按大小轮转
 */
function rotateBySize(): void {
  flush();
  closeStreams();

  const logDir = expandHomeDir(globalConfig!.logDir);
  const historyDir = join(logDir, currentDate);
  mkdirSync(historyDir, { recursive: true });

  const nextIndex = getNextIndex(historyDir);
  moveToHistory(historyDir, nextIndex);

  openStreams();
}

/**
 * 获取下一个序号
 */
function getNextIndex(historyDir: string): number {
  try {
    const files = readdirSync(historyDir);
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
 * 移动文件到历史目录
 */
function moveToHistory(historyDir: string, index: number): void {
  const logDir = expandHomeDir(globalConfig!.logDir);
  const indexStr = String(index).padStart(3, '0');

  const files = [
    { from: 'console.log', to: `console-${indexStr}.log` },
    { from: 'info.log', to: `info-${indexStr}.log` },
    { from: 'error.log', to: `error-${indexStr}.log` }
  ];

  for (const { from, to } of files) {
    const fromPath = join(logDir, from);
    const toPath = join(historyDir, to);
    try {
      if (existsSync(fromPath)) {
        renameSync(fromPath, toPath);
      }
    } catch {
      // 忽略错误
    }
  }
}

/**
 * 清理过期日志
 */
function cleanupOldLogs(): void {
  if (!globalConfig) return;

  const logDir = expandHomeDir(globalConfig.logDir);
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - globalConfig.maxDays);

  try {
    const entries = readdirSync(logDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const dirDate = new Date(entry.name);
        if (!isNaN(dirDate.getTime()) && dirDate < cutoffDate) {
          const dirPath = join(logDir, entry.name);
          deleteDirectory(dirPath);
        }
      }
    }
  } catch {
    // 忽略错误
  }
}

/**
 * 删除目录
 */
function deleteDirectory(dirPath: string): void {
  try {
    const entries = readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);
      if (entry.isDirectory()) {
        deleteDirectory(fullPath);
      } else {
        unlinkSync(fullPath);
      }
    }
    rmdirSync(dirPath);
  } catch {
    // 忽略错误
  }
}

/**
 * 启动定时刷新
 */
function startFlushTimer(): void {
  if (flushInterval) return;

  flushInterval = setInterval(() => {
    flush();
  }, FLUSH_INTERVAL);
}

/**
 * 停止定时刷新
 */
function stopFlushTimer(): void {
  if (flushInterval) {
    clearInterval(flushInterval);
    flushInterval = null;
  }
}

/**
 * 写入日志行
 */
function writeLogLine(line: string): void {
  buffer.push(line);

  if (buffer.length >= BUFFER_SIZE) {
    flush();
  }

  checkRotation();
}

/**
 * 创建 Logger 实例
 */
export function createLogger(moduleConfig: ModuleConfig): Logger {
  // Auto-initialize with defaults if not yet configured
  if (!globalConfig) {
    const defaultLogDir = expandHomeDir('~/.claude-chat/logs');
    initLogFactory({
      ...DEFAULT_LOG_FACTORY_CONFIG,
      logDir: defaultLogDir,
      colorize: process.env.NODE_ENV !== 'production'
    });
  }

  const { enabled, level, colorize } = globalConfig!;
  const { module, shorthand } = moduleConfig;

  if (!enabled) {
    return pino({ level: 'silent' });
  }

  const formatter = createFormatter(module, shorthand, colorize ?? false);
  const pinoLevel = level === 'console' ? 'debug' : level;
  const levelValue = LEVEL_VALUES[pinoLevel] ?? 30;

  // 创建自定义 stream
  const stream = {
    write: (data: string) => {
      try {
        const log = JSON.parse(data);
        const { level: lvl, time, msg } = log;
        const levelName = pino.levels.labels[lvl] || 'info';

        // 过滤级别
        if (lvl < levelValue) return;

        const line = formatter(levelName, time, msg || '');
        writeLogLine(line);

        // 同时输出到终端
        if (colorize && process.stdout.isTTY) {
          process.stdout.write(line);
        }
      } catch {
        // 忽略解析错误
      }
    }
  };

  const options: LoggerOptions = {
    level: pinoLevel,
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: (label) => ({ level: label }),
      bindings: () => ({})
    },
    messageKey: 'msg'
  };

  return pino(options, stream as any);
}

/**
 * 检查并轮转启动时存在的旧日志文件
 */
function rotateExistingLogs(logDir: string, todayStr: string): void {
  const consolePath = join(logDir, 'console.log');
  try {
    if (!existsSync(consolePath)) return;

    const stats = statSync(consolePath);
    const fileDate = format(stats.mtime, 'yyyy-MM-dd');

    // 日志文件修改时间不是今天，需要轮转到对应日期目录
    if (fileDate !== todayStr) {
      const historyDir = join(logDir, fileDate);
      mkdirSync(historyDir, { recursive: true });

      const nextIndex = getNextIndex(historyDir);
      moveToHistory(historyDir, nextIndex);
    }
  } catch {
    // 忽略错误
  }
}

/**
 * 初始化日志工厂
 */
export function initLogFactory(config: LogFactoryConfig): void {
  globalConfig = config;

  const logDir = expandHomeDir(config.logDir);
  ensureLogDir(logDir);

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  // 启动时检查并轮转旧日志
  rotateExistingLogs(logDir, todayStr);

  currentDate = todayStr;
  openStreams();
  startFlushTimer();
  cleanupOldLogs();
}

/**
 * 更新日志配置
 */
export function updateLogConfig(updates: Partial<LogFactoryConfig>): void {
  if (globalConfig) {
    globalConfig = { ...globalConfig, ...updates };
  }
}

/**
 * 关闭日志工厂
 */
export function closeLogFactory(): void {
  flush();
  stopFlushTimer();
  closeStreams();
}

/**
 * 创建 Fastify logger
 */
export function createFastifyLogger(): Logger {
  return createLogger({
    module: 'HTTP',
    shorthand: 's.http'
  });
}

/**
 * 获取全局配置
 */
export function getGlobalConfig(): LogFactoryConfig | null {
  return globalConfig;
}

export default {
  createLogger,
  initLogFactory,
  updateLogConfig,
  closeLogFactory,
  createFastifyLogger,
  getGlobalConfig
};
