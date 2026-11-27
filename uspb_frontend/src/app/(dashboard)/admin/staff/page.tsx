"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import api from "@/lib/api";
import { ApiResponse, CreateUserInput, School, User, UserRole } from "@/types";

const ROLES: UserRole[] = [
  "ADMIN",
  "FEE_OFFICER",
  "ENV_OFFICER",
  "GARBAGE_SUPERVISOR",
  "TEACHER",
];

export default function AdminStaffPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newTempPass, setNewTempPass] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("FEE_OFFICER");
  const [newSchoolId, setNewSchoolId] = useState("");

  const [resetTarget, setResetTarget] = useState<User | null>(null);
  const [resetPassword, setResetPassword] = useState("");

  const loadData = useCallback(async () => {
    try {
      const [usersRes, schoolsRes] = await Promise.all([
        api.get<ApiResponse<User[]>>("/admin/users"),
        api.get<ApiResponse<School[]>>("/admin/schools"),
      ]);
      setUsers(usersRes.data.data || []);
      setSchools(schoolsRes.data.data || []);
    } catch {
      setFeedback({ type: "err", text: "Failed to load staff directory." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([
      api.get<ApiResponse<User[]>>("/admin/users"),
      api.get<ApiResponse<School[]>>("/admin/schools"),
    ])
      .then(([usersRes, schoolsRes]) => {
        if (!active) return;
        setUsers(usersRes.data.data || []);
        setSchools(schoolsRes.data.data || []);
      })
      .catch(() => {
        if (active) setFeedback({ type: "err", text: "Failed to load staff directory." });
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const schoolBadgeForTeacher = (u: User) => {
    if (u.role !== "TEACHER" || !u.school_id) return null;
    const found = schools.find((s) => s.id === u.school_id);
    return found ? `${found.name} (${found.code})` : `School #${u.school_id}`;
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const payload: CreateUserInput = {
      name: newName.trim(),
      username: newUsername.trim(),
      email: newEmail.trim(),
      phone: newPhone.trim(),
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
      setNewEmail("");
      setNewPhone("");
      setNewTempPass("");
      setNewSchoolId("");
      await loadData();
    } catch (err) {
      const msg = axios.isAxiosError<ApiResponse>(err) ? err.response?.data?.error : undefined;
      setFeedback({ type: "err", text: msg || "Could not create user." });
    }
  };

  const handleToggleActive = async (u: User) => {
    setFeedback(null);
    try {
      await api.patch(`/admin/users/${u.id}`, { is_active: !u.is_active });
      setFeedback({
        type: "ok",
        text: `${u.username} ${u.is_active ? "deactivated (all sessions revoked)" : "activated"}.`,
      });
      await loadData();
    } catch {
      setFeedback({ type: "err", text: "Failed to update account status." });
    }
  };

  const handleUnlock = async (u: User) => {
    setFeedback(null);
    try {
      await api.post(`/admin/users/${u.id}/unlock`);
      setFeedback({ type: "ok", text: `Cleared login lockout for "${u.username}".` });
    } catch {
      setFeedback({ type: "err", text: "Failed to unlock account." });
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
      const msg = axios.isAxiosError<ApiResponse>(err) ? err.response?.data?.error : undefined;
      setFeedback({ type: "err", text: msg || "Failed to reset password." });
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    const matchesSearch =
      u.name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      (u.email && u.email.toLowerCase().includes(q));
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-serif text-[22px] text-[#5a0000] leading-tight">
            Staff Management
          </h2>
          <p className="text-[13px] text-[#8a5a58] mt-1">
            Create staff accounts, assign roles, unlock accounts, and reset passwords.
          </p>
        </div>
        {!showCreate && (
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="btn-hover-fx rounded-lg bg-[#800000] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#5a0000]"
          >
            + Create Staff Account
          </button>
        )}
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
              <label className="block text-xs font-semibold text-[#5a0000]">Email Address</label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="staff@balangoda.gov.lk"
                className="mt-1 w-full rounded-lg border border-[#dcc6c4] px-3 py-2 text-sm focus:border-[#800000] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#5a0000]">Phone Number</label>
              <input
                type="tel"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="07X-XXXXXXX"
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
              <div className="sm:col-span-2 lg:col-span-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-[#5a0000]">
                    Assigned School (Teachers Only)
                  </label>
                  <Link href="/admin/schools" className="text-[11px] text-[#800000] hover:underline">
                    + Add school in Schools Registry
                  </Link>
                </div>
                <select
                  required
                  value={newSchoolId}
                  onChange={(e) => setNewSchoolId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#dcc6c4] bg-white px-3 py-2 text-sm focus:border-[#800000] focus:outline-none"
                >
                  <option value="">Select a registered school...</option>
                  {schools
                    .filter((s) => s.is_active)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                </select>
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

      <div className="rounded-xl border border-[#f0e6e5] bg-white shadow-[0_2px_10px_rgba(90,0,0,0.06)]">
        <div className="flex flex-col gap-3 border-b border-[#f0e6e5] p-4 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="font-serif text-base font-bold text-[#5a0000]">
            Staff Directory ({filteredUsers.length})
          </h3>
          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="rounded-lg border border-[#dcc6c4] bg-white px-3 py-1.5 text-xs focus:border-[#800000] focus:outline-none"
            >
              <option value="ALL">All Roles</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <input
              type="search"
              placeholder="Search name, username, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-56 rounded-lg border border-[#dcc6c4] px-3 py-1.5 text-xs focus:border-[#800000] focus:outline-none"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#faf4f3] text-[#5a0000] uppercase">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Username</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Role</th>
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
                filteredUsers.map((u) => {
                  const teacherSchool = schoolBadgeForTeacher(u);
                  return (
                    <tr key={u.id} className="hover:bg-[#fcf8f7]">
                      <td className="px-4 py-3 font-medium text-[#1b1c1c]">{u.name}</td>
                      <td className="px-4 py-3 font-mono text-[#5a413d]">{u.username}</td>
                      <td className="px-4 py-3 text-[#5a413d]">
                        {u.email || u.phone ? (
                          <div className="space-y-0.5">
                            {u.email && <div>{u.email}</div>}
                            {u.phone && <div className="text-[11px] text-[#8a5a58]">{u.phone}</div>}
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col items-start gap-1">
                          <span className="rounded bg-[#f0e0df] px-2 py-0.5 font-semibold text-[#5a0000]">
                            {u.role}
                          </span>
                          {teacherSchool && (
                            <span className="text-[11px] text-[#5a413d]">{teacherSchool}</span>
                          )}
                        </div>
                      </td>
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
                      <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setResetTarget(u)}
                          className="rounded border border-[#dcc6c4] px-2 py-1 text-[11px] font-semibold text-[#5a0000] hover:bg-[#f0e0df]"
                        >
                          Reset PW
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleUnlock(u)}
                          className="rounded border border-[#dcc6c4] px-2 py-1 text-[11px] font-semibold text-[#5a0000] hover:bg-[#f0e0df]"
                        >
                          Unlock
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleToggleActive(u)}
                          className="rounded border border-[#dcc6c4] px-2 py-1 text-[11px] font-semibold text-[#800000] hover:bg-red-50"
                        >
                          {u.is_active ? "Deactivate" : "Activate"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
