"use client";

import React from "react";
import {
  Calendar,
  Filter,
  RotateCcw,
  School as SchoolIcon,
  FileSpreadsheet,
  CheckCircle2,
  X,
  SlidersHorizontal,
} from "lucide-react";

export interface SchoolOption {
  id: number;
  name: string;
  code?: string;
}

export interface FinancialFilterState {
  school_id?: number;
  status: string;
  start_date: string;
  end_date: string;
  report_type: string;
}

export interface FinancialFiltersProps {
  draftFilters: FinancialFilterState;
  appliedFilters: FinancialFilterState;
  schools: SchoolOption[];
  onDraftChange: <K extends keyof FinancialFilterState>(
    key: K,
    value: FinancialFilterState[K]
  ) => void;
  onApply: () => void;
  onReset: () => void;
  onRemoveFilter?: (key: keyof FinancialFilterState) => void;
  isLoading?: boolean;
}

const REPORT_TYPE_LABELS: Record<string, string> = {
  consolidated: "Consolidated Council Overview",
  school_settlement: "School Settlement Statements",
  material_valuation: "Material Stream Valuation",
  disbursement_ledger: "Disbursement Audit Ledger",
};

const STATUS_LABELS: Record<string, string> = {
  all: "All Payout Statuses",
  settled: "Fully Settled",
  partial: "Partially Disbursed",
  pending: "Pending First Disbursement",
};

