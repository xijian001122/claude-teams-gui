import { useState, useEffect } from 'preact/hooks';
import type { ConfigChange, AppConfig } from '@shared/types';
import { Icon } from './Icon';
import { ConfigChangeDialog } from './ConfigChangeDialog';
import { ToastContainer, useToast } from './Toast';
import { LogConfigPanel } from './LogConfigPanel';
import { api } from '../utils/api';

interface SettingsPageProps {
  pendingConfigRestart: boolean;
  pendingChanges: ConfigChange[];
  onRestartComplete?: () => void;
}

// Config key display names and hints
const CONFIG_METADATA: Record<string, { name: string; hint?: string; type: string }> = {
  dataDir: { name: '数据保存目录', hint: '消息和配置文件的存储路径', type: 'text' },
  teamsPath: { name: 'Claude Teams 路径', hint: 'Claude Code Teams 配置目录', type: 'text' },
  retentionDays: { name: '消息保留天数', hint: '超过此天数的消息将被自动清理', type: 'number' },
  theme: { name: '主题', type: 'select', hint: '界面主题' },
  desktopNotifications: { name: '桌面通知', type: 'toggle', hint: '收到新消息时显示系统通知' },
  soundEnabled: { name: '消息提示音', type: 'toggle', hint: '收到消息时播放声音' },
  cleanupEnabled: { name: '自动清理', type: 'toggle', hint: '自动清理过期消息' },
  cleanupTime: { name: '清理时间', type: 'text', hint: '每日清理执行时间 (HH:MM)' }
};

const RESTART_REQUIRED_KEYS = ['dataDir', 'teamsPath'];

