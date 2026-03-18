import { Icon as IconifyIcon } from '@iconify/react';

interface IconProps {
  icon: string;
  size?: number;
  className?: string;
}

/**
 * Icon component wrapper for Iconify
 * Uses Lucide icon set by default
 */
export function Icon({ icon, size = 24, className }: IconProps) {
  return (
    <IconifyIcon
      icon={`lucide:${icon}`}
      width={size}
      height={size}
      className={className}
    />
  );
}