export function FinancialFilters({
  draftFilters,
  appliedFilters,
  schools,
  onDraftChange,
  onApply,
  onReset,
  onRemoveFilter,
  isLoading = false,
}: FinancialFiltersProps) {
  // Count active applied filters (deviating from defaults)
  const activeCount = [
    Boolean(appliedFilters.school_id),
    appliedFilters.status !== "all",
    Boolean(appliedFilters.start_date),
    Boolean(appliedFilters.end_date),
    appliedFilters.report_type !== "consolidated",
  ].filter(Boolean).length;

  // Selected school name lookup
  const selectedSchool = schools.find((s) => s.id === appliedFilters.school_id);

  // Preset date helper
  const handlePresetNovember2026 = () => {
    onDraftChange("start_date", "2026-11-01");
    onDraftChange("end_date", "2026-11-30");
  };

  const handlePresetAllTime = () => {
    onDraftChange("start_date", "");
    onDraftChange("end_date", "");
  };

  return (
    <div className="rounded-xl border border-stone-200 bg-white shadow-2xs overflow-hidden transition-all">
      {/* 1. Header with Badge & Presets */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-200 bg-stone-50/80 px-4 py-3 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#800000]/10 text-[#800000]">
            <SlidersHorizontal className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
              Financial Report Filters & Scope
            </h2>
            <p className="text-[11px] text-stone-500">
              Isolate fiscal performance by date range, educational institution, perspective, and payout status
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {activeCount > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#800000] px-2.5 py-0.5 text-[10px] font-bold text-white shadow-2xs">
              <Filter className="h-3 w-3" />
              {activeCount} {activeCount === 1 ? "Filter Active" : "Filters Active"}
            </span>
          ) : (
            <span className="rounded-full bg-stone-200/80 px-2.5 py-0.5 text-[10px] font-semibold text-stone-600">
              Showing All Records
            </span>
          )}

          {/* Quick Date Presets */}
          <div className="hidden md:flex items-center gap-1 pl-2 border-l border-stone-200 text-[11px]">
            <span className="text-stone-400 text-[10px] font-semibold uppercase">Presets:</span>
            <button
              type="button"
              onClick={handlePresetNovember2026}
              className="px-2 py-0.5 rounded border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 text-[10px] font-medium transition-colors cursor-pointer"
            >
              Nov 2026
            </button>
            <button
              type="button"
              onClick={handlePresetAllTime}
              className="px-2 py-0.5 rounded border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 text-[10px] font-medium transition-colors cursor-pointer"
            >
              All Time
            </button>
          </div>
        </div>
      </div>

      {/* 2. Filter Inputs Grid */}
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Filter 1: Date Range (Start & End) */}
          <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
            <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-stone-600">
              <Calendar className="h-3.5 w-3.5 text-stone-400" />
              Date Range (Period)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <input
                  type="date"
                  aria-label="Start Date"
                  value={draftFilters.start_date}
                  onChange={(e) => onDraftChange("start_date", e.target.value)}
                  className="w-full rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-xs text-stone-800 focus:border-[#800000] focus:outline-none focus:ring-1 focus:ring-[#800000] transition-colors"
                  placeholder="From"
                />
                <span className="block text-[9px] text-stone-400 mt-0.5 pl-0.5">Start Date</span>
              </div>
              <div>
                <input
                  type="date"
                  aria-label="End Date"
                  value={draftFilters.end_date}
                  onChange={(e) => onDraftChange("end_date", e.target.value)}
                  className="w-full rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-xs text-stone-800 focus:border-[#800000] focus:outline-none focus:ring-1 focus:ring-[#800000] transition-colors"
                  placeholder="To"
                />
                <span className="block text-[9px] text-stone-400 mt-0.5 pl-0.5">End Date</span>
              </div>
            </div>
          </div>

          {/* Filter 2: Balangoda School Selector */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-stone-600">
              <SchoolIcon className="h-3.5 w-3.5 text-stone-400" />
              Participating School
            </label>
            <select
              aria-label="Select School"
              value={draftFilters.school_id ? String(draftFilters.school_id) : ""}
              onChange={(e) =>
                onDraftChange(
                  "school_id",
                  e.target.value ? Number(e.target.value) : undefined
                )
              }
              className="w-full rounded-lg border border-stone-300 bg-white px-2.5 py-2 text-xs text-stone-800 focus:border-[#800000] focus:outline-none focus:ring-1 focus:ring-[#800000] transition-colors cursor-pointer"
            >
              <option value="">All Balangoda Schools (All 5)</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.code ? `(${s.code})` : ""}
                </option>
              ))}
            </select>
            <span className="block text-[9px] text-stone-400 pl-0.5">
              Select specific educational institution
            </span>
          </div>

          {/* Filter 3: Report Perspective / Type */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-stone-600">
              <FileSpreadsheet className="h-3.5 w-3.5 text-stone-400" />
              Report Type / Perspective
            </label>
            <select
              aria-label="Select Report Type"
              value={draftFilters.report_type}
              onChange={(e) => onDraftChange("report_type", e.target.value)}
              className="w-full rounded-lg border border-stone-300 bg-white px-2.5 py-2 text-xs text-stone-800 focus:border-[#800000] focus:outline-none focus:ring-1 focus:ring-[#800000] transition-colors cursor-pointer"
            >
              <option value="consolidated">Consolidated Council Overview</option>
              <option value="school_settlement">School Settlement Statements</option>
              <option value="material_valuation">Material Stream Valuation</option>
              <option value="disbursement_ledger">Disbursement Audit Ledger</option>
            </select>
            <span className="block text-[9px] text-stone-400 pl-0.5">
              Fiscal perspective & aggregation scope
            </span>
          </div>

          {/* Filter 4: Payout Settlement Status */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-stone-600">
              <CheckCircle2 className="h-3.5 w-3.5 text-stone-400" />
              Payout Settlement Status
            </label>
            <select
              aria-label="Select Settlement Status"
              value={draftFilters.status}
              onChange={(e) => onDraftChange("status", e.target.value)}
              className="w-full rounded-lg border border-stone-300 bg-white px-2.5 py-2 text-xs text-stone-800 focus:border-[#800000] focus:outline-none focus:ring-1 focus:ring-[#800000] transition-colors cursor-pointer"
            >
              <option value="all">All Payout Statuses</option>
              <option value="settled">Fully Settled (100% Disbursed)</option>
              <option value="partial">Partially Disbursed (Pending Balance)</option>
              <option value="pending">Pending First Disbursement</option>
            </select>
            <span className="block text-[9px] text-stone-400 pl-0.5">
              Municipal disbursement state
            </span>
          </div>
        </div>

        {/* 3. Actions Row: Apply Filters & Reset Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-2 border-t border-stone-100 gap-2.5">
          <div className="text-[11px] text-stone-500 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>Interactive demonstration dataset responds in real time upon applying</span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Reset Filters Button */}
            <button
              type="button"
              onClick={onReset}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 shadow-2xs hover:bg-stone-50 hover:text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-300 disabled:opacity-50 transition-colors cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5 text-stone-500" />
              Reset Filters
            </button>

            {/* Apply Filters Button */}
            <button
              type="button"
              onClick={onApply}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#800000] px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-[#680000] focus:outline-none focus:ring-2 focus:ring-[#800000] focus:ring-offset-1 disabled:opacity-50 transition-colors cursor-pointer"
            >
              <Filter className="h-3.5 w-3.5 text-white" />
              {isLoading ? "Applying..." : "Apply Filters"}
            </button>
          </div>
        </div>

        {/* 4. Active Filter Tags / Chips */}
        {activeCount > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-stone-100 text-xs">
            <span className="text-[11px] font-semibold text-stone-500 mr-1">Active Criteria:</span>

            {selectedSchool && (
              <span className="inline-flex items-center gap-1 rounded-md bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-800 border border-stone-200">
                School: <strong className="font-semibold">{selectedSchool.name}</strong>
                {onRemoveFilter && (
                  <button
                    type="button"
                    onClick={() => onRemoveFilter("school_id")}
                    className="hover:text-red-700 ml-0.5 cursor-pointer"
                    title="Remove school filter"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </span>
            )}

            {appliedFilters.status !== "all" && (
              <span className="inline-flex items-center gap-1 rounded-md bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-800 border border-stone-200">
                Status: <strong className="font-semibold">{STATUS_LABELS[appliedFilters.status] || appliedFilters.status}</strong>
                {onRemoveFilter && (
                  <button
                    type="button"
                    onClick={() => onRemoveFilter("status")}
                    className="hover:text-red-700 ml-0.5 cursor-pointer"
                    title="Remove status filter"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </span>
            )}

            {appliedFilters.start_date && (
              <span className="inline-flex items-center gap-1 rounded-md bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-800 border border-stone-200">
                From: <strong className="font-semibold">{appliedFilters.start_date}</strong>
                {onRemoveFilter && (
                  <button
                    type="button"
                    onClick={() => onRemoveFilter("start_date")}
                    className="hover:text-red-700 ml-0.5 cursor-pointer"
                    title="Remove start date filter"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </span>
            )}

            {appliedFilters.end_date && (
              <span className="inline-flex items-center gap-1 rounded-md bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-800 border border-stone-200">
                To: <strong className="font-semibold">{appliedFilters.end_date}</strong>
                {onRemoveFilter && (
                  <button
                    type="button"
                    onClick={() => onRemoveFilter("end_date")}
                    className="hover:text-red-700 ml-0.5 cursor-pointer"
                    title="Remove end date filter"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </span>
            )}

            {appliedFilters.report_type !== "consolidated" && (
              <span className="inline-flex items-center gap-1 rounded-md bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-800 border border-stone-200">
                Perspective: <strong className="font-semibold">{REPORT_TYPE_LABELS[appliedFilters.report_type]}</strong>
                {onRemoveFilter && (
                  <button
                    type="button"
                    onClick={() => onRemoveFilter("report_type")}
                    className="hover:text-red-700 ml-0.5 cursor-pointer"
                    title="Reset to Consolidated"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </span>
            )}

            <button
              type="button"
              onClick={onReset}
              className="text-[11px] font-semibold text-[#800000] hover:underline ml-1 cursor-pointer"
            >
              Clear All
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
