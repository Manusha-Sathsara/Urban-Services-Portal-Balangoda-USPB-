"use client";

import React from "react";
import { DisbursementRecord } from "@/types";
import {
  X,
  Receipt,
  School as SchoolIcon,
  CreditCard,
  Building2,
  Calendar,
  UserCheck,
  CheckCircle2,
  Sparkles,
  Printer,
  ShieldCheck,
  FileCheck2,
} from "lucide-react";

function formatLKR(amount: number): string {
  return `LKR ${amount.toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export interface VoucherDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  voucher: DisbursementRecord | null;
  onPrint?: (voucher: DisbursementRecord) => void;
}

export function VoucherDetailsModal({
  isOpen,
  onClose,
  voucher,
  onPrint,
}: VoucherDetailsModalProps) {
  if (!isOpen || !voucher) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="voucher-modal-title"
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-stone-200 bg-white p-6 shadow-xl animate-in zoom-in-95 duration-150 space-y-5">
        {/* Voucher Header */}
        <div className="flex items-start justify-between border-b border-stone-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
              <Receipt className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="voucher-modal-title" className="text-base font-bold text-stone-900 font-mono">
                  {voucher.voucher_reference}
                </h2>
                <span className="rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold">
                  {voucher.status.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Official Municipal Payout & Grant Disbursement Voucher
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

        {/* Voucher Receipt Card */}
        <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-4 space-y-4">
          {/* Beneficiary */}
          <div className="border-b border-stone-200 pb-3">
            <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block">
              Beneficiary Educational Institution
            </span>
            <div className="flex items-center gap-2 mt-1">
              <SchoolIcon className="h-4 w-4 text-[#800000]" />
              <span className="font-bold text-stone-900 text-sm">
                {voucher.school_name}
              </span>
              <span className="font-mono text-xs text-stone-500 bg-white px-2 py-0.5 rounded border border-stone-200">
                {voucher.school_code}
              </span>
            </div>
          </div>

          {/* Amount and Points */}
          <div className="grid grid-cols-2 gap-3 border-b border-stone-200 pb-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block">
                Disbursed Grant Amount
              </span>
              <span className="text-lg font-bold text-emerald-800 font-mono block mt-0.5">
                {formatLKR(voucher.amount_lkr)}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block">
                Liquidated Eco-Points
              </span>
              <span className="text-base font-bold text-amber-800 font-mono flex items-center gap-1 mt-0.5">
                <Sparkles className="h-4 w-4 text-amber-600" />
                {voucher.points_redeemed.toLocaleString("en-LK")} pts
              </span>
            </div>
          </div>

          {/* Modality & Authorization */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block">
                Payment Modality
              </span>
              <span className="font-semibold text-stone-800 capitalize mt-1 block">
                {voucher.payment_method.replace("_", " ")}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block">
                Disbursement Date
              </span>
              <span className="font-mono text-stone-800 mt-1 block flex items-center gap-1">
                <Calendar className="h-3 w-3 text-stone-400" />
                {voucher.disbursement_date}
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block">
                Authorized By Council Officer
              </span>
              <span className="font-mono text-stone-800 text-[11px] flex items-center gap-1 mt-0.5">
                <UserCheck className="h-3.5 w-3.5 text-stone-400" />
                {voucher.authorized_by}
              </span>
            </div>
          </div>

          {/* Notes */}
          {voucher.notes && (
            <div className="bg-white p-2.5 rounded-lg border border-stone-200 text-xs">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-0.5">
                Council Grant Purpose / Notes:
              </span>
              <p className="text-stone-700 italic text-[11px]">{voucher.notes}</p>
            </div>
          )}
        </div>

        {/* Security & Verification Seal */}
        <div className="flex items-center justify-between text-xs text-stone-500 pt-1">
          <div className="flex items-center gap-1.5 text-[11px]">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Authorized by Balangoda Urban Council Municipal Treasury</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#800000] px-4 py-2 font-semibold text-white hover:bg-[#680000] transition-colors cursor-pointer text-xs"
          >
            Close Voucher
          </button>
        </div>
      </div>
    </div>
  );
}
