import { format, isToday, isYesterday } from 'date-fns';
import { marked } from 'marked';
import type { Message, TeamMember } from '@shared/types';
import { Avatar } from './Avatar';
import { Icon } from './Icon';

// Configure marked for safe rendering
marked.setOptions({
  breaks: true,
  gfm: true,
  headerIds: false
});

interface MessageBubbleProps {
  message: Message;
  isSelf: boolean;
  showAvatar: boolean;
  member?: TeamMember;
  onAvatarClick?: (memberName: string) => void;
  currentTeam?: string;
}

function formatMessageContent(content: string): { type: 'text' | 'json'; display: string } {
  // Try to parse as JSON for system messages
  if (content.trim().startsWith('{') && content.trim().endsWith('}')) {
    try {
      const parsed = JSON.parse(content);
      if (parsed.type === 'idle_notification') {
        const agentName = parsed.from || 'Agent';
        return { type: 'json', display: `💤 ${agentName} 进入空闲状态` };
      }
      if (parsed.type === 'permission_request') {
        return { type: 'json', display: `🔒 ${parsed.agent_id || 'Agent'} 请求权限: ${parsed.description || '执行操作'}` };
      }
      if (parsed.type === 'task_assignment') {
        return { type: 'json', display: `📋 任务分配: ${parsed.subject || '新任务'}` };
      }
      if (parsed.type === 'task_completed') {
        return { type: 'json', display: `✅ 任务完成: ${parsed.subject || '任务已完成'}` };
      }
    } catch {
      // Not valid JSON, treat as text
    }
  }
  return { type: 'text', display: content };
}

export function MessageBubble({
  message,
  isSelf,
  showAvatar,
  member,
  onAvatarClick,
  currentTeam
}: MessageBubbleProps) {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    if (isToday(date)) {
      return format(date, 'HH:mm');
    }
    if (isYesterday(date)) {
      return `昨天 ${format(date, 'HH:mm')}`;
    }
    return format(date, 'MM/dd HH:mm');
  };

  const formatted = formatMessageContent(message.content);
  const isSystemMessage = formatted.type === 'json';

  // Determine cross-team message status
  const isCrossTeamIncoming = message.originalTeam && message.originalTeam !== currentTeam;
  const isCrossTeamOutgoing = message.to?.startsWith('team:');
  const crossTeamTarget = isCrossTeamOutgoing ? message.to.slice(5) : null;
  const crossTeamSource = isCrossTeamIncoming ? message.originalTeam : null;

  // Determine target recipient (for @mentions within team)
  const hasTarget = message.to && !message.to.startsWith('team:');
  const targetName = hasTarget ? message.to : null;
  const isTargetSelf = targetName === 'user';
  const displayTarget = isTargetSelf ? '你' : targetName;

  // Truncate long usernames
  const truncateTarget = (name: string, maxLength: number = 20) => {
    if (name.length <= maxLength) return name;
    return name.slice(0, maxLength - 3) + '...';
  };

  // Parse markdown for text content
  const renderContent = () => {
    if (isSystemMessage) {
      return formatted.display;
    }
    // Convert markdown to HTML
    const html = marked.parse(formatted.display, { async: false }) as string;
    return html;
  };

  return (
    <div
      className={`flex gap-3 ${isSelf ? 'flex-row-reverse' : 'flex-row'} message-bubble`}
    >
      {/* Avatar */}
      {showAvatar && member ? (
        <Avatar
          letter={member.avatarLetter}
          color={member.color}
          onClick={() => onAvatarClick?.(message.from)}
        />
      ) : (
        <div className="w-10" /> /* Spacer when no avatar */
      )}

      {/* Bubble */}
      <div
        className={`max-w-[70%] rounded-lg px-4 py-2 ${
          isSelf
            ? 'bg-blue-500 text-white rounded-tr-none'
            : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-tl-none'
        }`}
      >
        {/* Sender name (only for others in group chat) */}
        {!isSelf && member && (
          <div className="text-base text-gray-700 dark:text-gray-300 mb-1.5 font-semibold">
            {member.displayName}
          </div>
        )}

        {/* Cross-team message indicator */}
        {(isCrossTeamIncoming || isCrossTeamOutgoing) && (
          <div className={`flex items-center gap-2 mb-2 text-base ${
            isSelf ? 'text-blue-100' : 'text-gray-500'
          }`}>
            {isCrossTeamIncoming && crossTeamSource && (
              <span className="inline-flex items-center px-3 py-1.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200 font-medium">
                <Icon icon="arrow-left" size={16} className="mr-2" />
                来自: {crossTeamSource}
              </span>
            )}
            {isCrossTeamOutgoing && crossTeamTarget && (
              <span className="inline-flex items-center px-3 py-1.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 font-medium">
                <Icon icon="arrow-right" size={16} className="mr-2" />
                发送至: {crossTeamTarget}
              </span>
            )}
          </div>
        )}

        {/* Target recipient badge (for @mentions within team) */}
        {hasTarget && displayTarget && (
          <div className={`text-xs mb-2 ${
            isSelf
              ? isTargetSelf
                ? 'text-emerald-100'
                : 'text-blue-100'
              : isTargetSelf
                ? 'text-emerald-600'
                : 'text-blue-600'
          }`}>
            <span className={`inline-flex items-center px-2 py-0.5 rounded ${
              isTargetSelf
                ? isSelf
                  ? 'bg-emerald-400/30'
                  : 'bg-emerald-100 dark:bg-emerald-900/30'
                : isSelf
                  ? 'bg-blue-400/30'
                  : 'bg-blue-100 dark:bg-blue-900/30'
            }`}>
              @{truncateTarget(displayTarget)}
            </span>
          </div>
        )}

        {/* Content */}
        <div
          className={`text-sm break-words markdown-content ${isSystemMessage ? 'italic text-gray-500' : ''}`}
          dangerouslySetInnerHTML={{ __html: renderContent() }}
        />

        {/* Timestamp */}
        <div
          className={`text-xs mt-1 ${
            isSelf ? 'text-blue-100' : 'text-gray-400'
          }`}
        >
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
}

interface DateDividerProps {
  date: Date;
}

export function DateDivider({ date }: DateDividerProps) {
  const formatDate = (d: Date) => {
    if (isToday(d)) return '今天';
    if (isYesterday(d)) return '昨天';
    return format(d, 'yyyy年MM月dd日');
  };

  return (
    <div className="flex items-center justify-center my-6">
      <div className="h-px bg-[var(--border-color)] flex-1" />
      <span className="px-4 text-xs text-[var(--text-secondary)]">
        {formatDate(date)}
      </span>
      <div className="h-px bg-[var(--border-color)] flex-1" />
    </div>
  );
}
