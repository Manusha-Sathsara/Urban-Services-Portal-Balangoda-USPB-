"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { Banknote, CheckCircle2, FolderKanban, Plus, Recycle, RotateCcw, Trash2, Users } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { ApiResponse } from "@/types";

interface SchoolStudent {
  id: number;
  school_id: number;
  membership_no: string;
  full_name: string;
  name_with_initials: string;
  grade: string;
  class_name: string;
  address: string;
  guardian_name: string;
  guardian_phone: string;
  is_active: boolean;
  available_points: number;
  lifetime_earned_points: number;
  completed_cards: number;
  redeemed_cards: number;
}

interface ActiveCategory {
  id: number;
  name: string;
  measurement_unit: string;
  current_points_per_unit: number;
}

interface CollectionItemDraft {
  category_id: number;
  category_name: string;
  measurement_unit: string;
  quantity: string;
  rate_snapshot: number;
}

interface WasteCollection {
  id: number;
  student_id: number;
  student_name: string;
  collection_date: string;
  total_points: number;
  notes: string;
  is_reversed: boolean;
  items: Array<{
    id: number;
    category_name: string;
    measurement_unit: string;
    quantity: number;
    rate_snapshot: number;
    points_earned: number;
  }>;
}

interface RewardPayout {
  id: number;
  student_id: number;
  student_name: string;
  points_deducted: number;
  amount_lkr: number;
  physical_card_ref: string;
  receipt_no: string;
  status: "paid" | "reversed";
  paid_at: string;
}

interface DashboardSummary {
  total_students: number;
  active_students: number;
  eligible_students: number;
  total_available_points: number;
  total_payouts_lkr: number;
  total_collections: number;
}

type TabKey = "students" | "classes" | "collect" | "payouts" | "history";

function TeacherWorkspaceContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlTab = searchParams.get("tab") as TabKey | null;
  const tab: TabKey =
    urlTab && ["students", "classes", "collect", "payouts", "history"].includes(urlTab)
      ? urlTab
      : "students";
  const setTab = (next: TabKey) => {
    router.replace(`/schools/teacher?tab=${next}`);
  };
  const [classFilter, setClassFilter] = useState<string>("");
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [students, setStudents] = useState<SchoolStudent[]>([]);
  const [categories, setCategories] = useState<ActiveCategory[]>([]);
  const [collections, setCollections] = useState<WasteCollection[]>([]);
  const [payouts, setPayouts] = useState<RewardPayout[]>([]);
  const [search, setSearch] = useState("");
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Student registration form
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [membershipNo, setMembershipNo] = useState("");
  const [fullName, setFullName] = useState("");
  const [initialsName, setInitialsName] = useState("");
  const [grade, setGrade] = useState("");
  const [className, setClassName] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [address, setAddress] = useState("");

  // Collection form
  const [colStudentId, setColStudentId] = useState("");
  const [colDate, setColDate] = useState("");
  const [colNotes, setColNotes] = useState("");
  const [colItems, setColItems] = useState<CollectionItemDraft[]>([]);

  // Payout modal/inline form
  const [payoutStudent, setPayoutStudent] = useState<SchoolStudent | null>(null);
  const [cardRef, setCardRef] = useState("");
  const [receiptNo, setReceiptNo] = useState("");

  const loadAll = useCallback(async () => {
    try {
      const [sumRes, stRes, catRes, colRes, payRes] = await Promise.all([
        api.get<ApiResponse<DashboardSummary>>("/school-rewards/dashboard"),
        api.get<ApiResponse<SchoolStudent[]>>("/school-rewards/students"),
        api.get<ApiResponse<ActiveCategory[]>>("/categories/active"),
        api.get<ApiResponse<WasteCollection[]>>("/school-rewards/collections"),
        api.get<ApiResponse<RewardPayout[]>>("/school-rewards/payouts"),
      ]);
      setSummary(sumRes.data.data || null);
      setStudents(stRes.data.data || []);
      const activeCats = catRes.data.data || [];
      setCategories(activeCats);
      if (activeCats.length > 0 && colItems.length === 0) {
        setColItems([
          {
            category_id: activeCats[0].id,
            category_name: activeCats[0].name,
            measurement_unit: activeCats[0].measurement_unit,
            quantity: "1",
            rate_snapshot: activeCats[0].current_points_per_unit,
          },
        ]);
      }
      setCollections(colRes.data.data || []);
      setPayouts(payRes.data.data || []);
    } catch {
      setFeedback({ type: "err", text: "Unable to load school rewards data." });
    }
  }, [colItems.length]);

  useEffect(() => {
    let active = true;
    Promise.all([
      api.get<ApiResponse<DashboardSummary>>("/school-rewards/dashboard"),
      api.get<ApiResponse<SchoolStudent[]>>("/school-rewards/students"),
      api.get<ApiResponse<ActiveCategory[]>>("/categories/active"),
      api.get<ApiResponse<WasteCollection[]>>("/school-rewards/collections"),
      api.get<ApiResponse<RewardPayout[]>>("/school-rewards/payouts"),
    ])
      .then(([sumRes, stRes, catRes, colRes, payRes]) => {
        if (!active) return;
        setColDate(new Date().toISOString().slice(0, 10));
        setSummary(sumRes.data.data || null);
        setStudents(stRes.data.data || []);
        const activeCats = catRes.data.data || [];
        setCategories(activeCats);
        if (activeCats.length > 0) {
          setColItems([
            {
              category_id: activeCats[0].id,
              category_name: activeCats[0].name,
              measurement_unit: activeCats[0].measurement_unit,
              quantity: "1",
              rate_snapshot: activeCats[0].current_points_per_unit,
            },
          ]);
        }
        setCollections(colRes.data.data || []);
        setPayouts(payRes.data.data || []);
      })
      .catch(() => {
        if (active) setFeedback({ type: "err", text: "Unable to load school rewards data." });
      });
    return () => {
      active = false;
    };
  }, []);

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    try {
      await api.post("/school-rewards/students", {
        membership_no: membershipNo.trim(),
        full_name: fullName.trim(),
        name_with_initials: initialsName.trim(),
        grade: grade.trim(),
        class_name: className.trim(),
        guardian_name: guardianName.trim(),
        guardian_phone: guardianPhone.trim(),
        address: address.trim(),
      });
      setFeedback({ type: "ok", text: `Registered 3R member "${fullName.trim()}".` });
      setShowStudentForm(false);
      setMembershipNo("");
      setFullName("");
      setInitialsName("");
      setGrade("");
      setClassName("");
      setGuardianName("");
      setGuardianPhone("");
      setAddress("");
      await loadAll();
    } catch (err) {
      const msg = axios.isAxiosError<ApiResponse>(err) ? err.response?.data?.error : undefined;
      setFeedback({ type: "err", text: msg || "Could not register student." });
    }
  };

  const handleToggleStudentActive = async (st: SchoolStudent) => {
    setFeedback(null);
    try {
      await api.patch(`/school-rewards/students/${st.id}`, { is_active: !st.is_active });
      setFeedback({
        type: "ok",
        text: `${st.full_name} marked ${st.is_active ? "inactive" : "active"}.`,
      });
      await loadAll();
    } catch {
      setFeedback({ type: "err", text: "Failed to update student status." });
    }
  };

  const addCollectionRow = () => {
    if (categories.length === 0) return;
    setColItems((prev) => [
      ...prev,
      {
        category_id: categories[0].id,
        category_name: categories[0].name,
        measurement_unit: categories[0].measurement_unit,
        quantity: "1",
        rate_snapshot: categories[0].current_points_per_unit,
      },
    ]);
  };

  const updateCollectionCategory = (idx: number, categoryId: number) => {
    const cat = categories.find((c) => c.id === categoryId);
    if (!cat) return;
    setColItems((prev) =>
      prev.map((row, i) =>
        i === idx
          ? {
              ...row,
              category_id: cat.id,
              category_name: cat.name,
              measurement_unit: cat.measurement_unit,
              rate_snapshot: cat.current_points_per_unit,
            }
          : row
      )
    );
  };

  const estimatedTotalPoints = colItems.reduce((acc, item) => {
    const qty = Number(item.quantity);
    if (!Number.isFinite(qty) || qty <= 0) return acc;
    return acc + Math.round(qty * item.rate_snapshot * 100) / 100;
  }, 0);

  const handleRecordCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    const idempotencyKey = `col-${crypto.randomUUID()}`;
    try {
      const payload = {
        student_id: Number(colStudentId),
        collection_date: colDate,
        idempotency_key: idempotencyKey,
        notes: colNotes.trim(),
        items: colItems.map((i) => ({
          category_id: i.category_id,
          category_name: i.category_name,
          measurement_unit: i.measurement_unit,
          quantity: Number(i.quantity),
          rate_snapshot: i.rate_snapshot,
        })),
      };
      await api.post("/school-rewards/collections", payload);
      setFeedback({
        type: "ok",
        text: `Collection recorded (+${estimatedTotalPoints.toFixed(2)} points).`,
      });
      setColNotes("");
      await loadAll();
      setTab("students");
    } catch (err) {
      const msg = axios.isAxiosError<ApiResponse>(err) ? err.response?.data?.error : undefined;
      setFeedback({ type: "err", text: msg || "Failed to record waste collection." });
    }
  };

  const handleRecordPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutStudent) return;
    setFeedback(null);
    const idempotencyKey = `pay-${payoutStudent.id}-${crypto.randomUUID()}`;
    try {
      const res = await api.post<ApiResponse<{ remaining_points: number }>>("/school-rewards/payouts", {
        student_id: payoutStudent.id,
        physical_card_ref: cardRef.trim(),
        receipt_no: receiptNo.trim(),
        idempotency_key: idempotencyKey,
      });
      const rem = res.data.data?.remaining_points ?? 0;
      setFeedback({
        type: "ok",
        text: `Recorded Rs. 1,000.00 payout for ${payoutStudent.full_name}. Remaining balance: ${rem.toFixed(2)} pts.`,
      });
      setPayoutStudent(null);
      setCardRef("");
      setReceiptNo("");
      await loadAll();
    } catch (err) {
      const msg = axios.isAxiosError<ApiResponse>(err) ? err.response?.data?.error : undefined;
      setFeedback({ type: "err", text: msg || "Could not record payout." });
    }
  };

  const handleReverseCollection = async (colId: number) => {
    setFeedback(null);
    try {
      await api.post(`/school-rewards/collections/${colId}/reverse`, {
        reason: "Corrected entry by teacher",
      });
      setFeedback({ type: "ok", text: `Collection #${colId} reversed.` });
      await loadAll();
    } catch (err) {
      const msg = axios.isAxiosError<ApiResponse>(err) ? err.response?.data?.error : undefined;
      setFeedback({ type: "err", text: msg || "Failed to reverse collection." });
    }
  };

  const filteredStudents = students.filter((s) => {
    const q = search.toLowerCase();
    const matchesSearch =
      s.full_name.toLowerCase().includes(q) ||
      s.membership_no.toLowerCase().includes(q);
    const classKey = [s.grade, s.class_name].filter(Boolean).join(" · ") || "Unassigned";
    const matchesClass = !classFilter || classKey === classFilter;
    return matchesSearch && matchesClass;
  });

  const classGroups = Object.values(
    students.reduce<
      Record<
        string,
        { key: string; grade: string; className: string; count: number; active: number; totalPts: number }
      >
    >((acc, s) => {
      const key = [s.grade, s.class_name].filter(Boolean).join(" · ") || "Unassigned";
      if (!acc[key]) {
        acc[key] = {
          key,
          grade: s.grade || "—",
          className: s.class_name || "—",
          count: 0,
          active: 0,
          totalPts: 0,
        };
      }
      acc[key].count += 1;
      if (s.is_active) acc[key].active += 1;
      acc[key].totalPts += s.available_points;
      return acc;
    }, {})
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-serif text-[22px] text-[#5a0000] leading-tight">
            3R Sampath Kendraya — School Workspace
          </h2>
          <p className="text-[13px] text-[#8a5a58] mt-1">
            {user?.role === "TEACHER"
              ? `Assigned school ID ${user.school_id ?? "—"} · 1 Point = Rs. 1.00 · 1,000 pts per completed card`
              : "Council view across participating schools · 1 Point = Rs. 1.00"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTab("collect")}
            className="inline-flex items-center gap-2 rounded-lg bg-[#800000] px-4 py-2 text-xs font-semibold text-white hover:bg-[#5a0000] transition-colors"
          >
            <Recycle className="h-4 w-4" strokeWidth={1.5} />
            Record collection
          </button>
        </div>
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

      {/* Summary Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-[#f0e6e5] bg-white p-5">
          <p className="text-xs font-medium text-[#8a5a58]">Registered students</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-[#5a0000]">
            {summary?.total_students ?? 0}
          </p>
          <p className="mt-1 text-xs text-[#8a5a58]">
            {summary?.active_students ?? 0} active members
          </p>
        </div>
        <div className="rounded-xl border border-[#f0e6e5] bg-white p-5">
          <p className="text-xs font-medium text-[#8a5a58]">Eligible for Rs. 1,000 card</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-emerald-700">
            {summary?.eligible_students ?? 0}
          </p>
          <p className="mt-1 text-xs text-[#8a5a58]">1,000+ available points</p>
        </div>
        <div className="rounded-xl border border-[#f0e6e5] bg-white p-5">
          <p className="text-xs font-medium text-[#8a5a58]">Unredeemed points</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-[#5a0000]">
            {(summary?.total_available_points ?? 0).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
          <p className="mt-1 text-xs text-[#8a5a58]">
            {summary?.total_collections ?? 0} collections logged
          </p>
        </div>
        <div className="rounded-xl border border-[#f0e6e5] bg-white p-5">
          <p className="text-xs font-medium text-[#8a5a58]">Recorded cash payouts</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-[#5a0000]">
            Rs. {(summary?.total_payouts_lkr ?? 0).toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-[#8a5a58]">Rs. 1,000 per completed card</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#f0e6e5] pb-2">
        {(
          [
            { key: "students", label: "Students & balances", icon: Users },
            { key: "classes", label: "Class management", icon: FolderKanban },
            { key: "collect", label: "Record collection", icon: Recycle },
            { key: "payouts", label: "Redemptions & payouts", icon: Banknote },
            { key: "history", label: "Collection history", icon: RotateCcw },
          ] as const
        ).map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
                active
                  ? "bg-[#800000] text-white"
                  : "bg-white text-[#5a0000] border border-[#f0e6e5] hover:bg-[#f0e0df]"
              }`}
            >
              <Icon className="h-4 w-4" strokeWidth={1.5} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: STUDENTS */}
      {tab === "students" && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="search"
                placeholder="Search student or membership no"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:w-72 rounded-lg border border-[#dcc6c4] bg-white px-3 py-2 text-xs focus:border-[#800000] focus:outline-none"
              />
              {classFilter && (
                <button
                  type="button"
                  onClick={() => setClassFilter("")}
                  className="rounded-lg border border-[#dcc6c4] bg-[#faf4f3] px-3 py-2 text-xs font-medium text-[#5a0000]"
                >
                  Class: {classFilter} ×
                </button>
              )}
            </div>
            {!showStudentForm && (
              <button
                type="button"
                onClick={() => setShowStudentForm(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#dcc6c4] bg-white px-3.5 py-2 text-xs font-semibold text-[#5a0000] hover:bg-[#f0e0df]"
              >
                <Plus className="h-4 w-4" strokeWidth={1.5} />
                Register student
              </button>
            )}
          </div>

          {showStudentForm && (
            <form
              onSubmit={handleCreateStudent}
              className="rounded-xl border border-[#dcc6c4] bg-white p-6 space-y-4"
            >
              <h3 className="font-serif text-base font-semibold text-[#5a0000]">
                3R Society Member Registration
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="block text-xs font-medium text-[#5a0000]">Membership No</label>
                  <input
                    type="text"
                    required
                    value={membershipNo}
                    onChange={(e) => setMembershipNo(e.target.value)}
                    placeholder="3R-2026-001"
                    className="mt-1 w-full rounded-lg border border-[#dcc6c4] px-3 py-2 text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-[#5a0000]">Full Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#dcc6c4] px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#5a0000]">Name with Initials</label>
                  <input
                    type="text"
                    value={initialsName}
                    onChange={(e) => setInitialsName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#dcc6c4] px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#5a0000]">Grade</label>
                  <input
                    type="text"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    placeholder="Grade 9"
                    className="mt-1 w-full rounded-lg border border-[#dcc6c4] px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#5a0000]">Class</label>
                  <input
                    type="text"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    placeholder="9-A"
                    className="mt-1 w-full rounded-lg border border-[#dcc6c4] px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#5a0000]">Guardian Name</label>
                  <input
                    type="text"
                    value={guardianName}
                    onChange={(e) => setGuardianName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#dcc6c4] px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#5a0000]">Home Phone</label>
                  <input
                    type="tel"
                    value={guardianPhone}
                    onChange={(e) => setGuardianPhone(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#dcc6c4] px-3 py-2 text-sm"
                  />
                </div>
                <div className="sm:col-span-2 lg:col-span-4">
                  <label className="block text-xs font-medium text-[#5a0000]">Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#dcc6c4] px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowStudentForm(false)}
                  className="rounded-lg border border-[#dcc6c4] px-4 py-2 text-xs font-semibold text-[#5a0000]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#800000] px-4 py-2 text-xs font-semibold text-white hover:bg-[#5a0000]"
                >
                  Save Member
                </button>
              </div>
            </form>
          )}

          {/* Payout Modal Inline */}
          {payoutStudent && (
            <form
              onSubmit={handleRecordPayout}
              className="rounded-xl border border-[#fbbf24] bg-[#fff8e1] p-5 space-y-3"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-[#5a0000]">
                  Redeem 1,000 points (Rs. 1,000.00) for {payoutStudent.full_name}
                </p>
                <span className="text-xs font-mono tabular-nums text-[#5a3a00]">
                  Available: {payoutStudent.available_points.toFixed(2)} pts → Remainder:{" "}
                  {(payoutStudent.available_points - 1000).toFixed(2)} pts
                </span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <input
                  type="text"
                  required
                  placeholder="Physical card reference"
                  value={cardRef}
                  onChange={(e) => setCardRef(e.target.value)}
                  className="rounded-lg border border-[#dcc6c4] bg-white px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  placeholder="Receipt number (optional)"
                  value={receiptNo}
                  onChange={(e) => setReceiptNo(e.target.value)}
                  className="rounded-lg border border-[#dcc6c4] bg-white px-3 py-2 text-sm"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 rounded-lg bg-[#800000] px-4 py-2 text-xs font-semibold text-white"
                  >
                    Confirm Rs. 1,000 Payout
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayoutStudent(null)}
                    className="rounded-lg border border-[#dcc6c4] bg-white px-3 py-2 text-xs font-semibold text-[#5a0000]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          )}

          <div className="rounded-xl border border-[#f0e6e5] bg-white overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#faf4f3] text-[#5a0000]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Membership</th>
                  <th className="px-4 py-3 font-semibold">Student</th>
                  <th className="px-4 py-3 font-semibold">Grade / Class</th>
                  <th className="px-4 py-3 font-semibold">Sampath Card Progress</th>
                  <th className="px-4 py-3 font-semibold text-right">Available Pts</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0e6e5]">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-[#8a5a58]">
                      No students registered yet.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((st) => {
                    const cardProgress = Math.min(100, ((st.available_points % 1000) / 1000) * 100);
                    const canRedeem = st.is_active && st.available_points >= 1000;
                    return (
                      <tr key={st.id} className="hover:bg-[#fcf8f7]">
                        <td className="px-4 py-3 font-mono text-[#5a413d]">{st.membership_no}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-[#1b1c1c]">{st.full_name}</div>
                          {!st.is_active && (
                            <span className="text-[11px] text-[#800000]">Inactive</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-[#5a413d]">
                          {[st.grade, st.class_name].filter(Boolean).join(" · ") || "—"}
                        </td>
                        <td className="px-4 py-3 min-w-[180px]">
                          <div className="flex items-center justify-between text-[11px] text-[#5a413d] mb-1">
                            <span>
                              {st.completed_cards > 0
                                ? `${st.completed_cards} card(s) ready`
                                : `${(st.available_points % 1000).toFixed(0)} / 1,000 pts`}
                            </span>
                            <span className="font-mono tabular-nums">{st.redeemed_cards} paid</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-[#f0e0df] overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                canRedeem ? "bg-emerald-600" : "bg-[#800000]"
                              }`}
                              style={{ width: `${canRedeem ? 100 : cardProgress}%` }}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums text-[#5a0000]">
                          {st.available_points.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                          {canRedeem && (
                            <button
                              type="button"
                              onClick={() => setPayoutStudent(st)}
                              className="inline-flex items-center gap-1 rounded bg-emerald-700 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-800"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                              Redeem Rs. 1,000
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => void handleToggleStudentActive(st)}
                            className="rounded border border-[#dcc6c4] px-2.5 py-1 text-[11px] font-semibold text-[#5a0000] hover:bg-[#f0e0df]"
                          >
                            {st.is_active ? "Deactivate" : "Activate"}
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
      )}

      {/* TAB 2: CLASS MANAGEMENT */}
      {tab === "classes" && (
        <div className="rounded-xl border border-[#f0e6e5] bg-white overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#faf4f3] text-[#5a0000]">
              <tr>
                <th className="px-4 py-3 font-semibold">Grade</th>
                <th className="px-4 py-3 font-semibold">Class</th>
                <th className="px-4 py-3 font-semibold text-right">Students</th>
                <th className="px-4 py-3 font-semibold text-right">Active</th>
                <th className="px-4 py-3 font-semibold text-right">Available Points</th>
                <th className="px-4 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0e6e5]">
              {classGroups.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-[#8a5a58]">
                    No classes found. Register students to populate classes.
                  </td>
                </tr>
              ) : (
                classGroups.map((cg) => (
                  <tr key={cg.key} className="hover:bg-[#fcf8f7]">
                    <td className="px-4 py-3 font-medium text-[#1b1c1c]">{cg.grade}</td>
                    <td className="px-4 py-3 text-[#5a413d]">{cg.className}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">{cg.count}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">{cg.active}</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums text-[#5a0000]">
                      {cg.totalPts.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setClassFilter(cg.key);
                          setTab("students");
                        }}
                        className="rounded border border-[#dcc6c4] px-2.5 py-1 text-[11px] font-semibold text-[#5a0000] hover:bg-[#f0e0df]"
                      >
                        View Students
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: RECORD COLLECTION */}
      {tab === "collect" && (
        <form
          onSubmit={handleRecordCollection}
          className="rounded-xl border border-[#f0e6e5] bg-white p-6 space-y-5"
        >
          <h3 className="font-serif text-base font-semibold text-[#5a0000]">
            Record Waste Collection (Official Balangoda UC Rates)
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-[#5a0000]">Student</label>
              <select
                required
                value={colStudentId}
                onChange={(e) => setColStudentId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#dcc6c4] bg-white px-3 py-2 text-sm"
              >
                <option value="">Select active student...</option>
                {students
                  .filter((s) => s.is_active)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} ({s.membership_no})
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#5a0000]">Collection Date</label>
              <input
                type="date"
                required
                value={colDate}
                onChange={(e) => setColDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#dcc6c4] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#5a0000]">Notes</label>
              <input
                type="text"
                value={colNotes}
                onChange={(e) => setColNotes(e.target.value)}
                placeholder="Optional note"
                className="mt-1 w-full rounded-lg border border-[#dcc6c4] px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#5a0000]">Waste Items</span>
              <button
                type="button"
                onClick={addCollectionRow}
                className="inline-flex items-center gap-1 rounded border border-[#dcc6c4] px-2.5 py-1 text-xs font-semibold text-[#5a0000] hover:bg-[#f0e0df]"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
                Add item
              </button>
            </div>
            {colItems.map((row, idx) => {
              const linePts = (Number(row.quantity) || 0) * row.rate_snapshot;
              return (
                <div
                  key={idx}
                  className="grid grid-cols-1 gap-2 sm:grid-cols-12 items-center rounded-lg border border-[#f0e6e5] bg-[#fcf8f7] p-3"
                >
                  <div className="sm:col-span-5">
                    <select
                      value={row.category_id}
                      onChange={(e) => updateCollectionCategory(idx, Number(e.target.value))}
                      className="w-full rounded border border-[#dcc6c4] bg-white px-2.5 py-1.5 text-xs"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.current_points_per_unit.toFixed(2)} pts/{c.measurement_unit})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-3">
                    <input
                      type="number"
                      step="0.001"
                      min="0.001"
                      required
                      value={row.quantity}
                      onChange={(e) =>
                        setColItems((prev) =>
                          prev.map((r, i) => (i === idx ? { ...r, quantity: e.target.value } : r))
                        )
                      }
                      className="w-full rounded border border-[#dcc6c4] bg-white px-2.5 py-1.5 text-xs tabular-nums"
                    />
                  </div>
                  <div className="sm:col-span-3 text-right font-mono text-xs font-semibold tabular-nums text-[#5a0000]">
                    {linePts.toFixed(2)} pts
                  </div>
                  <div className="sm:col-span-1 text-right">
                    {colItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setColItems((prev) => prev.filter((_, i) => i !== idx))
                        }
                        className="text-[#800000] hover:opacity-75"
                        aria-label="Remove item"
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between border-t border-[#f0e6e5] pt-4">
            <div className="text-sm font-semibold text-[#5a0000]">
              Total Points:{" "}
              <span className="font-mono tabular-nums">{estimatedTotalPoints.toFixed(2)} pts</span>
            </div>
            <button
              type="submit"
              className="rounded-lg bg-[#800000] px-5 py-2 text-xs font-semibold text-white hover:bg-[#5a0000]"
            >
              Submit Collection
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: PAYOUTS */}
      {tab === "payouts" && (
        <div className="rounded-xl border border-[#f0e6e5] bg-white overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#faf4f3] text-[#5a0000]">
              <tr>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Student</th>
                <th className="px-4 py-3 font-semibold">Card Ref</th>
                <th className="px-4 py-3 font-semibold">Receipt</th>
                <th className="px-4 py-3 font-semibold text-right">Points</th>
                <th className="px-4 py-3 font-semibold text-right">Cash Paid</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0e6e5]">
              {payouts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-[#8a5a58]">
                    No payouts recorded yet.
                  </td>
                </tr>
              ) : (
                payouts.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3 text-[#5a413d]">
                      {new Date(p.paid_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 font-medium text-[#1b1c1c]">{p.student_name}</td>
                    <td className="px-4 py-3 font-mono">{p.physical_card_ref || "—"}</td>
                    <td className="px-4 py-3 font-mono">{p.receipt_no || "—"}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">
                      -{p.points_deducted.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums text-[#5a0000]">
                      Rs. {p.amount_lkr.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 font-medium ${
                          p.status === "paid"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-red-50 text-[#800000]"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 4: COLLECTION HISTORY */}
      {tab === "history" && (
        <div className="rounded-xl border border-[#f0e6e5] bg-white overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#faf4f3] text-[#5a0000]">
              <tr>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Student</th>
                <th className="px-4 py-3 font-semibold">Items</th>
                <th className="px-4 py-3 font-semibold text-right">Points</th>
                <th className="px-4 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0e6e5]">
              {collections.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-[#8a5a58]">
                    No collections logged yet.
                  </td>
                </tr>
              ) : (
                collections.map((c) => (
                  <tr key={c.id} className={c.is_reversed ? "opacity-60" : ""}>
                    <td className="px-4 py-3 text-[#5a413d]">{c.collection_date}</td>
                    <td className="px-4 py-3 font-medium text-[#1b1c1c]">{c.student_name}</td>
                    <td className="px-4 py-3 text-[#5a413d]">
                      {(c.items || [])
                        .map((i) => `${i.category_name} (${i.quantity} ${i.measurement_unit})`)
                        .join(", ")}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums text-[#5a0000]">
                      +{c.total_points.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {c.is_reversed ? (
                        <span className="text-[#800000]">Reversed</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void handleReverseCollection(c.id)}
                          className="rounded border border-[#dcc6c4] px-2.5 py-1 text-[11px] font-semibold text-[#800000] hover:bg-red-50"
                        >
                          Reverse
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function TeacherWorkspacePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-[#5a0000]">
          Loading workspace...
        </div>
      }
    >
      <TeacherWorkspaceContent />
    </Suspense>
  );
}
