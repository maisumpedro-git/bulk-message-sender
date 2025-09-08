"use client";
import { signOut } from 'next-auth/react';

interface Props {
  className?: string;
}

export default function LogoutButton({ className }: Props) {
  function onClick() {
    signOut({ callbackUrl: '/login' });
  }
  return (
    <button
      onClick={onClick}
      className={
        className ||
        'rounded-md border border-border/70 bg-surface-alt/60 px-2 py-1 text-[11px] font-medium text-fg-muted hover:bg-surface-alt active:scale-[.97]'
      }
      aria-label="Logout"
      type="button"
    >
      Sair
    </button>
  );
}
