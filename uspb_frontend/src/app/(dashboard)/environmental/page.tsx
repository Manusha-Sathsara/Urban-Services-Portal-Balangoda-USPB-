"use client";

import Link from "next/link";
import React, { useCallback, useEffect, useMemo, useState } from "react";

interface EnvironmentalCert {
  id: number;
  business_name: string;
  owner_name: string;
  owner_nic: string;
  contact_phone: string;
  address: string;
  business_category: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface NewCertForm {
  business_name: string;
  owner_name: string;
  owner_nic: string;
  contact_phone: string;
  address: string;
  business_category: string;
}

type SidebarTab = "dashboard" | "businesses" | "inspections" | "renewals";

const CATEGORIES = [
  "Food & Hospitality",
  "Manufacturing & Tea",
  "General Trade / Retail",
  "Service & Repair",
  "Agriculture & Livestock",
  "Healthcare & Clinics",
];

const INITIAL_FORM: NewCertForm = {
  business_name: "",
  owner_name: "",
  owner_nic: "",
  contact_phone: "",
  address: "",
  business_category: CATEGORIES[0],
};

function getApiBase(): string {
  const raw = (
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1"
  ).replace(/\/$/, "");
  return raw.endsWith("/api/v1") ? raw : `${raw}/api/v1`;
}

function formatRegNo(id: number): string {
  return `ENV-BAL-2026-${String(id).padStart(3, "0")}`;
}

function formatDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getStatusBadge(status: string) {
  const normalized = (status || "PENDING").toUpperCase();
  switch (normalized) {
    case "APPROVED":
      return {
        label: "Approved",
        classes: "bg-emerald-50 text-emerald-700 border-emerald-200",
        dot: "bg-emerald-500",
      };
    case "UNDER_INSPECTION":
    case "INSPECTED":
      return {
        label: "Under Inspection",
        classes: "bg-blue-50 text-blue-700 border-blue-200",
        dot: "bg-blue-500",
      };
    case "EXPIRED":
    case "RENEWAL_DUE":
      return {
        label: "Renewal Due",
        classes: "bg-rose-50 text-rose-700 border-rose-200",
        dot: "bg-rose-500",
      };
    case "REJECTED":
      return {
        label: "Rejected",
        classes: "bg-stone-100 text-stone-700 border-stone-300",
        dot: "bg-stone-500",
      };
    default:
      return {
        label: "Pending Review",
        classes: "bg-amber-50 text-amber-800 border-amber-200",
        dot: "bg-amber-500",
      };
  }
}

export default function EnvironmentalCertsPage() {
  const apiBase = useMemo(() => getApiBase(), []);

  const [activeTab, setActiveTab] = useState<SidebarTab>("dashboard");
  const [certs, setCerts] = useState<EnvironmentalCert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  // Create Modal state
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [formData, setFormData] = useState<NewCertForm>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Detail Modal state
  const [selectedCert, setSelectedCert] = useState<EnvironmentalCert | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);

