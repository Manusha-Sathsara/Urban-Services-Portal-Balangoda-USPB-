"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { ActiveSession, ApiResponse } from "@/types";

export default function AdminSettingsPage() {
  const { user, refreshUser } = useAuth();
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const loadSessions = useCallback(async () => {
    try {
      const res = await api.get<ApiResponse<ActiveSession[]>>("/admin/sessions");
      setSessions(res.data.data || []);
    } catch {
      // handled silently on initial load
    }
  }, []);

  useEffect(() => {
    let active = true;
    api.get<ApiResponse<ActiveSession[]>>("/admin/sessions").then((res) => {
      if (active) setSessions(res.data.data || []);
    });
    return () => {
      active = false;
    };
  }, []);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    if (newPassword.length < 8) {
      setFeedback({ type: "err", text: "New password must be at least 8 characters." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setFeedback({ type: "err", text: "Password confirmation does not match." });
      return;
    }
    try {
      await api.post("/auth/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      await refreshUser();
      setFeedback({ type: "ok", text: "Your password has been updated." });
    } catch (err) {
      const msg = axios.isAxiosError<ApiResponse>(err) ? err.response?.data?.error : undefined;
      setFeedback({ type: "err", text: msg || "Failed to update password." });
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    setFeedback(null);
    try {
      await api.post(`/admin/sessions/${sessionId}/revoke`);
      setFeedback({ type: "ok", text: `Revoked session ${sessionId.slice(0, 8)}...` });
      await loadSessions();
    } catch {
      setFeedback({ type: "err", text: "Could not revoke session." });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-[22px] text-[#5a0000] leading-tight">
          Settings &amp; Security
        </h2>
        <p className="text-[13px] text-[#8a5a58] mt-1">
          Manage your administrator password and monitor or terminate active staff sessions.
        </p>
      </div>

      {feedback && (
        <div
          className={`rounded-lg border px-4 py-2.5 text-xs font-medium ${
            feedback.type === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-[#800000]"
          }`}
        >
          {feedback.text}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Change Password */}
        <form
          onSubmit={handlePasswordSubmit}
          className="rounded-xl border border-[#f0e6e5] bg-white p-6 shadow-[0_2px_10px_rgba(90,0,0,0.06)] space-y-4"
        >
          <h3 className="font-serif text-base font-bold text-[#5a0000]">
            Change Administrator Password
          </h3>
          <div>
            <label className="block text-xs font-semibold text-[#5a0000]">Current Password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#dcc6c4] px-3 py-2 text-sm focus:border-[#800000] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#5a0000]">
              New Password (min 8 chars)
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#dcc6c4] px-3 py-2 text-sm focus:border-[#800000] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#5a0000]">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#dcc6c4] px-3 py-2 text-sm focus:border-[#800000] focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="btn-hover-fx rounded-lg bg-[#800000] px-4 py-2 text-xs font-semibold text-white hover:bg-[#5a0000]"
          >
            Update Password
          </button>
        </form>

        {/* Security Policy Summary */}
        <div className="rounded-xl border border-[#f0e6e5] bg-white p-6 shadow-[0_2px_10px_rgba(90,0,0,0.06)] space-y-3">
          <h3 className="font-serif text-base font-bold text-[#5a0000]">
            Active Security Controls
          </h3>
          <ul className="space-y-2 text-xs text-[#5a413d]">
            <li>
              <strong className="text-[#5a0000]">Signed-in Account:</strong> {user?.name} ({user?.username})
            </li>
            <li>
              <strong className="text-[#5a0000]">Session Storage:</strong> HttpOnly + SameSite=Lax cookies with CSRF double-submit protection
            </li>
            <li>
              <strong className="text-[#5a0000]">Brute-Force Protection:</strong> 5 failed attempts trigger temporary account lockout + IP rate limiting
            </li>
            <li>
              <strong className="text-[#5a0000]">Database Isolation:</strong> PostgreSQL Row-Level Security (RLS) enforced via least-privilege role
            </li>
          </ul>
        </div>
      </div>

      {/* Active Sessions */}
      <div className="rounded-xl border border-[#f0e6e5] bg-white shadow-[0_2px_10px_rgba(90,0,0,0.06)]">
        <div className="border-b border-[#f0e6e5] p-4">
          <h3 className="font-serif text-base font-bold text-[#5a0000]">
            Active Staff Sessions ({sessions.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#faf4f3] text-[#5a0000] uppercase">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">IP</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Expires</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0e6e5]">
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-5 text-center text-[#8a5a58]">
                    No active sessions.
                  </td>
                </tr>
              ) : (
                sessions.map((s) => (
                  <tr key={s.id} className="hover:bg-[#fcf8f7]">
                    <td className="px-4 py-2.5 font-mono font-semibold text-[#1b1c1c]">
                      {s.username}
                    </td>
                    <td className="px-4 py-2.5">{s.role}</td>
                    <td className="px-4 py-2.5 font-mono text-[#8a5a58]">{s.ip_address || "—"}</td>
                    <td className="px-4 py-2.5">{new Date(s.created_at).toLocaleString()}</td>
                    <td className="px-4 py-2.5">{new Date(s.expires_at).toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => void handleRevokeSession(s.id)}
                        className="rounded border border-[#dcc6c4] px-2.5 py-1 text-[11px] font-semibold text-[#800000] hover:bg-red-50"
                      >
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
