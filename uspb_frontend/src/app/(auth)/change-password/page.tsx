"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import axios from "axios";
import api from "@/lib/api";
import { dashboardByRole, useAuth } from "@/lib/auth";
import { ApiResponse } from "@/types";

export default function ChangePasswordPage() {
  const router = useRouter();
  const { user, isLoading, refreshUser, logout } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (newPassword.length < 8) {
      setErrorMsg("New password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg("New password and confirmation do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/auth/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
      });
      const updated = await refreshUser();
      if (updated) {
        router.push(dashboardByRole[updated.role]);
      } else {
        router.push("/login");
      }
    } catch (err) {
      if (axios.isAxiosError<ApiResponse>(err)) {
        setErrorMsg(err.response?.data?.error || "Failed to update password.");
      } else {
        setErrorMsg("Failed to update password.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fcf8f7] text-sm text-[#5a0000]">
        Loading account...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#fcf8f7] px-4 py-12">
      <div className="w-full max-w-md space-y-6 rounded-xl border border-[#f0e6e5] bg-white p-8 shadow-[0_2px_10px_rgba(90,0,0,0.08)]">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-[#dcc6c4] bg-[#f0e0df] p-1">
            <Image
              src="/images/gov_logo.png"
              alt="Balangoda Urban Council Crest"
              width={36}
              height={36}
              className="object-contain"
            />
          </div>
          <h1 className="mt-4 font-serif text-xl font-bold text-[#5a0000]">
            {user.must_change_password ? "Set Your New Password" : "Change Password"}
          </h1>
          <p className="mt-1 text-xs text-[#8a5a58]">
            {user.must_change_password
              ? "For security, please replace your temporary password before continuing."
              : `Updating password for ${user.username}`}
          </p>
        </div>

        {errorMsg && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-medium text-[#800000]"
          >
            {errorMsg}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#5a0000]">
              Current / Temporary Password
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-[#dcc6c4] bg-white px-3 py-2 text-sm text-[#1b1c1c] focus:border-[#800000] focus:outline-none focus:ring-1 focus:ring-[#800000]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#5a0000]">
              New Password (min 8 chars)
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-[#dcc6c4] bg-white px-3 py-2 text-sm text-[#1b1c1c] focus:border-[#800000] focus:outline-none focus:ring-1 focus:ring-[#800000]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#5a0000]">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-[#dcc6c4] bg-white px-3 py-2 text-sm text-[#1b1c1c] focus:border-[#800000] focus:outline-none focus:ring-1 focus:ring-[#800000]"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-hover-fx flex w-full justify-center rounded-lg bg-[#800000] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#5a0000] disabled:opacity-50"
          >
            {isSubmitting ? "Updating..." : "Update Password"}
          </button>
        </form>

        <div className="flex justify-between border-t border-[#f0e6e5] pt-4 text-xs">
          {!user.must_change_password ? (
            <button
              type="button"
              onClick={() => router.push(dashboardByRole[user.role])}
              className="font-medium text-[#5a0000] hover:underline"
            >
              &larr; Back to Dashboard
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={() => void logout()}
            className="font-medium text-[#8a5a58] hover:text-[#5a0000]"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
