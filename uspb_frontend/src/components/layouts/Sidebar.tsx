"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { getServiceConfig, isNavItemActive, NavItem } from "@/lib/serviceConfig";
import { useAuth } from "@/lib/auth";

function getInitials(name?: string): string {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Sidebar() {
  const pathname = usePathname();
  const config = getServiceConfig(pathname);
  const { user, logout } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile Toggle Button (Visible on screens < md) */}
      <div className="md:hidden sticky top-16 z-20 flex items-center justify-between border-b border-[#f0e6e5] bg-white px-4 py-2">
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
        className={`w-64 shrink-0 border-r border-[#f0e6e5] bg-white p-4 transition-all duration-200 flex-col justify-between ${
          isMobileOpen ? "flex" : "hidden md:flex"
        }`}
      >
        <div>
          <div className="mb-4 px-3 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a5a58]">
              {config.navSectionLabel}
            </span>
            <span className="text-[10px] rounded bg-[#f0e0df] px-1.5 py-0.5 font-mono font-medium text-[#5a0000]">
              USPB
            </span>
          </div>

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
                      ? "text-[#8a5a58] hover:bg-[#f0e0df]/40 hover:text-[#5a0000] cursor-pointer"
                      : "text-[#5a0000] hover:bg-[#f0e0df]/70 hover:text-[#5a0000]"
                  }`}
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
                          : "bg-[#fbbf24]/20 text-[#5a3a00] border border-[#fbbf24]/40"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Authenticated User Profile & Sign Out */}
        {user && (
          <div className="mt-6 border-t border-[#f0e6e5] pt-4 space-y-3">
            <div className="flex items-center gap-3 px-1">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#800000] text-xs font-bold text-white shadow-xs">
                {getInitials(user.name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-[#5a0000]">
                  {user.name}
                </p>
                <p className="truncate text-[11px] text-[#8a5a58]">
                  {user.role}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void logout()}
              className="btn-hover-fx w-full rounded-lg border border-[#dcc6c4] bg-[#faf4f3] px-3 py-2 text-xs font-semibold text-[#5a0000] hover:bg-[#f0e0df] hover:border-[#800000] transition"
            >
              Sign Out
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

export default Sidebar;
