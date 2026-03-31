import { useEffect, useRef, useState } from 'preact/hooks';
import type { Team, Message, TeamMember, MemberStatusInfo } from '@shared/types';
import { MessageBubble, DateDivider } from './MessageBubble';
import { InputBox } from './InputBox';
import { Icon } from './Icon';
import { OnlineMembersTrigger } from './OnlineMembersTrigger';
import { isSameDay, parseISO, format } from 'date-fns';

interface ChatAreaProps {
  team: Team | null;
  messages: Message[];
  memberStatuses: MemberStatusInfo[];
  crossTeamTargets: Team[];
  archivedTeams: Team[];
  onSendMessage: (content: string, to?: string) => void;
  onAvatarClick: (memberName: string) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onPermissionResponse?: (requestId: string, approve: boolean, agentId: string) => Promise<void>;
  onViewMemberContext?: (memberName: string) => void;
}

// Check if message is internal and should be filtered
function isInternalMessage(content: string): { isInternal: boolean; processedContent?: string } {
  // Remove leading newlines and whitespace for more reliable detection
  const trimmed = content.replace(/^\s+/, '');

  // Filter out teammate-message tags (use includes for more reliable matching)
  if (trimmed.includes('<teammate-message')) {
    const match = trimmed.match(/<teammate-message[^>]*teammate_id="([^"]+)"[^>]*>([\s\S]*)<\/teammate-message>/);
    if (match && match[1] === 'user') {
      // Extract content for user messages
      return { isInternal: false, processedContent: match[2].trim() };
    }
    // Filter out other teammate messages (team-lead, etc.)
    return { isInternal: true };
  }

  // Filter out command execution tags (use includes for robust matching)
  if (trimmed.includes('<command-name') || trimmed.includes('<command-message') ||
      trimmed.includes('<local-command-stdout') || trimmed.includes('<local-command-caveat')) {
    return { isInternal: true };
  }

  // Filter out tool_result JSON arrays
  if (trimmed.startsWith('[{') && trimmed.includes('"tool_use_id"')) {
    return { isInternal: true };
  }

  // Filter out raw text block arrays [{"type":"text","text":"..."}]
  if (trimmed.startsWith('[{') && trimmed.includes('"type":"text"') && trimmed.includes('"text"')) {
    return { isInternal: true };
  }

  // Filter out interrupted request messages
  if (trimmed === '[Request interrupted by user]' || trimmed.startsWith('[Request interrupted')) {
    return { isInternal: true };
  }

  // Filter out internal protocol messages (JSON format)
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      const internalTypes = ['idle_notification', 'shutdown_request', 'shutdown_response', 'task_assignment', 'permission_request', 'permission_response'];
      if (internalTypes.includes(parsed.type)) {
        return { isInternal: true };
      }
    } catch {
      // Not valid JSON, continue
    }
  }

  return { isInternal: false };
}

// Visual divider between team instances
function InstanceDivider({ timestamp, instanceIndex, onToggle, isExpanded, isLatest }: {
  timestamp: string;
  instanceIndex: number;
  onToggle: () => void;
  isExpanded: boolean;
  isLatest: boolean;
}) {
  return (
    <div className="flex items-center gap-3 py-4 my-2">
      <div className="flex-1 h-px bg-[var(--border-color)]" />
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs text-[var(--text-secondary)]">
          <Icon icon="refresh-cw" size={12} />
          <span>{isLatest ? '当前实例' : '团队已重建'}</span>
          <span className="text-[var(--text-tertiary)]">·</span>
          <span>{format(parseISO(timestamp), 'MM/dd HH:mm')}</span>
        </div>
        <button
          onClick={onToggle}
          className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors underline underline-offset-2"
        >
          {isExpanded ? '折叠消息' : `展开实例 #${instanceIndex} 消息`}
        </button>
      </div>
      <div className="flex-1 h-px bg-[var(--border-color)]" />
    </div>
  );
}

