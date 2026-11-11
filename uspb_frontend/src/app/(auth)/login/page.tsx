"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { dashboardByRole, useAuth } from "@/lib/auth";
import { ApiResponse } from "@/types";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading, login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sessionExpired = searchParams.get("expired") === "1";

  useEffect(() => {
    if (!authLoading && user) {
      if (user.must_change_password) {
        router.replace("/change-password");
      } else {
        router.replace(dashboardByRole[user.role]);
      }
    }
  }, [authLoading, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const loggedIn = await login(username.trim(), password);
      if (loggedIn.must_change_password) {
        router.push("/change-password");
      } else {
        router.push(dashboardByRole[loggedIn.role]);
      }
    } catch (err) {
      if (axios.isAxiosError<ApiResponse>(err)) {
        const msg = err.response?.data?.error;
        setErrorMsg(msg || "Invalid username or password.");
      } else {
        setErrorMsg("Unable to sign in. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#fcf8f7] px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6 rounded-xl border border-[#f0e6e5] bg-white p-8 shadow-[0_2px_10px_rgba(90,0,0,0.08)]">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl border border-[#dcc6c4] bg-[#f0e0df] p-1.5 shadow-xs">
            <Image
              src="/images/gov_logo.png"
              alt="Balangoda Urban Council Crest"
              width={44}
              height={44}
              className="object-contain"
              priority
            />
          </div>
          <h1 className="mt-4 font-serif text-2xl font-bold tracking-tight text-[#5a0000]">
            Urban Services Portal
          </h1>
          <p className="mt-1 text-sm text-[#8a5a58]">
            Balangoda Urban Council — Staff Sign In
          </p>
        </div>

        {sessionExpired && !errorMsg && (
          <div className="rounded-lg border border-[#fbbf24]/60 bg-[#fff8e1] px-4 py-2.5 text-xs font-medium text-[#5a3a00]">
            Your session has expired. Please sign in again to continue.
          </div>
        )}

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
            <label
              htmlFor="username"
              className="block text-xs font-semibold uppercase tracking-wider text-[#5a0000]"
            >
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. admin or teacher_kamal"
              className="mt-1 block w-full rounded-lg border border-[#dcc6c4] bg-white px-3 py-2 text-sm text-[#1b1c1c] placeholder-gray-400 focus:border-[#800000] focus:outline-none focus:ring-1 focus:ring-[#800000]"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-semibold uppercase tracking-wider text-[#5a0000]"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1 block w-full rounded-lg border border-[#dcc6c4] bg-white px-3 py-2 text-sm text-[#1b1c1c] placeholder-gray-400 focus:border-[#800000] focus:outline-none focus:ring-1 focus:ring-[#800000]"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-hover-fx flex w-full justify-center rounded-lg bg-[#800000] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#5a0000] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#800000] disabled:opacity-50"
          >
            {isSubmitting ? "Signing in..." : "Sign in to Portal"}
          </button>
        </form>

        <div className="flex items-center justify-between border-t border-[#f0e6e5] pt-4 text-xs text-[#8a5a58]">
          <Link href="/" className="font-medium text-[#5a0000] hover:underline">
            &larr; Public Portal
          </Link>
          <span>Need credentials? Contact UC IT Admin.</span>
        </div>
      </div>
    </div>
  );
}
