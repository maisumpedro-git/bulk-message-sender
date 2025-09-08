import * as React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
  variant?: 'subtle' | 'solid';
}

const toneMap: Record<string, { subtle: string; solid: string }> = {
  neutral: {
    subtle: 'bg-neutral-100 text-neutral-700 border-neutral-200',
    solid: 'bg-neutral-800 text-white border-neutral-800',
  },
  success: {
    subtle: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    solid: 'bg-emerald-600 text-white border-emerald-600',
  },
  warning: {
    subtle: 'bg-amber-100 text-amber-800 border-amber-200',
    solid: 'bg-amber-600 text-white border-amber-600',
  },
  danger: {
    subtle: 'bg-rose-100 text-rose-800 border-rose-200',
    solid: 'bg-rose-600 text-white border-rose-600',
  },
  info: {
    subtle: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    solid: 'bg-indigo-600 text-white border-indigo-600',
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
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${styles} ${className}`}
    />
  );
}
