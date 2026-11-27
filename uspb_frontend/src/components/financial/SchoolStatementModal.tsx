"use client";

import React from "react";
import { SchoolFinancialStatement, DisbursementRecord } from "@/types";
import {
  X,
  School as SchoolIcon,
  Phone,
  User,
  Scale,
  Sparkles,
  Coins,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  Receipt,
  Printer,
  ShieldCheck,
} from "lucide-react";

function formatLKR(amount: number): string {
  return `LKR ${amount.toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export interface SchoolStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  statement: SchoolFinancialStatement | null;
  disbursements: DisbursementRecord[];
  onPrintPdf?: (statement: SchoolFinancialStatement) => void;
}

export function SchoolStatementModal({
  isOpen,
  onClose,
  statement,
  disbursements,
  onPrintPdf,
}: SchoolStatementModalProps) {
  if (!isOpen || !statement) return null;

  const schoolDisbursements = disbursements.filter(
    (d) => d.school_id === statement.school_id
  );

  const settlementPct =
    statement.total_value_lkr > 0
      ? ((statement.total_disbursed_lkr / statement.total_value_lkr) * 100).toFixed(1)
      : "0.0";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="statement-modal-title"
    >
      <div className="relative w-full max-w-2xl rounded-2xl border border-stone-200 bg-white p-6 shadow-xl animate-in zoom-in-95 duration-150 space-y-5 my-8">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-stone-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#800000]/10 text-[#800000] border border-[#800000]/20 shadow-2xs">
              <SchoolIcon className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-stone-700 bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                  {statement.school_code}
                </span>
                <h2 id="statement-modal-title" className="text-base font-bold text-stone-900 font-serif">
                  {statement.school_name}
                </h2>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Balangoda Urban Council • Official Statement of Recyclable Rewards Account
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Institutional Contact Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-stone-50/80 p-3 rounded-xl border border-stone-200 text-xs text-stone-600">
          <div className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-stone-400" />
            <span>Principal: <strong className="text-stone-800">{statement.principal_name || "N/A"}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5 text-stone-400" />
            <span>Contact: <strong className="text-stone-800">{statement.contact_number || "N/A"}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 sm:justify-end">
            <span className="text-stone-400">Status:</span>
            {statement.settlement_status === "settled" ? (
              <span className="inline-flex items-center gap-1 font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded text-[10px] border border-emerald-200">
                <CheckCircle2 className="h-3 w-3" /> Fully Settled
              </span>
            ) : statement.settlement_status === "partial" ? (
              <span className="inline-flex items-center gap-1 font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded text-[10px] border border-amber-200">
                <Clock className="h-3 w-3" /> Partially Settled ({settlementPct}%)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded text-[10px] border border-rose-200">
                <AlertCircle className="h-3 w-3" /> Pending Disbursement
              </span>
            )}
          </div>
        </div>

        {/* 4 Financial Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-stone-200 bg-white p-3 space-y-1">
            <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider flex items-center gap-1">
              <Scale className="h-3 w-3 text-stone-500" /> Recyclables
            </span>
            <p className="text-sm font-bold text-stone-900 font-mono">
              {statement.total_collections_kg.toLocaleString("en-LK")} <span className="text-xs font-normal text-stone-500">kg</span>
            </p>
          </div>

          <div className="rounded-xl border border-stone-200 bg-white p-3 space-y-1">
            <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-amber-600" /> Eco-Points
            </span>
            <p className="text-sm font-bold text-amber-800 font-mono">
              {statement.total_points_earned.toLocaleString("en-LK")} pts
            </p>
          </div>

          <div className="rounded-xl border border-stone-200 bg-white p-3 space-y-1">
            <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Disbursed
            </span>
            <p className="text-sm font-bold text-emerald-800 font-mono">
              {formatLKR(statement.total_disbursed_lkr)}
            </p>
          </div>

          <div className="rounded-xl border border-stone-200 bg-white p-3 space-y-1">
            <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider flex items-center gap-1">
              <AlertCircle className="h-3 w-3 text-rose-600" /> Pending
            </span>
            <p className="text-sm font-bold text-rose-800 font-mono">
              {formatLKR(statement.pending_balance_lkr)}
            </p>
          </div>
        </div>

        {/* Historical Disbursements for this school */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
              <Receipt className="h-3.5 w-3.5 text-[#800000]" />
              Historical Council Grants & Vouchers ({schoolDisbursements.length})
            </h3>
            <span className="text-[11px] text-stone-500 font-mono">
              Total Settled: {formatLKR(statement.total_disbursed_lkr)}
            </span>
          </div>

          {schoolDisbursements.length === 0 ? (
            <div className="p-4 rounded-xl border border-stone-200 bg-stone-50 text-center text-xs text-stone-500">
              No grant vouchers have been disbursed to this school yet. Accrued liability stands at {formatLKR(statement.pending_balance_lkr)}.
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {schoolDisbursements.map((v) => (
                <div
                  key={v.id}
                  className="p-3 rounded-xl border border-stone-200 bg-stone-50/50 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-stone-900">{v.voucher_reference}</span>
                      <span className="text-[10px] text-stone-500 bg-stone-200 px-1.5 py-0.2 rounded uppercase font-semibold">
                        {v.payment_method.replace("_", " ")}
                      </span>
                    </div>
                    {v.notes && <p className="text-[11px] text-stone-500 mt-0.5">{v.notes}</p>}
                  </div>
                  <div className="sm:text-right shrink-0">
                    <span className="font-mono font-bold text-emerald-800 text-xs block">
                      {formatLKR(v.amount_lkr)}
                    </span>
                    <span className="text-[10px] text-stone-400 block font-mono">
                      Issued {v.disbursement_date}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-stone-100 text-xs">
          <div className="flex items-center gap-1.5 text-stone-500 text-[11px]">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Verified Balangoda Urban Council Municipal Audit Statement</span>
          </div>

          <div className="flex items-center gap-2">
            {onPrintPdf && (
              <button
                type="button"
                onClick={() => onPrintPdf(statement)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3.5 py-2 font-semibold text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer text-xs"
              >
                <Printer className="h-3.5 w-3.5 text-[#800000]" />
                Print Statement
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#800000] px-4 py-2 font-semibold text-white hover:bg-[#680000] transition-colors cursor-pointer text-xs"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
