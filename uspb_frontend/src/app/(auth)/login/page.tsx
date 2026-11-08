"use client";

import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Authentication logic will connect to Go backend /api/v1/auth/login
    setTimeout(() => {
      setIsLoading(false);
      window.location.href = "/admin";
    }, 600);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fcf8f7] px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-[#f0e6e5] bg-white p-8 shadow-[0_2px_10px_rgba(90,0,0,0.08)]">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#800000] text-xl font-bold text-white shadow">
            U
          </div>
          <h2 className="mt-4 font-serif text-2xl font-bold tracking-tight text-[#5a0000]">
            Urban Services Portal
          </h2>
          <p className="mt-1 text-sm text-[#8a5a58]">
            Balangoda Urban Council (USPB)
          </p>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-semibold uppercase tracking-wider text-[#5a0000]"
            >
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="officer@balangoda.gov.lk"
              className="mt-1 block w-full rounded-lg border border-[#dcc6c4] bg-white px-3 py-2 text-sm text-[#4a4a4a] placeholder-gray-400 focus:border-[#800000] focus:outline-none focus:ring-1 focus:ring-[#800000]"
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
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1 block w-full rounded-lg border border-[#dcc6c4] bg-white px-3 py-2 text-sm text-[#4a4a4a] placeholder-gray-400 focus:border-[#800000] focus:outline-none focus:ring-1 focus:ring-[#800000]"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-hover-fx flex w-full justify-center rounded-lg bg-[#800000] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#5a0000] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#800000] disabled:opacity-50 transition"
          >
            {isLoading ? "Signing in..." : "Sign in to Portal"}
          </button>
        </form>

        <div className="text-center text-xs text-[#8a5a58]">
          Need access credentials? Contact the UC IT Administration.
        </div>
      </div>
    </div>
  );
}
