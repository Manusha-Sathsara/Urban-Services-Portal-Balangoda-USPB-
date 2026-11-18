"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { ActiveSession, ApiResponse, AuditLog, AuditLogPage, School, User } from "@/types";

export default function AdminOverviewPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);
  const [dbReady, setDbReady] = useState<"checking" | "connected" | "error">("checking");

  useEffect(() => {
    let active = true;
    Promise.all([
      api.get<ApiResponse<User[]>>("/admin/users"),
      api.get<ApiResponse<School[]>>("/admin/schools"),
      api.get<ApiResponse<ActiveSession[]>>("/admin/sessions"),
      api.get<ApiResponse<AuditLogPage>>("/admin/audit-logs?page=1&limit=5"),
      api.get<ApiResponse<{ database: string }>>("/ready"),
    ])
      .then(([uRes, sRes, sessRes, logRes, readyRes]) => {
        if (!active) return;
        setUsers(uRes.data.data || []);
        setSchools(sRes.data.data || []);
        setSessions(sessRes.data.data || []);
        setRecentLogs(logRes.data.data?.logs || []);
        setDbReady(readyRes.data.data?.database === "connected" ? "connected" : "error");
      })
      .catch(() => {
        if (active) setDbReady("error");
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-serif text-[22px] text-[#5a0000] leading-tight">
            Admin Overview
          </h2>
          <p className="text-[13px] text-[#8a5a58] mt-1">
            Balangoda Urban Council — Portal operations and staff summary.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/staff"
            className="btn-hover-fx rounded-lg bg-[#800000] px-4 py-2 text-xs font-semibold text-white hover:bg-[#5a0000]"
          >
            Manage Staff
          </Link>
          <Link
            href="/admin/schools"
            className="rounded-lg border border-[#dcc6c4] bg-white px-4 py-2 text-xs font-semibold text-[#5a0000] hover:bg-[#f0e0df]"
          >
            Manage Schools
          </Link>
        </div>
      </div>

      {/* System & Access Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-[#f0e6e5] bg-white p-5 shadow-[0_2px_10px_rgba(90,0,0,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#8a5a58]">
            Staff Accounts
          </p>
          <p className="mt-2 text-2xl font-bold text-[#5a0000]">{users.length}</p>
          <p className="mt-1 text-xs text-emerald-700">
            {users.filter((u) => u.is_active).length} active
          </p>
        </div>

        <div className="rounded-lg border border-[#f0e6e5] bg-white p-5 shadow-[0_2px_10px_rgba(90,0,0,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#8a5a58]">
            Registered Schools
          </p>
          <p className="mt-2 text-2xl font-bold text-[#5a0000]">{schools.length}</p>
          <p className="mt-1 text-xs text-[#8a5a58]">
            {users.filter((u) => u.role === "TEACHER").length} teachers assigned
          </p>
        </div>

        <div className="rounded-lg border border-[#f0e6e5] bg-white p-5 shadow-[0_2px_10px_rgba(90,0,0,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#8a5a58]">
            Active Sessions
          </p>
          <p className="mt-2 text-2xl font-bold text-[#5a0000]">{sessions.length}</p>
          <Link href="/admin/settings" className="mt-1 inline-block text-xs text-[#800000] hover:underline">
            Manage sessions &rarr;
          </Link>
        </div>

        <div className="rounded-lg border border-[#f0e6e5] bg-white p-5 shadow-[0_2px_10px_rgba(90,0,0,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#8a5a58]">
            Database Status
          </p>
          <p
            className={`mt-2 text-2xl font-bold ${
              dbReady === "connected"
                ? "text-emerald-700"
                : dbReady === "checking"
                ? "text-[#8a5a58]"
                : "text-[#800000]"
            }`}
          >
            {dbReady === "connected"
              ? "Connected"
              : dbReady === "checking"
              ? "Checking..."
              : "Offline"}
          </p>
        </div>
      </div>

      {/* Service Divisions Summary */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-[#f0e6e5] bg-white p-5 shadow-2xs">
          <p className="text-xs font-bold uppercase tracking-wider text-[#800000]">
            Garbage Fee Management
          </p>
          <p className="mt-2 text-sm font-medium text-[#1b1c1c]">
            Assigned Officers: {users.filter((u) => u.role === "FEE_OFFICER").length}
          </p>
        </div>
        <div className="rounded-xl border border-[#f0e6e5] bg-white p-5 shadow-2xs">
          <p className="text-xs font-bold uppercase tracking-wider text-[#800000]">
            Environmental Certificates
          </p>
          <p className="mt-2 text-sm font-medium text-[#1b1c1c]">
            Assigned Officers: {users.filter((u) => u.role === "ENV_OFFICER").length}
          </p>
        </div>
        <div className="rounded-xl border border-[#f0e6e5] bg-white p-5 shadow-2xs">
          <p className="text-xs font-bold uppercase tracking-wider text-[#800000]">
            School Waste Rewards
          </p>
          <p className="mt-2 text-sm font-medium text-[#1b1c1c]">
            Teachers: {users.filter((u) => u.role === "TEACHER").length} | Supervisors:{" "}
            {users.filter((u) => u.role === "GARBAGE_SUPERVISOR").length}
          </p>
        </div>
      </div>

      {/* Recent Audit Events Preview */}
      <div className="rounded-xl border border-[#f0e6e5] bg-white shadow-[0_2px_10px_rgba(90,0,0,0.06)]">
        <div className="flex items-center justify-between border-b border-[#f0e6e5] p-4">
          <h3 className="font-serif text-base font-bold text-[#5a0000]">
            Recent Security Events
          </h3>
          <Link
            href="/admin/audit-logs"
            className="text-xs font-semibold text-[#800000] hover:underline"
          >
            View Full Audit Log &rarr;
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#faf4f3] text-[#5a0000] uppercase">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Target</th>
                <th className="px-4 py-3">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0e6e5]">
              {recentLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-5 text-center text-[#8a5a58]">
                    No audit events recorded yet.
                  </td>
                </tr>
              ) : (
                recentLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-4 py-2.5 text-[#5a413d]">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 font-mono font-semibold text-[#5a0000]">
                      {log.action}
                    </td>
                    <td className="px-4 py-2.5">{log.actor_user_id ?? "—"}</td>
                    <td className="px-4 py-2.5">
                      {log.target_type}:{log.target_id}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[#8a5a58]">
                      {log.ip_address || "—"}
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
