"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { getServiceConfig } from "@/lib/serviceConfig";
import { useAuth } from "@/lib/auth";

export interface HeaderProps {
  userRole?: string;
  userName?: string;
  serviceName?: string;
}

export function Header({
  userName,
  userRole,
  serviceName: customServiceName,
}: HeaderProps) {
  const pathname = usePathname();
  const config = getServiceConfig(pathname);
  const { user, logout } = useAuth();

  const activeServiceName = customServiceName || config.serviceName;
  const activeRoleTitle = userRole || user?.role || config.roleTitle;
  const activeUserName = userName || user?.name || config.defaultUserName;

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[#f0e6e5] bg-white px-4 md:px-6 shadow-2xs backdrop-blur transition-all">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="group flex items-center gap-3 focus:outline-none"
          title="Back to USPB Public Portal"
          aria-label="Balangoda Urban Services Portal Home"
        >
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f0e0df] border border-[#dcc6c4] p-1 shadow-xs group-hover:scale-105 transition-transform">
            <Image
              src="/images/gov_logo.png"
              alt="Balangoda Urban Council Crest"
              width={34}
              height={34}
              className="object-contain"
              priority
            />
          </div>
          <div>
            <h1 className="font-serif text-[14px] md:text-[15px] font-bold tracking-tight text-[#5a0000] leading-tight">
              {activeServiceName}
            </h1>
            <p className="text-[11px] md:text-[11.5px] text-[#8a5a58]">
              {config.serviceSubtitle}
            </p>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        <Link
          href="/"
          className="hidden lg:inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-[#8a5a58] hover:bg-[#faf4f3] hover:text-[#5a0000] transition-colors"
        >
          <span aria-hidden="true">&larr;</span> Public Portal
        </Link>

        <div
          className="flex items-center gap-2 rounded-full border border-[#f0e6e5] bg-[#faf4f3] px-3 py-1.5 shadow-xs max-w-[260px] sm:max-w-none"
          title={`Active Role: ${activeRoleTitle}`}
        >
          <div
            className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0"
            aria-hidden="true"
          />
          <div className="truncate text-xs text-[#5a0000]">
            <span className="font-semibold text-[#5a0000]">
              {activeUserName}
            </span>{" "}
            <span className="hidden sm:inline text-[#8a5a58] font-normal">
              ({activeRoleTitle})
            </span>
          </div>
        </div>

        <Link
          href="/change-password"
          className="hidden sm:inline-flex shrink-0 rounded border border-[#f0e6e5] bg-[#faf4f3] px-2.5 py-1.5 text-xs font-medium text-[#5a0000] hover:bg-[#f0e0df] transition"
        >
          Password
        </Link>

        <button
          type="button"
          onClick={() => void logout()}
          className="btn-hover-fx shrink-0 rounded border border-[#dcc6c4] bg-white px-3 py-1.5 text-xs font-semibold text-[#5a0000] hover:bg-[#f0e0df] hover:border-[#800000] transition"
        >
          Sign Out
        </button>
      </div>
    </header>
  );
}

export default Header;
