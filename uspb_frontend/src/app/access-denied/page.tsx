"use client";

import Link from "next/link";
import { dashboardByRole, useAuth } from "@/lib/auth";

export default function AccessDeniedPage() {
  const { user } = useAuth();
  const homeHref = user ? dashboardByRole[user.role] : "/login";

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fcf8f7] px-4">
      <div className="w-full max-w-md rounded-xl border border-[#f0e6e5] bg-white p-8 text-center shadow-[0_2px_10px_rgba(90,0,0,0.08)]">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#f0e0df] text-xl font-bold text-[#800000]">
          !
        </div>
        <h1 className="mt-4 font-serif text-2xl font-bold text-[#5a0000]">
          Access Denied
        </h1>
        <p className="mt-2 text-sm text-[#5a413d]">
          Your account does not have permission to view this section.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href={homeHref}
            className="btn-hover-fx rounded-lg bg-[#800000] px-4 py-2 text-sm font-semibold text-white hover:bg-[#5a0000]"
          >
            {user ? "Return to My Dashboard" : "Sign In"}
          </Link>
          <Link
            href="/"
            className="rounded-lg border border-[#dcc6c4] bg-white px-4 py-2 text-sm font-semibold text-[#5a0000] hover:bg-[#f0e0df]"
          >
            Public Portal
          </Link>
        </div>
      </div>
    </div>
  );
}
