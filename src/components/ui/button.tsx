import * as React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'solid' | 'outline' | 'ghost';
  size?: 'sm' | 'md';
}

const base =
  'inline-flex items-center justify-center rounded font-medium focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed';
const sizes: Record<string, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-9 px-4 text-sm',
};
const variants: Record<string, string> = {
  solid: 'bg-neutral-900 text-white hover:bg-neutral-800 shadow',
  outline: 'border border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50',
  ghost: 'text-neutral-700 hover:bg-neutral-100',
};

export function Button({ variant = 'solid', size = 'md', className = '', ...rest }: ButtonProps) {
  const cls = [base, sizes[size], variants[variant], className].join(' ');
  return <button {...rest} className={cls} />;
}
