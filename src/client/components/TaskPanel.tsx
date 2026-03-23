import { useState, useEffect, useCallback } from 'preact/hooks';
import type { Task, TaskStatus, TaskHistoryEntry } from '@shared/types';
import { api } from '../utils/api';

interface TaskPanelProps {
  currentTeam: string | null;
}

type ViewMode = 'current' | 'global';

// Inline SVG Icons
const Icons: Record<string, (props: { size?: number; className?: string }) => JSX.Element> = {
  'clipboard-list': ({ size = 24, className = '' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className={className}>
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/>
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
      <path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>
    </svg>
  ),
  'check-circle': ({ size = 24, className = '' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className={className}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <path d="m9 11 3 3L22 4"/>
    </svg>
  ),
  'clock': ({ size = 24, className = '' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className={className}>
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  'loader-2': ({ size = 24, className = '' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className={className}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
  ),
  'refresh-cw': ({ size = 24, className = '' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className={className}>
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
      <path d="M21 3v5h-5"/>
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
      <path d="M3 21v-5h5"/>
    </svg>
  ),
  'x': ({ size = 24, className = '' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className={className}>
      <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
    </svg>
  ),
  'ban': ({ size = 24, className = '' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className={className}>
      <circle cx="12" cy="12" r="10"/>
      <path d="m4.9 4.9 14.2 14.2"/>
    </svg>
  ),
  'trash-2': ({ size = 24, className = '' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className={className}>
      <path d="M3 6h18"/>
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
      <line x1="10" x2="10" y1="11" y2="17"/>
      <line x1="14" x2="14" y1="11" y2="17"/>
    </svg>
  ),
  'globe': ({ size = 24, className = '' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className={className}>
      <circle cx="12" cy="12" r="10"/>
      <path d="M2 12h20"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  ),
  'users': ({ size = 24, className = '' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className={className}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  'chevron-down': ({ size = 24, className = '' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className={className}>
      <path d="m6 9 6 6 6-6"/>
    </svg>
  ),
  'history': ({ size = 24, className = '' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className={className}>
      <path d="M3 3v5h5"/>
      <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/>
      <path d="M12 7v5l4 2"/>
    </svg>
  ),
  'filter': ({ size = 24, className = '' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className={className}>
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
    </svg>
  ),
  'expand': ({ size = 24, className = '' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className={className}>
      <path d="m21 21-6-6m6 6v-4.8m0 4.8h-4.8"/>
      <path d="M3 16.2V21m0 0h4.8M3 21l6-6"/>
      <path d="M21 7.8V3m0 0h-4.8M21 3l-6 6"/>
      <path d="M3 7.8V3m0 0h4.8M3 3l6 6"/>
    </svg>
  ),
  'collapse': ({ size = 24, className = '' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className={className}>
      <path d="m21 21-6-6m6 6v-4.8m0 4.8h-4.8"/>
      <path d="M3 16.2V21m0 0h4.8M3 21l6-6"/>
      <path d="M21 7.8V3m0 0h-4.8M21 3l-6 6"/>
      <path d="M3 7.8V3m0 0h4.8M3 3l6 6"/>
    </svg>
  ),
  'corner-down-right': ({ size = 24, className = '' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className={className}>
      <polyline points="15 10 20 15 15 20"/>
      <path d="M4 4v7a4 4 0 0 0 4 4h12"/>
    </svg>
  )
};

// Icon component using inline SVG
function Icon({ name, size = 24, className = '' }: { name: string; size?: number; className?: string }) {
  const IconComponent = Icons[name];
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found`);
    return null;
  }
  return <IconComponent size={size} className={className} />;
}

const statusConfig: Record<TaskStatus, { icon: string; color: string; label: string; bgColor: string }> = {
  pending: { icon: 'clock', color: 'text-amber-500', label: '等待中', bgColor: 'bg-amber-50 dark:bg-amber-900/20' },
  in_progress: { icon: 'loader-2', color: 'text-blue-500', label: '进行中', bgColor: 'bg-blue-50 dark:bg-blue-900/20' },
  completed: { icon: 'check-circle', color: 'text-green-500', label: '已完成', bgColor: 'bg-green-50 dark:bg-green-900/20' },
  deleted: { icon: 'trash-2', color: 'text-gray-400', label: '已删除', bgColor: 'bg-gray-50 dark:bg-gray-800/50' }
};

// Map 'blocked' to pending for display purposes
const getStatusDisplay = (status: TaskStatus, blockedBy?: string[]) => {
  if (blockedBy && blockedBy.length > 0) {
    return { icon: 'ban', color: 'text-red-500', label: '被阻塞', bgColor: 'bg-red-50 dark:bg-red-900/20' };
  }
  return statusConfig[status] || statusConfig.pending;
};

// Format timestamp for display
function formatTimeAgo(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 30) return `${diffDays}天前`;
  return date.toLocaleDateString('zh-CN');
}

// Format full timestamp
function formatFullTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Format date for task card (compact)
function formatTaskDate(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return '昨天';
  } else if (diffDays < 7) {
    return `${diffDays}天前`;
  } else {
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  }
}

// Generate consistent color for team name
function getTeamColor(teamName: string): string {
  const colors = [
    'from-blue-500 to-blue-600',
    'from-purple-500 to-purple-600',
    'from-emerald-500 to-emerald-600',
    'from-orange-500 to-orange-600',
    'from-pink-500 to-pink-600',
    'from-cyan-500 to-cyan-600',
    'from-indigo-500 to-indigo-600',
    'from-rose-500 to-rose-600'
  ];
  let hash = 0;
  for (let i = 0; i < teamName.length; i++) {
    hash = teamName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

// Task History Timeline Component
function TaskHistoryTimeline({ history }: { history?: TaskHistoryEntry[] }) {
  if (!history || history.length === 0) {
    return (
      <div className="text-xs text-[var(--text-secondary)] py-2">
        暂无历史记录
      </div>
    );
  }

  return (
    <div className="task-history-timeline">
      {history.map((entry, index) => (
        <div key={index} className="task-history-item">
          <div className="task-history-dot" />
          <div className="task-history-content">
            <div className="task-history-header">
              <span className="task-history-field">{getFieldLabel(entry.field)}</span>
              <span className="task-history-time">{formatTimeAgo(entry.timestamp)}</span>
            </div>
            <div className="task-history-change">
              {entry.oldValue !== null && (
                <span className="task-history-old">{entry.oldValue}</span>
              )}
              <Icon name="corner-down-right" size={12} className="text-[var(--text-secondary)]" />
              <span className="task-history-new">{entry.newValue}</span>
            </div>
            {entry.changedBy && (
              <div className="task-history-by">由 {entry.changedBy} 修改</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function getFieldLabel(field: string): string {
  const labels: Record<string, string> = {
    status: '状态',
    owner: '负责人',
    subject: '标题',
    description: '描述'
  };
  return labels[field] || field;
}

// Task Counts Interface
interface TaskCounts {
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
  deleted: number;
}

export function TaskPanel({ currentTeam }: TaskPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tasks, setTasks] = useState<Array<Task & { teamName?: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('current');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [counts, setCounts] = useState<TaskCounts | null>(null);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      if (viewMode === 'current' && currentTeam) {
        // Load tasks for current team
        const response = await api.get(`/teams/${currentTeam}/tasks`);
        const data = response.data as { tasks?: Task[] };
        if (data?.tasks) {
          const tasksWithTeam = data.tasks.map(t => ({ ...t, teamName: currentTeam }));
          setTasks(tasksWithTeam);
        } else {
          setTasks([]);
        }
        setCounts(null);
      } else {
        // Load global tasks
        const statusParam = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
        const response = await api.get(`/tasks${statusParam}`);
        const data = response.data as { tasks?: Array<Task & { teamName: string }>; counts?: TaskCounts };
        if (data?.tasks) {
          setTasks(data.tasks);
        } else {
          setTasks([]);
        }
        setCounts(data?.counts || null);
      }
    } catch (err) {
      console.error('[TaskPanel] Failed to load tasks:', err);
      setTasks([]);
      setCounts(null);
    } finally {
      setLoading(false);
    }
  }, [currentTeam, viewMode, statusFilter]);

  // Load tasks when dependencies change
  useEffect(() => {
    if (isOpen) {
      loadTasks();
    }
  }, [loadTasks, isOpen]);

  // Reset view mode when team changes
  useEffect(() => {
    if (viewMode === 'current' && !currentTeam) {
      setViewMode('global');
    }
  }, [currentTeam, viewMode]);

  // Calculate active task count (non-completed for badge)
  const activeTaskCount = tasks.filter(t => t.status !== 'completed' && t.status !== 'deleted').length;

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setExpandedTaskId(null);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setExpandedTaskId(null);
  };

  const toggleTaskExpand = (taskId: string) => {
    setExpandedTaskId(expandedTaskId === taskId ? null : taskId);
  };

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isOpen && !target.closest('.task-panel-container')) {
        handleClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Filter tasks locally for current team view
  const filteredTasks = statusFilter === 'all' || viewMode === 'global'
    ? tasks
    : tasks.filter(t => t.status === statusFilter);

  return (
    <div className="task-panel-container">
      {/* Floating Action Button */}
      <button
        onClick={handleToggle}
        className={`task-fab ${isOpen ? 'active' : ''}`}
        title="查看任务"
      >
        <Icon name="clipboard-list" size={24} />
        {activeTaskCount > 0 && (
          <span className="task-fab-badge">{activeTaskCount}</span>
        )}
      </button>

      {/* Task Drawer */}
      {isOpen && (
        <div className="task-drawer task-drawer-enhanced">
          {/* Drawer Header */}
          <div className="task-drawer-header">
            <div className="flex items-center gap-2">
              <Icon name="clipboard-list" size={18} />
              <span className="font-semibold">
                {viewMode === 'global' ? '全局任务' : `${currentTeam} 任务`}
              </span>
              <span className="task-count-badge">{filteredTasks.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={loadTasks}
                className="task-refresh-btn"
                title="刷新"
                disabled={loading}
              >
                {loading ? <Icon name="loader-2" size={16} className="animate-spin" /> : <Icon name="refresh-cw" size={16} />}
              </button>
              <button
                onClick={handleClose}
                className="task-close-btn"
                title="关闭"
              >
                <Icon name="x" size={16} />
              </button>
            </div>
          </div>

          {/* View Mode Tabs */}
          <div className="task-view-tabs">
            <button
              className={`task-view-tab ${viewMode === 'current' ? 'active' : ''}`}
              onClick={() => setViewMode('current')}
              disabled={!currentTeam}
              title={!currentTeam ? '请先选择一个团队' : '当前团队任务'}
            >
              <Icon name="users" size={14} />
              <span>当前团队</span>
            </button>
            <button
              className={`task-view-tab ${viewMode === 'global' ? 'active' : ''}`}
              onClick={() => setViewMode('global')}
              title="所有团队任务"
            >
              <Icon name="globe" size={14} />
              <span>全局视图</span>
            </button>
          </div>

          {/* Status Filter */}
          <div className="task-filter-bar">
            <div className="task-filter-label">
              <Icon name="filter" size={12} />
              <span>过滤:</span>
            </div>
            <select
              className="task-filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter((e.target as HTMLSelectElement).value as TaskStatus | 'all')}
            >
              <option value="all">全部状态</option>
              <option value="pending">等待中</option>
              <option value="in_progress">进行中</option>
              <option value="completed">已完成</option>
              <option value="deleted">已删除</option>
            </select>
          </div>

          {/* Task List */}
          <div className="task-drawer-content">
            {filteredTasks.length === 0 ? (
              <div className="task-empty">
                <div className="text-4xl mb-2 text-[var(--text-secondary)]">
                  <Icon name="clipboard-list" size={48} />
                </div>
                <div className="text-[var(--text-secondary)]">
                  {loading ? '加载中...' : '暂无任务'}
                </div>
              </div>
            ) : (
              <div className="task-list">
                {filteredTasks.map((task) => {
                  const statusDisplay = getStatusDisplay(task.status, task.blockedBy);
                  const isExpanded = expandedTaskId === task.id;
                  const teamColorClass = task.teamName ? getTeamColor(task.teamName) : '';
                  return (
                    <div key={`${task.teamName}-${task.id}`} className={`task-item ${isExpanded ? 'expanded' : ''}`}>
                      {/* Task Header Row */}
                      <div className="task-item-header" onClick={() => toggleTaskExpand(task.id)}>
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Team Badge - Most Important in Global View */}
                          {viewMode === 'global' && task.teamName && (
                            <span className={`task-team-badge-enhanced bg-gradient-to-r ${teamColorClass}`}>
                              <Icon name="users" size={10} />
                              {task.teamName}
                            </span>
                          )}
                          {/* Task ID */}
                          <span className="task-id">#{task.id}</span>
                          {/* Status Badge with Label */}
                          <span className={`task-status-badge ${statusDisplay.bgColor} ${statusDisplay.color}`}>
                            <Icon name={statusDisplay.icon} size={12} />
                            <span>{statusDisplay.label}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Timestamp */}
                          {(task.createdAt || task.updatedAt) && (
                            <span className="task-timestamp" title={formatFullTime(task.updatedAt || task.createdAt!)}>
                              <Icon name="clock" size={10} />
                              {formatTaskDate(task.updatedAt || task.createdAt!)}
                            </span>
                          )}
                          <button className="task-expand-btn">
                            <Icon name={isExpanded ? 'collapse' : 'expand'} size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Task Subject */}
                      <div className="task-subject" onClick={() => toggleTaskExpand(task.id)}>
                        {task.subject}
                      </div>

                      {/* Task Meta Row */}
                      <div className="task-meta-row">
                        {task.owner && (
                          <div className="task-owner">
                            <span className="task-owner-avatar">
                              {task.owner.charAt(0).toUpperCase()}
                            </span>
                            <span className="task-owner-name">{task.owner}</span>
                          </div>
                        )}
                        {task.blockedBy && task.blockedBy.length > 0 && (
                          <div className="task-blocked-by">
                            <Icon name="ban" size={10} />
                            <span>阻塞于 </span>
                            {task.blockedBy.map((blockedId, index) => (
                              <span key={blockedId}>
                                #{blockedId}
                                {index < task.blockedBy!.length - 1 ? ', ' : ''}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Expanded Content: History */}
                      {isExpanded && (
                        <div className="task-expanded-content">
                          <div className="task-history-header">
                            <Icon name="history" size={14} />
                            <span>历史记录</span>
                          </div>
                          <TaskHistoryTimeline history={task.history} />
                          <div className="task-dates">
                            {task.createdAt && (
                              <span>创建于 {formatFullTime(task.createdAt)}</span>
                            )}
                            {task.updatedAt && task.updatedAt !== task.createdAt && (
                              <span>更新于 {formatFullTime(task.updatedAt)}</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Drawer Footer */}
          <div className="task-drawer-footer">
            {viewMode === 'global' && counts ? (
              <div className="task-summary task-summary-global">
                <div className="task-summary-item task-summary-total">
                  <span className="task-summary-label">总计</span>
                  <span className="task-summary-value">{counts.total}</span>
                </div>
                <div className="task-summary-divider" />
                <div className="task-summary-item">
                  <span className="text-gray-500">
                    <Icon name="clock" size={12} />
                  </span>
                  <span>{counts.pending}</span>
                </div>
                <div className="task-summary-item">
                  <span className="text-blue-500">
                    <Icon name="loader-2" size={12} />
                  </span>
                  <span>{counts.in_progress}</span>
                </div>
                <div className="task-summary-item">
                  <span className="text-green-500">
                    <Icon name="check-circle" size={12} />
                  </span>
                  <span>{counts.completed}</span>
                </div>
              </div>
            ) : (
              <div className="task-summary">
                <span className="task-summary-item">
                  <span className="text-green-500">
                    <Icon name="check-circle" size={14} />
                  </span>
                  <span>{tasks.filter(t => t.status === 'completed').length}</span>
                </span>
                <span className="task-summary-item">
                  <span className="text-blue-500">
                    <Icon name="loader-2" size={14} />
                  </span>
                  <span>{tasks.filter(t => t.status === 'in_progress').length}</span>
                </span>
                <span className="task-summary-item">
                  <span className="text-gray-500">
                    <Icon name="clock" size={14} />
                  </span>
                  <span>{tasks.filter(t => t.status === 'pending').length}</span>
                </span>
                <span className="task-summary-item">
                  <span className="text-red-500">
                    <Icon name="ban" size={14} />
                  </span>
                  <span>{tasks.filter(t => t.blockedBy && t.blockedBy.length > 0).length}</span>
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
