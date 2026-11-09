"use client";

/**
 * Annual Payment Records Page
 * Route: /garbage-fees/annual
 *
 * Implements:
 *  A. Page Header — title, subtitle, Select Year dropdown
 *  B. Annual Payment Summary Cards — Total Businesses, Paid Businesses, Unpaid Businesses, Total Collected
 *  C. Annual Payment Overview — visual progress bar and completion rate using CollectionSummary
 *  D. Search and Filter Section — search by business name, owner name, reg. number;
 *     filters for Payment Status, Business Type, and Business Status; Reset Filters button
 *  E. Annual Payment Records Table — 8 columns, badges, currency in LKR, pagination, empty state
 *  F. Optional Record Details Modal — read-only view of annual assessment and payment record details
 *
 * Data: Derived from existing Business Management (MOCK_BUSINESSES) and Payment Management
 *       (INITIAL_PAYMENT_RECORDS). One record per eligible business for the selected year.
 *       ⚠️ Temporary frontend state flow.
 *
 * Theme: Balangoda Urban Council brand colors (#5a0000, #800000, #fbbf24, #f0e0df, #dcc6c4).
 * Components: Reuses StatCard, PaymentStatusBadge, BusinessStatusBadge, CollectionSummary.
 */

import { useState, useMemo, useEffect } from "react";
import { StatCard } from "@/components/shared/StatCard";
import { PaymentStatusBadge } from "@/components/shared/PaymentStatusBadge";
import { BusinessStatusBadge } from "@/components/shared/BusinessStatusBadge";
import { CollectionSummary } from "@/components/shared/CollectionSummary";

import {
  MOCK_BUSINESSES,
  BUSINESS_TYPES,
  type Business,
} from "../business/mockData";

