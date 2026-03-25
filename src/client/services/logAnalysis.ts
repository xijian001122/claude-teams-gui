import { api } from '../utils/api';

export interface LogAnalysisResult {
  totalErrors: number;
  timeRange: string;
  errors: ClassifiedError[];
}

export interface ClassifiedError {
  type: 'Database' | 'Network' | 'Permission' | 'Unknown';
  count: number;
  messages: string[];
  suggestion: string;
}

// Error classification patterns
const ERROR_PATTERNS = {
  Database: [/SQLITE/i, /database/i, /DB_ERROR/i, /SQL/i, /sqlite/i],
  Network: [/ECONNREFUSED/i, /timeout/i, /fetch/i, /network/i, /ENOTFOUND/i, /ETIMEDOUT/i, /ECONNRESET/i],
  Permission: [/EACCES/i, /EPERM/i, /permission denied/i, /access denied/i, /unauthorized/i]
};

// Fix suggestions for each error type
const FIX_SUGGESTIONS: Record<string, string> = {
  Database: '检查数据库文件权限，确保磁盘空间充足，或重启服务恢复连接。',
  Network: '检查网络连接，确认目标服务是否运行，或调整超时配置。',
  Permission: '检查文件/目录权限 (chmod/chown)，确保运行用户有足够权限。',
  Unknown: '查看详细错误日志，联系管理员或提交 Issue。'
};

/**
 * Analyze error.log file and generate report
 */
export async function analyzeLogs(dateRange?: { start: Date; end: Date }): Promise<LogAnalysisResult> {
  try {
    // Fetch error.log content from API
    const response = await api.get<string>('/logs/error');
    if (!response.success || !response.data) {
      return {
        totalErrors: 0,
        timeRange: 'N/A',
        errors: []
      };
    }

    const logContent = response.data;
    const lines = logContent.split('\n').filter(line => line.trim());

    // Parse and classify errors
    const classifiedErrors = new Map<string, ClassifiedError>();

    for (const line of lines) {
      const errorType = classifyError(line);
      const existing = classifiedErrors.get(errorType);

      if (existing) {
        existing.count++;
        if (existing.messages.length < 3) { // Keep first 3 unique messages
          existing.messages.push(line);
        }
      } else {
        classifiedErrors.set(errorType, {
          type: errorType,
          count: 1,
          messages: [line],
          suggestion: FIX_SUGGESTIONS[errorType]
        });
      }
    }

    // Calculate time range from log lines
    const timestamps = lines
      .map(line => {
        const match = line.match(/\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}/);
        return match ? new Date(match[0]) : null;
      })
      .filter((t): t is Date => t !== null);

    const timeRange = timestamps.length > 0
      ? `${formatDate(timestamps[0])} - ${formatDate(timestamps[timestamps.length - 1])}`
      : 'last 24 hours';

    return {
      totalErrors: lines.length,
      timeRange,
      errors: Array.from(classifiedErrors.values()).sort((a, b) => b.count - a.count)
    };
  } catch (err) {
    console.error('Failed to analyze logs:', err);
    return {
      totalErrors: 0,
      timeRange: 'N/A',
      errors: [{
        type: 'Unknown',
        count: 1,
        messages: ['无法读取错误日志文件'],
        suggestion: '确保日志服务已启用，并检查日志目录权限。'
      }]
    };
  }
}

/**
 * Classify error based on message content
 */
function classifyError(message: string): 'Database' | 'Network' | 'Permission' | 'Unknown' {
  for (const [type, patterns] of Object.entries(ERROR_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(message)) {
        return type as 'Database' | 'Network' | 'Permission';
      }
    }
  }
  return 'Unknown';
}

/**
 * Format date for display
 */
function formatDate(date: Date): string {
  return date.toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Generate markdown report from analysis result
 */
export function generateReport(result: LogAnalysisResult): string {
  if (result.totalErrors === 0) {
    return `## Log Analysis Report

✅ 未发现错误日志。系统运行正常！`;
  }

  const lines = [
    '## Log Analysis Report',
    '',
    '### Summary',
    `- **Total errors**: ${result.totalErrors}`,
    `- **Time range**: ${result.timeRange}`,
    '',
    '### Error Breakdown'
  ];

  result.errors.forEach((error, index) => {
    lines.push('');
    lines.push(`${index + 1}. **[${error.type}]** ${error.count} 个错误`);
    lines.push('');
    lines.push('   **示例消息:**');
    error.messages.slice(0, 2).forEach(msg => {
      const truncated = msg.length > 100 ? msg.substring(0, 100) + '...' : msg;
      lines.push(`   - \`${truncated}\``);
    });
    lines.push('');
    lines.push(`   **💡 建议:** ${error.suggestion}`);
  });

  lines.push('');
  lines.push('---');
  lines.push('*使用 `/log-fix` 重新分析*');

  return lines.join('\n');
}
