"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import api from "@/lib/api";
import { ApiResponse, AuditLog, CreateUserInput, User, UserRole } from "@/types";

const ROLES: UserRole[] = [
  "ADMIN",
  "FEE_OFFICER",
  "ENV_OFFICER",
  "GARBAGE_SUPERVISOR",
  "TEACHER",
];

export default function AdminDashboardPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Create user form state
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newTempPass, setNewTempPass] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("FEE_OFFICER");
  const [newSchoolId, setNewSchoolId] = useState("");

  // Reset password modal state
  const [resetTarget, setResetTarget] = useState<User | null>(null);
  const [resetPassword, setResetPassword] = useState("");

  const loadData = useCallback(async () => {
    try {
      const [usersRes, logsRes] = await Promise.all([
        api.get<ApiResponse<User[]>>("/admin/users"),
        api.get<ApiResponse<AuditLog[]>>("/admin/audit-logs?limit=25"),
      ]);
      setUsers(usersRes.data.data || []);
      setAuditLogs(logsRes.data.data || []);
    } catch {
      setFeedback({ type: "err", text: "Failed to load admin data from backend." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([
      api.get<ApiResponse<User[]>>("/admin/users"),
      api.get<ApiResponse<AuditLog[]>>("/admin/audit-logs?limit=25"),
    ])
      .then(([usersRes, logsRes]) => {
        if (!active) return;
        setUsers(usersRes.data.data || []);
        setAuditLogs(logsRes.data.data || []);
      })
      .catch(() => {
        if (active) {
          setFeedback({ type: "err", text: "Failed to load admin data from backend." });
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const payload: CreateUserInput = {
      name: newName.trim(),
      username: newUsername.trim(),
      temporary_password: newTempPass,
      role: newRole,
      school_id: newRole === "TEACHER" && newSchoolId ? Number(newSchoolId) : null,
    };

    try {
      await api.post("/admin/users", payload);
      setFeedback({ type: "ok", text: `Created staff account "${payload.username}".` });
      setShowCreate(false);
      setNewName("");
      setNewUsername("");
      setNewTempPass("");
      setNewSchoolId("");
      await loadData();
    } catch (err) {
      const msg = axios.isAxiosError<ApiResponse>(err)
        ? err.response?.data?.error
        : undefined;
      setFeedback({ type: "err", text: msg || "Could not create user." });
    }
  };

  const handleToggleActive = async (u: User) => {
    setFeedback(null);
    try {
      await api.patch(`/admin/users/${u.id}`, { is_active: !u.is_active });
      setFeedback({
        type: "ok",
        text: `${u.username} ${u.is_active ? "deactivated (sessions revoked)" : "activated"}.`,
      });
      await loadData();
    } catch {
      setFeedback({ type: "err", text: "Failed to update account status." });
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTarget) return;
    setFeedback(null);
    try {
      await api.post(`/admin/users/${resetTarget.id}/reset-password`, {
        temporary_password: resetPassword,
      });
      setFeedback({
        type: "ok",
        text: `Temporary password set for "${resetTarget.username}". Existing sessions revoked.`,
      });
      setResetTarget(null);
      setResetPassword("");
      await loadData();
    } catch (err) {
      const msg = axios.isAxiosError<ApiResponse>(err)
        ? err.response?.data?.error
        : undefined;
      setFeedback({ type: "err", text: msg || "Failed to reset password." });
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-serif text-[22px] text-[#5a0000] leading-tight">
            Admin Overview &amp; Access Control
          </h2>
          <p className="text-[13px] text-[#8a5a58] mt-1">
            Manage Balangoda Urban Council staff accounts, roles, school assignments, and security audit logs.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate((prev) => !prev)}
          className="btn-hover-fx rounded-lg bg-[#800000] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#5a0000]"
        >
          {showCreate ? "Close Form" : "+ Create Staff Account"}
        </button>
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-[#f0e6e5] bg-white p-5 shadow-[0_2px_10px_rgba(90,0,0,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#8a5a58]">
            Total Staff Accounts
          </p>
          <p className="mt-2 text-2xl font-bold text-[#5a0000]">{users.length}</p>
        </div>
        <div className="rounded-lg border border-[#f0e6e5] bg-white p-5 shadow-[0_2px_10px_rgba(90,0,0,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#8a5a58]">
            Active Accounts
          </p>
          <p className="mt-2 text-2xl font-bold text-emerald-700">
            {users.filter((u) => u.is_active).length}
          </p>
        </div>
        <div className="rounded-lg border border-[#f0e6e5] bg-white p-5 shadow-[0_2px_10px_rgba(90,0,0,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#8a5a58]">
            Teacher Accounts
          </p>
          <p className="mt-2 text-2xl font-bold text-[#5a0000]">
            {users.filter((u) => u.role === "TEACHER").length}
          </p>
        </div>
        <div className="rounded-lg border border-[#f0e6e5] bg-white p-5 shadow-[0_2px_10px_rgba(90,0,0,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#8a5a58]">
            Recent Audit Events
          </p>
          <p className="mt-2 text-2xl font-bold text-[#5a0000]">{auditLogs.length}</p>
        </div>
      </div>

      {/* Create User Panel */}
      {showCreate && (
        <form
          onSubmit={handleCreateUser}
          className="rounded-xl border border-[#dcc6c4] bg-white p-6 shadow-xs space-y-4"
        >
          <h3 className="font-serif text-base font-bold text-[#5a0000]">
            Create New Staff Account
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-[#5a0000]">Full Name</label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#dcc6c4] px-3 py-2 text-sm focus:border-[#800000] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#5a0000]">Username</label>
              <input
                type="text"
                required
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#dcc6c4] px-3 py-2 text-sm focus:border-[#800000] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#5a0000]">
                Temporary Password (min 8)
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={newTempPass}
                onChange={(e) => setNewTempPass(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#dcc6c4] px-3 py-2 text-sm focus:border-[#800000] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#5a0000]">Role</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as UserRole)}
                className="mt-1 w-full rounded-lg border border-[#dcc6c4] bg-white px-3 py-2 text-sm focus:border-[#800000] focus:outline-none"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            {newRole === "TEACHER" && (
              <div>
                <label className="block text-xs font-semibold text-[#5a0000]">
                  Assigned School ID
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={newSchoolId}
                  onChange={(e) => setNewSchoolId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#dcc6c4] px-3 py-2 text-sm focus:border-[#800000] focus:outline-none"
                />
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="rounded-lg border border-[#dcc6c4] px-4 py-2 text-xs font-semibold text-[#5a0000]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-[#800000] px-4 py-2 text-xs font-semibold text-white hover:bg-[#5a0000]"
            >
              Create Account
            </button>
          </div>
        </form>
      )}

      {/* Reset Password Inline Panel */}
      {resetTarget && (
        <form
          onSubmit={handleResetPassword}
          className="rounded-xl border border-[#fbbf24] bg-[#fff8e1] p-5 space-y-3"
        >
          <p className="text-sm font-semibold text-[#5a0000]">
            Reset Temporary Password for {resetTarget.username}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="password"
              required
              minLength={8}
              placeholder="New temporary password (min 8 chars)"
              value={resetPassword}
              onChange={(e) => setResetPassword(e.target.value)}
              className="flex-1 rounded-lg border border-[#dcc6c4] bg-white px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="rounded-lg bg-[#800000] px-4 py-2 text-xs font-semibold text-white"
            >
              Confirm Reset
            </button>
            <button
              type="button"
              onClick={() => {
                setResetTarget(null);
                setResetPassword("");
              }}
              className="rounded-lg border border-[#dcc6c4] bg-white px-4 py-2 text-xs font-semibold text-[#5a0000]"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Users Table */}
      <div className="rounded-xl border border-[#f0e6e5] bg-white shadow-[0_2px_10px_rgba(90,0,0,0.06)]">
        <div className="flex flex-col gap-3 border-b border-[#f0e6e5] p-4 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="font-serif text-base font-bold text-[#5a0000]">
            Staff Directory
          </h3>
          <input
            type="search"
            placeholder="Search name, username, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64 rounded-lg border border-[#dcc6c4] px-3 py-1.5 text-xs focus:border-[#800000] focus:outline-none"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#faf4f3] text-[#5a0000] uppercase">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Username</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">School ID</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0e6e5]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-[#8a5a58]">
                    Loading staff accounts...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-[#8a5a58]">
                    No matching accounts found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-[#fcf8f7]">
                    <td className="px-4 py-3 font-medium text-[#1b1c1c]">{u.name}</td>
                    <td className="px-4 py-3 font-mono text-[#5a413d]">{u.username}</td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-[#f0e0df] px-2 py-0.5 font-semibold text-[#5a0000]">
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#5a413d]">{u.school_id ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 font-semibold ${
                          u.is_active
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-red-50 text-[#800000]"
                        }`}
                      >
                        {u.is_active ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => setResetTarget(u)}
                        className="rounded border border-[#dcc6c4] px-2.5 py-1 text-[11px] font-semibold text-[#5a0000] hover:bg-[#f0e0df]"
                      >
                        Reset PW
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleToggleActive(u)}
                        className="rounded border border-[#dcc6c4] px-2.5 py-1 text-[11px] font-semibold text-[#800000] hover:bg-red-50"
                      >
                        {u.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Logs */}
      <div className="rounded-xl border border-[#f0e6e5] bg-white shadow-[0_2px_10px_rgba(90,0,0,0.06)]">
        <div className="border-b border-[#f0e6e5] p-4">
          <h3 className="font-serif text-base font-bold text-[#5a0000]">
            Security Audit Log (Latest 25)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#faf4f3] text-[#5a0000] uppercase">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Actor ID</th>
                <th className="px-4 py-3">Target</th>
                <th className="px-4 py-3">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0e6e5]">
              {auditLogs.map((log) => (
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
