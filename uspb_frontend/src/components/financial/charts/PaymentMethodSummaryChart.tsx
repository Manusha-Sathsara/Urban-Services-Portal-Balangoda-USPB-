"use client";

import React from "react";
import { FinancialStats, PaymentMethodBreakdown } from "@/types";
import { CreditCard, Building2, CheckCircle2, Receipt, AlertCircle } from "lucide-react";

function formatLKR(amount: number): string {
  return `LKR ${amount.toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export interface PaymentMethodSummaryChartProps {
  stats: FinancialStats;
  isLoading?: boolean;
}

export function PaymentMethodSummaryChart({
  stats,
  isLoading = false,
}: PaymentMethodSummaryChartProps) {
  const summary: PaymentMethodBreakdown[] = stats.payment_methods_summary || [];
  const totalAmount = stats.total_cash_disbursed_lkr || 0;
  const totalVouchers = stats.completed_payouts_count || 0;

  const getMethodIcon = (method: string) => {
    switch (method) {
      case "bank_transfer":
        return <Building2 className="h-4 w-4 text-sky-600" />;
      case "cheque":
        return <CreditCard className="h-4 w-4 text-purple-600" />;
      case "eco_grant":
      default:
        return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
    }
  };

  const getBarColor = (method: string) => {
    switch (method) {
      case "bank_transfer":
        return "bg-sky-500";
      case "cheque":
        return "bg-purple-500";
      case "eco_grant":
      default:
        return "bg-emerald-500";
    }
  };

  const getBadgeColor = (method: string) => {
    switch (method) {
      case "bank_transfer":
        return "bg-sky-50 text-sky-800 border-sky-200";
      case "cheque":
        return "bg-purple-50 text-purple-800 border-purple-200";
      case "eco_grant":
      default:
        return "bg-emerald-50 text-emerald-800 border-emerald-200";
    }
  };

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-2xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#800000]/10 text-[#800000]">
            <Receipt className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-stone-900 font-serif">
              Payment Method Summary
            </h4>
            <p className="text-[10px] text-stone-500">
              Disbursement volume and value breakdown across payment modalities
            </p>
          </div>
        </div>

        <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
          {totalVouchers} {totalVouchers === 1 ? "Payout" : "Payouts"}
        </span>
      </div>

      {isLoading ? (
        <div className="h-40 flex items-center justify-center text-xs text-stone-400">
          Loading payment method breakdown...
        </div>
      ) : totalVouchers === 0 ? (
        <div className="h-40 flex flex-col items-center justify-center text-center p-4 text-stone-400 gap-1.5">
          <AlertCircle className="h-6 w-6 text-stone-300" />
          <p className="text-xs font-medium text-stone-600">No disbursements recorded</p>
          <p className="text-[11px] text-stone-400">
            No completed vouchers match the current active reporting filters.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {/* Method Cards with Progress Bars */}
          {summary.map((item) => (
            <div key={item.method} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold border ${getBadgeColor(
                      item.method
                    )}`}
                  >
                    {getMethodIcon(item.method)}
                    {item.method_label}
                  </span>
                  <span className="text-[11px] text-stone-500">
                    ({item.count} {item.count === 1 ? "voucher" : "vouchers"})
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-stone-900 text-xs">
                    {formatLKR(item.total_amount_lkr)}
                  </span>
                  <span className="font-mono text-[10px] text-stone-500 ml-1.5">
                    ({item.percentage.toFixed(1)}%)
                  </span>
                </div>
              </div>

              {/* Progress Track */}
              <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${getBarColor(
                    item.method
                  )}`}
                  style={{ width: `${Math.min(100, Math.max(0, item.percentage))}%` }}
                />
              </div>
            </div>
          ))}

          {/* Aggregate Total Footer */}
          <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
            <span className="text-stone-500 font-medium">Total Cash Disbursed:</span>
            <span className="font-mono font-bold text-emerald-800 text-sm">
              {formatLKR(totalAmount)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
