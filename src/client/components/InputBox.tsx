import { useState, useRef, useCallback } from 'preact/hooks';
import type { TeamMember, Team } from '@shared/types';
import { Icon } from './Icon';

interface InputBoxProps {
  members: TeamMember[];
  crossTeamTargets: Team[];
  onSend: (content: string, to?: string) => void;
  disabled?: boolean;
}

export function InputBox({ members, crossTeamTargets, onSend, disabled }: InputBoxProps) {
  const [content, setContent] = useState('');
  const [showMention, setShowMention] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [showTeamSelector, setShowTeamSelector] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const filteredMembers = members.filter(m =>
    m.name !== 'user' &&
    m.name.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  const handleInput = (e: Event) => {
    const target = e.target as HTMLTextAreaElement;
    const value = target.value;
    setContent(value);

    // Check for @ mention
    const lastAtIndex = value.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      const afterAt = value.slice(lastAtIndex + 1);
      const hasSpace = afterAt.includes(' ');

      if (!hasSpace) {
        setShowMention(true);
        setMentionQuery(afterAt);
        setSelectedIndex(0);
      } else {
        setShowMention(false);
      }
    } else {
      setShowMention(false);
    }

    // Auto resize
    target.style.height = 'auto';
    target.style.height = Math.min(target.scrollHeight, 120) + 'px';
  };

  const insertMention = useCallback((member: TeamMember) => {
    const lastAtIndex = content.lastIndexOf('@');
    const before = content.slice(0, lastAtIndex);
    const after = content.slice(lastAtIndex + 1 + mentionQuery.length);

    const newContent = `${before}@${member.name} ${after}`;
    setContent(newContent);
    setShowMention(false);

    // Focus and set cursor position
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const pos = newContent.length - after.length;
        textareaRef.current.setSelectionRange(pos, pos);
      }
    }, 0);
  }, [content, mentionQuery]);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (showMention && filteredMembers.length > 0) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(i => (i + 1) % filteredMembers.length);
          return;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(i => (i - 1 + filteredMembers.length) % filteredMembers.length);
          return;
        case 'Enter':
        case 'Tab':
          e.preventDefault();
          insertMention(filteredMembers[selectedIndex]);
          return;
        case 'Escape':
          setShowMention(false);
          return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    const trimmed = content.trim();
    if (!trimmed || disabled) return;

    // Parse @mentions (supports hyphens in member names like @bug-fixer)
    const mentionMatch = trimmed.match(/@([\w-]+)/);
    const mentionTo = mentionMatch ? mentionMatch[1] : undefined;

    // Use selected team for cross-team message, or mention, or undefined
    const to = selectedTeam ? `team:${selectedTeam}` : mentionTo;

    onSend(trimmed, to);
    setContent('');
    setSelectedTeam(null); // Reset selected team after send

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const selectTeam = (teamName: string | null) => {
    setSelectedTeam(teamName);
    setShowTeamSelector(false);
  };

  return (
    <div className="relative border-t border-[var(--border-color)] p-4 bg-[var(--bg-primary)]">
      {/* Mention popup */}
      {showMention && filteredMembers.length > 0 && (
        <div className="mention-popup">
          {filteredMembers.map((member, index) => (
            <div
              key={member.name}
              className={`mention-item ${index === selectedIndex ? 'selected' : ''}`}
              onClick={() => insertMention(member)}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold text-white"
                style={{ backgroundColor: member.color }}
              >
                {member.avatarLetter}
              </div>
              <div>
                <div className="font-medium text-[var(--text-primary)]">
                  {member.displayName}
                </div>
                <div className="text-xs text-[var(--text-secondary)]">
                  @{member.name}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Team selector popup */}
      {showTeamSelector && crossTeamTargets.length > 0 && (
        <div className="mention-popup">
          <div
            className={`mention-item ${selectedTeam === null ? 'selected' : ''}`}
            onClick={() => selectTeam(null)}
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold bg-gray-400 text-white">
              本
            </div>
            <div>
              <div className="font-medium text-[var(--text-primary)]">当前团队</div>
              <div className="text-xs text-[var(--text-secondary)]">仅在当前团队内发送</div>
            </div>
          </div>
          {crossTeamTargets.map((team) => (
            <div
              key={team.name}
              className={`mention-item ${selectedTeam === team.name ? 'selected' : ''}`}
              onClick={() => selectTeam(team.name)}
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold bg-blue-500 text-white">
                {team.displayName.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-medium text-[var(--text-primary)]">{team.displayName}</div>
                <div className="text-xs text-[var(--text-secondary)]">发送跨团队消息</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selected team indicator */}
      {selectedTeam && (
        <div className="mb-2 flex items-center gap-2">
          <span className="text-xs text-[var(--text-secondary)]">发送至:</span>
          <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 text-xs">
            {crossTeamTargets.find(t => t.name === selectedTeam)?.displayName || selectedTeam}
            <button
              onClick={() => setSelectedTeam(null)}
              className="ml-1 hover:text-blue-900"
            >
              &times;
            </button>
          </span>
        </div>
      )}

      <div className="flex gap-2">
        <textarea
          ref={textareaRef}
          value={content}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="输入消息... 使用 @ 提及成员"
          disabled={disabled}
          className="input-box flex-1"
          rows={1}
        />
        {crossTeamTargets.length > 0 && (
          <button
            onClick={() => setShowTeamSelector(!showTeamSelector)}
            className={`btn self-end py-2 px-3 ${selectedTeam ? 'btn-primary' : 'btn-secondary'}`}
            title="选择目标团队"
          >
            <Icon icon="arrow-right-left" size={18} />
          </button>
        )}
        <button
          onClick={handleSend}
          disabled={!content.trim() || disabled}
          className="btn btn-primary self-end py-2 px-3"
        >
          <Icon icon="send" size={18} />
        </button>
      </div>
    </div>
  );
}
