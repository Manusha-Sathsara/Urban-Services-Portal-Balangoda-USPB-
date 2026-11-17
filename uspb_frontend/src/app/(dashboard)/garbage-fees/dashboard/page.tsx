"use client";

/**
 * Garbage Collection Fee Management Dashboard
 * Route: /garbage-fees/dashboard
 *
 * Implements:
 *  A. Page Header — title, subtitle, year selector, Add New Business button (opens registration form)
 *  B. Summary Cards — Total Businesses, Paid, Unpaid, Total Collected (live reactive state)
 *  C. Annual Fee Collection Summary — progress bar + summary figures
 *  D. Search and Filter Section — search by business name, owner name, reg. number, NIC;
 *     filters for Payment Status and Business Type; Reset Filters button
 *  E. Business Payment Records Table — filtered payment records for the selected year with view details
 *  F. Register Business Modal — full modal dialog for registering new businesses with 35 categories & auto-pricing
 *  G. Business Details Modal — inspection of full business profile including NIC, address, and category
 *  H. Success Toast Notification — visual feedback upon successful registration
 *
 * Theme: Balangoda Urban Council brand colors (#5a0000, #800000, #fbbf24, #f0e0df, #dcc6c4).
 */

import { useState, useMemo, useEffect } from "react";
import { StatCard } from "@/components/shared/StatCard";
import { PaymentStatusBadge } from "@/components/shared/PaymentStatusBadge";
import { CollectionSummary } from "@/components/shared/CollectionSummary";
import {
  RegisterBusinessModal,
  NewBusinessData,
} from "@/components/garbage-fees/RegisterBusinessModal";
import {
  MOCK_BUSINESS_RECORDS,
  AVAILABLE_YEARS,
  DEFAULT_YEAR,
  computeDashboardStats,
  type BusinessFeeRecord,
} from "./mockData";
import { formatLKR } from "@/lib/businessCategories";

