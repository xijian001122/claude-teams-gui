import { format, isToday, isYesterday } from 'date-fns';
import { marked } from 'marked';
import { useState, useRef, useEffect } from 'preact/hooks';
import type { Message, TeamMember, SessionMsgType } from '@shared/types';
import { Avatar } from './Avatar';
import { Icon } from './Icon';
import { JsonMessageCard } from './JsonMessageCard';
import { ToolUseCard } from './ToolUseCard';
import { ThinkingBlock } from './ThinkingBlock';
import { MarkdownRenderer } from './MarkdownRenderer';

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
  onPermissionResponse?: (requestId: string, approve: boolean, agentId: string) => Promise<void>;
}

// Long content wrapper with expand/collapse
// Exposes expand state via render prop so the button can be placed elsewhere
function LongContent({ html, isSelf, footer }: { html: string; isSelf: boolean; footer: (expandBtn: any) => any }) {
  const [expanded, setExpanded] = useState(false);
  const [isOverflow, setIsOverflow] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const maxHeight = 300; // px

  // User messages are always fully expanded
  const alwaysExpanded = isSelf;

  useEffect(() => {
    if (contentRef.current && !alwaysExpanded) {
      setIsOverflow(contentRef.current.scrollHeight > maxHeight);
    }
  }, [html, alwaysExpanded]);

  const expandBtn = (!alwaysExpanded && isOverflow) ? (
    <button
      onClick={() => setExpanded(!expanded)}
      className={`text-xs flex items-center gap-1 transition-colors ${
        isSelf ? 'text-blue-100 hover:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
      }`}
    >
      {expanded ? (
        <>
          <Icon icon="chevron-up" size={14} />
          收起
        </>
      ) : (
        <>
          <Icon icon="chevron-down" size={14} />
          展开全部
        </>
      )}
    </button>
  ) : null;

  return (
    <>
      <div className="relative">
        <div
          ref={contentRef}
          className={`overflow-y-auto transition-all duration-200 ${alwaysExpanded || expanded ? '' : 'max-h-[300px]'}`}
          style={{ maxHeight: alwaysExpanded || expanded ? 'none' : `${maxHeight}px` }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
        {/* Gradient overlay when collapsed */}
        {!alwaysExpanded && !expanded && isOverflow && (
          <div className={`absolute bottom-0 left-0 right-0 h-12 pointer-events-none ${
            isSelf ? 'bg-gradient-to-t from-blue-500' : 'bg-gradient-to-t from-[var(--bg-secondary)]'
          }`} />
        )}
      </div>
      {footer(expandBtn)}
    </>
  );
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
  currentTeam,
  onPermissionResponse
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
  const isSessionMsg = message.source === 'session';
  const msgType = message.msgType || 'text';

  // Session message type rendering — reuse rich components from MemberConversationPanel
  const renderSessionContent = () => {
    switch (msgType) {
      case 'thinking':
        return <ThinkingBlock content={message.content} />;
      case 'tool_use': {
        let toolInput: object = {};
        if (message.toolInput) {
          try { toolInput = JSON.parse(message.toolInput); } catch { toolInput = {}; }
        }
        return (
          <ToolUseCard
            toolName={message.toolName || 'Tool'}
            toolInput={toolInput}
          />
        );
      }
      case 'tool_result':
        return (
          <div className="my-1 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 overflow-hidden">
            <details>
              <summary className="px-3 py-2 flex items-center gap-2 cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors text-left list-none">
                <svg className="w-3.5 h-3.5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-xs font-medium text-green-700 dark:text-green-300">工具返回结果</span>
              </summary>
              <div className="px-3 pb-3 border-t border-green-200 dark:border-green-800">
                <div className="pt-2 text-sm text-green-800 dark:text-green-200 overflow-hidden max-h-[300px] overflow-y-auto">
                  <MarkdownRenderer content={message.content} />
                </div>
              </div>
            </details>
          </div>
        );
      case 'queue_operation':
        return (
          <div className="my-1 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 overflow-hidden">
            <div className="px-3 py-2 flex items-center gap-2 text-left">
              <svg className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.204-.107-.397.165-.71.505-.78.929l-.15.894c-.09.542-.56.94-1.109.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-xs text-amber-700 dark:text-amber-300">{message.content}</span>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

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

  // Check if this is a JSON message that should use JsonMessageCard
  const isJsonMessage = message.content.trim().startsWith('{') && message.content.trim().endsWith('}');

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
      className={`flex gap-3 min-w-0 ${isSelf ? 'flex-row-reverse' : 'flex-row'} message-bubble`}
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
        className={`max-w-[70%] min-w-0 rounded-lg px-4 py-2 overflow-hidden ${
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
        {isSessionMsg && msgType !== 'text' ? (
          /* Session non-text messages: thinking, tool_use, tool_result, queue_operation */
          <div className="text-sm">
            {renderSessionContent()}
            <div className={`text-xs mt-1 ${isSelf ? 'text-blue-100' : 'text-gray-400'}`}>
              {formatTime(message.timestamp)}
            </div>
          </div>
        ) : isJsonMessage ? (
          <JsonMessageCard
            message={message}
            onPermissionResponse={onPermissionResponse}
          />
        ) : (
          <div className={`text-sm break-words markdown-content ${isSystemMessage ? 'italic text-gray-500' : ''}`}>
            {isSystemMessage ? (
              <>
                {renderContent()}
                <div className={`text-xs mt-1 ${isSelf ? 'text-blue-100' : 'text-gray-400'}`}>
                  {formatTime(message.timestamp)}
                </div>
              </>
            ) : (
              <LongContent
                html={renderContent()}
                isSelf={isSelf}
                footer={(expandBtn: any) => (
                  <div className={`flex items-center justify-between text-xs mt-1 ${
                    isSelf ? 'text-blue-100' : 'text-gray-400'
                  }`}>
                    <span>{formatTime(message.timestamp)}</span>
                    {expandBtn}
                  </div>
                )}
              />
            )}
          </div>
        )}

        {/* Timestamp (only for system messages and json messages) */}
        {(isSystemMessage || isJsonMessage) && (
          <div
            className={`text-xs mt-1 ${
              isSelf ? 'text-blue-100' : 'text-gray-400'
            }`}
          >
            {formatTime(message.timestamp)}
          </div>
        )}
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