import {
  INITIAL_PAYMENT_RECORDS,
  AVAILABLE_PAYMENT_YEARS,
  DEFAULT_PAYMENT_YEAR,
  getEstablishedFee,
  type PaymentRecord,
} from "../payment/mockData";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
export interface AnnualRecordItem {
  businessId: string;
  registrationNumber: string;
  businessName: string;
  ownerName: string;
  businessType: string;
  feeYear: number;
  amount: number;
  paymentStatus: "paid" | "unpaid";
  paymentDate?: string;
  businessStatus: "active" | "inactive";
  receiptNumber?: string;
  notes?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const PAGE_SIZE = 8;

// ─────────────────────────────────────────────────────────────────────────────
// Utility Functions
// ─────────────────────────────────────────────────────────────────────────────
function formatLKR(amount: number): string {
  return `LKR ${amount.toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

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

/**
 * Builds annual records for all eligible businesses in the given year.
 * Matches with existing payment records or generates an unpaid fee obligation.
 */
function buildAnnualRecords(
  businesses: Business[],
  payments: PaymentRecord[],
  selectedYear: number
): AnnualRecordItem[] {
  // A business is eligible for selectedYear if registered on or before that year,
  // or if there is an explicit payment record for that year.
  const eligibleBusinesses = businesses.filter((b) => {
    const regYear = new Date(b.createdAt).getFullYear();
    const hasRecordInYear = payments.some(
      (p) => p.businessId === b.id && p.feeYear === selectedYear
    );
    return regYear <= selectedYear || hasRecordInYear;
  });

  return eligibleBusinesses.map((b) => {
    const payment = payments.find(
      (p) => p.businessId === b.id && p.feeYear === selectedYear
    );

    if (payment) {
      return {
        businessId: b.id,
        registrationNumber: b.registrationNumber,
        businessName: b.businessName,
        ownerName: b.ownerName,
        businessType: b.businessType,
        feeYear: selectedYear,
        amount: payment.amount,
        paymentStatus: payment.status,
        paymentDate: payment.paymentDate,
        businessStatus: b.status,
        receiptNumber: payment.receiptNumber,
        notes: payment.notes,
      };
    }

    // Default to unpaid obligation with the council established fee
    return {
      businessId: b.id,
      registrationNumber: b.registrationNumber,
      businessName: b.businessName,
      ownerName: b.ownerName,
      businessType: b.businessType,
      feeYear: selectedYear,
      amount: getEstablishedFee(b.id),
      paymentStatus: "unpaid",
      paymentDate: undefined,
      businessStatus: b.status,
      receiptNumber: undefined,
      notes: undefined,
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// File-Level Component: Empty State
// ─────────────────────────────────────────────────────────────────────────────
function EmptyState({
  filtered,
  onReset,
}: {
  filtered: boolean;
  onReset: () => void;
}) {
  return (
    <div className="py-16 text-center">
      <div className="w-14 h-14 rounded-full bg-[#f0e0df] text-[#5a0000] text-3xl grid place-items-center mx-auto mb-4">
        {filtered ? "🔍" : "📁"}
      </div>
      <p className="text-sm font-semibold text-[#5a0000] mb-1">
        {filtered ? "No records match your filters" : "No annual records found"}
      </p>
      <p className="text-xs text-[#8a5a58] max-w-[320px] mx-auto mb-4">
        {filtered
          ? "Try adjusting your search query, payment status, business type, or status filters."
          : "No registered businesses are currently eligible for this fee year."}
      </p>
      {filtered && (
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 rounded border border-[#dcc6c4] bg-white px-3 py-1.5 text-xs font-semibold text-[#5a0000] hover:bg-[#f0e0df] transition-colors"
        >
          Reset Filters
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// File-Level Component: Table Pagination
// ─────────────────────────────────────────────────────────────────────────────
function Pagination({
  total,
  page,
  pageSize,
  onPage,
}: {
  total: number;
  page: number;
  pageSize: number;
  onPage: (p: number) => void;
}) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-6 py-3 border-t border-[#f0e6e5] bg-[#fcf8f7] rounded-b-lg">
      <p className="text-[11px] text-[#8a5a58]">
        Showing page {page} of {totalPages} ({total} businesses total)
      </p>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
          className="px-2.5 py-1 rounded border border-[#dcc6c4] text-xs text-[#5a0000] bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#f0e0df] transition-colors"
          aria-label="Previous page"
        >
          ←
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPage(p)}
            className={`px-2.5 py-1 rounded border text-xs font-medium transition-colors ${
              p === page
                ? "border-[#800000] bg-[#800000] text-white"
                : "border-[#dcc6c4] bg-white text-[#5a0000] hover:bg-[#f0e0df]"
            }`}
            aria-label={`Page ${p}`}
            aria-current={p === page ? "page" : undefined}
          >
            {p}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onPage(page + 1)}
          disabled={page === totalPages}
          className="px-2.5 py-1 rounded border border-[#dcc6c4] text-xs text-[#5a0000] bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#f0e0df] transition-colors"
          aria-label="Next page"
        >
          →
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// File-Level Component: Details Modal (Read-Only)
// ─────────────────────────────────────────────────────────────────────────────
function ViewAnnualRecordModal({
  record,
  onClose,
}: {
  record: AnnualRecordItem;
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Annual record details for ${record.businessName}`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#1a0000]/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-lg rounded-xl bg-white border border-[#f0e6e5] shadow-[0_8px_32px_rgba(90,0,0,0.18)] overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-[#f0e6e5] bg-white">
          <div>
            <h3 className="font-serif text-[16px] text-[#5a0000]">
              Annual Assessment Record
            </h3>
            <p className="text-xs text-[#8a5a58] mt-0.5">
              Fiscal Year: <span className="font-bold text-[#5a0000]">FY {record.feeYear}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded hover:bg-[#f0e0df] text-[#8a5a58] hover:text-[#5a0000] transition-colors"
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-3.5">
          <div className="grid grid-cols-[160px_1fr] gap-2 text-sm">
            <span className="text-[#8a5a58] font-medium shrink-0">Registration Number</span>
            <span className="font-mono text-[13px] text-[#5a0000]">{record.registrationNumber}</span>
          </div>

          <div className="grid grid-cols-[160px_1fr] gap-2 text-sm">
            <span className="text-[#8a5a58] font-medium shrink-0">Business Name</span>
            <span className="font-semibold text-[#5a0000]">{record.businessName}</span>
          </div>

          <div className="grid grid-cols-[160px_1fr] gap-2 text-sm">
            <span className="text-[#8a5a58] font-medium shrink-0">Owner Name</span>
            <span>{record.ownerName}</span>
          </div>

          <div className="grid grid-cols-[160px_1fr] gap-2 text-sm">
            <span className="text-[#8a5a58] font-medium shrink-0">Business Type</span>
            <span>{record.businessType}</span>
          </div>

          <div className="grid grid-cols-[160px_1fr] gap-2 text-sm items-center">
            <span className="text-[#8a5a58] font-medium shrink-0">Business Status</span>
            <div>
              <BusinessStatusBadge status={record.businessStatus} />
            </div>
          </div>

          <div className="grid grid-cols-[160px_1fr] gap-2 text-sm">
            <span className="text-[#8a5a58] font-medium shrink-0">Annual Fee Amount</span>
            <span className="font-bold text-[#5a0000]">{formatLKR(record.amount)}</span>
          </div>

          <div className="grid grid-cols-[160px_1fr] gap-2 text-sm items-center">
            <span className="text-[#8a5a58] font-medium shrink-0">Payment Status</span>
            <div>
              <PaymentStatusBadge status={record.paymentStatus} />
            </div>
          </div>

          <div className="grid grid-cols-[160px_1fr] gap-2 text-sm">
            <span className="text-[#8a5a58] font-medium shrink-0">Payment Date</span>
            <span>{formatDate(record.paymentDate)}</span>
          </div>

          {record.receiptNumber && (
            <div className="grid grid-cols-[160px_1fr] gap-2 text-sm">
              <span className="text-[#8a5a58] font-medium shrink-0">Receipt Reference</span>
              <span className="font-mono text-[#5a0000] bg-[#faf4f3] px-2 py-0.5 rounded border border-[#f0e6e5] w-fit">
                {record.receiptNumber}
              </span>
            </div>
          )}

          {record.notes && (
            <div className="grid grid-cols-[160px_1fr] gap-2 text-sm">
              <span className="text-[#8a5a58] font-medium shrink-0">Remarks</span>
              <span className="text-[#555] bg-[#fcf8f7] p-2.5 rounded border border-[#f0e6e5] text-xs leading-relaxed">
                {record.notes}
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#f0e6e5] bg-[#fcf8f7] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded border border-[#dcc6c4] bg-white text-xs font-semibold text-[#5a0000] hover:bg-[#f0e0df] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page Component
// ─────────────────────────────────────────────────────────────────────────────
export default function AnnualPaymentRecordsPage() {
  // ── State ─────────────────────────────────────────────────────────────────
  const [selectedYear, setSelectedYear] = useState<number>(DEFAULT_PAYMENT_YEAR);
  const [search, setSearch] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<"all" | "paid" | "unpaid">("all");
  const [businessTypeFilter, setBusinessTypeFilter] = useState<string>("all");
  const [businessStatusFilter, setBusinessStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [page, setPage] = useState(1);
  const [selectedRecord, setSelectedRecord] = useState<AnnualRecordItem | null>(null);

  // ── Build all eligible annual records for selected year ───────────────────
  const annualRecords = useMemo(() => {
    return buildAnnualRecords(MOCK_BUSINESSES, INITIAL_PAYMENT_RECORDS, selectedYear);
  }, [selectedYear]);

  // ── Summary statistics for the selected year ──────────────────────────────
  const stats = useMemo(() => {
    const totalBusinesses = annualRecords.length;
    const paidRecords = annualRecords.filter((r) => r.paymentStatus === "paid");
    const paidBusinesses = paidRecords.length;
    const unpaidBusinesses = annualRecords.filter((r) => r.paymentStatus === "unpaid").length;
    const totalCollected = paidRecords.reduce((sum, r) => sum + r.amount, 0);

    return {
      totalBusinesses,
      paidBusinesses,
      unpaidBusinesses,
      totalCollected,
    };
  }, [annualRecords]);

  // ── Filtered Records for Table ────────────────────────────────────────────
  const filteredRecords = useMemo(() => {
    const q = search.trim().toLowerCase();
    return annualRecords.filter((r) => {
      const matchesSearch =
        !q ||
        r.businessName.toLowerCase().includes(q) ||
        r.ownerName.toLowerCase().includes(q) ||
        r.registrationNumber.toLowerCase().includes(q);

      const matchesPaymentStatus =
        paymentStatusFilter === "all" || r.paymentStatus === paymentStatusFilter;

      const matchesBusinessType =
        businessTypeFilter === "all" || r.businessType === businessTypeFilter;

      const matchesBusinessStatus =
        businessStatusFilter === "all" || r.businessStatus === businessStatusFilter;

      return (
        matchesSearch &&
        matchesPaymentStatus &&
        matchesBusinessType &&
        matchesBusinessStatus
      );
    });
  }, [
    annualRecords,
    search,
    paymentStatusFilter,
    businessTypeFilter,
    businessStatusFilter,
  ]);

  const paginatedRecords = useMemo(() => {
    return filteredRecords.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  }, [filteredRecords, page]);

  const hasActiveFilters =
    search.trim() !== "" ||
    paymentStatusFilter !== "all" ||
    businessTypeFilter !== "all" ||
    businessStatusFilter !== "all";

  // ── Change Handlers (Directly update page to 1 without useEffect) ─────────
  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    setPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const handlePaymentStatusChange = (val: "all" | "paid" | "unpaid") => {
    setPaymentStatusFilter(val);
    setPage(1);
  };

  const handleBusinessTypeChange = (val: string) => {
    setBusinessTypeFilter(val);
    setPage(1);
  };

  const handleBusinessStatusChange = (val: "all" | "active" | "inactive") => {
    setBusinessStatusFilter(val);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearch("");
    setPaymentStatusFilter("all");
    setBusinessTypeFilter("all");
    setBusinessStatusFilter("all");
    setPage(1);
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ──────────────────────────────────────────────────────────────────── */}
      {/* A. Page Header & Year Selector                                       */}
      {/* ──────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-[22px] text-[#5a0000] leading-tight">
            Annual Payment Records
          </h2>
          <p className="text-[13px] text-[#8a5a58] mt-1 max-w-[500px]">
            View and monitor annual garbage collection fee payment records of registered businesses.
          </p>
        </div>

        {/* Year Selector Dropdown */}
        <div className="flex items-center gap-2.5 bg-white px-3.5 py-1.5 rounded-lg border border-[#dcc6c4] shadow-xs">
          <label
            htmlFor="annual-year-select"
            className="text-[11px] font-bold uppercase tracking-wider text-[#8a5a58] whitespace-nowrap"
          >
            Select Year
          </label>
          <select
            id="annual-year-select"
            value={selectedYear}
            onChange={(e) => handleYearChange(Number(e.target.value))}
            className="bg-transparent text-sm font-bold text-[#5a0000] focus:outline-none cursor-pointer pr-1"
            aria-label="Select annual records year"
          >
            {AVAILABLE_PAYMENT_YEARS.map((y) => (
              <option key={y} value={y}>
                FY {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────── */}
      {/* B. Annual Payment Summary Cards                                      */}
      {/* ──────────────────────────────────────────────────────────────────── */}
      <section aria-label="Annual payment summary cards">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Businesses"
            value={stats.totalBusinesses}
            description="Businesses for the selected year"
            icon="🏪"
            variant="default"
          />
          <StatCard
            label="Paid Businesses"
            value={stats.paidBusinesses}
            description="Completed annual payments"
            icon="✅"
            variant="success"
          />
          <StatCard
            label="Unpaid Businesses"
            value={stats.unpaidBusinesses}
            description="Outstanding annual payments"
            icon="⏳"
            variant="warning"
          />
          <StatCard
            label="Total Fee Collected"
            value={formatLKR(stats.totalCollected)}
            description="Annual collection total"
            icon="💰"
            variant="revenue"
          />
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────── */}
      {/* C. Annual Payment Overview (Progress Bar & Rate)                     */}
      {/* ──────────────────────────────────────────────────────────────────── */}
      <CollectionSummary
        totalBusinesses={stats.totalBusinesses}
        paidBusinesses={stats.paidBusinesses}
        unpaidBusinesses={stats.unpaidBusinesses}
        totalCollected={stats.totalCollected}
        year={selectedYear}
      />

      {/* ──────────────────────────────────────────────────────────────────── */}
      {/* D. Search and Filter Section                                         */}
      {/* ──────────────────────────────────────────────────────────────────── */}
      <section
        className="bg-white rounded-lg border border-[#f0e6e5] shadow-[0_2px_10px_rgba(90,0,0,0.06)] p-4"
        aria-label="Search and filter annual payment records"
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:gap-4">
          {/* Search bar */}
          <div className="flex-1 min-w-0">
            <label
              htmlFor="annual-records-search"
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
                id="annual-records-search"
                type="search"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search by business name, owner name, or registration number..."
                className="w-full rounded border border-[#dcc6c4] bg-white pl-9 pr-8 py-2 text-sm text-[#4a4a4a] placeholder:text-[#c0a8a6] shadow-xs focus:outline-none focus:ring-2 focus:ring-[#800000]/30"
                aria-label="Search records"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => handleSearchChange("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8a5a58] hover:text-[#5a0000] text-xs p-0.5"
                  aria-label="Clear search query"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Payment Status Filter */}
          <div className="sm:min-w-[150px]">
            <label
              htmlFor="payment-status-filter"
              className="block text-[11px] font-semibold uppercase tracking-wider text-[#8a5a58] mb-1.5"
            >
              Payment Status
            </label>
            <select
              id="payment-status-filter"
              value={paymentStatusFilter}
              onChange={(e) =>
                handlePaymentStatusChange(e.target.value as "all" | "paid" | "unpaid")
              }
              className="w-full rounded border border-[#dcc6c4] bg-white px-3 py-2 text-sm text-[#5a0000] shadow-xs focus:outline-none focus:ring-2 focus:ring-[#800000]/30 cursor-pointer font-medium"
              aria-label="Filter by payment status"
            >
              <option value="all">All</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
            </select>
          </div>

          {/* Business Type Filter */}
          <div className="sm:min-w-[180px]">
            <label
              htmlFor="business-type-filter"
              className="block text-[11px] font-semibold uppercase tracking-wider text-[#8a5a58] mb-1.5"
            >
              Business Type
            </label>
            <select
              id="business-type-filter"
              value={businessTypeFilter}
              onChange={(e) => handleBusinessTypeChange(e.target.value)}
              className="w-full rounded border border-[#dcc6c4] bg-white px-3 py-2 text-sm text-[#5a0000] shadow-xs focus:outline-none focus:ring-2 focus:ring-[#800000]/30 cursor-pointer font-medium"
              aria-label="Filter by business type"
            >
              <option value="all">All Types</option>
              {BUSINESS_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Business Status Filter */}
          <div className="sm:min-w-[150px]">
            <label
              htmlFor="business-status-filter"
              className="block text-[11px] font-semibold uppercase tracking-wider text-[#8a5a58] mb-1.5"
            >
              Business Status
            </label>
            <select
              id="business-status-filter"
              value={businessStatusFilter}
              onChange={(e) =>
                handleBusinessStatusChange(e.target.value as "all" | "active" | "inactive")
              }
              className="w-full rounded border border-[#dcc6c4] bg-white px-3 py-2 text-sm text-[#5a0000] shadow-xs focus:outline-none focus:ring-2 focus:ring-[#800000]/30 cursor-pointer font-medium"
              aria-label="Filter by business status"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Reset Filters button */}
          {hasActiveFilters && (
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleResetFilters}
                className="whitespace-nowrap rounded border border-[#dcc6c4] bg-white px-3 py-2 text-xs font-semibold text-[#5a0000] hover:bg-[#f0e0df] transition-colors"
                aria-label="Reset all search filters"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────── */}
      {/* E. Annual Payment Records Table                                      */}
      {/* ──────────────────────────────────────────────────────────────────── */}
      <section
        className="bg-white rounded-lg border border-[#f0e6e5] shadow-[0_2px_10px_rgba(90,0,0,0.08)]"
        aria-label="Annual payment records table"
      >
        {/* Table header bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0e6e5]">
          <div>
            <h3 className="font-serif text-[15px] text-[#5a0000]">
              Registered Business Annual Records — FY {selectedYear}
            </h3>
            <p className="text-[11.5px] text-[#8a5a58] mt-0.5">
              {hasActiveFilters
                ? `Showing ${filteredRecords.length} matching business record${
                    filteredRecords.length !== 1 ? "s" : ""
                  }`
                : `${annualRecords.length} eligible registered business${
                    annualRecords.length !== 1 ? "es" : ""
                  } in FY ${selectedYear}`}
            </p>
          </div>
        </div>

        {/* Table Content */}
        {paginatedRecords.length === 0 ? (
          <EmptyState
            filtered={hasActiveFilters}
            onReset={handleResetFilters}
          />
        ) : (
          <div className="overflow-x-auto">
            <table
              className="min-w-full divide-y divide-[#f0e6e5] text-left text-sm"
              aria-label={`Annual payment records for fiscal year ${selectedYear}`}
            >
              <thead className="bg-[#fcf8f7] text-[11px] uppercase font-semibold text-[#8a5a58]">
                <tr>
                  <th scope="col" className="px-5 py-3 whitespace-nowrap">
                    Registration No.
                  </th>
                  <th scope="col" className="px-5 py-3 whitespace-nowrap">
                    Business Name
                  </th>
                  <th scope="col" className="px-5 py-3 whitespace-nowrap">
                    Owner Name
                  </th>
                  <th scope="col" className="px-5 py-3 whitespace-nowrap">
                    Business Type
                  </th>
                  <th scope="col" className="px-5 py-3 whitespace-nowrap text-right">
                    Annual Fee (LKR)
                  </th>
                  <th scope="col" className="px-5 py-3 whitespace-nowrap">
                    Payment Status
                  </th>
                  <th scope="col" className="px-5 py-3 whitespace-nowrap">
                    Payment Date
                  </th>
                  <th scope="col" className="px-5 py-3 whitespace-nowrap">
                    Business Status
                  </th>
                  <th scope="col" className="px-5 py-3 whitespace-nowrap text-right">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0e6e5] text-[#4a4a4a]">
                {paginatedRecords.map((record) => (
                  <tr
                    key={record.businessId}
                    className="hover:bg-[#fcf8f7] transition-colors"
                  >
                    {/* 1. Registration Number */}
                    <td className="px-5 py-3">
                      <span className="font-mono text-[11px] text-[#8a5a58] whitespace-nowrap">
                        {record.registrationNumber}
                      </span>
                    </td>

                    {/* 2. Business Name */}
                    <td className="px-5 py-3">
                      <span className="font-semibold text-[13px] text-[#5a0000] whitespace-nowrap">
                        {record.businessName}
                      </span>
                    </td>

                    {/* 3. Owner Name */}
                    <td className="px-5 py-3 text-[13px] whitespace-nowrap">
                      {record.ownerName}
                    </td>

                    {/* 4. Business Type */}
                    <td className="px-5 py-3">
                      <span className="text-[12px] text-[#8a5a58] whitespace-nowrap">
                        {record.businessType}
                      </span>
                    </td>

                    {/* 5. Annual Fee Amount (LKR) */}
                    <td className="px-5 py-3 text-right font-medium text-[13px] whitespace-nowrap">
                      {formatLKR(record.amount)}
                    </td>

                    {/* 6. Payment Status Badge */}
                    <td className="px-5 py-3 whitespace-nowrap">
                      <PaymentStatusBadge status={record.paymentStatus} />
                    </td>

                    {/* 7. Payment Date */}
                    <td className="px-5 py-3 text-[13px] text-[#8a5a58] whitespace-nowrap">
                      {formatDate(record.paymentDate)}
                    </td>

                    {/* 8. Business Status Badge */}
                    <td className="px-5 py-3 whitespace-nowrap">
                      <BusinessStatusBadge status={record.businessStatus} />
                    </td>

                    {/* Details Action Button */}
                    <td className="px-5 py-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setSelectedRecord(record)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#5a0000] bg-white border border-[#dcc6c4] rounded hover:bg-[#f0e0df] transition-colors"
                        aria-label={`View record details for ${record.businessName}`}
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

        {/* Pagination Bar */}
        <Pagination
          total={filteredRecords.length}
          page={page}
          pageSize={PAGE_SIZE}
          onPage={setPage}
        />

        {/* Footer Note */}
        <div className="px-6 py-3 border-t border-[#f0e6e5] bg-[#fcf8f7] rounded-b-lg">
          <p className="text-[10.5px] text-[#8a5a58]">
            ⚠️ Displaying municipal annual assessment records for FY {selectedYear}. Connect to{" "}
            <code className="font-mono text-[10px]">
              GET /api/v1/garbage-fees/annual-records?year={selectedYear}
            </code>{" "}
            when the backend integration is available.
          </p>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────── */}
      {/* F. Record Details Modal (Read-Only)                                  */}
      {/* ──────────────────────────────────────────────────────────────────── */}
      {selectedRecord && (
        <ViewAnnualRecordModal
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      )}
    </div>
  );
}