export function SettingsPage({ pendingConfigRestart, pendingChanges, onRestartComplete }: SettingsPageProps) {
  const [config, setConfig] = useState<Partial<AppConfig>>({});
  const [originalConfig, setOriginalConfig] = useState<Partial<AppConfig>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'advanced' | 'logging'>('general');
  const [currentChanges, setCurrentChanges] = useState<ConfigChange[]>([]);
  const { toasts, closeToast, success, error } = useToast();

  // Load config on mount
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      // api.get 返回 ApiResponse<T>，其中 data 字段包含实际数据
      const response = await api.get<Partial<AppConfig>>('/settings');
      console.log('[SettingsPage] API response:', response);
      if (response.success && response.data) {
        console.log('[SettingsPage] Setting config:', response.data);
        setConfig(response.data);
        setOriginalConfig(response.data);
      } else {
        console.warn('[SettingsPage] Invalid response:', response);
      }
    } catch (err) {
      console.error('Failed to load config:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Find changed values
      const changes: Partial<AppConfig> = {};
      for (const key of Object.keys(config)) {
        if (config[key as keyof AppConfig] !== originalConfig[key as keyof AppConfig]) {
          changes[key as keyof AppConfig] = config[key as keyof AppConfig] as any;
        }
      }

      if (Object.keys(changes).length === 0) {
        setSaving(false);
        return;
      }

      // Build ConfigChange array for dialog display
      const configChanges: ConfigChange[] = Object.entries(changes).map(([key, newValue]) => ({
        key,
        oldValue: originalConfig[key as keyof AppConfig],
        newValue,
        requiresRestart: RESTART_REQUIRED_KEYS.includes(key)
      }));
      setCurrentChanges(configChanges);

      const hasRestartRequired = Object.keys(changes).some(key =>
        RESTART_REQUIRED_KEYS.includes(key)
      );

      if (hasRestartRequired) {
        setShowDialog(true);
      } else {
        await api.put('/settings', changes);
        setOriginalConfig({ ...config });
        success('保存成功');
      }
    } catch (err) {
      console.error('Failed to save config:', err);
      error('保存失败: ' + (err instanceof Error ? err.message : '未知错误'));
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmRestart = async () => {
    try {
      // Build changes object from currentChanges
      const changes: Partial<AppConfig> = {};
      currentChanges.forEach(change => {
        changes[change.key as keyof AppConfig] = change.newValue as any;
      });

      // Save settings first
      await api.put('/settings', changes);
      setOriginalConfig({ ...config });

      success('正在重启服务器，请稍候...');
      setShowDialog(false);
      setCurrentChanges([]);

      // Call restart API (may fail if server restarts too quickly)
      try {
        await api.post('/settings/restart', {});
      } catch {
        // Server may have restarted before response, this is expected
      }

      // Wait for server to restart
      setTimeout(() => {
        // Check if server is back by pinging health endpoint
        checkServerReady();
      }, 3000);
    } catch (err) {
      console.error('Failed to save config:', err);
      error('保存失败: ' + (err instanceof Error ? err.message : '未知错误'));
      setSaving(false);
    }
  };

  const checkServerReady = async () => {
    const maxRetries = 10;
    let retries = 0;

    const check = async () => {
      try {
        // Try to ping the server
        await api.get('/settings');
        // Server is back
        success('服务器已重启，配置生效');
        onRestartComplete?.();
        setSaving(false);
      } catch {
        retries++;
        if (retries < maxRetries) {
          setTimeout(check, 1000);
        } else {
          error('服务器重启超时，请手动刷新页面');
          setSaving(false);
        }
      }
    };

    check();
  };

  const handleDismissRestart = () => {
    // Dismiss the restart notice
    console.log('Restart dismissed');
  };

  const updateConfig = (key: keyof AppConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const hasChanges = () => {
    return Object.keys(config).some(
      key => config[key as keyof AppConfig] !== originalConfig[key as keyof AppConfig]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-[var(--text-secondary)]">加载中...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[var(--bg-primary)]">
      {/* Warning Notice Bar */}
      {pendingConfigRestart && (
        <div className="px-6 py-4 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-100 dark:border-amber-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <Icon icon="alert-triangle" size={18} />
              <span className="font-medium">检测到配置变更，需要重启服务才能生效</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  // 如果有当前变更，显示确认对话框
                  // 否则使用待处理的变更（来自 WebSocket 更新）
                  if (currentChanges.length > 0) {
                    setShowDialog(true);
                  } else if (pendingChanges.length > 0) {
                    setCurrentChanges(pendingChanges);
                    setShowDialog(true);
                  } else {
                    // 没有变更记录，直接触发重启提示
                    onRestartComplete?.();
                  }
                }}
                className="px-3 py-1.5 rounded-md bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors"
              >
                立即重启
              </button>
              <button
                onClick={handleDismissRestart}
                className="px-3 py-1.5 rounded-md text-amber-700 dark:text-amber-400 text-sm hover:bg-amber-100 dark:hover:bg-amber-800/50 transition-colors"
              >
                稍后
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="px-6 border-b border-[var(--border-color)]">
        <div className="flex gap-6">
          <TabButton
            active={activeTab === 'general'}
            onClick={() => setActiveTab('general')}
            label="常规"
          />
          <TabButton
            active={activeTab === 'notifications'}
            onClick={() => setActiveTab('notifications')}
            label="通知"
          />
          <TabButton
            active={activeTab === 'advanced'}
            onClick={() => setActiveTab('advanced')}
            label="高级"
          />
          <TabButton
            active={activeTab === 'logging'}
            onClick={() => setActiveTab('logging')}
            label="日志"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'general' && (
          <div className="space-y-6 max-w-lg">
            <ConfigField
              config={config}
              field="theme"
              onChange={updateConfig}
            />
            <ConfigField
              config={config}
              field="retentionDays"
              onChange={updateConfig}
            />
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-6 max-w-lg">
            <ConfigToggle
              config={config}
              field="desktopNotifications"
              onChange={updateConfig}
            />
            <ConfigToggle
              config={config}
              field="soundEnabled"
              onChange={updateConfig}
            />
          </div>
        )}

        {activeTab === 'advanced' && (
          <div className="space-y-6 max-w-lg">
            <ConfigField
              config={config}
              field="dataDir"
              onChange={updateConfig}
            />
            <ConfigField
              config={config}
              field="teamsPath"
              onChange={updateConfig}
            />
            <ConfigField
              config={config}
              field="cleanupTime"
              onChange={updateConfig}
            />
            <ConfigToggle
              config={config}
              field="cleanupEnabled"
              onChange={updateConfig}
            />
          </div>
        )}

        {activeTab === 'logging' && (
          <div className="max-w-lg">
            <LogConfigPanel />
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="px-6 py-4 border-t border-[var(--border-color)] flex justify-end gap-3">
        <button
          onClick={() => setConfig({ ...originalConfig })}
          disabled={!hasChanges()}
          className="px-4 py-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          重置
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !hasChanges()}
          className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? '保存中...' : '保存'}
        </button>
      </div>

      {/* Config Change Dialog */}
      <ConfigChangeDialog
        isOpen={showDialog}
        changes={currentChanges}
        onClose={() => {
          setShowDialog(false);
          setCurrentChanges([]);
        }}
        onConfirm={handleConfirmRestart}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={closeToast} />
    </div>
  );
}

function TabButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`py-3 text-sm font-medium border-b-2 transition-colors ${
        active
          ? 'border-blue-500 text-blue-500'
          : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
      }`}
    >
      {label}
    </button>
  );
}

