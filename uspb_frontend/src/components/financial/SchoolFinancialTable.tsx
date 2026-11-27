"use client";

import React from "react";
import { SchoolFinancialStatement } from "@/types";
import {
  Search,
  RotateCcw,
  School as SchoolIcon,
  ChevronLeft,
  ChevronRight,
  X,
  FileText,
  AlertCircle,
  Coins,
  Sparkles,
  CheckCircle2,
  Clock,
  Phone,
  User,
  Download,
} from "lucide-react";

// Currency formatter
function formatLKR(amount: number): string {
  return `LKR ${amount.toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export interface SchoolFinancialTableProps {
  records: SchoolFinancialStatement[];
  isLoading: boolean;
  search: string;
  onSearchChange: (val: string) => void;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (p: number) => void;
  onRefresh: () => void;
  onViewStatement?: (statement: SchoolFinancialStatement) => void;
  onExportCsv?: () => void;
}

export function SchoolFinancialTable({
  records,
  isLoading,
  search,
  onSearchChange,
  currentPage,
  totalPages,
  totalCount,
  onPageChange,
  onRefresh,
  onViewStatement,
  onExportCsv,
}: SchoolFinancialTableProps) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white shadow-2xs overflow-hidden">
      {/* 1. Table Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-200 bg-stone-50/70 p-4 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#800000]/10 text-[#800000]">
            <SchoolIcon className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-stone-900 font-serif">
              School-wise Financial Report Statements
            </h3>
            <p className="text-[11px] text-stone-500">
              Institutional breakdown of recyclable waste volumes, earned rewards, payouts, and pending balances
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Keyword Search */}
          <div className="relative w-full sm:w-64">
            <span
              className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-stone-400 pointer-events-none"
              aria-hidden="true"
            >
              <Search className="h-3.5 w-3.5" />
            </span>
            <input
              type="text"
              placeholder="Search by school or code..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full rounded-lg border border-stone-300 bg-white py-1.5 pl-8 pr-7 text-xs text-stone-900 placeholder:text-stone-400 focus:border-[#800000] focus:outline-none focus:ring-1 focus:ring-[#800000] transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="absolute inset-y-0 right-0 flex items-center pr-2 text-stone-400 hover:text-stone-600 cursor-pointer"
                title="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {onExportCsv && (
            <button
              type="button"
              onClick={onExportCsv}
              title="Export School Statements CSV"
              className="inline-flex items-center justify-center rounded-lg border border-stone-200 bg-white p-2 text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors cursor-pointer shrink-0"
            >
              <Download className="h-3.5 w-3.5 text-stone-600" />
            </button>
          )}

          <button
            type="button"
            onClick={onRefresh}
            title="Refresh school financial statements"
            className="inline-flex items-center justify-center rounded-lg border border-stone-200 bg-white p-2 text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors cursor-pointer shrink-0"
          >
            <RotateCcw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* 2. Table Data */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-stone-600">
          <thead className="border-b border-stone-200 bg-stone-50 text-[10px] font-bold uppercase tracking-wider text-stone-500">
            <tr>
              <th scope="col" className="px-4 py-3">
                School Institution
              </th>
              <th scope="col" className="px-3 py-3 text-right">
                Waste Diverted
              </th>
              <th scope="col" className="px-3 py-3 text-right">
                Points Earned
              </th>
              <th scope="col" className="px-3 py-3 text-right">
                Total Value
              </th>
              <th scope="col" className="px-3 py-3 text-right">
                Disbursed
              </th>
              <th scope="col" className="px-3 py-3 text-right">
                Pending Balance
              </th>
              <th scope="col" className="px-3 py-3 text-center">
                Settlement Status
              </th>
              <th scope="col" className="px-3 py-3 text-center">
                Last Collection
              </th>
              <th scope="col" className="px-4 py-3 text-center">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 bg-white">
            {isLoading ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-stone-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <RotateCcw className="h-5 w-5 animate-spin text-[#800000]" />
                    <span className="text-xs font-medium">Loading school financial statements...</span>
                  </div>
                </td>
              </tr>
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-10 text-center text-stone-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <AlertCircle className="h-6 w-6 text-stone-400" />
                    <p className="font-semibold text-stone-800 text-xs">No school financial records found</p>
                    <p className="text-[11px] text-stone-400">
                      No records match the active search or filter criteria.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              records.map((school) => {
                const isFullySettled = school.settlement_status === "settled";
                const isPartial = school.settlement_status === "partial";

                return (
                  <tr
                    key={school.school_id}
                    className="hover:bg-stone-50/80 transition-colors"
                  >
                    {/* School Info */}
                    <td className="px-4 py-3.5">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-stone-700 border border-stone-200">
                            {school.school_code}
                          </span>
                          <span className="font-bold text-stone-900 text-xs hover:text-[#800000] transition-colors">
                            {school.school_name}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-stone-500 pt-0.5">
                          {school.principal_name && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3 text-stone-400" />
                              {school.principal_name}
                            </span>
                          )}
                          {school.contact_number && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3 text-stone-400" />
                              {school.contact_number}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Waste Diverted */}
                    <td className="px-3 py-3.5 text-right font-medium text-stone-900">
                      <span>{school.total_collections_kg.toLocaleString("en-LK")}</span>
                      <span className="text-[10px] text-stone-500 ml-1">kg</span>
                    </td>

                    {/* Points Earned */}
                    <td className="px-3 py-3.5 text-right font-medium text-stone-900 font-mono">
                      <span className="inline-flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-amber-600" />
                        {school.total_points_earned.toLocaleString("en-LK")}
                      </span>
                    </td>

                    {/* Total Value */}
                    <td className="px-3 py-3.5 text-right font-semibold text-stone-900 font-mono">
                      {formatLKR(school.total_value_lkr)}
                    </td>

                    {/* Disbursed */}
                    <td className="px-3 py-3.5 text-right font-semibold text-emerald-700 font-mono">
                      {formatLKR(school.total_disbursed_lkr)}
                    </td>

                    {/* Pending Balance */}
                    <td className="px-3 py-3.5 text-right font-semibold font-mono">
                      <span className={school.pending_balance_lkr > 0 ? "text-amber-800" : "text-stone-400"}>
                        {formatLKR(school.pending_balance_lkr)}
                      </span>
                    </td>

                    {/* Settlement Status */}
                    <td className="px-3 py-3.5 text-center">
                      {isFullySettled ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          Fully Settled
                        </span>
                      ) : isPartial ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
                          <Clock className="h-3 w-3 text-amber-600" />
                          Partially Settled
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-800 border border-rose-200">
                          <AlertCircle className="h-3 w-3 text-rose-600" />
                          Pending Payout
                        </span>
                      )}
                    </td>

                    {/* Last Collection Date */}
                    <td className="px-3 py-3.5 text-center text-[11px] text-stone-500 font-mono">
                      {school.last_collection_date || "—"}
                    </td>

                    {/* Action */}
                    <td className="px-4 py-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => onViewStatement && onViewStatement(school)}
                        className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-stone-700 hover:bg-stone-50 hover:text-[#800000] hover:border-[#800000]/30 transition-colors cursor-pointer"
                        title="View Detailed School Financial Statement"
                      >
                        <FileText className="h-3.5 w-3.5 text-[#800000]" />
                        <span>Statement</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 3. Table Pagination Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t border-stone-200 bg-stone-50/70 px-4 py-3 text-xs text-stone-500 gap-2">
        <div className="flex items-center gap-2">
          <span>
            Showing <strong className="text-stone-800 font-semibold">{records.length}</strong> of{" "}
            <strong className="text-stone-800 font-semibold">{totalCount}</strong> participating schools
          </span>
          {search && (
            <span className="text-[10px] bg-stone-200 text-stone-700 px-1.5 py-0.5 rounded">
              Search filtered
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1 || isLoading}
            className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-xs font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Prev
          </button>
          <span className="px-2 text-[11px] font-semibold text-stone-700">
            Page {currentPage} of {Math.max(1, totalPages)}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages || isLoading}
            className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-xs font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            Next
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
