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
        'rounded-md border border-neutral-300 px-2 py-1 text-[11px] font-medium text-neutral-600 hover:bg-neutral-100 active:scale-[.97] dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-800'
      }
      aria-label="Logout"
      type="button"
    >
      Sair
    </button>
  );
}