interface ConfigFieldProps {
  config: Partial<AppConfig>;
  field: keyof AppConfig;
  onChange: (key: keyof AppConfig, value: any) => void;
}

function ConfigField({ config, field, onChange }: ConfigFieldProps) {
  const meta = CONFIG_METADATA[field];
  if (!meta) return null;

  // 提供默认值，防止 undefined 导致显示问题
  const value = config[field] ?? (meta.type === 'number' ? 0 : meta.type === 'select' ? 'auto' : '');
  const requiresRestart = RESTART_REQUIRED_KEYS.includes(field);

  // Debug log
  console.log(`[ConfigField] field=${field}, config[field]=`, config[field], `, value=`, value);

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
        {meta.name}
        {requiresRestart && (
          <span className="text-xs text-amber-600 dark:text-amber-400">(需重启)</span>
        )}
      </label>
      {meta.type === 'select' ? (
        <select
          value={value as string}
          onChange={(e) => onChange(field, (e.target as HTMLSelectElement).value)}
          className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:border-blue-500 focus:outline-none"
        >
          <option value="auto">自动</option>
          <option value="light">浅色</option>
          <option value="dark">深色</option>
        </select>
      ) : (
        <input
          type={meta.type}
          value={value as string | number}
          onChange={(e) => {
            const newValue = meta.type === 'number'
              ? parseInt((e.target as HTMLInputElement).value, 10)
              : (e.target as HTMLInputElement).value;
            onChange(field, newValue);
          }}
          className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:border-blue-500 focus:outline-none"
        />
      )}
      {meta.hint && (
        <p className="text-xs text-[var(--text-secondary)]">{meta.hint}</p>
      )}
    </div>
  );
}

function ConfigToggle({ config, field, onChange }: ConfigFieldProps) {
  const meta = CONFIG_METADATA[field];
  if (!meta) return null;

  // 提供默认值，防止 undefined 导致显示问题
  // 注意：?? 的优先级高于 as，所以需要括号
  const value = (config[field] as boolean | undefined) ?? false;

  // Debug log
  console.log(`[ConfigToggle] field=${field}, config[field]=`, config[field], `, value=`, value);

  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <label className="text-sm font-medium text-[var(--text-primary)]">{meta.name}</label>
        {meta.hint && (
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">{meta.hint}</p>
        )}
      </div>
      <button
        onClick={() => onChange(field, !value)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          value ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
            value ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