// ---------------------------------------------------------------------------
// Utility: format ISO date to a readable string
// ---------------------------------------------------------------------------
function formatDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// File-Level Component: Year Selector
// ---------------------------------------------------------------------------
function YearSelector({
  years,
  selected,
  onChange,
}: {
  years: number[];
  selected: number;
  onChange: (year: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor="fee-year-select"
        className="text-[11px] font-semibold uppercase tracking-wider text-[#8a5a58] whitespace-nowrap"
      >
        Fee Year
      </label>
      <select
        id="fee-year-select"
        value={selected}
        onChange={(e) => onChange(Number(e.target.value))}
        className="rounded-lg border border-[#dcc6c4] bg-white px-3 py-1.5 text-sm font-medium text-[#5a0000] shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#800000]/30 cursor-pointer"
        aria-label="Select fee year"
      >
        {years.map((y) => (
          <option key={y} value={y}>
            FY {y}
          </option>
        ))}
      </select>
    </div>
  );
}

// ---------------------------------------------------------------------------
// File-Level Component: Empty State
// ---------------------------------------------------------------------------
function EmptyState({
  filtered,
  selectedYear,
  onReset,
}: {
  filtered: boolean;
  selectedYear: number;
  onReset?: () => void;
}) {
  return (
    <div className="py-12 text-center">
      <div className="w-12 h-12 rounded-full bg-[#f0e0df] text-[#5a0000] text-2xl grid place-items-center mx-auto mb-3">
        {filtered ? "🔍" : "📋"}
      </div>
      <p className="text-sm font-semibold text-[#5a0000]">
        {filtered
          ? "No business records match your search or filters"
          : `No business records found for fee year ${selectedYear}.`}
      </p>
      {filtered ? (
        <>
          <p className="text-xs text-[#8a5a58] mt-1 max-w-[320px] mx-auto mb-3">
            Try adjusting your search keyword, payment status, or business type filter.
          </p>
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#dcc6c4] bg-white px-3 py-1.5 text-xs font-semibold text-[#5a0000] hover:bg-[#f0e0df] transition-colors"
            >
              Reset Filters
            </button>
          )}
        </>
      ) : (
        <p className="text-xs text-[#8a5a58] mt-1">
          Select another fee year from the dropdown above or click &ldquo;+ Add New Business&rdquo; to register one.
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// File-Level Component: Business Record View Details Modal
// ---------------------------------------------------------------------------
function BusinessRecordDetailsModal({
  record,
  onClose,
}: {
  record: BusinessFeeRecord;
  onClose: () => void;
}) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="biz-details-title"
    >
      <div
        className="fixed inset-0 bg-[#1a0000]/40 backdrop-blur-xs"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-lg rounded-xl bg-white border border-[#f0e6e5] shadow-[0_8px_32px_rgba(90,0,0,0.2)] my-auto">
        <div className="flex items-start justify-between px-6 py-4 border-b border-[#f0e6e5] bg-[#fcf8f7] rounded-t-xl">
          <div>
            <h3 id="biz-details-title" className="font-serif text-[17px] font-bold text-[#5a0000]">
              Business Registration Details
            </h3>
            <p className="text-xs font-mono text-[#8a5a58] mt-0.5">{record.id}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#f0e0df] text-[#8a5a58] hover:text-[#5a0000] transition-colors"
            aria-label="Close details"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-5 space-y-3.5">
          <div className="grid grid-cols-[130px_1fr] gap-2 text-sm">
            <span className="text-[#8a5a58] font-medium shrink-0">Business Name</span>
            <span className="text-[#5a0000] font-semibold">{record.businessName}</span>
          </div>

          <div className="grid grid-cols-[130px_1fr] gap-2 text-sm">
            <span className="text-[#8a5a58] font-medium shrink-0">Owner Name</span>
            <span className="text-[#4a4a4a]">{record.ownerName || "—"}</span>
          </div>

          <div className="grid grid-cols-[130px_1fr] gap-2 text-sm">
            <span className="text-[#8a5a58] font-medium shrink-0">Owner ID (NIC)</span>
            <span className="font-mono text-[#4a4a4a]">{record.ownerIdNumber || "—"}</span>
          </div>

          <div className="grid grid-cols-[130px_1fr] gap-2 text-sm">
            <span className="text-[#8a5a58] font-medium shrink-0">Category</span>
            <div>
              <span className="text-[#4a4a4a] font-medium">{record.businessType || "—"}</span>
              {record.categorySinhalaName && (
                <span className="text-xs text-[#8a5a58] block mt-0.5">
                  {record.categorySinhalaName}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-[130px_1fr] gap-2 text-sm">
            <span className="text-[#8a5a58] font-medium shrink-0">Address</span>
            <span className="text-[#4a4a4a]">{record.address || "—"}</span>
          </div>

          <div className="grid grid-cols-[130px_1fr] gap-2 text-sm">
            <span className="text-[#8a5a58] font-medium shrink-0">Contact Number</span>
            <span className="font-mono text-[#4a4a4a]">
              {record.contactNumber ? (
                <a href={`tel:${record.contactNumber}`} className="text-[#5a0000] hover:underline">
                  {record.contactNumber}
                </a>
              ) : (
                "—"
              )}
            </span>
          </div>

          <div className="grid grid-cols-[130px_1fr] gap-2 text-sm">
            <span className="text-[#8a5a58] font-medium shrink-0">Ward</span>
            <span className="text-[#4a4a4a]">{record.ward}</span>
          </div>

          <div className="grid grid-cols-[130px_1fr] gap-2 text-sm">
            <span className="text-[#8a5a58] font-medium shrink-0">Fee Year</span>
            <span className="text-[#5a0000] font-semibold">FY {record.feeYear}</span>
          </div>

          <div className="grid grid-cols-[130px_1fr] gap-2 text-sm">
            <span className="text-[#8a5a58] font-medium shrink-0">Annual Fee</span>
            <span className="font-mono font-bold text-[#5a0000]">{formatLKR(record.feeAmount)}</span>
          </div>

          <div className="grid grid-cols-[130px_1fr] gap-2 text-sm items-center">
            <span className="text-[#8a5a58] font-medium shrink-0">Payment Status</span>
            <div>
              <PaymentStatusBadge status={record.status} />
              {record.paymentDate && (
                <span className="text-xs text-[#8a5a58] block mt-1">
                  Paid on {formatDate(record.paymentDate)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-3.5 border-t border-[#f0e6e5] bg-[#fcf8f7] rounded-b-xl flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-[#dcc6c4] bg-white text-xs font-semibold text-[#5a0000] hover:bg-[#f0e0df] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// File-Level Component: Toast Notification
// ---------------------------------------------------------------------------
function SuccessToast({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 5000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-emerald-200 bg-white px-4 py-3 shadow-[0_6px_24px_rgba(0,0,0,0.15)] max-w-md animate-fade-in"
    >
      <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm shrink-0">
        ✓
      </div>
      <p className="text-xs font-medium text-emerald-950 leading-relaxed">{message}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="ml-auto text-[#8a5a58] hover:text-[#5a0000] text-xs p-1 rounded hover:bg-[#f0e0df]"
        aria-label="Dismiss notification"
      >
        ✕
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Dashboard Page
// ---------------------------------------------------------------------------
export default function GarbageFeeDashboardPage() {
  const [selectedYear, setSelectedYear] = useState<number>(DEFAULT_YEAR);
  const [records, setRecords] = useState<BusinessFeeRecord[]>(MOCK_BUSINESS_RECORDS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Modal & Toast states
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<BusinessFeeRecord | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Derive dashboard stats from state records for selectedYear
  const stats = useMemo(
    () => computeDashboardStats(records, selectedYear),
    [records, selectedYear]
  );

  // All records for the selected fee year
  const yearRecords = useMemo(
    () => records.filter((r) => r.feeYear === selectedYear),
    [records, selectedYear]
  );

  // Generate next sequential registration number for the selected year
  const nextRegistrationNumber = useMemo(() => {
    const prefix = `BAL-BUS-${selectedYear}-`;
    const yearMatches = records
      .filter((r) => r.id.startsWith(prefix))
      .map((r) => {
        const numPart = parseInt(r.id.replace(prefix, ""), 10);
        return isNaN(numPart) ? 0 : numPart;
      });
    const maxNum = yearMatches.length > 0 ? Math.max(...yearMatches) : 0;
    return `BAL-BUS-${selectedYear}-${String(maxNum + 1).padStart(3, "0")}`;
  }, [records, selectedYear]);

  // Dynamically derive available business types from existing records
  const availableBusinessTypes = useMemo(() => {
    const types = new Set<string>();
    records.forEach((r) => {
      if (r.businessType) types.add(r.businessType);
    });
    return Array.from(types).sort();
  }, [records]);

  // Filtered records matching search and filter selections
  const filteredRecords = useMemo(() => {
    const q = search.trim().toLowerCase();
    return yearRecords.filter((record) => {
      const matchesSearch =
        !q ||
        record.businessName.toLowerCase().includes(q) ||
        (record.ownerName && record.ownerName.toLowerCase().includes(q)) ||
        (record.ownerIdNumber && record.ownerIdNumber.toLowerCase().includes(q)) ||
        (record.address && record.address.toLowerCase().includes(q)) ||
        record.id.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "paid" && record.status === "paid") ||
        (statusFilter === "unpaid" &&
          (record.status === "unpaid" || record.status === "overdue"));

      const matchesType =
        typeFilter === "all" || record.businessType === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [yearRecords, search, statusFilter, typeFilter]);

  const hasActiveFilters =
    search.trim() !== "" || statusFilter !== "all" || typeFilter !== "all";

  const handleResetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setTypeFilter("all");
  };

  // Handle new business registration from the modal form
  const handleRegisterBusiness = (data: NewBusinessData) => {
    const wardName = data.ward.includes(" - ") ? data.ward.split(" - ")[0] : data.ward;

    const newRecord: BusinessFeeRecord = {
      id: data.registrationNumber,
      businessName: data.businessName,
      ownerName: data.ownerName,
      ownerIdNumber: data.ownerIdNumber,
      businessType: data.categoryName,
      categorySinhalaName: data.categorySinhalaName,
      categoryId: data.categoryId,
      address: data.address,
      contactNumber: data.contactNumber,
      ward: wardName,
      feeYear: selectedYear,
      feeAmount: data.price,
      status: "unpaid",
    };

    setRecords((prev) => [newRecord, ...prev]);

    setToastMessage(
      `"${data.businessName}" registered successfully under "${data.categoryName}" with annual fee of ${formatLKR(data.price)}.`
    );
  };

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------------ */}
      {/* A. Page Header                                                       */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-[22px] text-[#5a0000] leading-tight">
            Garbage Fee Management
          </h2>
          <p className="text-[13px] text-[#8a5a58] mt-1 max-w-[480px]">
            Manage business registrations and track annual garbage collection fees.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <YearSelector
            years={AVAILABLE_YEARS}
            selected={selectedYear}
            onChange={setSelectedYear}
          />
          <button
            type="button"
            id="add-new-business-btn"
            onClick={() => setIsRegisterModalOpen(true)}
            className="btn-hover-fx inline-flex items-center gap-1.5 rounded-lg bg-[#800000] px-4 py-2 text-[13px] font-semibold text-white shadow-sm hover:bg-[#5a0000] transition-colors"
            aria-label="Add new business registration"
          >
            <span aria-hidden="true" className="text-base leading-none">+</span> Add New Business
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* B. Summary Cards                                                     */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Businesses"
          value={stats.totalBusinesses}
          description="Registered active businesses for this fee year"
          icon="🏪"
          variant="default"
        />
        <StatCard
          label="Paid Businesses"
          value={stats.paidBusinesses}
          description="Businesses that have paid their annual fee"
          icon="✅"
          variant="success"
        />
        <StatCard
          label="Unpaid Businesses"
          value={stats.unpaidBusinesses}
          description="Businesses with outstanding annual fees"
          icon="⏳"
          variant="warning"
        />
        <StatCard
          label="Fee Collection"
          value={formatLKR(stats.totalCollected)}
          description="Total amount collected for the selected year"
          icon="💰"
          variant="revenue"
        />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* C. Annual Fee Collection Summary                                     */}
      {/* ------------------------------------------------------------------ */}
      <CollectionSummary
        totalBusinesses={stats.totalBusinesses}
        paidBusinesses={stats.paidBusinesses}
        unpaidBusinesses={stats.unpaidBusinesses}
        totalCollected={stats.totalCollected}
        year={selectedYear}
      />

      {/* ------------------------------------------------------------------ */}
      {/* D. Search and Filter Section                                         */}
      {/* ------------------------------------------------------------------ */}
      <section
        className="bg-white rounded-lg border border-[#f0e6e5] shadow-[0_2px_10px_rgba(90,0,0,0.06)] p-4"
        aria-label="Search and filter payment records"
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:gap-4">
          {/* Search bar */}
          <div className="flex-1 min-w-0">
            <label
              htmlFor="dashboard-search"
              className="block text-[11px] font-semibold uppercase tracking-wider text-[#8a5a58] mb-1.5"
            >
              Search
            </label>
            <div className="relative">
              <span
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a5a58] text-sm pointer-events-none"
                aria-hidden="true"
              >
                🔍
              </span>
              <input
                id="dashboard-search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by business name, owner name, NIC, or registration number..."
                className="w-full rounded-lg border border-[#dcc6c4] bg-white pl-9 pr-8 py-2 text-sm text-[#4a4a4a] placeholder:text-[#c0a8a6] shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#800000]/30"
                aria-label="Search business records"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8a5a58] hover:text-[#5a0000] text-xs p-0.5"
                  aria-label="Clear search query"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Payment Status Filter */}
          <div className="sm:min-w-[160px]">
            <label
              htmlFor="dashboard-status-filter"
              className="block text-[11px] font-semibold uppercase tracking-wider text-[#8a5a58] mb-1.5"
            >
              Payment Status
            </label>
            <select
              id="dashboard-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg border border-[#dcc6c4] bg-white px-3 py-2 text-sm text-[#5a0000] shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#800000]/30 cursor-pointer font-medium"
              aria-label="Filter by payment status"
            >
              <option value="all">All Payments</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
            </select>
          </div>

          {/* Business Type Filter */}
          <div className="sm:min-w-[200px]">
            <label
              htmlFor="dashboard-type-filter"
              className="block text-[11px] font-semibold uppercase tracking-wider text-[#8a5a58] mb-1.5"
            >
              Business Category
            </label>
            <select
              id="dashboard-type-filter"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full rounded-lg border border-[#dcc6c4] bg-white px-3 py-2 text-sm text-[#5a0000] shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#800000]/30 cursor-pointer font-medium"
              aria-label="Filter by business category"
            >
              <option value="all">All Categories</option>
              {availableBusinessTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleResetFilters}
                className="whitespace-nowrap rounded-lg border border-[#dcc6c4] bg-white px-3 py-2 text-xs font-semibold text-[#5a0000] hover:bg-[#f0e0df] transition-colors"
                aria-label="Reset all search filters"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* E. Business Payment Activity Table                                   */}
      {/* ------------------------------------------------------------------ */}
      <section className="bg-white rounded-lg border border-[#f0e6e5] shadow-[0_2px_10px_rgba(90,0,0,0.08)]">
        {/* Table header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0e6e5]">
          <div>
            <h3 className="font-serif text-[15px] text-[#5a0000]">
              Business Payment Records
            </h3>
            <p className="text-[11.5px] text-[#8a5a58] mt-0.5">
              Annual fee payment status for all registered businesses — FY {selectedYear}
            </p>
          </div>
          <span className="text-[11px] font-semibold text-[#8a5a58]">
            {filteredRecords.length !== yearRecords.length
              ? `Showing ${filteredRecords.length} of ${yearRecords.length} records`
              : `${yearRecords.length} record${yearRecords.length !== 1 ? "s" : ""}`}
          </span>
        </div>

        {/* Table */}
        {filteredRecords.length === 0 ? (
          <EmptyState
            filtered={hasActiveFilters}
            selectedYear={selectedYear}
            onReset={hasActiveFilters ? handleResetFilters : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <table
              className="min-w-full divide-y divide-[#f0e6e5] text-left text-sm"
              aria-label={`Business payment records for ${selectedYear}`}
            >
              <thead className="bg-[#fcf8f7] text-xs uppercase font-semibold text-[#8a5a58]">
                <tr>
                  <th scope="col" className="px-5 py-3 whitespace-nowrap">
                    Business Name
                  </th>
                  <th scope="col" className="px-5 py-3 whitespace-nowrap">
                    Category
                  </th>
                  <th scope="col" className="px-5 py-3 whitespace-nowrap">
                    Ward
                  </th>
                  <th scope="col" className="px-5 py-3 whitespace-nowrap">
                    Fee Year
                  </th>
                  <th scope="col" className="px-5 py-3 text-right whitespace-nowrap">
                    Annual Fee
                  </th>
                  <th scope="col" className="px-5 py-3 whitespace-nowrap">
                    Status
                  </th>
                  <th scope="col" className="px-5 py-3 whitespace-nowrap">
                    Payment Date
                  </th>
                  <th scope="col" className="px-5 py-3 text-right whitespace-nowrap">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0e6e5] text-[#4a4a4a]">
                {filteredRecords.map((record) => (
                  <tr
                    key={record.id}
                    className="hover:bg-[#fcf8f7] transition-colors"
                  >
                    <td className="px-5 py-3">
                      <span className="font-semibold text-[#5a0000] block text-[13.5px]">
                        {record.businessName}
                      </span>
                      {record.ownerName && (
                        <span className="text-xs text-[#8a5a58] block">
                          {record.ownerName}
                          {record.ownerIdNumber && (
                            <span className="font-mono text-[10.5px] ml-1.5 text-[#8a5a58]">
                              • NIC: {record.ownerIdNumber}
                            </span>
                          )}
                        </span>
                      )}
                      <span className="font-mono text-[10px] text-[#8a5a58]">
                        {record.id}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[13px] whitespace-nowrap">
                      <span className="text-[#5a0000] font-medium block">
                        {record.businessType || "—"}
                      </span>
                      {record.categorySinhalaName && (
                        <span className="text-xs text-[#8a5a58] block mt-0.5">
                          {record.categorySinhalaName}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-[13px] whitespace-nowrap">{record.ward}</td>
                    <td className="px-5 py-3 text-[13px] whitespace-nowrap font-medium text-[#5a0000]">
                      FY {record.feeYear}
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-[13px] whitespace-nowrap">
                      {formatLKR(record.feeAmount)}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <PaymentStatusBadge status={record.status} />
                    </td>
                    <td className="px-5 py-3 text-[13px] text-[#8a5a58] whitespace-nowrap">
                      {formatDate(record.paymentDate)}
                    </td>
                    <td className="px-5 py-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setViewingRecord(record)}
                        className="inline-flex items-center gap-1 rounded border border-[#dcc6c4] bg-white px-2.5 py-1 text-xs font-semibold text-[#5a0000] hover:bg-[#f0e0df] transition-colors"
                        aria-label={`View details for ${record.businessName}`}
                      >
                        <span aria-hidden="true">👁️</span> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Table footer — data source note */}
        <div className="px-6 py-3 border-t border-[#f0e6e5] bg-[#fcf8f7] rounded-b-lg">
          <p className="text-[10.5px] text-[#8a5a58]">
            ⚠️ Displaying mock data for development. Connect to{" "}
            <code className="font-mono text-[10px]">
              GET /api/v1/garbage-fees/dashboard?year={selectedYear}
            </code>{" "}
            when the backend is available.
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* F. Register Business Modal Dialog                                    */}
      {/* ------------------------------------------------------------------ */}
      {isRegisterModalOpen && (
        <RegisterBusinessModal
          isOpen={isRegisterModalOpen}
          onClose={() => setIsRegisterModalOpen(false)}
          onSubmit={handleRegisterBusiness}
          nextRegistrationNumber={nextRegistrationNumber}
          defaultFeeYear={selectedYear}
        />
      )}

      {/* ------------------------------------------------------------------ */}
      {/* G. Business Record Details Modal                                     */}
      {/* ------------------------------------------------------------------ */}
      {viewingRecord && (
        <BusinessRecordDetailsModal
          record={viewingRecord}
          onClose={() => setViewingRecord(null)}
        />
      )}

      {/* ------------------------------------------------------------------ */}
      {/* H. Success Toast Notification                                        */}
      {/* ------------------------------------------------------------------ */}
      {toastMessage && (
        <SuccessToast
          message={toastMessage}
          onDismiss={() => setToastMessage(null)}
        />
      )}
    </div>
  );
}