export function ChatArea({
  team,
  messages,
  memberStatuses,
  crossTeamTargets,
  archivedTeams,
  onSendMessage,
  onAvatarClick,
  theme,
  onToggleTheme,
  onPermissionResponse,
  onViewMemberContext
}: ChatAreaProps) {
  const isReadOnly = team ? archivedTeams.some(t => t.name === team.name) : false;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // Track which instances are collapsed (by instance id) - default all expanded
  const [collapsedInstances, setCollapsedInstances] = useState<Set<string>>(new Set());

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getMember = (name: string): TeamMember | undefined => {
    return team?.members.find(m => m.name === name);
  };

  const toggleInstance = (instanceId: string) => {
    setCollapsedInstances(prev => {
      const next = new Set(prev);
      if (next.has(instanceId)) {
        next.delete(instanceId);
      } else {
        next.add(instanceId);
      }
      return next;
    });
  };

  // Group messages by instance (oldest → newest order)
  const instanceOrder: string[] = [];
  const instanceMessages: Map<string, Message[]> = new Map();

  messages.forEach(message => {
    // Check and filter internal messages
    const checkResult = isInternalMessage(message.content);
    if (checkResult.isInternal) {
      return;
    }

    // Use processed content if available
    const processedMessage = checkResult.processedContent
      ? { ...message, content: checkResult.processedContent }
      : { ...message };
    const content = processedMessage.content.trim();

    // Treat null/undefined teamInstance as current instance (not __legacy__)
    // Messages from UI or with missing teamInstance should be grouped with the latest instance
    const instance = processedMessage.teamInstance || '__current__';
    if (!instanceMessages.has(instance)) {
      instanceMessages.set(instance, []);
      instanceOrder.push(instance);
    }
    instanceMessages.get(instance)!.push(processedMessage);
  });

  // Build flat render list with instance dividers
  type RenderItem =
    | { type: 'date'; date: Date; key: string }
    | { type: 'message'; message: Message; showAvatar: boolean }
    | { type: 'instance_divider'; instanceId: string; timestamp: string; instanceIndex: number; isExpanded: boolean; isLatest: boolean };

  const groupedMessages: RenderItem[] = [];
  const lastIndex = instanceOrder.length - 1;

  instanceOrder.forEach((instanceId, orderIndex) => {
    const isLatest = orderIndex === lastIndex;
    // Latest instance: expanded by default (collapsed only if explicitly toggled)
    // Older instances: collapsed by default (expanded only if explicitly toggled)
    const isExpanded = isLatest
      ? !collapsedInstances.has(instanceId)
      : collapsedInstances.has(instanceId);

    const msgs = instanceMessages.get(instanceId) || [];
    const dividerTimestamp = msgs[0]?.timestamp || new Date().toISOString();

    // Every instance gets a divider above it
    groupedMessages.push({
      type: 'instance_divider',
      instanceId,
      timestamp: dividerTimestamp,
      instanceIndex: orderIndex + 1,
      isExpanded,
      isLatest
    });

    if (isExpanded) {
      msgs.forEach((message, index) => {
        const messageDate = parseISO(message.timestamp);
        const prevMsg = index === 0 ? null : msgs[index - 1];

        if (index === 0 || !isSameDay(messageDate, parseISO(prevMsg!.timestamp))) {
          groupedMessages.push({ type: 'date', date: messageDate, key: `${instanceId}-date-${index}` });
        }

        const showAvatar = !prevMsg ||
          prevMsg.from !== message.from ||
          !isSameDay(parseISO(prevMsg.timestamp), messageDate);

        groupedMessages.push({ type: 'message', message, showAvatar });
      });
    }
  });

  if (!team) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="text-[var(--text-secondary)]">
          选择一个团队开始聊天
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[var(--bg-primary)]">
      {/* Header */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-[var(--border-color)]">
        <div>
          <h2 className="font-semibold text-[var(--text-primary)]">
            {team.displayName}
          </h2>
          {/* Online Members Trigger - 显示在团队名称下方 */}
          <div className="mt-1">
            <OnlineMembersTrigger
              memberStatuses={memberStatuses}
              currentUser="user"
              onViewContext={onViewMemberContext}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors text-[var(--text-secondary)]"
            title={theme === 'light' ? '切换到深色模式' : '切换到浅色模式'}
          >
            <Icon icon={theme === 'light' ? 'moon' : 'sun'} size={18} />
          </button>

          {/* Info button */}
          <button className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors text-[var(--text-secondary)]" title="团队信息">
            <Icon icon="info" size={18} />
          </button>
        </div>
      </div>

      {/* Read-only banner for archived teams */}
      {isReadOnly && (
        <div className="px-6 py-2 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-700 flex items-center gap-2 text-yellow-800 dark:text-yellow-300 text-sm">
          <Icon icon="archive" size={16} />
          <span>此团队已归档，仅供查看</span>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[var(--text-secondary)]">
            暂无消息，发送一条消息开始聊天
          </div>
        ) : (
          <div className="space-y-1">
            {groupedMessages.map((item, index) => {
              if (item.type === 'date') {
                return <DateDivider key={item.key || `date-${index}`} date={item.date} />;
              }

              if (item.type === 'instance_divider') {
                return (
                  <InstanceDivider
                    key={`instance-divider-${item.instanceId}`}
                    timestamp={item.timestamp}
                    instanceIndex={item.instanceIndex}
                    isExpanded={item.isExpanded}
                    isLatest={item.isLatest}
                    onToggle={() => toggleInstance(item.instanceId)}
                  />
                );
              }

              const { message, showAvatar } = item;
              const isSelf = message.from === 'user';
              const member = getMember(message.from);

              return (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isSelf={isSelf}
                  showAvatar={showAvatar}
                  member={member}
                  onAvatarClick={onAvatarClick}
                  currentTeam={team?.name}
                  onPermissionResponse={onPermissionResponse}
                />
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <InputBox
        members={team.members}
        crossTeamTargets={crossTeamTargets}
        onSend={onSendMessage}
        disabled={!team || isReadOnly}
      />
    </div>
  );
}
