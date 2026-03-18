import type { ConfigChange } from '@shared/types';
import { Icon } from './Icon';

interface ConfigChangeDialogProps {
  isOpen: boolean;
  changes: ConfigChange[];
  onClose: () => void;
  onConfirm: () => void;
}

// Config key display names
const CONFIG_KEY_NAMES: Record<string, string> = {
  port: '服务端口',
  host: '绑定地址',
  dataDir: '数据目录',
  teamsPath: '团队路径',
  retentionDays: '消息保留天数',
  theme: '主题',
  desktopNotifications: '桌面通知',
  soundEnabled: '消息提示音',
  cleanupEnabled: '自动清理',
  cleanupTime: '清理时间'
};

export function ConfigChangeDialog({
  isOpen,
  changes,
  onClose,
  onConfirm
}: ConfigChangeDialogProps) {
  if (!isOpen) return null;

  const restartChanges = changes.filter(c => c.requiresRestart);
  const hotReloadChanges = changes.filter(c => !c.requiresRestart);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--bg-primary)] rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border-color)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            配置变更确认
          </h2>
        </div>

        {/* Change List */}
        <div className="px-6 py-4 max-h-64 overflow-y-auto">
          {restartChanges.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-red-500 mb-2 flex items-center gap-1.5">
                <Icon icon="alert-circle" size={14} />
                需要重启生效
              </h3>
              <div className="space-y-2">
                {restartChanges.map((change, index) => (
                  <ChangeItem key={index} change={change} />
                ))}
              </div>
            </div>
          )}

          {hotReloadChanges.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-green-500 mb-2 flex items-center gap-1.5">
                <Icon icon="check-circle" size={14} />
                已自动生效
              </h3>
              <div className="space-y-2">
                {hotReloadChanges.map((change, index) => (
                  <ChangeItem key={index} change={change} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Warning */}
        {restartChanges.length > 0 && (
          <div className="px-6 py-3 bg-amber-50 dark:bg-amber-900/20 border-y border-amber-100 dark:border-amber-800">
            <p className="text-sm text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
              <Icon icon="alert-triangle" size={14} />
              部分配置需要重启服务才能生效
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors text-sm font-medium"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors text-sm font-medium"
          >
            {restartChanges.length > 0 ? '确认并重启' : '确认'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface ChangeItemProps {
  change: ConfigChange;
  key?: number | string;
}

function ChangeItem({ change }: ChangeItemProps) {
  const displayName = CONFIG_KEY_NAMES[change.key] || change.key;
  const formatValue = (value: any) => {
    if (value === true) return '开启';
    if (value === false) return '关闭';
    if (value === null || value === undefined) return '-';
    return String(value);
  };

  return (
    <div className="flex items-center justify-between py-2 px-3 bg-[var(--bg-secondary)] rounded-md">
      <span className="text-sm text-[var(--text-primary)]">{displayName}</span>
      <div className="flex items-center gap-2 text-sm">
        <span className="text-[var(--text-secondary)] line-through">
          {formatValue(change.oldValue)}
        </span>
        <Icon icon="arrow-right" size={14} className="text-[var(--text-secondary)]" />
        <span className="text-[var(--text-primary)] font-medium">
          {formatValue(change.newValue)}
        </span>
      </div>
    </div>
  );
}
