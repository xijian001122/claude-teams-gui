import { useState, useRef, useCallback, useEffect } from 'preact/hooks';
import type { TeamMember, Team, CommandItem, CommandsResponse } from '@shared/types';
import { Icon } from './Icon';
import { analyzeLogs, generateReport } from '../services/logAnalysis';

interface InputBoxProps {
  members: TeamMember[];
  crossTeamTargets: Team[];
  commands: CommandsResponse;
  onSend: (content: string, to?: string) => void;
  onSendSystemMessage?: (content: string) => void;
  disabled?: boolean;
}

// Helper: Get plain text from contenteditable div
function getPlainText(element: HTMLElement): string {
  return element.innerText || element.textContent || '';
}

// Helper: Get full text including chip names (for sending)
function getFullText(element: HTMLElement): string {
  const chips = element.querySelectorAll('.cmd-chip');
  let text = element.innerHTML;

  // Replace chip spans with their text content
  chips.forEach(chip => {
    const chipText = chip.textContent || '';
    // Remove the × button text if present
    const cleanText = chipText.replace('×', '').trim();
    text = text.replace(chip.outerHTML, cleanText + ' ');
  });

  // Create a temp element to strip HTML
  const temp = document.createElement('div');
  temp.innerHTML = text;
  return temp.textContent || temp.innerText || '';
}

// Helper: Set cursor position at end
function setCursorAtEnd(element: HTMLElement) {
  const range = document.createRange();
  const selection = window.getSelection();
  range.selectNodeContents(element);
  range.collapse(false);
  selection?.removeAllRanges();
  selection?.addRange(range);
}

// Helper: Check if cursor is right after a chip
function isCursorAfterChip(element: HTMLElement): boolean {
  const selection = window.getSelection();
  if (!selection?.rangeCount) return false;

  const range = selection.getRangeAt(0);
  if (!range.collapsed) return false;

  const node = range.startContainer;
  const offset = range.startOffset;

  // If we're in a text node right after a chip
  if (node.nodeType === Node.TEXT_NODE) {
    const prevNode = node.previousSibling;
    if (prevNode?.nodeType === Node.ELEMENT_NODE &&
        (prevNode as Element).classList?.contains('cmd-chip')) {
      return offset === 0;
    }
  }

  return false;
}

// Helper: Remove the chip before cursor
function removeChipBeforeCursor(element: HTMLElement): boolean {
  const selection = window.getSelection();
  if (!selection?.rangeCount) return false;

  const range = selection.getRangeAt(0);
  const node = range.startContainer;
  const offset = range.startOffset;

  if (node.nodeType === Node.TEXT_NODE && offset === 0) {
    const prevNode = node.previousSibling;
    if (prevNode?.nodeType === Node.ELEMENT_NODE &&
        (prevNode as Element).classList?.contains('cmd-chip')) {
      prevNode.remove();
      return true;
    }
  }

  return false;
}

