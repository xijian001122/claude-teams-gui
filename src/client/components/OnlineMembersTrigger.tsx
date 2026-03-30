import { useState, useRef, useEffect } from 'preact/hooks';
import type { MemberStatusInfo } from '@shared/types';
import { Icon } from './Icon';
import { OnlineMembersPanel } from './OnlineMembersPanel';

interface OnlineMembersTriggerProps {
  memberStatuses: MemberStatusInfo[];
  currentUser?: string;
  onViewContext?: (memberName: string) => void;
}

export function OnlineMembersTrigger({
  memberStatuses,
  currentUser,
  onViewContext
}: OnlineMembersTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter out current user and offline members
  const otherMembers = memberStatuses.filter(m => m.memberName !== currentUser && m.status !== 'offline');
  const busyCount = otherMembers.filter(m => m.status === 'busy').length;
  const idleCount = otherMembers.filter(m => m.status === 'idle').length;
  const occupiedCount = otherMembers.filter(m => m.status === 'occupied').length;

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm text-gray-600 dark:text-gray-400 transition-all ${
          isOpen
            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
            : 'bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)]'
        }`}
        title="查看团队成员"
      >
        {/* Busy Count */}
        {busyCount > 0 && (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-sm font-medium text-[var(--text-primary)]">
              {busyCount} 执行中
            </span>
          </span>
        )}

        {/* Separator */}
        {(busyCount > 0) && (idleCount > 0 || occupiedCount > 0) && (
          <span className="text-[var(--text-secondary)]">·</span>
        )}

        {/* Occupied Count */}
        {occupiedCount > 0 && (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-yellow-500" />
            <span className="text-sm font-medium text-[var(--text-primary)]">
              {occupiedCount} 繁忙
            </span>
          </span>
        )}

        {/* Separator between occupied and idle */}
        {occupiedCount > 0 && idleCount > 0 && (
          <span className="text-[var(--text-secondary)]">·</span>
        )}

        {/* Idle Count */}
        {idleCount > 0 && (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-sm font-medium text-[var(--text-primary)]">
              {idleCount} 空闲
            </span>
          </span>
        )}

        {/* No Active Members */}
        {busyCount === 0 && idleCount === 0 && occupiedCount === 0 && (
          <span className="text-sm font-medium text-[var(--text-primary)]">
            0 在线
          </span>
        )}

        {/* Dropdown Icon */}
        <Icon
          icon={isOpen ? 'chevron-up' : 'chevron-down'}
          size={14}
          className="text-[var(--text-secondary)]"
        />
      </button>

      {/* Dropdown Panel - show all including offline */}
      {isOpen && (
        <OnlineMembersPanel
          memberStatuses={memberStatuses.filter(m => m.memberName !== currentUser)}
          onClose={() => setIsOpen(false)}
          onViewContext={onViewContext}
        />
      )}
    </div>
  );
}
