"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { getServiceConfig } from "@/lib/serviceConfig";
import { User as UserIcon } from "lucide-react";

export interface HeaderProps {
  /** Optional role override; if omitted, automatically derived from the active service route */
  userRole?: string;
  /** Optional user name override; if omitted, uses service default */
  userName?: string;
  /** Optional service name override; if omitted, automatically derived from active route */
  serviceName?: string;
}

export function Header({
  userName,
  userRole,
  serviceName: customServiceName,
}: HeaderProps) {
  const pathname = usePathname();
  const config = getServiceConfig(pathname);

  // Dynamic values defaulting to service-specific configuration
  const activeServiceName = customServiceName || config.serviceName;
  const activeRoleTitle = userRole || config.roleTitle;
  const activeUserName = userName || config.defaultUserName;

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[#f0e6e5] bg-white px-4 md:px-6 shadow-2xs backdrop-blur transition-all">
      {/* Service & Portal Branding */}
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
            <h1 className="font-sans text-[14px] md:text-[15px] font-bold tracking-tight text-[#5a0000] leading-tight">
              {activeServiceName}
            </h1>
            <p className="text-[11px] md:text-[11.5px] text-[#8a5a58]">
              {config.serviceSubtitle}
            </p>
          </div>
        </Link>
      </div>

      {/* Right-hand Controls & Role Badge */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Link back to public portal (hidden on very small screens) */}
        <Link
          href="/"
          className="hidden lg:inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-[#8a5a58] hover:bg-[#faf4f3] hover:text-[#5a0000] transition-colors"
        >
          <span aria-hidden="true">&larr;</span> Public Portal
        </Link>

        {/* User profile & service role badge */}
        <div
          className="flex items-center gap-2 rounded-full border border-stone-200 bg-[#faf4f3] px-3 py-1.5 shadow-2xs"
          title={`Active Role: ${activeRoleTitle}`}
        >
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#f0e0df] text-[#5a0000]">
            <UserIcon className="h-3 w-3" />
          </div>
          <span className="truncate text-xs font-semibold text-[#5a0000]">
            {activeUserName}
          </span>
        </div>

        {/* Sign out link */}
        <Link
          href="/login"
          className="btn-hover-fx shrink-0 rounded border border-[#dcc6c4] bg-white px-3 py-1.5 text-xs font-semibold text-[#5a0000] hover:bg-[#f0e0df] hover:border-[#800000] transition"
        >
          Sign Out
        </Link>
      </div>
    </header>
  );
}

export default Header;