  const fetchCertificates = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch(`${apiBase}/environmental-certs`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to load environmental certificates");
      }
      setCerts(Array.isArray(json.data) ? json.data : []);
    } catch (err) {
      setFetchError(
        err instanceof Error
          ? err.message
          : "Unable to connect to backend API at port 8080"
      );
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const handleTabSwitch = (tab: SidebarTab) => {
    setActiveTab(tab);
    if (tab === "inspections") {
      setStatusFilter("PENDING");
    } else if (tab === "renewals") {
      setStatusFilter("EXPIRED");
    } else {
      setStatusFilter("ALL");
    }
  };

  const handleOpenDetail = async (cert: EnvironmentalCert) => {
    setSelectedCert(cert);
    setLoadingDetail(true);
    try {
      const res = await fetch(`${apiBase}/environmental-certs/${cert.id}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (res.ok && json.success && json.data) {
        setSelectedCert(json.data);
      }
    } catch {
      // Keep row snapshot if detail refresh fails
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (
      !formData.business_name.trim() ||
      !formData.owner_name.trim() ||
      !formData.owner_nic.trim() ||
      !formData.contact_phone.trim() ||
      !formData.address.trim() ||
      !formData.business_category.trim()
    ) {
      setFormError("All 6 business application fields are required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${apiBase}/environmental-certs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_name: formData.business_name.trim(),
          owner_name: formData.owner_name.trim(),
          owner_nic: formData.owner_nic.trim(),
          contact_phone: formData.contact_phone.trim(),
          address: formData.address.trim(),
          business_category: formData.business_category.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to register business application");
      }

      setFormData(INITIAL_FORM);
      setIsCreateOpen(false);
      setToastMessage(
        `Application registered for ${json.data?.business_name || "business"}.`
      );
      await fetchCertificates();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Error submitting application"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const stats = useMemo(() => {
    const total = certs.length;
    const pending = certs.filter((c) => {
      const s = (c.status || "").toUpperCase();
      return s === "PENDING" || s === "UNDER_INSPECTION";
    }).length;
    const approved = certs.filter(
      (c) => (c.status || "").toUpperCase() === "APPROVED"
    ).length;
    const renewalsDue = certs.filter((c) => {
      const s = (c.status || "").toUpperCase();
      return s === "EXPIRED" || s === "RENEWAL_DUE";
    }).length;
    const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;
    return { total, pending, approved, renewalsDue, approvalRate };
  }, [certs]);

  const availableCategories = useMemo(() => {
    const set = new Set<string>(CATEGORIES);
    certs.forEach((c) => {
      if (c.business_category) set.add(c.business_category);
    });
    return Array.from(set);
  }, [certs]);

  const filteredCerts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return certs.filter((cert) => {
      const s = (cert.status || "").toUpperCase();
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "PENDING"
          ? s === "PENDING" || s === "UNDER_INSPECTION"
          : s === statusFilter);
      const matchesCategory =
        categoryFilter === "ALL" || cert.business_category === categoryFilter;
      const regNo = formatRegNo(cert.id).toLowerCase();
      const matchesQuery =
        !q ||
        cert.business_name.toLowerCase().includes(q) ||
        cert.owner_name.toLowerCase().includes(q) ||
        cert.owner_nic.toLowerCase().includes(q) ||
        regNo.includes(q);
      return matchesStatus && matchesCategory && matchesQuery;
    });
  }, [certs, searchQuery, statusFilter, categoryFilter]);

  const pageMeta = useMemo(() => {
    switch (activeTab) {
      case "businesses":
        return {
          title: "Business Applications List",
          subtitle:
            "Manage registered businesses and their environmental clearance intake records.",
        };
      case "inspections":
        return {
          title: "Inspection Queue",
          subtitle:
            "Monitor applications awaiting Public Health Inspector (PHI) site inspection.",
        };
      case "renewals":
        return {
          title: "Renewals & Expiry Records",
          subtitle:
            "View and monitor expired environmental certificates due for annual renewal.",
        };
      default:
        return {
          title: "Environmental Certificate Management",
          subtitle:
            "Manage business environmental clearance applications, compliance status, and annual renewals.",
        };
    }
  }, [activeTab]);

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF7F5] text-stone-900">
      {/* Top Municipal Portal Bar */}
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-white px-5 py-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-[#7A1C1C]">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <div>
              <p className="font-serif text-base font-bold leading-tight text-[#3B1818]">
                Environmental Certificate Management
              </p>
              <p className="text-xs text-stone-500">
                Health Division — Balangoda Urban Council
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/"
              className="text-xs font-medium text-stone-600 hover:text-[#7A1C1C] transition"
            >
              ← Public Portal
            </Link>

            {stats.renewalsDue > 0 && (
              <button
                type="button"
                onClick={() => handleTabSwitch("renewals")}
                className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition"
              >
                <span className="h-2 w-2 rounded-full bg-rose-600 animate-pulse" />
                {stats.renewalsDue} Renewal{stats.renewalsDue > 1 ? "s" : ""} Due
              </button>
            )}

            <div className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-3.5 py-1.5 text-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="font-semibold text-stone-800">
                Environmental Health Officer
              </span>
              <span className="hidden text-stone-400 sm:inline">
                (Health Division)
              </span>
            </div>

            <Link
              href="/login"
              className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition"
            >
              Sign Out
            </Link>
          </div>
        </div>
      </header>

      {/* Body: Left Module Sidebar + Main Content */}
      <div className="flex flex-1">
        <aside className="flex w-56 shrink-0 flex-col justify-between border-r border-stone-200 bg-white p-3.5">
          <div>
            <div className="mb-3 flex items-center justify-between px-2">
              <span className="text-[11px] font-bold tracking-wider uppercase text-stone-500">
                Env. Clearance
              </span>
              <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-[#7A1C1C]">
                USPB
              </span>
            </div>

            <nav className="space-y-1">
              <button
                type="button"
                onClick={() => handleTabSwitch("dashboard")}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${
                  activeTab === "dashboard"
                    ? "bg-[#7A1C1C] font-semibold text-white shadow-xs"
                    : "text-stone-700 hover:bg-stone-100"
                }`}
              >
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                <span>Dashboard</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabSwitch("businesses")}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${
                  activeTab === "businesses"
                    ? "bg-[#7A1C1C] font-semibold text-white shadow-xs"
                    : "text-stone-700 hover:bg-stone-100"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span>Business List</span>
                </span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
                    activeTab === "businesses"
                      ? "bg-white/20 text-white"
                      : "bg-stone-100 text-stone-600"
                  }`}
                >
                  {stats.total}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleTabSwitch("inspections")}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${
                  activeTab === "inspections"
                    ? "bg-[#7A1C1C] font-semibold text-white shadow-xs"
                    : "text-stone-700 hover:bg-stone-100"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  <span>Inspection Queue</span>
                </span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
                    activeTab === "inspections"
                      ? "bg-white/20 text-white"
                      : "bg-amber-50 text-amber-800"
                  }`}
                >
                  {stats.pending}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleTabSwitch("renewals")}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${
                  activeTab === "renewals"
                    ? "bg-[#7A1C1C] font-semibold text-white shadow-xs"
                    : "text-stone-700 hover:bg-stone-100"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Renewals Due</span>
                </span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
                    activeTab === "renewals"
                      ? "bg-white/20 text-white"
                      : stats.renewalsDue > 0
                      ? "bg-rose-100 text-rose-700"
                      : "bg-stone-100 text-stone-600"
                  }`}
                >
                  {stats.renewalsDue}
                </span>
              </button>
            </nav>
          </div>

          <div className="rounded-xl border border-stone-200 bg-[#FAF7F5] p-3 text-xs">
            <p className="font-semibold text-[#3B1818]">
              Environmental Certificate Management
            </p>
            <p className="mt-1 leading-relaxed text-stone-500">
              Balangoda Urban Council municipal portal interface.
            </p>
          </div>
        </aside>

        {/* Main Workspace */}
        <main className="min-w-0 flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-7xl">
            {toastMessage && (
              <div className="mb-5 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                <span>{toastMessage}</span>
                <button
                  type="button"
                  onClick={() => setToastMessage(null)}
                  className="text-xs font-semibold text-emerald-700 hover:underline"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Page Title & Action */}
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h1 className="font-serif text-2xl font-bold tracking-tight text-[#3B1818] sm:text-3xl">
                  {pageMeta.title}
                </h1>
                <p className="mt-1 text-sm text-stone-600">
                  {pageMeta.subtitle}
                </p>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={fetchCertificates}
                  className="rounded-lg border border-stone-300 bg-white px-3.5 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 transition"
                >
                  Refresh
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormError(null);
                    setIsCreateOpen(true);
                  }}
                  className="rounded-lg bg-[#7A1C1C] px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-[#5E1414] transition"
                >
                  + New Application
                </button>
              </div>
            </div>

            {/* KPI Summary Cards */}
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border border-stone-200 bg-white p-5">
                <div className="flex items-start justify-between">
                  <p className="text-[11px] font-semibold tracking-wider uppercase text-stone-500">
                    Total Applications
                  </p>
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-100 text-stone-700">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </span>
                </div>
                <p className="mt-2 text-3xl font-bold text-[#3B1818]">
                  {stats.total}
                </p>
                <p className="mt-1.5 text-xs text-stone-500">
                  All registered environmental intake records
                </p>
              </div>

              <div className="rounded-xl border border-stone-200 bg-white p-5">
                <div className="flex items-start justify-between">
                  <p className="text-[11px] font-semibold tracking-wider uppercase text-stone-500">
                    Pending Review
                  </p>
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </span>
                </div>
                <p className="mt-2 text-3xl font-bold text-amber-700">
                  {stats.pending}
                </p>
                <p className="mt-1.5 text-xs text-stone-500">
                  Awaiting field inspection &amp; clearance
                </p>
              </div>

              <div className="rounded-xl border border-stone-200 bg-white p-5">
                <div className="flex items-start justify-between">
                  <p className="text-[11px] font-semibold tracking-wider uppercase text-stone-500">
                    Approved Certificates
                  </p>
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                </div>
                <p className="mt-2 text-3xl font-bold text-emerald-700">
                  {stats.approved}
                </p>
                <p className="mt-1.5 text-xs text-stone-500">
                  Active compliant businesses in Balangoda
                </p>
              </div>

              <div className="rounded-xl border border-stone-200 bg-white p-5">
                <div className="flex items-start justify-between">
                  <p className="text-[11px] font-semibold tracking-wider uppercase text-stone-500">
                    Renewals Due
                  </p>
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86l-7.5 13A1 1 0 003.65 18h16.7a1 1 0 00.86-1.5l-7.5-13a1 1 0 00-1.72 0z" />
                    </svg>
                  </span>
                </div>
                <p className="mt-2 text-3xl font-bold text-rose-700">
                  {stats.renewalsDue}
                </p>
                <p className="mt-1.5 text-xs text-stone-500">
                  Expired or flagged for annual renewal
                </p>
              </div>
            </div>

            {/* Dashboard Compliance Progress Summary */}
            {activeTab === "dashboard" && (
              <div className="mt-6 rounded-xl border border-stone-200 bg-white p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-serif text-base font-bold text-[#3B1818]">
                      Annual Environmental Compliance Summary
                    </h2>
                    <p className="text-xs text-stone-500">
                      Certificate clearance completion rate for FY 2026
                    </p>
                  </div>
                  <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">
                    FY 2026
                  </span>
                </div>
                <div className="mt-4">
                  <div className="mb-1.5 flex items-center justify-between text-xs font-semibold">
                    <span className="text-stone-700">Clearance Completion</span>
                    <span className="text-[#7A1C1C]">{stats.approvalRate}%</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-stone-100">
                    <div
                      className="h-full rounded-full bg-[#7A1C1C] transition-all duration-300"
                      style={{ width: `${stats.approvalRate}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-stone-500">
                    {stats.approved} of {stats.total} registered businesses hold active approved clearances.
                  </p>
                </div>
              </div>
            )}

            {/* Search & Filter Bar */}
            <div className="mt-6 rounded-xl border border-stone-200 bg-white p-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
                <div className="md:col-span-6">
                  <label className="block text-[11px] font-semibold tracking-wider uppercase text-stone-500">
                    Search
                  </label>
                  <div className="relative mt-1.5">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by business name, owner name, NIC, or registration number..."
                      className="w-full rounded-lg border border-stone-300 bg-white py-2 pr-3 pl-9 text-sm text-stone-900 placeholder-stone-400 focus:border-[#7A1C1C] focus:outline-none"
                    />
                    <svg
                      className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-stone-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z"
                      />
                    </svg>
                  </div>
                </div>

                <div className="md:col-span-3">
                  <label className="block text-[11px] font-semibold tracking-wider uppercase text-stone-500">
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-[#7A1C1C] focus:outline-none"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="PENDING">Pending / Inspection</option>
                    <option value="APPROVED">Approved</option>
                    <option value="EXPIRED">Expired / Renewal Due</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>

                <div className="md:col-span-3">
                  <label className="block text-[11px] font-semibold tracking-wider uppercase text-stone-500">
                    Business Category
                  </label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-[#7A1C1C] focus:outline-none"
                  >
                    <option value="ALL">All Categories</option>
                    {availableCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Applications DataTable */}
            <div className="mt-6 rounded-xl border border-stone-200 bg-white p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="font-serif text-lg font-bold text-[#3B1818]">
                    Registered Applications
                  </h2>
                  <p className="text-xs text-stone-500">
                    Showing {filteredCerts.length} of {certs.length} registered business{" "}
                    {certs.length === 1 ? "record" : "records"}
                  </p>
                </div>
              </div>

              {fetchError && (
                <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  <strong>Connection Error:</strong> {fetchError}
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full divide-y divide-stone-200 text-left text-sm">
                  <thead>
                    <tr className="border-b border-stone-200 text-[11px] font-semibold tracking-wider uppercase text-stone-500">
                      <th className="py-3 pr-2.5 whitespace-nowrap">Reg. No</th>
                      <th className="px-2.5 py-3">Business Name</th>
                      <th className="px-2.5 py-3">Owner Name</th>
                      <th className="px-2.5 py-3">Category</th>
                      <th className="px-2.5 py-3">Address</th>
                      <th className="px-2.5 py-3 whitespace-nowrap">Contact</th>
                      <th className="px-2.5 py-3 whitespace-nowrap">Status</th>
                      <th className="py-3 pl-2.5 text-right whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-stone-800">
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-sm text-stone-500">
                          Loading environmental certificate applications...
                        </td>
                      </tr>
                    ) : filteredCerts.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-sm text-stone-500">
                          No matching applications found. Click{" "}
                          <span className="font-semibold text-[#7A1C1C]">
                            + New Application
                          </span>{" "}
                          to register a business.
                        </td>
                      </tr>
                    ) : (
                      filteredCerts.map((cert) => {
                        const badge = getStatusBadge(cert.status);
                        return (
                          <tr
                            key={cert.id}
                            className="hover:bg-stone-50/80 transition-colors"
                          >
                            <td className="py-3.5 pr-2.5 font-mono text-xs font-medium text-stone-600 whitespace-nowrap">
                              {formatRegNo(cert.id)}
                            </td>
                            <td className="px-2.5 py-3.5 font-semibold text-stone-900">
                              {cert.business_name}
                            </td>
                            <td className="px-2.5 py-3.5">
                              <div className="font-medium text-stone-800">
                                {cert.owner_name}
                              </div>
                              <div className="text-xs text-stone-500">
                                NIC: {cert.owner_nic}
                              </div>
                            </td>
                            <td className="px-2.5 py-3.5 text-xs text-stone-700">
                              {cert.business_category}
                            </td>
                            <td className="max-w-[160px] px-2.5 py-3.5 text-xs text-stone-600">
                              {cert.address}
                            </td>
                            <td className="px-2.5 py-3.5 font-mono text-xs text-stone-700 whitespace-nowrap">
                              {cert.contact_phone}
                            </td>
                            <td className="px-2.5 py-3.5 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badge.classes}`}
                              >
                                <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                                {badge.label}
                              </span>
                            </td>
                            <td className="py-3.5 pl-2.5 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleOpenDetail(cert)}
                                className="rounded-md border border-stone-200 bg-white px-2.5 py-1 text-xs font-semibold text-stone-700 hover:border-[#7A1C1C] hover:text-[#7A1C1C] transition"
                              >
                                View
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
        </main>
      </div>

      {/* + New Application Intake Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-stone-200 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between border-b border-stone-200 pb-4">
              <div>
                <h2 className="font-serif text-xl font-bold text-[#3B1818]">
                  New Environmental Certificate Application
                </h2>
                <p className="mt-0.5 text-xs text-stone-500">
                  Submit business intake details for Balangoda Urban Council clearance.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4">
              {formError && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-stone-700">
                  Business Name <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.business_name}
                  onChange={(e) =>
                    setFormData({ ...formData, business_name: e.target.value })
                  }
                  placeholder="e.g. Saman Tea Factory"
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-[#7A1C1C] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-stone-700">
                    Owner / Applicant Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.owner_name}
                    onChange={(e) =>
                      setFormData({ ...formData, owner_name: e.target.value })
                    }
                    placeholder="e.g. K. M. Saman Perera"
                    className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-[#7A1C1C] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700">
                    Owner NIC <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.owner_nic}
                    onChange={(e) =>
                      setFormData({ ...formData, owner_nic: e.target.value })
                    }
                    placeholder="e.g. 198512345678"
                    className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-[#7A1C1C] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-stone-700">
                    Contact Phone <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.contact_phone}
                    onChange={(e) =>
                      setFormData({ ...formData, contact_phone: e.target.value })
                    }
                    placeholder="e.g. 0771234567"
                    className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-[#7A1C1C] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700">
                    Business Category <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={formData.business_category}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        business_category: e.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-[#7A1C1C] focus:outline-none"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700">
                  Premises Address <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="e.g. No. 18, Ratnapura Road, Balangoda"
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-[#7A1C1C] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 border-t border-stone-200 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  disabled={submitting}
                  className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-[#7A1C1C] px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-[#5E1414] disabled:opacity-60"
                >
                  {submitting ? "Submitting..." : "Submit Application"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Application Detail Modal */}
      {selectedCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between border-b border-stone-200 pb-3">
              <div>
                <span className="font-mono text-xs font-semibold text-stone-500">
                  {formatRegNo(selectedCert.id)}
                </span>
                <h3 className="font-serif text-xl font-bold text-[#3B1818]">
                  {selectedCert.business_name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCert(null)}
                className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 text-sm">
              {loadingDetail && (
                <p className="text-xs text-stone-400">Syncing latest record...</p>
              )}
              <div className="flex justify-between">
                <span className="text-stone-500">Status</span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                    getStatusBadge(selectedCert.status).classes
                  }`}
                >
                  {getStatusBadge(selectedCert.status).label}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Applicant / Owner</span>
                <span className="font-medium text-stone-900">
                  {selectedCert.owner_name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Owner NIC</span>
                <span className="font-mono text-stone-800">
                  {selectedCert.owner_nic}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Contact Phone</span>
                <span className="font-mono text-stone-800">
                  {selectedCert.contact_phone}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Category</span>
                <span className="font-medium text-stone-800">
                  {selectedCert.business_category}
                </span>
              </div>
              <div>
                <span className="block text-stone-500">Premises Address</span>
                <span className="mt-0.5 block font-medium text-stone-800">
                  {selectedCert.address}
                </span>
              </div>
              <div className="flex justify-between border-t border-stone-100 pt-2 text-xs text-stone-500">
                <span>Submitted: {formatDate(selectedCert.created_at)}</span>
                <span>Updated: {formatDate(selectedCert.updated_at)}</span>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedCert(null)}
                className="rounded-lg bg-[#7A1C1C] px-4 py-2 text-sm font-semibold text-white hover:bg-[#5E1414]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}