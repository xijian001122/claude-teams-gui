import { useEffect, useRef } from 'preact/hooks';
import type { Team, Message, TeamMember } from '@shared/types';
import { MessageBubble, DateDivider } from './MessageBubble';
import { InputBox } from './InputBox';
import { Icon } from './Icon';
import { isSameDay, parseISO } from 'date-fns';

interface ChatAreaProps {
  team: Team | null;
  messages: Message[];
  crossTeamTargets: Team[];
  onSendMessage: (content: string, to?: string) => void;
  onAvatarClick: (memberName: string) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export function ChatArea({
  team,
  messages,
  crossTeamTargets,
  onSendMessage,
  onAvatarClick,
  theme,
  onToggleTheme
}: ChatAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getMember = (name: string): TeamMember | undefined => {
    return team?.members.find(m => m.name === name);
  };

  // Group messages by date
  const groupedMessages: Array<{ type: 'date'; date: Date } | { type: 'message'; message: Message; showAvatar: boolean }> = [];

  messages.forEach((message, index) => {
    const messageDate = parseISO(message.timestamp);

    // Add date divider if first message or different day
    if (index === 0 || !isSameDay(messageDate, parseISO(messages[index - 1].timestamp))) {
      groupedMessages.push({ type: 'date', date: messageDate });
    }

    // Determine if we should show avatar
    const prevMessage = messages[index - 1];
    const showAvatar = !prevMessage ||
      prevMessage.from !== message.from ||
      !isSameDay(parseISO(prevMessage.timestamp), messageDate);

    groupedMessages.push({ type: 'message', message, showAvatar });
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
          <div className="text-xs text-[var(--text-secondary)]">
            {team.members.filter(m => m.isOnline).length} 人在线
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
                return <DateDivider key={`date-${index}`} date={item.date} />;
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
        disabled={!team}
      />
    </div>
  );
}