export function InputBox({ members, crossTeamTargets, commands, onSend, disabled }: InputBoxProps) {
  const [content, setContent] = useState('');
  const [showMention, setShowMention] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [showTeamSelector, setShowTeamSelector] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Slash command states
  const [showCommandPopup, setShowCommandPopup] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);
  const [hasCommandChip, setHasCommandChip] = useState(false);

  const editableRef = useRef<HTMLDivElement>(null);
  const lastSlashIndexRef = useRef<number>(-1);
  const selectedItemRef = useRef<HTMLDivElement>(null);

  // Filter members for @mention
  const filteredMembers = members.filter(m =>
    m.name !== 'user' &&
    m.name.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  // Filter commands
  const filteredCommands = commands.commands.filter(cmd =>
    cmd.name.toLowerCase().includes(commandQuery.toLowerCase())
  );

  const filteredSkills = commands.skills.filter(skill =>
    skill.name.toLowerCase().includes(commandQuery.toLowerCase())
  );

  const totalFiltered = filteredCommands.length + filteredSkills.length;
  const totalAvailable = commands.commands.length + commands.skills.length;

  // Combined list for keyboard navigation
  const allFilteredItems: CommandItem[] = [...filteredCommands, ...filteredSkills];

  const handleInput = () => {
    if (!editableRef.current) return;

    const text = getPlainText(editableRef.current);
    const html = editableRef.current.innerHTML;

    // Check if we have a command chip
    const chipExists = editableRef.current.querySelector('.cmd-chip') !== null;
    setHasCommandChip(chipExists);

    // Check for @ mention
    const lastAtIndex = text.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      const afterAt = text.slice(lastAtIndex + 1);
      const hasSpace = afterAt.includes(' ');

      if (!hasSpace) {
        setShowMention(true);
        setShowCommandPopup(false);
        setMentionQuery(afterAt);
        setSelectedMentionIndex(0);
      } else {
        setShowMention(false);
      }
    } else {
      setShowMention(false);
    }

    // Check for / command trigger
    const lastSlashIndex = text.lastIndexOf('/');
    if (lastSlashIndex !== -1 && !chipExists) {
      const afterSlash = text.slice(lastSlashIndex + 1);
      const hasSpaceAfterSlash = afterSlash.includes(' ');

      // Only show if: no space after slash, and no @ mention popup is showing
      if (!hasSpaceAfterSlash && !showMention && afterSlash.length >= 0) {
        lastSlashIndexRef.current = lastSlashIndex;
        setShowCommandPopup(true);
        setCommandQuery(afterSlash);
        setSelectedCommandIndex(0);
      } else {
        setShowCommandPopup(false);
      }
    } else {
      setShowCommandPopup(false);
    }
  };

  const insertMention = useCallback((member: TeamMember) => {
    if (!editableRef.current) return;

    const text = getPlainText(editableRef.current);
    const lastAtIndex = text.lastIndexOf('@');
    const before = text.slice(0, lastAtIndex);
    const after = text.slice(lastAtIndex + 1 + mentionQuery.length);

    const newText = `${before}@${member.name} ${after}`;
    editableRef.current.innerText = newText;
    setShowMention(false);

    // Focus and set cursor position
    setTimeout(() => {
      if (editableRef.current) {
        editableRef.current.focus();
        setCursorAtEnd(editableRef.current);
      }
    }, 0);
  }, [mentionQuery]);

  const insertCommandChip = useCallback((item: CommandItem) => {
    if (!editableRef.current) return;

    const text = getPlainText(editableRef.current);
    const lastSlashIndex = text.lastIndexOf('/');

    // Remove the /query text
    const before = text.slice(0, lastSlashIndex);
    const after = text.slice(lastSlashIndex + 1 + commandQuery.length);

    // Remove existing chip if any (constraint: only one command at a time)
    const existingChip = editableRef.current.querySelector('.cmd-chip');
    if (existingChip) {
      existingChip.remove();
    }

    // Build HTML with chip
    const chipHtml = `<span contenteditable="false" class="cmd-chip">/${item.name}<button class="chip-remove" onclick="this.parentElement.remove()">×</button></span>`;

    // Set content
    const newHtml = before + chipHtml + (after ? ' ' + after : ' ');
    editableRef.current.innerHTML = newHtml;

    setShowCommandPopup(false);
    setHasCommandChip(true);

    // Focus and place cursor after chip
    setTimeout(() => {
      if (editableRef.current) {
        editableRef.current.focus();
        setCursorAtEnd(editableRef.current);
      }
    }, 0);
  }, [commandQuery]);

  const handleKeyDown = (e: KeyboardEvent) => {
    // Handle command popup navigation
    if (showCommandPopup && allFilteredItems.length > 0) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedCommandIndex(i => (i + 1) % allFilteredItems.length);
          return;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedCommandIndex(i => (i - 1 + allFilteredItems.length) % allFilteredItems.length);
          return;
        case 'Enter':
        case 'Tab':
          e.preventDefault();
          insertCommandChip(allFilteredItems[selectedCommandIndex]);
          return;
        case 'Escape':
          setShowCommandPopup(false);
          return;
      }
    }

    // Handle mention popup navigation
    if (showMention && filteredMembers.length > 0) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedMentionIndex(i => (i + 1) % filteredMembers.length);
          return;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedMentionIndex(i => (i - 1 + filteredMembers.length) % filteredMembers.length);
          return;
        case 'Enter':
        case 'Tab':
          e.preventDefault();
          insertMention(filteredMembers[selectedMentionIndex]);
          return;
        case 'Escape':
          setShowMention(false);
          return;
      }
    }

    // Handle Backspace to remove chip
    if (e.key === 'Backspace' && editableRef.current) {
      if (removeChipBeforeCursor(editableRef.current)) {
        e.preventDefault();
        setHasCommandChip(editableRef.current.querySelector('.cmd-chip') !== null);
        return;
      }
    }

    if (e.key === 'Enter' && !e.ctrlKey && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = async () => {
    if (!editableRef.current) return;

    const fullText = getFullText(editableRef.current).trim();
    if (!fullText || disabled) return;

    // Handle /log-fix command (for backward compatibility)
    if (fullText.startsWith('/log-fix')) {
      setIsAnalyzing(true);
      editableRef.current.innerHTML = '';

      // Show loading message
      const loadingContent = '🔍 正在分析日志，请稍候...';
      onSend(loadingContent);

      try {
        const result = await analyzeLogs();
        const report = generateReport(result);
        onSend(report);
      } catch (err) {
        console.error('Log analysis failed:', err);
        onSend('❌ 日志分析失败: ' + (err instanceof Error ? err.message : '未知错误'));
      } finally {
        setIsAnalyzing(false);
      }

      return;
    }

    // Parse @mentions (supports hyphens in member names like @bug-fixer)
    const mentionMatch = fullText.match(/@([\w-]+)/);
    const mentionTo = mentionMatch ? mentionMatch[1] : undefined;

    // Use selected team for cross-team message, or mention, or undefined
    const to = selectedTeam ? `team:${selectedTeam}` : mentionTo;

    onSend(fullText, to);
    editableRef.current.innerHTML = '';
    setSelectedTeam(null);
    setHasCommandChip(false);
  };

  const selectTeam = (teamName: string | null) => {
    setSelectedTeam(teamName);
    setShowTeamSelector(false);
  };

  // Calculate popup position
  const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    if ((showCommandPopup || showMention) && editableRef.current) {
      // Position popup above the input
      setPopupStyle({
        position: 'absolute',
        bottom: '100%',
        left: 0,
        right: '68px', // Leave room for buttons
        marginBottom: '8px'
      });
    }
  }, [showCommandPopup, showMention]);

  // Auto-scroll selected command item into view
  useEffect(() => {
    if (showCommandPopup && selectedItemRef.current) {
      selectedItemRef.current.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedCommandIndex, showCommandPopup]);

  return (
    <div className="relative border-t border-[var(--border-color)] p-4 bg-[var(--bg-primary)]">
      {/* Mention popup */}
      {showMention && filteredMembers.length > 0 && (
        <div className="mention-popup" style={popupStyle}>
          {filteredMembers.map((member, index) => (
            <div
              key={member.name}
              className={`mention-item ${index === selectedMentionIndex ? 'selected' : ''}`}
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

      {/* Command popup */}
      {showCommandPopup && (
        <div className="command-popup" style={popupStyle}>
          <div className="command-popup-header">
            <span>命令列表</span>
            <span className="command-popup-count">
              {totalFiltered > 0 ? `${totalFiltered}/${totalAvailable}` : '无匹配'}
            </span>
          </div>

          {filteredCommands.length > 0 && (
            <div className="command-popup-group">
              <div className="command-popup-group-title">Commands ({filteredCommands.length})</div>
              {filteredCommands.map((cmd, index) => (
                <div
                  key={cmd.name}
                  ref={selectedCommandIndex === index ? selectedItemRef : null}
                  className={`command-popup-item ${selectedCommandIndex === index ? 'selected' : ''}`}
                  onClick={() => insertCommandChip(cmd)}
                >
                  <span className="command-popup-name">/{cmd.name}</span>
                  <span className="command-popup-desc">{cmd.description}</span>
                </div>
              ))}
            </div>
          )}

          {filteredSkills.length > 0 && (
            <div className="command-popup-group">
              <div className="command-popup-group-title">Skills ({filteredSkills.length})</div>
              {filteredSkills.map((skill, index) => (
                <div
                  key={skill.name}
                  ref={selectedCommandIndex === filteredCommands.length + index ? selectedItemRef : null}
                  className={`command-popup-item ${selectedCommandIndex === filteredCommands.length + index ? 'selected' : ''}`}
                  onClick={() => insertCommandChip(skill)}
                >
                  <span className="command-popup-name">/{skill.name}</span>
                  <span className="command-popup-desc">{skill.description}</span>
                </div>
              ))}
            </div>
          )}

          {totalFiltered === 0 && (
            <div className="command-popup-empty">无匹配命令</div>
          )}
        </div>
      )}

      {/* Team selector popup */}
      {showTeamSelector && crossTeamTargets.length > 0 && (
        <div className="mention-popup" style={popupStyle}>
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
              ×
            </button>
          </span>
        </div>
      )}

      <div className="flex gap-2">
        <div
          ref={editableRef}
          contentEditable={!disabled && !isAnalyzing}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          className={`editable-input flex-1 ${disabled || isAnalyzing ? 'bg-[var(--bg-secondary)] opacity-60 cursor-not-allowed' : ''}`}
          data-placeholder={
            disabled
              ? "此团队已归档，无法发送消息"
              : isAnalyzing
              ? "正在分析日志..."
              : "输入消息... 使用 @ 提及成员，输入 / 查看命令"
          }
          suppressContentEditableWarning
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
          disabled={disabled || isAnalyzing}
          className="btn btn-primary self-end py-2 px-3"
        >
          <Icon icon="send" size={18} />
        </button>
      </div>
    </div>
  );
}
