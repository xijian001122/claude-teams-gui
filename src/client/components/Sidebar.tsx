import type { Team } from '@shared/types';
import { Avatar } from './Avatar';
import { Icon } from './Icon';
import { useState } from 'preact/hooks';
import { generateAvatarColor } from '@shared/utils/avatar';

interface SidebarProps {
  teams: Team[];
  archivedTeams: Team[];
  currentTeam: string | null;
  onSelectTeam: (team: string) => void;
  connected: boolean;
  pendingConfigRestart?: boolean;
  onOpenSettings?: () => void;
}

export function Sidebar({
  teams,
  archivedTeams,
  currentTeam,
  onSelectTeam,
  connected,
  pendingConfigRestart = false,
  onOpenSettings
}: SidebarProps) {
  const [showArchive, setShowArchive] = useState(false);

  const getOnlineCount = (team: Team) => {
    return team.members.filter(member => member.isOnline).length;
  };

  const getLastMessagePreview = (team: Team) => {
    if (team.messageCount === 0) {
      return '暂无消息';
    }
    return `${team.messageCount} 条消息`;
  };

  const formatSmartTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();

    // Reset time to midnight for date comparison
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = Math.floor((today.getTime() - messageDate.getTime()) / 86400000);

    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;

    if (diffDays === 0) {
      return `今天 ${timeStr}`;
    } else if (diffDays === 1) {
      return `昨天 ${timeStr}`;
    } else {
      const month = date.getMonth() + 1;
      const day = date.getDate();
      return `${month}月${day}日 ${timeStr}`;
    }
  };

  return (
    <div className="w-72 bg-[var(--bg-secondary)] border-r border-[var(--border-color)] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[var(--border-color)]">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-[var(--text-primary)]">
            Claude Teams
          </h1>
          <div className="flex items-center gap-2">
            <Icon
              icon={connected ? "wifi" : "wifi-off"}
              size={18}
              className={connected ? "text-green-500" : "text-red-500"}
            />
          </div>
        </div>
      </div>

      {/* New Team Button */}
      <div className="p-3">
        <button className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg border border-dashed border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors">
          <Icon icon="plus" size={20} />
          <span>新建团队</span>
        </button>
      </div>

      {/* Team List */}
      <div className="flex-1 overflow-y-auto">
        {teams.length === 0 ? (
          <div className="p-8 text-center text-[var(--text-secondary)]">
            暂无团队
          </div>
        ) : (
          teams.map(team => (
            <div
              key={team.name}
              className={`team-item ${currentTeam === team.name ? 'active' : ''}`}
              onClick={() => onSelectTeam(team.name)}
            >
              <div className="flex items-center gap-3">
                {/* Online indicator */}
                <div className="relative">
                  <Avatar
                    letter={team.name.charAt(0).toUpperCase()}
                    color={generateAvatarColor(team.name)}
                    size="sm"
                  />
                  {getOnlineCount(team) > 0 && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[var(--bg-secondary)]" />
                  )}
                </div>

                {/* Team info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-[var(--text-primary)] truncate">
                      {team.displayName}
                    </span>
                    <span className="text-xs text-[var(--text-secondary)]">
                      {formatSmartTime(team.lastActivity)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-sm text-[var(--text-secondary)] truncate">
                      {getLastMessagePreview(team)}
                    </span>
                    {team.unreadCount > 0 && (
                      <span className="unread-badge">{team.unreadCount}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Archive Section */}
      <div className="border-t border-[var(--border-color)]">
        <button
          className="w-full p-4 flex items-center justify-between text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
          onClick={() => setShowArchive(!showArchive)}
        >
          <div className="flex items-center gap-2">
            <Icon icon="archive" size={18} />
            <span>归档</span>
          </div>
          <div className="flex items-center gap-1">
            {archivedTeams.length > 0 && (
              <span className="text-xs">{archivedTeams.length} 个团队</span>
            )}
            <Icon icon={showArchive ? 'chevron-up' : 'chevron-down'} size={14} />
          </div>
        </button>

        {showArchive && archivedTeams.length > 0 && (
          <div className="pb-1">
            {archivedTeams.map(team => (
              <div
                key={team.name}
                className={`px-4 py-2 flex items-center gap-3 cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors ${currentTeam === team.name ? 'bg-[var(--bg-tertiary)]' : ''}`}
                onClick={() => onSelectTeam(team.name)}
              >
                <div className="relative opacity-60">
                  <Avatar
                    letter={team.name.charAt(0).toUpperCase()}
                    color={generateAvatarColor(team.name)}
                    size="sm"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-[var(--text-secondary)] truncate">
                    {team.displayName}
                  </div>
                  <div className="text-xs text-[var(--text-tertiary)]">
                    {team.archivedAt ? `归档于 ${formatSmartTime(team.archivedAt)}` : '已归档'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {showArchive && archivedTeams.length === 0 && (
          <div className="px-4 py-3 text-xs text-[var(--text-tertiary)] text-center">
            暂无归档团队
          </div>
        )}
      </div>

      {/* Settings Section */}
      <div className="border-t border-[var(--border-color)]">
        <button
          onClick={onOpenSettings}
          className="w-full p-4 flex items-center justify-between text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors group"
        >
          <div className="flex items-center gap-2">
            <Icon icon="settings" size={18} />
            <span>设置</span>
          </div>
          {pendingConfigRestart && (
            <span className="restart-badge">
              需重启
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
