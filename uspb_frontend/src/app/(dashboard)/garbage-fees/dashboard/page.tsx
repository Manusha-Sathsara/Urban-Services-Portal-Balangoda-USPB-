"use client";

/**
 * Garbage Collection Fee Management Dashboard
 * Route: /garbage-fees/dashboard
 *
 * Implements:
 *  A. Page Header — title, subtitle, year selector, Add New Business button
 *  B. Summary Cards — Total Businesses, Paid, Unpaid, Total Collected
 *  C. Annual Fee Collection Summary — progress bar + summary figures
 *  D. Business Payment Activity Table — compact table of recent records
 *
 * Data: Uses isolated mock data (mockData.ts) — replace with API calls when ready.
 * Theme: Reuses landing page brand colors (#5a0000, #800000, #fbbf24, #f0e0df).
 * Components: Reuses StatCard, PaymentStatusBadge, CollectionSummary from shared/.
 */

import { useState, useMemo } from "react";
import { StatCard } from "@/components/shared/StatCard";
import { PaymentStatusBadge } from "@/components/shared/PaymentStatusBadge";
import { CollectionSummary } from "@/components/shared/CollectionSummary";
import {
  MOCK_BUSINESS_RECORDS,
  AVAILABLE_YEARS,
  DEFAULT_YEAR,
  computeDashboardStats,
} from "./mockData";

// ---------------------------------------------------------------------------
// Utility: format amount as LKR
// ---------------------------------------------------------------------------
function formatLKR(amount: number): string {
  return `LKR ${amount.toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// ---------------------------------------------------------------------------
// Utility: format ISO date to a readable string
// ---------------------------------------------------------------------------
function formatDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Component: Year Selector
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
        className="rounded border border-[#dcc6c4] bg-white px-3 py-1.5 text-sm font-medium text-[#5a0000] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#800000]/30 cursor-pointer"
        aria-label="Select fee year"
      >
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component: Empty State (shown when no records exist)
// ---------------------------------------------------------------------------
function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-12 text-center">
      <div className="w-12 h-12 rounded-full bg-[#f0e0df] text-[#5a0000] text-2xl grid place-items-center mx-auto mb-3">
        📋
      </div>
      <p className="text-sm text-[#8a5a58]">{message}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Dashboard Page
// ---------------------------------------------------------------------------
export default function GarbageFeeDashboardPage() {
  const [selectedYear, setSelectedYear] = useState<number>(DEFAULT_YEAR);

  // Derive stats and filtered records from mock data (swap with API call later)
  const stats = useMemo(
    () => computeDashboardStats(MOCK_BUSINESS_RECORDS, selectedYear),
    [selectedYear]
  );

  const yearRecords = useMemo(
    () => MOCK_BUSINESS_RECORDS.filter((r) => r.feeYear === selectedYear),
    [selectedYear]
  );

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
            Manage business registrations and track annual garbage collection
            fees.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <YearSelector
            years={AVAILABLE_YEARS}
            selected={selectedYear}
            onChange={setSelectedYear}
          />
          {/*
           * "Add New Business" — route not yet confirmed in the existing project.
           * Button is intentionally kept without an href until the route exists.
           */}
          <button
            type="button"
            id="add-new-business-btn"
            className="btn-hover-fx inline-flex items-center gap-1.5 rounded bg-[#800000] px-4 py-2 text-[13px] font-semibold text-white shadow-sm hover:bg-[#5a0000]"
            aria-label="Add new business registration"
          >
            <span aria-hidden="true">+</span> Add New Business
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
      {/* D. Business Payment Activity Table                                   */}
      {/* ------------------------------------------------------------------ */}
      <section className="bg-white rounded-lg border border-[#f0e6e5] shadow-[0_2px_10px_rgba(90,0,0,0.08)]">
        {/* Table header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0e6e5]">
          <div>
            <h3 className="font-serif text-[15px] text-[#5a0000]">
              Business Payment Records
            </h3>
            <p className="text-[11.5px] text-[#8a5a58] mt-0.5">
              Annual fee payment status for all registered businesses — FY{" "}
              {selectedYear}
            </p>
          </div>
          <span className="text-[11px] font-semibold text-[#8a5a58]">
            {yearRecords.length} record{yearRecords.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Table */}
        {yearRecords.length === 0 ? (
          <EmptyState
            message={`No business records found for fee year ${selectedYear}.`}
          />
        ) : (
          <div className="overflow-x-auto">
            <table
              className="min-w-full divide-y divide-[#f0e6e5] text-left text-sm"
              aria-label={`Business payment records for ${selectedYear}`}
            >
              <thead className="bg-[#fcf8f7] text-xs uppercase font-semibold text-[#8a5a58]">
                <tr>
                  <th scope="col" className="px-5 py-3">
                    Business Name
                  </th>
                  <th scope="col" className="px-5 py-3">
                    Ward
                  </th>
                  <th scope="col" className="px-5 py-3">
                    Fee Year
                  </th>
                  <th scope="col" className="px-5 py-3 text-right">
                    Fee Amount
                  </th>
                  <th scope="col" className="px-5 py-3">
                    Status
                  </th>
                  <th scope="col" className="px-5 py-3">
                    Payment Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0e6e5] text-[#4a4a4a]">
                {yearRecords.map((record) => (
                  <tr
                    key={record.id}
                    className="hover:bg-[#fcf8f7] transition-colors"
                  >
                    <td className="px-5 py-3">
                      <span className="font-medium text-[#5a0000]">
                        {record.businessName}
                      </span>
                      <br />
                      <span className="font-mono text-[10px] text-[#8a5a58]">
                        {record.id}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[13px]">{record.ward}</td>
                    <td className="px-5 py-3 text-[13px]">{record.feeYear}</td>
                    <td className="px-5 py-3 text-right font-medium text-[13px]">
                      {formatLKR(record.feeAmount)}
                    </td>
                    <td className="px-5 py-3">
                      <PaymentStatusBadge status={record.status} />
                    </td>
                    <td className="px-5 py-3 text-[13px] text-[#8a5a58]">
                      {formatDate(record.paymentDate)}
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
    </div>
  );
}
