"use client";

import Link from "next/link";
import Image from "next/image";
import { dashboardByRole, useAuth } from "@/lib/auth";

export function LandingNavbar() {
  const { user, isLoading } = useAuth();
  const dashboardHref = user ? dashboardByRole[user.role] : "/login";

  return (
    <header className="bg-[#5a0000] text-white">
      <div className="max-w-[1180px] mx-auto px-5 py-[14px] flex items-center justify-between">
        <Link href="/" className="flex items-center gap-[14px] group">
          <div className="relative w-10 h-10 shrink-0">
            <Image
              src="/images/gov_logo.png"
              alt="Government / Council Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div>
            <b className="font-serif text-[15px] leading-tight block group-hover:text-[#fbbf24] transition-colors">
              Health Division Information Management System
            </b>
            <small className="text-[#fbbf24] text-[11px] block">
              Balangoda Urban Council, Sri Lanka
            </small>
          </div>
        </Link>

        <nav className="flex items-center gap-[26px] font-serif text-[13px] font-bold">
          <Link href="/" className="hidden md:inline-block hover:text-[#fbbf24] transition-colors">
            Home
          </Link>
          <Link href="#services" className="hidden md:inline-block hover:text-[#fbbf24] transition-colors">
            Services
          </Link>
          <Link href="#about" className="hidden md:inline-block hover:text-[#fbbf24] transition-colors">
            About
          </Link>
          <Link href="#help" className="hidden md:inline-block hover:text-[#fbbf24] transition-colors">
            Contact
          </Link>

          {!isLoading && user ? (
            <Link
              href={dashboardHref}
              className="btn-hover-fx bg-[#fbbf24] text-[#4a1a00] px-5 py-[10px] rounded font-sans font-bold hover:bg-[#f59e0b] shadow-sm hover:shadow"
            >
              My Dashboard
            </Link>
          ) : (
            <Link
              href="/login"
              className="btn-hover-fx bg-[#fbbf24] text-[#4a1a00] px-6 py-[11px] rounded font-sans font-bold hover:bg-[#f59e0b] shadow-sm hover:shadow"
            >
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
