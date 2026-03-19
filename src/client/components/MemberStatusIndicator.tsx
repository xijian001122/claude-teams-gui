interface MemberStatusIndicatorProps {
  status: 'busy' | 'idle' | 'occupied' | 'offline';
  size?: 'sm' | 'md';
}

export function MemberStatusIndicator({
  status,
  size = 'md'
}: MemberStatusIndicatorProps) {
  const sizeClasses = size === 'sm'
    ? 'w-2.5 h-2.5 border-[1.5px]'
    : 'w-3 h-3 border-2';

  const statusClasses = {
    busy: 'bg-red-500',        // 红色 - 执行中
    idle: 'bg-green-500',      // 绿色 - 空闲
    occupied: 'bg-yellow-500',  // 黄色 - 繁忙
    offline: 'bg-gray-400'     // 灰色 - 离线
  };

  const statusLabels = {
    busy: '执行中',
    idle: '空闲',
    occupied: '繁忙',
    offline: '离线'
  };

  return (
    <span
      className={`absolute -bottom-0.5 -right-0.5 rounded-full ${sizeClasses} ${statusClasses[status]} border-[var(--bg-primary)]`}
      title={statusLabels[status]}
    />
  );
}
