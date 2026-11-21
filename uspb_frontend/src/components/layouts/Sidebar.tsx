"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  getServiceConfig,
  isNavItemActive,
  NavItem,
} from "@/lib/serviceConfig";
import {
  School,
  Recycle,
  Gift,
  Award,
  BarChart3,
  LayoutDashboard,
  ShieldCheck,
  Building2,
  FileText,
  CreditCard,
  FolderArchive,
  Lock,
} from "lucide-react";

function renderNavIcon(iconName?: string) {
  if (!iconName) return null;

  switch (iconName.toLowerCase()) {
    case "school":
    case "🏫":
    case "🎓":
      return <School className="h-4 w-4 shrink-0" />;
    case "recycle":
    case "♻️":
      return <Recycle className="h-4 w-4 shrink-0" />;
    case "gift":
    case "🎁":
      return <Gift className="h-4 w-4 shrink-0" />;
    case "award":
    case "🏅":
      return <Award className="h-4 w-4 shrink-0" />;
    case "barchart3":
    case "📊":
      return <BarChart3 className="h-4 w-4 shrink-0" />;
    case "dashboard":
    case "⚙️":
      return <LayoutDashboard className="h-4 w-4 shrink-0" />;
    case "shield":
    case "🛡️":
      return <ShieldCheck className="h-4 w-4 shrink-0" />;
    case "business":
    case "🏪":
      return <Building2 className="h-4 w-4 shrink-0" />;
    case "payment":
    case "💳":
      return <CreditCard className="h-4 w-4 shrink-0" />;
    case "annual":
    case "📁":
      return <FolderArchive className="h-4 w-4 shrink-0" />;
    default:
      return <FileText className="h-4 w-4 shrink-0" />;
  }
}

export function Sidebar() {
  const pathname = usePathname();
  const config = getServiceConfig(pathname);
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

      {/* Shared Sidebar Container - widened to w-72 to eliminate cut-off text */}
      <aside
        className={`w-72 shrink-0 border-r border-[#f0e6e5] bg-white p-4 transition-all duration-200 ${
          isMobileOpen ? "block" : "hidden md:block"
        }`}
      >
        {/* Section Heading */}
        <div className="mb-4 px-3 flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a5a58]">
            {config.navSectionLabel}
          </span>
          <span className="text-[10px] rounded bg-[#f0e0df] px-1.5 py-0.5 font-mono font-medium text-[#5a0000]">
            USPB
          </span>
        </div>

        {/* Dynamic Navigation Items for the Active Service */}
        <nav
          className="space-y-1.5"
          aria-label={`${config.serviceName} navigation`}
        >
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
                    ? "text-[#8a5a58] hover:bg-[#faf4f3] hover:text-[#5a0000] cursor-pointer"
                    : "text-[#5a0000] hover:bg-[#faf4f3] hover:text-[#5a0000]"
                }`}
                title={
                  isPlaceholder
                    ? `${item.name} (Module under development)`
                    : item.name
                }
                aria-current={isActive ? "page" : undefined}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`shrink-0 ${
                      isActive ? "text-white" : "text-[#8a5a58]"
                    }`}
                  >
                    {renderNavIcon(item.icon)}
                  </span>
                  <span className="truncate">{item.name}</span>
                </div>

                {item.badge && (
                  <span
                    className={`ml-2 shrink-0 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-stone-100 text-stone-500 border border-stone-200"
                    }`}
                  >
                    {isPlaceholder && <Lock className="h-2.5 w-2.5 text-stone-400" />}
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

export default Sidebar;
