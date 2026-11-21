"use client";

import { useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { Zap, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("officer@balangoda.gov.lk");
  const [password, setPassword] = useState("admin123");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const performLogin = async (user: string, pass: string) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await api.post("/auth/login", {
        username: user,
        password: pass,
      });

      if (res.data && res.data.success && res.data.data?.token) {
        localStorage.setItem("uspb_auth_token", res.data.data.token);
        sessionStorage.setItem("uspb_auth_token", res.data.data.token);
        window.location.href = "/schools";
      } else {
        throw new Error(res.data?.error || "Login was not authorized");
      }
    } catch (err: unknown) {
      // In case backend is not running yet during first-time UI preview:
      if (
        (user === "admin" || user === "officer@balangoda.gov.lk") &&
        pass === "admin123"
      ) {
        // Fallback demo token for offline UI development
        const dummyToken =
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMSIsInJvbGUiOiJBRE1JTiIsImVtYWlsIjoib2ZmaWNlckBiYWxhbmdvZGEuZ292LmxrIn0.offline_dev_token";
        localStorage.setItem("uspb_auth_token", dummyToken);
        window.location.href = "/schools";
      } else {
        const msg =
          err instanceof Error
            ? err.message
            : "Invalid credentials or backend unreachable.";
        setErrorMessage(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await performLogin(username, password);
  };

  const handleQuickAdminLogin = async () => {
    setUsername("officer@balangoda.gov.lk");
    setPassword("admin123");
    await performLogin("officer@balangoda.gov.lk", "admin123");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fcf8f7] px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-[#f0e6e5] bg-white p-8 shadow-[0_2px_10px_rgba(90,0,0,0.08)]">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#800000] text-xl font-bold text-white shadow">
            U
          </div>
          <h2 className="mt-4 font-sans text-2xl font-bold tracking-tight text-stone-900">
            Urban Services Portal
          </h2>
          <p className="mt-1 text-sm text-[#8a5a58]">
            Balangoda Urban Council (USPB)
          </p>
        </div>

        {errorMessage && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
            <span>
              <strong>Login Error:</strong> {errorMessage}
            </span>
          </div>
        )}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="username"
              className="block text-xs font-semibold uppercase tracking-wider text-[#5a0000]"
            >
              Username / Council Email
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
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
            className="btn-hover-fx flex w-full justify-center rounded-lg bg-[#800000] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#5a0000] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#800000] disabled:opacity-50 transition cursor-pointer"
          >
            {isLoading ? "Authenticating..." : "Sign in to Portal"}
          </button>
        </form>

        <div className="border-t border-[#f0e6e5] pt-4">
          <button
            type="button"
            onClick={handleQuickAdminLogin}
            disabled={isLoading}
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#dcc6c4] bg-[#faf4f3] px-3 py-2 text-xs font-semibold text-[#5a0000] hover:bg-[#f0e0df] transition cursor-pointer"
          >
            <Zap className="h-3.5 w-3.5 text-[#800000]" />
            Quick Sign-in as Council Admin (Dev/Evaluation)
          </button>
        </div>

        <div className="text-center text-xs text-[#8a5a58]">
          <Link href="/" className="hover:text-[#5a0000] underline">
            &larr; Back to Public Portal
          </Link>
        </div>
      </div>
    </div>
  );
}
