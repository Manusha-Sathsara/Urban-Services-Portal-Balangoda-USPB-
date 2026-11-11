"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { dashboardByRole, useAuth } from "@/lib/auth";

export default function DashboardRouterPage() {
  const router = useRouter();
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
    router.replace(dashboardByRole[user.role]);
  }, [isLoading, user, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fcf8f7] text-sm font-medium text-[#5a0000]">
      Redirecting to your dashboard...
    </div>
  );
}
