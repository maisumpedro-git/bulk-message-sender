import * as React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'solid' | 'outline' | 'ghost';
  size?: 'sm' | 'md';
}

const base =
  'inline-flex select-none items-center justify-center whitespace-nowrap rounded-md font-medium tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg transition-colors ease-out-soft disabled:opacity-55 disabled:cursor-not-allowed active:translate-y-px';
const sizes: Record<string, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-9 px-4 text-sm',
};
const variants: Record<string, string> = {
  solid:
    'bg-brand text-white shadow-subtle hover:bg-brand-hover active:bg-brand-hover/90 dark:text-neutral-900',
  outline:
    'border border-border/80 bg-surface text-fg hover:bg-surface-alt/70 dark:hover:bg-surface-alt',
  ghost:
    'text-fg-muted hover:bg-surface-alt/70 dark:text-fg-muted dark:hover:bg-surface-alt',
};

export function Button({ variant = 'solid', size = 'md', className = '', ...rest }: ButtonProps) {
  const cls = [base, sizes[size], variants[variant], className].join(' ').replace(/\s+/g, ' ').trim();
  return <button {...rest} className={cls} />;
}
