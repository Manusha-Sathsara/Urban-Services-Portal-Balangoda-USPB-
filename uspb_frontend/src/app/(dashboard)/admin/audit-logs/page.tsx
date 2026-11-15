"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { ApiResponse, AuditLog, AuditLogPage } from "@/types";

const ACTIONS = [
  "",
  "AUTH_LOGIN_SUCCESS",
  "AUTH_LOGIN_FAILED",
  "AUTH_LOGIN_LOCKED",
  "AUTH_LOGOUT",
  "AUTH_PASSWORD_CHANGED",
  "AUTH_REFRESH_REUSE_DETECTED",
  "ADMIN_USER_CREATED",
  "ADMIN_USER_UPDATED",
  "ADMIN_USER_UNLOCKED",
  "ADMIN_PASSWORD_RESET",
  "ADMIN_SCHOOL_CREATED",
  "ADMIN_SESSION_REVOKED",
];

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const limit = 20;

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (actionFilter) params.set("action", actionFilter);
    if (search.trim()) params.set("search", search.trim());

    api
      .get<ApiResponse<AuditLogPage>>(`/admin/audit-logs?${params.toString()}`)
      .then((res) => {
        if (!active) return;
        setLogs(res.data.data?.logs || []);
        setTotal(res.data.data?.total || 0);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [page, actionFilter, search]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const exportCsv = () => {
    const header = "id,timestamp,action,actor_user_id,target_type,target_id,ip_address\n";
    const rows = logs
      .map((l) =>
        [
          l.id,
          l.created_at,
          l.action,
          l.actor_user_id ?? "",
          l.target_type,
          l.target_id,
          l.ip_address,
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `uspb_audit_logs_page_${page}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-serif text-[22px] text-[#5a0000] leading-tight">
            Audit &amp; Security Monitoring
          </h2>
          <p className="text-[13px] text-[#8a5a58] mt-1">
            Immutable authentication, access control, and administrative change trail ({total} total events).
          </p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          disabled={logs.length === 0}
          className="rounded-lg border border-[#dcc6c4] bg-white px-4 py-2 text-xs font-semibold text-[#5a0000] hover:bg-[#f0e0df] disabled:opacity-50"
        >
          Export Page CSV
        </button>
      </div>

      <div className="rounded-xl border border-[#f0e6e5] bg-white shadow-[0_2px_10px_rgba(90,0,0,0.06)]">
        <div className="flex flex-col gap-3 border-b border-[#f0e6e5] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-[#dcc6c4] bg-white px-3 py-1.5 text-xs focus:border-[#800000] focus:outline-none"
            >
              <option value="">All Event Types</option>
              {ACTIONS.filter(Boolean).map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
            <input
              type="search"
              placeholder="Search target ID or IP..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full sm:w-56 rounded-lg border border-[#dcc6c4] px-3 py-1.5 text-xs focus:border-[#800000] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-[#5a413d]">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded border border-[#dcc6c4] px-2.5 py-1 font-semibold text-[#5a0000] disabled:opacity-40"
            >
              Previous
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded border border-[#dcc6c4] px-2.5 py-1 font-semibold text-[#5a0000] disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#faf4f3] text-[#5a0000] uppercase">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Actor ID</th>
                <th className="px-4 py-3">Target</th>
                <th className="px-4 py-3">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0e6e5]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-[#8a5a58]">
                    Loading audit logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-[#8a5a58]">
                    No audit events match your filter.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#fcf8f7]">
                    <td className="px-4 py-2.5 font-mono text-[#8a5a58]">{log.id}</td>
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
