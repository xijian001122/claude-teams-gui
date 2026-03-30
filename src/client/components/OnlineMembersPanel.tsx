import type { MemberStatusInfo } from '@shared/types';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface OnlineMembersPanelProps {
  memberStatuses: MemberStatusInfo[];
  onClose: () => void;
  onViewContext?: (memberName: string) => void;
}

export function OnlineMembersPanel({
  memberStatuses,
  onClose,
  onViewContext
}: OnlineMembersPanelProps) {
  // Group members by status
  const busyMembers = memberStatuses.filter(m => m.status === 'busy');
  const occupiedMembers = memberStatuses.filter(m => m.status === 'occupied');
  const idleMembers = memberStatuses.filter(m => m.status === 'idle');
  const offlineMembers = memberStatuses.filter(m => m.status === 'offline');

  const formatLastActivity = (timestamp: number): string => {
    try {
      return formatDistanceToNow(timestamp, {
        addSuffix: true,
        locale: zhCN
      });
    } catch {
      return '未知时间';
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'busy':
        return '正在处理任务';
      case 'idle':
        return '等待任务中';
      case 'occupied':
        return '长时间工作中';
      case 'offline':
        return '已离线';
      default:
        return '未知状态';
    }
  };

  // Count online (not offline)
  const onlineCount = memberStatuses.filter(m => m.status !== 'offline').length;

  return (
    <div className="absolute left-0 top-[calc(100%+8px)] w-[360px] bg-[var(--bg-primary)] rounded-xl shadow-xl z-50 overflow-hidden border border-[var(--border-color)]">
      {/* Header */}
      <div className="px-4 py-4 border-b border-[var(--border-color)] flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          团队成员
        </h3>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {onlineCount} 人在线
        </span>
      </div>

      {/* Content */}
      <div className="max-h-80 overflow-y-auto">
        {memberStatuses.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            暂无成员
          </div>
        ) : (
          <div>
            {/* Busy Group - 执行中 */}
            {busyMembers.length > 0 && (
              <div className="py-3 border-b border-[var(--border-color)]">
                <div className="flex items-center gap-1.5 px-4 pb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                  <span className="w-3.5 h-3.5 rounded-full bg-red-500"></span>
                  <span>执行中</span>
                  <span className="ml-1 px-1.5 py-0.5 bg-[var(--bg-tertiary)] rounded text-[10px]">{busyMembers.length}</span>
                </div>
                {busyMembers.map(member => (
                  <MemberItem
                    key={member.memberName}
                    member={member}
                    formatLastActivity={formatLastActivity}
                    getStatusLabel={getStatusLabel}
                    onViewContext={onViewContext}
                  />
                ))}
              </div>
            )}

            {/* Occupied Group - 繁忙 */}
            {occupiedMembers.length > 0 && (
              <div className="py-3 border-b border-[var(--border-color)]">
                <div className="flex items-center gap-1.5 px-4 pb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                  <span className="w-3.5 h-3.5 rounded-full bg-yellow-500"></span>
                  <span>繁忙</span>
                  <span className="ml-1 px-1.5 py-0.5 bg-[var(--bg-tertiary)] rounded text-[10px]">{occupiedMembers.length}</span>
                </div>
                {occupiedMembers.map(member => (
                  <MemberItem
                    key={member.memberName}
                    member={member}
                    formatLastActivity={formatLastActivity}
                    getStatusLabel={getStatusLabel}
                    onViewContext={onViewContext}
                  />
                ))}
              </div>
            )}

            {/* Idle Group - 空闲 */}
            {idleMembers.length > 0 && (
              <div className="py-3 border-b border-[var(--border-color)]">
                <div className="flex items-center gap-1.5 px-4 pb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                  <span className="w-3.5 h-3.5 rounded-full bg-green-500"></span>
                  <span>空闲</span>
                  <span className="ml-1 px-1.5 py-0.5 bg-[var(--bg-tertiary)] rounded text-[10px]">{idleMembers.length}</span>
                </div>
                {idleMembers.map(member => (
                  <MemberItem
                    key={member.memberName}
                    member={member}
                    formatLastActivity={formatLastActivity}
                    getStatusLabel={getStatusLabel}
                    onViewContext={onViewContext}
                  />
                ))}
              </div>
            )}

            {/* Offline Group - 离线 */}
            {offlineMembers.length > 0 && (
              <div className="py-3">
                <div className="flex items-center gap-1.5 px-4 pb-2 text-xs font-medium text-gray-400 dark:text-gray-500">
                  <span className="w-3.5 h-3.5 rounded-full bg-gray-400"></span>
                  <span>离线</span>
                  <span className="ml-1 px-1.5 py-0.5 bg-[var(--bg-tertiary)] rounded text-[10px]">{offlineMembers.length}</span>
                </div>
                {offlineMembers.map(member => (
                  <MemberItem
                    key={member.memberName}
                    member={member}
                    formatLastActivity={formatLastActivity}
                    getStatusLabel={getStatusLabel}
                    onViewContext={onViewContext}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface MemberItemProps {
  member: MemberStatusInfo;
  formatLastActivity: (timestamp: number) => string;
  getStatusLabel: (status: string) => string;
  onViewContext?: (memberName: string) => void;
}

function MemberItem({ member, formatLastActivity, getStatusLabel, onViewContext }: MemberItemProps) {
  const avatarLetter = member.memberName.charAt(0).toUpperCase();

  const getAvatarColor = (name: string): string => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-red-500',
      'bg-teal-500'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const getStatusDotColor = (status: string): string => {
    switch (status) {
      case 'busy': return 'bg-red-500';
      case 'occupied': return 'bg-yellow-500';
      case 'idle': return 'bg-green-500';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'busy':
        return { text: '执行中', class: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' };
      case 'occupied':
        return { text: '繁忙', class: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' };
      case 'idle':
        return { text: '空闲', class: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' };
      case 'offline':
        return { text: '离线', class: 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]' };
      default:
        return { text: '未知', class: 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]' };
    }
  };

  const badge = getStatusBadge(member.status);

  return (
    <div className="flex items-center gap-4 px-5 py-3.5 hover:bg-[var(--bg-secondary)] transition-colors">
      {/* Avatar with Status Indicator */}
      <div className="relative flex-shrink-0">
        <div className={`w-11 h-11 rounded-full ${getAvatarColor(member.memberName)} flex items-center justify-center text-white text-base font-semibold`}>
          {avatarLetter}
        </div>
        <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[var(--bg-primary)] ${getStatusDotColor(member.status)}`} />
      </div>

      {/* Member Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-medium text-gray-900 dark:text-white truncate">
            {member.memberName}
          </span>
          {member.status !== 'offline' && (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${badge.class}`}>
              {badge.text}
            </span>
          )}
        </div>
        <div className="text-[13px] text-gray-500 dark:text-gray-400">
          {getStatusLabel(member.status)}
        </div>
      </div>

      {/* Time */}
      <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
        {formatLastActivity(member.lastActivityAt)}
      </span>

      {/* View Context Button */}
      {onViewContext && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onViewContext(member.memberName);
          }}
          className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors group"
          title="查看上下文"
        >
          <svg
            className="w-4 h-4 text-gray-400 group-hover:text-blue-500 dark:text-gray-500 dark:group-hover:text-blue-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </button>
      )}
    </div>
  );
}
