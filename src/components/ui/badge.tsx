import * as React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
  variant?: 'subtle' | 'solid';
}

const toneMap: Record<string, { subtle: string; solid: string }> = {
  neutral: {
    subtle:
      'bg-surface-alt text-fg-muted border-border/70 dark:bg-surface-alt dark:text-fg-muted dark:border-border',
    solid: 'bg-fg text-bg border-fg dark:bg-fg dark:text-neutral-900',
  },
  success: {
    subtle:
      'bg-success/10 text-success border-success/30 dark:bg-success/15 dark:text-success',
    solid: 'bg-success text-white border-success dark:text-neutral-900',
  },
  warning: {
    subtle:
      'bg-warning/15 text-warning border-warning/30 dark:bg-warning/20 dark:text-warning',
    solid: 'bg-warning text-neutral-900 border-warning',
  },
  danger: {
    subtle: 'bg-danger/10 text-danger border-danger/30 dark:bg-danger/15',
    solid: 'bg-danger text-white border-danger dark:text-neutral-900',
  },
  info: {
    subtle: 'bg-info/12 text-info border-info/30 dark:bg-info/18',
    solid: 'bg-info text-white border-info dark:text-neutral-900',
  },
};

export function Badge({
  tone = 'neutral',
  variant = 'subtle',
  className = '',
  ...rest
}: BadgeProps) {
  const styles = toneMap[tone]?.[variant] || toneMap.neutral.subtle;
  return (
    <span
      {...rest}
  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium leading-none tracking-wide ${styles} ${className}`}
    />
  );
}
