"use client";

import Link from "next/link";

interface HeaderProps {
  userRole?: string;
  userName?: string;
}

export function Header({
  userName = "Municipal Officer",
  userRole = "Admin",
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-gray-200 bg-white/95 px-6 backdrop-blur transition-all dark:border-gray-800 dark:bg-gray-900/95">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 font-bold text-white shadow-sm">
          U
        </div>
        <div>
          <h1 className="text-sm font-semibold tracking-tight text-gray-900 dark:text-gray-100">
            Urban Services Portal
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Balangoda Urban Council
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 dark:border-gray-800 dark:bg-gray-800/60">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {userName} ({userRole})
          </span>
        </div>
        <Link
          href="/login"
          className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 transition"
        >
          Sign Out
        </Link>
      </div>
    </header>
  );
}

export default Header;
