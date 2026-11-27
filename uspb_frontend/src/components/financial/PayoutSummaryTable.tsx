"use client";

import React from "react";
import { DisbursementRecord } from "@/types";
import {
  Search,
  RotateCcw,
  Receipt,
  ChevronLeft,
  ChevronRight,
  X,
  CreditCard,
  Building2,
  FileCheck2,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  Calendar,
  UserCheck,
  Download,
  FileText,
} from "lucide-react";

// Currency formatter
function formatLKR(amount: number): string {
  return `LKR ${amount.toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export interface PayoutSummaryTableProps {
  disbursements: DisbursementRecord[];
  isLoading: boolean;
  search: string;
  onSearchChange: (val: string) => void;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (p: number) => void;
  onRefresh: () => void;
  onViewVoucher?: (voucher: DisbursementRecord) => void;
  onExportCsv?: () => void;
}

export function PayoutSummaryTable({
  disbursements,
  isLoading,
  search,
  onSearchChange,
  currentPage,
  totalPages,
  totalCount,
  onPageChange,
  onRefresh,
  onViewVoucher,
  onExportCsv,
}: PayoutSummaryTableProps) {
  // Compute sum of shown disbursements
  const totalDisbursedSum = disbursements.reduce((acc, d) => acc + d.amount_lkr, 0);

  return (
    <div className="rounded-xl border border-stone-200 bg-white shadow-2xs overflow-hidden">
      {/* 1. Table Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-200 bg-stone-50/70 p-4 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#800000]/10 text-[#800000]">
            <Receipt className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-stone-900 font-serif">
                Payout Statement & Voucher Audit Ledger
              </h3>
              <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold border border-emerald-200">
                {totalCount} Vouchers Recorded
              </span>
            </div>
            <p className="text-[11px] text-stone-500">
              Audit ledger of council-approved disbursements, payment modalities, and points redemption vouchers
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
              placeholder="Search voucher, school, ref..."
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
              title="Export Vouchers CSV"
              className="inline-flex items-center justify-center rounded-lg border border-stone-200 bg-white p-2 text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors cursor-pointer shrink-0"
            >
              <Download className="h-3.5 w-3.5 text-stone-600" />
            </button>
          )}

          <button
            type="button"
            onClick={onRefresh}
            title="Refresh payout disbursements"
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
              <th scope="col" className="px-3.5 py-3 whitespace-nowrap">
                Voucher Reference
              </th>
              <th scope="col" className="px-3 py-3 min-w-[180px]">
                Beneficiary School
              </th>
              <th scope="col" className="px-3 py-3 text-right whitespace-nowrap">
                Points Redeemed
              </th>
              <th scope="col" className="px-3 py-3 text-right whitespace-nowrap">
                Disbursed Cash
              </th>
              <th scope="col" className="px-3 py-3 text-center whitespace-nowrap">
                Payment Method
              </th>
              <th scope="col" className="px-3 py-3 text-center whitespace-nowrap">
                Date Issued
              </th>
              <th scope="col" className="px-3 py-3 whitespace-nowrap">
                Authorized By
              </th>
              <th scope="col" className="px-3 py-3 text-center whitespace-nowrap">
                Status
              </th>
              <th scope="col" className="px-3.5 py-3 text-center whitespace-nowrap">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 bg-white">
            {isLoading ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-stone-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <RotateCcw className="h-5 w-5 animate-spin text-[#800000]" />
                    <span className="text-xs font-medium">Loading payout summary records...</span>
                  </div>
                </td>
              </tr>
            ) : disbursements.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-10 text-center text-stone-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <AlertCircle className="h-6 w-6 text-stone-400" />
                    <p className="font-semibold text-stone-800 text-xs">No payout disbursements match filter</p>
                    <p className="text-[11px] text-stone-400 max-w-sm mx-auto">
                      No voucher disbursements found for the current reporting filter criteria.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              disbursements.map((voucher) => {
                const method = voucher.payment_method;

                return (
                  <tr
                    key={voucher.id}
                    className="hover:bg-stone-50/80 transition-colors"
                  >
                    {/* Voucher Reference */}
                    <td className="px-3.5 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <FileCheck2 className="h-3.5 w-3.5 text-[#800000] shrink-0" />
                        <span className="font-mono font-bold text-stone-900 text-xs bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                          {voucher.voucher_reference}
                        </span>
                      </div>
                    </td>

                    {/* School Beneficiary */}
                    <td className="px-3 py-3">
                      <div className="space-y-0.5">
                        <span className="font-semibold text-stone-900 text-xs block leading-tight">
                          {voucher.school_name}
                        </span>
                        <span className="font-mono text-[10px] text-stone-500 bg-stone-100 px-1.5 py-0.2 rounded border border-stone-200 inline-block">
                          {voucher.school_code}
                        </span>
                      </div>
                    </td>

                    {/* Points Redeemed */}
                    <td className="px-3 py-3 text-right font-medium font-mono whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-amber-800 font-semibold text-xs">
                        <Sparkles className="h-3 w-3 text-amber-600" />
                        {voucher.points_redeemed.toLocaleString("en-LK")}
                      </span>
                    </td>

                    {/* Disbursed Amount */}
                    <td className="px-3 py-3 text-right font-bold text-emerald-800 font-mono text-xs whitespace-nowrap">
                      {formatLKR(voucher.amount_lkr)}
                    </td>

                    {/* Payment Method */}
                    <td className="px-3 py-3 text-center whitespace-nowrap">
                      {method === "bank_transfer" ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-800 border border-sky-200">
                          <Building2 className="h-3 w-3 text-sky-600" />
                          Bank Transfer
                        </span>
                      ) : method === "cheque" ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-800 border border-purple-200">
                          <CreditCard className="h-3 w-3 text-purple-600" />
                          Council Cheque
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          Eco-Grant
                        </span>
                      )}
                    </td>

                    {/* Disbursement Date */}
                    <td className="px-3 py-3 text-center font-mono text-[11px] text-stone-600 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-stone-400" />
                        {voucher.disbursement_date}
                      </span>
                    </td>

                    {/* Authorized Officer */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-[11px] text-stone-600 font-mono truncate max-w-[140px]" title={voucher.authorized_by}>
                        <UserCheck className="h-3 w-3 text-stone-400 shrink-0" />
                        <span className="truncate">{voucher.authorized_by}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-3 py-3 text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                        Disbursed
                      </span>
                    </td>

                    {/* Action */}
                    <td className="px-3.5 py-3 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onViewVoucher && onViewVoucher(voucher)}
                        className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-stone-700 hover:bg-[#800000] hover:text-white hover:border-[#800000] transition-colors cursor-pointer shadow-2xs"
                        title="View Voucher Details"
                      >
                        <FileText className="h-3 w-3" />
                        <span>View Details</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 3. Table Pagination & Summary Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t border-stone-200 bg-stone-50/70 px-4 py-3 text-xs text-stone-500 gap-2">
        <div className="flex items-center gap-3">
          <span>
            Showing <strong className="text-stone-800 font-semibold">{disbursements.length}</strong> of{" "}
            <strong className="text-stone-800 font-semibold">{totalCount}</strong> vouchers
          </span>
          <span className="text-stone-300">|</span>
          <span className="font-semibold text-stone-700">
            Filtered Disbursed Total:{" "}
            <strong className="text-emerald-800 font-bold font-mono">
              {formatLKR(totalDisbursedSum)}
            </strong>
          </span>
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
