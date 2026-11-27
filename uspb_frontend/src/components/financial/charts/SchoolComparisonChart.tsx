"use client";

import React, { useState } from "react";
import { SchoolFinancialStatement } from "@/types";
import { School as SchoolIcon, CheckCircle2, Clock, AlertCircle } from "lucide-react";

function formatLKR(amount: number): string {
  return `LKR ${amount.toLocaleString("en-LK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export interface SchoolComparisonChartProps {
  schools: SchoolFinancialStatement[];
  isLoading?: boolean;
}

export function SchoolComparisonChart({
  schools,
  isLoading = false,
}: SchoolComparisonChartProps) {
  const [hoveredSchoolId, setHoveredSchoolId] = useState<number | null>(null);

  const maxValue = Math.max(...schools.map((s) => s.total_value_lkr), 100000);

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-2xs space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#800000]/10 text-[#800000]">
            <SchoolIcon className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-stone-900 font-serif">
              School-wise Financial Comparison
            </h4>
            <p className="text-[10px] text-stone-500">
              Comparative analysis of gross valuation vs settled grants & liabilities
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[10px]">
          <span className="flex items-center gap-1 font-medium text-emerald-800">
            <span className="h-2 w-2 rounded-xs bg-emerald-600" /> Disbursed
          </span>
          <span className="flex items-center gap-1 font-medium text-amber-800">
            <span className="h-2 w-2 rounded-xs bg-amber-500" /> Pending Balance
          </span>
        </div>
      </div>

      {/* Comparative List */}
      <div className="space-y-3 pt-1">
        {isLoading ? (
          <div className="py-8 text-center text-xs text-stone-400">
            Loading school comparisons...
          </div>
        ) : schools.length === 0 ? (
          <div className="py-6 text-center text-xs text-stone-400">
            No school records match current filter criteria.
          </div>
        ) : (
          schools.map((school) => {
            const disbursedPct =
              school.total_value_lkr > 0
                ? (school.total_disbursed_lkr / school.total_value_lkr) * 100
                : 0;
            const barWidthPct = (school.total_value_lkr / maxValue) * 100;
            const isHovered = hoveredSchoolId === school.school_id;

            return (
              <div
                key={school.school_id}
                className={`p-2 rounded-lg transition-colors cursor-pointer ${
                  isHovered ? "bg-stone-50 border border-stone-200" : "hover:bg-stone-50/60"
                }`}
                onMouseEnter={() => setHoveredSchoolId(school.school_id)}
                onMouseLeave={() => setHoveredSchoolId(null)}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-1.5 truncate max-w-[65%]">
                    <span className="font-mono text-[9px] font-bold text-stone-600 bg-stone-100 px-1 py-0.2 rounded">
                      {school.school_code}
                    </span>
                    <span className="font-semibold text-stone-800 truncate text-[11px]">
                      {school.school_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-mono">
                    <span className="text-emerald-700 font-bold">
                      {formatLKR(school.total_disbursed_lkr)}
                    </span>
                    <span className="text-stone-300">/</span>
                    <span className="text-stone-700 font-medium">
                      {formatLKR(school.total_value_lkr)}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1 rounded ${
                        disbursedPct >= 99
                          ? "bg-emerald-100 text-emerald-800"
                          : disbursedPct > 0
                          ? "bg-amber-100 text-amber-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {disbursedPct.toFixed(0)}%
                    </span>
                  </div>
                </div>

                {/* Comparative Stacked Bar */}
                <div className="w-full bg-stone-100 h-3 rounded-full overflow-hidden flex">
                  {/* Disbursed portion */}
                  <div
                    style={{
                      width: `${(school.total_disbursed_lkr / maxValue) * 100}%`,
                    }}
                    className="bg-emerald-600 h-full transition-all duration-300"
                    title={`Disbursed: ${formatLKR(school.total_disbursed_lkr)}`}
                  />
                  {/* Pending portion */}
                  <div
                    style={{
                      width: `${(school.pending_balance_lkr / maxValue) * 100}%`,
                    }}
                    className="bg-amber-400 h-full transition-all duration-300"
                    title={`Pending: ${formatLKR(school.pending_balance_lkr)}`}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[10px] text-stone-500">
        <span>Highest Earner: Balangoda Ananda Maithreya Central</span>
        <span className="font-semibold text-emerald-800">
          Fully Settled: St. Agnes Convent (100%)
        </span>
      </div>
    </div>
  );
}
