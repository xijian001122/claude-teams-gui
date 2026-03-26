import { useState, useEffect } from 'preact/hooks';
import type { LogConfig, AppConfig } from '@shared/types';
import { api } from '../utils/api';

interface LogConfigPanelProps {
  onChange?: (config: LogConfig) => void;
}

const DEFAULT_CONFIG: LogConfig = {
  enabled: true,
  level: 'console',
  maxSize: 10,
  maxDays: 7
};

export function LogConfigPanel({ onChange }: LogConfigPanelProps) {
  const [config, setConfig] = useState<LogConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);

  // Load config on mount
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await api.get<AppConfig>('/settings');
      if (response.success && response.data) {
        const logConfig = response.data.logConfig || DEFAULT_CONFIG;
        setConfig(logConfig);
      }
    } catch (err) {
      console.error('Failed to load log config:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = <K extends keyof LogConfig>(key: K, value: LogConfig[K]) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    // 通知父组件配置变更
    onChange?.(newConfig);
  };

  if (loading) {
    return (
      <div className="p-4 text-[var(--text-secondary)]">
        加载中...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enable Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium text-[var(--text-primary)]">启用日志记录</label>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">捕获并保存 console 输出到文件</p>
        </div>
        <button
          onClick={() => handleChange('enabled', !config.enabled)}
          className={`relative w-11 h-6 rounded-full transition-colors ${
            config.enabled ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
              config.enabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Log Level Selection */}
      <div className={`space-y-3 ${!config.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
        <label className="text-sm font-medium text-[var(--text-primary)]">日志级别</label>
        <div className="space-y-2">
          <RadioOption
            value="error"
            label="仅错误 (error)"
            description="只记录 error 级别的日志"
            checked={config.level === 'error'}
            onChange={() => handleChange('level', 'error')}
          />
          <RadioOption
            value="info"
            label="信息 (info)"
            description="记录 info 和 error 级别的日志"
            checked={config.level === 'info'}
            onChange={() => handleChange('level', 'info')}
          />
          <RadioOption
            value="console"
            label="全部 (console)"
            description="记录所有 console 输出 (log, info, warn, error)"
            checked={config.level === 'console'}
            onChange={() => handleChange('level', 'console')}
          />
        </div>
      </div>

      {/* File Size Limit */}
      <div className={`space-y-2 ${!config.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
        <label className="text-sm font-medium text-[var(--text-primary)]">单文件大小限制</label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={1}
            max={100}
            value={config.maxSize}
            onChange={(e) => handleChange('maxSize', parseInt((e.target as HTMLInputElement).value, 10) || 10)}
            className="w-24 px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:border-blue-500 focus:outline-none"
          />
          <span className="text-sm text-[var(--text-secondary)]">MB</span>
        </div>
        <p className="text-xs text-[var(--text-secondary)]">达到此大小时自动创建新日志文件</p>
      </div>

      {/* Retention Days */}
      <div className={`space-y-2 ${!config.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
        <label className="text-sm font-medium text-[var(--text-primary)]">日志保留天数</label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={1}
            max={90}
            value={config.maxDays}
            onChange={(e) => handleChange('maxDays', parseInt((e.target as HTMLInputElement).value, 10) || 7)}
            className="w-24 px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:border-blue-500 focus:outline-none"
          />
          <span className="text-sm text-[var(--text-secondary)]">天</span>
        </div>
        <p className="text-xs text-[var(--text-secondary)]">超过此天数的日志文件将被自动删除</p>
      </div>
    </div>
  );
}

interface RadioOptionProps {
  value: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}

function RadioOption({ label, description, checked, onChange }: RadioOptionProps) {
  return (
    <label
      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
        checked
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
          : 'border-[var(--border-color)] hover:bg-[var(--bg-secondary)]'
      }`}
      onClick={onChange}
    >
      <input
        type="radio"
        checked={checked}
        onChange={onChange}
        className="mt-0.5 w-4 h-4 text-blue-500 focus:ring-blue-500"
      />
      <div>
        <div className={`text-sm font-medium ${checked ? 'text-blue-700 dark:text-blue-400' : 'text-[var(--text-primary)]'}`}>
          {label}
        </div>
        <div className="text-xs text-[var(--text-secondary)] mt-0.5">{description}</div>
      </div>
    </label>
  );
}
