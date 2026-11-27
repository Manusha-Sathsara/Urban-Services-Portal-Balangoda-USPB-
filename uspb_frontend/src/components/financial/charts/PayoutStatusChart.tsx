"use client";

import React from "react";
import { FinancialStats } from "@/types";
import { PieChart, CheckCircle2, Clock, AlertCircle } from "lucide-react";

function formatLKR(amount: number): string {
  return `LKR ${amount.toLocaleString("en-LK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export interface PayoutStatusChartProps {
  stats: FinancialStats;
  isLoading?: boolean;
}

export function PayoutStatusChart({
  stats,
  isLoading = false,
}: PayoutStatusChartProps) {
  const total = stats.total_participating_schools || 1;
  const settledCount = stats.settled_schools_count;
  // Demonstration distribution
  const partialCount =
    total > 1 ? Math.max(0, Math.min(2, total - settledCount)) : 0;
  const pendingCount = Math.max(0, total - settledCount - partialCount);

  const settlementRate =
    total > 0
      ? ((settledCount / total) * 100).toFixed(0)
      : "0";

  // Donut SVG parameters
  const size = 160;
  const strokeWidth = 18;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Segments calculation based on counts
  const settledPct = total > 0 ? settledCount / total : 0;
  const partialPct = total > 0 ? partialCount / total : 0;
  const pendingPct = total > 0 ? pendingCount / total : 0;

  const settledDash = settledPct * circumference;
  const partialDash = partialPct * circumference;
  const pendingDash = pendingPct * circumference;

  const settledOffset = 0;
  const partialOffset = -settledDash;
  const pendingOffset = -(settledDash + partialDash);

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-2xs space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
            <PieChart className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-stone-900 font-serif">
              Payout Settlement Status Distribution
            </h4>
            <p className="text-[10px] text-stone-500">
              Breakdown of institutional grant settlement stages
            </p>
          </div>
        </div>

        <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
          {settlementRate}% Settled
        </span>
      </div>

      {/* Donut and Legend Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-4 py-2">
        {/* SVG Donut */}
        <div className="flex justify-center relative">
          {isLoading ? (
            <div className="w-[160px] h-[160px] flex items-center justify-center text-xs text-stone-400">
              Loading...
            </div>
          ) : (
            <div className="relative">
              <svg width={size} height={size} className="transform -rotate-90">
                {/* Background Ring */}
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  stroke="#f5f5f4"
                  strokeWidth={strokeWidth}
                />

                {/* Settled Segment (Emerald) */}
                {settledDash > 0 && (
                  <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="transparent"
                    stroke="#059669"
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${settledDash} ${circumference - settledDash}`}
                    strokeDashoffset={settledOffset}
                    className="transition-all duration-500"
                  />
                )}

                {/* Partial Segment (Amber) */}
                {partialDash > 0 && (
                  <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="transparent"
                    stroke="#f59e0b"
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${partialDash} ${circumference - partialDash}`}
                    strokeDashoffset={partialOffset}
                    className="transition-all duration-500"
                  />
                )}

                {/* Pending Segment (Rose) */}
                {pendingDash > 0 && (
                  <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="transparent"
                    stroke="#f43f5e"
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${pendingDash} ${circumference - pendingDash}`}
                    strokeDashoffset={pendingOffset}
                    className="transition-all duration-500"
                  />
                )}
              </svg>

              {/* Donut Center Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xl font-bold text-stone-900 font-mono">
                  {stats.settled_schools_count}/{stats.total_participating_schools}
                </span>
                <span className="text-[9px] uppercase font-semibold text-stone-400">
                  Settled Schools
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Legend List */}
        <div className="space-y-2 text-xs">
          {/* Fully Settled */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/50 border border-emerald-100">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-600 shrink-0" />
              <div>
                <span className="font-semibold text-stone-800 text-[11px] block">
                  Fully Settled
                </span>
                <span className="text-[10px] text-stone-500 font-mono">
                  {formatLKR(stats.total_cash_disbursed_lkr || stats.total_disbursed_lkr || 0)} disbursed
                </span>
              </div>
            </div>
            <span className="font-mono font-bold text-emerald-800 text-xs">
              {settledCount} School(s)
            </span>
          </div>

          {/* Partially Settled */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50/50 border border-amber-100">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shrink-0" />
              <div>
                <span className="font-semibold text-stone-800 text-[11px] block">
                  Partially Settled
                </span>
                <span className="text-[10px] text-stone-500 font-mono">
                  Active balance pending
                </span>
              </div>
            </div>
            <span className="font-mono font-bold text-amber-800 text-xs">
              {partialCount} School(s)
            </span>
          </div>

          {/* Pending First Disbursement */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-rose-50/50 border border-rose-100">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500 shrink-0" />
              <div>
                <span className="font-semibold text-stone-800 text-[11px] block">
                  Pending Payout
                </span>
                <span className="text-[10px] text-stone-500 font-mono">
                  {formatLKR(stats.outstanding_balance_lkr || 0)} pending
                </span>
              </div>
            </div>
            <span className="font-mono font-bold text-rose-800 text-xs">
              {pendingCount} School(s)
            </span>
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[10px] text-stone-500">
        <span>Target: 100% Payout Liquidation</span>
        <span className="font-semibold text-stone-800 font-mono">
          Total Disbursed: {formatLKR(stats.total_cash_disbursed_lkr || stats.total_disbursed_lkr || 0)}
        </span>
      </div>
    </div>
  );
}
