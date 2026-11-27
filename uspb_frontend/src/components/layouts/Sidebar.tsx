"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Award,
  Banknote,
  FileSpreadsheet,
  FolderKanban,
  History,
  LayoutDashboard,
  Recycle,
  School,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import { getServiceConfig, isNavItemActive, NavItem } from "@/lib/serviceConfig";
import { useAuth } from "@/lib/auth";

function getInitials(name?: string): string {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function NavIcon({ name }: { name?: string }) {
  const cls = "h-4 w-4 shrink-0";
  const stroke = 1.5;
  switch (name) {
    case "Users":
      return <Users className={cls} strokeWidth={stroke} />;
    case "School":
      return <School className={cls} strokeWidth={stroke} />;
    case "Recycle":
      return <Recycle className={cls} strokeWidth={stroke} />;
    case "Award":
      return <Award className={cls} strokeWidth={stroke} />;
    case "FileSpreadsheet":
      return <FileSpreadsheet className={cls} strokeWidth={stroke} />;
    case "ShieldCheck":
      return <ShieldCheck className={cls} strokeWidth={stroke} />;
    case "Settings":
      return <Settings className={cls} strokeWidth={stroke} />;
    case "FolderKanban":
      return <FolderKanban className={cls} strokeWidth={stroke} />;
    case "Banknote":
      return <Banknote className={cls} strokeWidth={stroke} />;
    case "History":
      return <History className={cls} strokeWidth={stroke} />;
    default:
      return <LayoutDashboard className={cls} strokeWidth={stroke} />;
  }
}

function isItemActive(pathname: string, searchTab: string | null, href: string): boolean {
  if (href.includes("?tab=")) {
    const [path, query] = href.split("?");
    const targetTab = new URLSearchParams(query).get("tab");
    if (pathname === path) {
      return (searchTab || "students") === targetTab;
    }
    return false;
  }
  return isNavItemActive(pathname, href);
}

function SidebarNavContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchTab = searchParams.get("tab");
  const { user, logout } = useAuth();
  const config = getServiceConfig(pathname, user?.role);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const visibleItems = config.navItems.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  );

  // Preserve order while grouping by optional section header
  const sections: Array<{ group: string; items: NavItem[] }> = [];
  for (const item of visibleItems) {
    const grp = item.group || config.navSectionLabel;
    const existing = sections.find((s) => s.group === grp);
    if (existing) {
      existing.items.push(item);
    } else {
      sections.push({ group: grp, items: [item] });
    }
  }

  return (
    <>
      <div className="md:hidden sticky top-16 z-20 flex items-center justify-between border-b border-[#f0e6e5] bg-white px-4 py-2">
        <span className="text-xs font-semibold text-[#8a5a58]">
          {config.navSectionLabel}
        </span>
        <button
          type="button"
          onClick={() => setIsMobileOpen((prev) => !prev)}
          className="flex items-center gap-1.5 rounded border border-[#dcc6c4] bg-white px-2.5 py-1 text-xs font-semibold text-[#5a0000] hover:bg-[#f0e0df] transition-colors"
          aria-expanded={isMobileOpen}
          aria-label="Toggle section navigation"
        >
          <span>{isMobileOpen ? "Close" : "Menu"}</span>
        </button>
      </div>

      <aside
        className={`w-64 shrink-0 border-r border-[#f0e6e5] bg-white p-4 flex-col justify-between ${
          isMobileOpen ? "flex" : "hidden md:flex"
        }`}
      >
        <div className="space-y-5">
          {sections.map((section) => (
            <div key={section.group}>
              <div className="mb-2 px-3 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#8a5a58]">
                  {section.group}
                </span>
              </div>

              <nav className="space-y-1" aria-label={section.group}>
                {section.items.map((item) => {
                  const active = isItemActive(pathname, searchTab, item.href);
                  const isPlaceholder = item.href === "#";

                  return (
                    <Link
                      key={`${section.group}-${item.name}`}
                      href={item.href}
                      onClick={(e) => {
                        if (isPlaceholder) e.preventDefault();
                        setIsMobileOpen(false);
                      }}
                      className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        active
                          ? "bg-[#800000] text-white"
                          : isPlaceholder
                          ? "text-[#8a5a58] hover:bg-[#f0e0df]/40"
                          : "text-[#5a0000] hover:bg-[#f0e0df]/70"
                      }`}
                      aria-current={active ? "page" : undefined}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <NavIcon name={item.icon} />
                        <span className="truncate">{item.name}</span>
                      </div>

                      {item.badge && (
                        <span
                          className={`ml-2 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            active
                              ? "bg-white/20 text-white"
                              : "bg-[#fbbf24]/20 text-[#5a3a00]"
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
          ))}
        </div>

        {user && (
          <div className="mt-6 border-t border-[#f0e6e5] pt-4 space-y-3">
            <div className="flex items-center gap-3 px-1">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#800000] text-xs font-semibold text-white">
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
              className="w-full rounded-lg border border-[#dcc6c4] bg-[#faf4f3] px-3 py-2 text-xs font-semibold text-[#5a0000] hover:bg-[#f0e0df] hover:border-[#800000] transition-colors"
            >
              Sign Out
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

export function Sidebar() {
  return (
    <Suspense fallback={<aside className="hidden md:block w-64 shrink-0 border-r border-[#f0e6e5] bg-white p-4" />}>
      <SidebarNavContent />
    </Suspense>
  );
}

export default Sidebar;
