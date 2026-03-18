interface AvatarProps {
  letter: string;
  color: string;
  size?: 'sm' | 'md' | 'lg';
  isOnline?: boolean;
  onClick?: () => void;
}

export function Avatar({
  letter,
  color,
  size = 'md',
  isOnline,
  onClick
}: AvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg'
  };

  return (
    <div
      className={`relative ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-semibold text-white`}
        style={{ backgroundColor: color }}
      >
        {letter}
      </div>
      {isOnline !== undefined && (
        <span
          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[var(--bg-primary)] ${
            isOnline ? 'bg-green-500' : 'bg-gray-400'
          }`}
        />
      )}
    </div>
  );
}
