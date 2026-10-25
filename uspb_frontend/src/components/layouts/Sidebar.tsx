"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { getServiceConfig, isNavItemActive, NavItem } from "@/lib/serviceConfig";

export function Sidebar() {
  const pathname = usePathname();
  const config = getServiceConfig(pathname);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile Toggle Button (Visible on screens < md) */}
      <div className="md:hidden sticky top-16 z-20 flex items-center justify-between border-b border-[#f0e6e5] bg-[#fcf8f7] px-4 py-2">
        <span className="text-xs font-bold uppercase tracking-wider text-[#8a5a58]">
          {config.navSectionLabel}
        </span>
        <button
          type="button"
          onClick={() => setIsMobileOpen((prev) => !prev)}
          className="flex items-center gap-1.5 rounded border border-[#dcc6c4] bg-white px-2.5 py-1 text-xs font-semibold text-[#5a0000] shadow-2xs hover:bg-[#f0e0df] transition-colors"
          aria-expanded={isMobileOpen}
          aria-label="Toggle section navigation"
        >
          <span>{isMobileOpen ? "Close Menu" : "Menu"}</span>
          <span aria-hidden="true">{isMobileOpen ? "✕" : "☰"}</span>
        </button>
      </div>

      {/* Shared Sidebar Container */}
      <aside
        className={`w-64 shrink-0 border-r border-[#f0e6e5] bg-[#fcf8f7] p-4 transition-all duration-200 dark:border-gray-800 dark:bg-gray-950/50 ${
          isMobileOpen ? "block" : "hidden md:block"
        }`}
      >
        {/* Section Heading */}
        <div className="mb-4 px-3 flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a5a58] dark:text-gray-400">
            {config.navSectionLabel}
          </span>
          <span className="text-[10px] rounded bg-[#f0e0df] px-1.5 py-0.5 font-mono font-medium text-[#5a0000] dark:bg-gray-800 dark:text-gray-300">
            USPB
          </span>
        </div>

        {/* Dynamic Navigation Items for the Active Service */}
        <nav className="space-y-1.5" aria-label={`${config.serviceName} navigation`}>
          {config.navItems.map((item: NavItem) => {
            const isActive = isNavItemActive(pathname, item.href);
            const isPlaceholder = item.href === "#";

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={(e) => {
                  if (isPlaceholder) {
                    e.preventDefault();
                  }
                  setIsMobileOpen(false);
                }}
                className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-[#800000] text-white shadow-xs font-semibold"
                    : isPlaceholder
                    ? "text-[#8a5a58] hover:bg-[#f0e0df]/40 hover:text-[#5a0000] dark:text-gray-400 dark:hover:bg-gray-900/60 cursor-pointer"
                    : "text-[#5a0000] hover:bg-[#f0e0df]/70 hover:text-[#5a0000] dark:text-gray-300 dark:hover:bg-gray-800/60 dark:hover:text-white"
                }`}
                title={
                  isPlaceholder
                    ? `${item.name} (Module under development)`
                    : item.name
                }
                aria-current={isActive ? "page" : undefined}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {item.icon && (
                    <span className="text-base shrink-0" aria-hidden="true">
                      {item.icon}
                    </span>
                  )}
                  <span className="truncate">{item.name}</span>
                </div>

                {item.badge && (
                  <span
                    className={`ml-2 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-[#fbbf24]/20 text-[#5a3a00] border border-[#fbbf24]/40 dark:bg-amber-950 dark:text-amber-300"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Informative footer card for non-implemented sections or quick context */}
        <div className="mt-8 rounded-lg border border-[#f0e6e5] bg-white p-3 text-[11px] text-[#8a5a58] shadow-2xs dark:border-gray-800 dark:bg-gray-900/50">
          <p className="font-semibold text-[#5a0000] dark:text-gray-200">
            {config.serviceName}
          </p>
          <p className="mt-0.5 text-[10.5px] leading-relaxed">
            Balangoda Urban Council municipal portal interface.
          </p>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
