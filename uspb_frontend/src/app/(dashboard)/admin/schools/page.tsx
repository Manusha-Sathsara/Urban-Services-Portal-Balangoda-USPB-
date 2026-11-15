"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import api from "@/lib/api";
import { ApiResponse, School } from "@/types";

export default function AdminSchoolsPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [address, setAddress] = useState("");

  const loadSchools = useCallback(async () => {
    try {
      const res = await api.get<ApiResponse<School[]>>("/admin/schools");
      setSchools(res.data.data || []);
    } catch {
      setFeedback({ type: "err", text: "Failed to load schools registry." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    api
      .get<ApiResponse<School[]>>("/admin/schools")
      .then((res) => {
        if (active) setSchools(res.data.data || []);
      })
      .catch(() => {
        if (active) setFeedback({ type: "err", text: "Failed to load schools registry." });
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    try {
      await api.post("/admin/schools", { name, code, address });
      setFeedback({ type: "ok", text: `Registered school "${name.trim()}".` });
      setShowForm(false);
      setName("");
      setCode("");
      setAddress("");
      await loadSchools();
    } catch (err) {
      const msg = axios.isAxiosError<ApiResponse>(err) ? err.response?.data?.error : undefined;
      setFeedback({ type: "err", text: msg || "Could not register school." });
    }
  };

  const handleToggle = async (s: School) => {
    setFeedback(null);
    try {
      await api.patch(`/admin/schools/${s.id}`, { is_active: !s.is_active });
      setFeedback({
        type: "ok",
        text: `${s.name} marked ${s.is_active ? "inactive" : "active"}.`,
      });
      await loadSchools();
    } catch {
      setFeedback({ type: "err", text: "Failed to update school status." });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-serif text-[22px] text-[#5a0000] leading-tight">
            Schools Registry
          </h2>
          <p className="text-[13px] text-[#8a5a58] mt-1">
            Register participating Balangoda schools so teachers can be assigned in Staff Management.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((prev) => !prev)}
          className="btn-hover-fx rounded-lg bg-[#800000] px-4 py-2 text-xs font-semibold text-white hover:bg-[#5a0000]"
        >
          {showForm ? "Close Form" : "+ Register School"}
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

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="rounded-xl border border-[#dcc6c4] bg-white p-6 shadow-xs space-y-4"
        >
          <h3 className="font-serif text-base font-bold text-[#5a0000]">
            Register Participating School
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-[#5a0000]">School Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Ananda Maithreya Central College"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#dcc6c4] px-3 py-2 text-sm focus:border-[#800000] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#5a0000]">School Code</label>
              <input
                type="text"
                required
                placeholder="e.g. BAMCC"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#dcc6c4] px-3 py-2 text-sm uppercase focus:border-[#800000] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#5a0000]">Address / Ward</label>
              <input
                type="text"
                placeholder="Balangoda"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#dcc6c4] px-3 py-2 text-sm focus:border-[#800000] focus:outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-[#dcc6c4] px-4 py-2 text-xs font-semibold text-[#5a0000]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-[#800000] px-4 py-2 text-xs font-semibold text-white hover:bg-[#5a0000]"
            >
              Save School
            </button>
          </div>
        </form>
      )}

      <div className="rounded-xl border border-[#f0e6e5] bg-white shadow-[0_2px_10px_rgba(90,0,0,0.06)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#faf4f3] text-[#5a0000] uppercase">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">School Name</th>
                <th className="px-4 py-3">Address</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0e6e5]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-[#8a5a58]">
                    Loading schools...
                  </td>
                </tr>
              ) : schools.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-[#8a5a58]">
                    No schools registered yet. Click &ldquo;+ Register School&rdquo; to add one.
                  </td>
                </tr>
              ) : (
                schools.map((s) => (
                  <tr key={s.id} className="hover:bg-[#fcf8f7]">
                    <td className="px-4 py-3 font-mono text-[#5a413d]">{s.id}</td>
                    <td className="px-4 py-3 font-mono font-semibold text-[#5a0000]">{s.code}</td>
                    <td className="px-4 py-3 font-medium text-[#1b1c1c]">{s.name}</td>
                    <td className="px-4 py-3 text-[#5a413d]">{s.address || "—"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 font-semibold ${
                          s.is_active
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-red-50 text-[#800000]"
                        }`}
                      >
                        {s.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => void handleToggle(s)}
                        className="rounded border border-[#dcc6c4] px-2.5 py-1 text-[11px] font-semibold text-[#5a0000] hover:bg-[#f0e0df]"
                      >
                        {s.is_active ? "Deactivate" : "Activate"}
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
