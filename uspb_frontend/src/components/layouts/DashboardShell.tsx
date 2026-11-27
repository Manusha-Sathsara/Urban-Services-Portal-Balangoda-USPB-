"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Header from "@/components/layouts/Header";
import Sidebar from "@/components/layouts/Sidebar";
import { useAuth } from "@/lib/auth";
import { UserRole } from "@/types";

function isRolePermittedForPath(role: UserRole, pathname: string): boolean {
  if (role === "ADMIN") return true;
  if (pathname.startsWith("/admin")) return false;
  if (pathname.startsWith("/garbage-fees")) return role === "FEE_OFFICER";
  if (pathname.startsWith("/environmental")) return role === "ENV_OFFICER";
  if (pathname.startsWith("/schools")) {
    return role === "TEACHER" || role === "GARBAGE_SUPERVISOR";
  }
  return true;
}

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.must_change_password) {
      router.replace("/change-password");
      return;
    }
    if (!isRolePermittedForPath(user.role, pathname)) {
      router.replace("/access-denied");
    }
  }, [isLoading, user, pathname, router]);

  const permitted = Boolean(
    !isLoading &&
      user &&
      !user.must_change_password &&
      isRolePermittedForPath(user.role, pathname)
  );

  return (
    <div className="flex min-h-screen flex-col bg-[#fcf8f7] text-[#4a4a4a]">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {!permitted && (
            <div className="flex min-h-[50vh] items-center justify-center text-sm font-medium text-[#5a0000]">
              Verifying session...
            </div>
          )}
          <div className={permitted ? "block" : "hidden"}>{children}</div>
        </main>
      </div>
    </div>
  );
}
