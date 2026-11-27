"use client";

import React from "react";
import {
  FinancialStats,
  MonthlyTrendDataPoint,
  SchoolFinancialStatement,
} from "@/types";
import { MonthlyPayoutTrendChart } from "./MonthlyPayoutTrendChart";
import { MonthlyPointsTrendChart } from "./MonthlyPointsTrendChart";
import { SchoolComparisonChart } from "./SchoolComparisonChart";
import { PayoutStatusChart } from "./PayoutStatusChart";
import { BarChart3, TrendingUp, Sparkles, Filter } from "lucide-react";

export interface FinancialChartsSectionProps {
  stats: FinancialStats;
  trends: MonthlyTrendDataPoint[];
  schools: SchoolFinancialStatement[];
  isLoading?: boolean;
  isFiltered?: boolean;
}

export function FinancialChartsSection({
  stats,
  trends,
  schools,
  isLoading = false,
  isFiltered = false,
}: FinancialChartsSectionProps) {
  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-200 pb-2.5 gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#800000]/10 text-[#800000]">
            <BarChart3 className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-stone-900 font-serif">
              Financial Trends & Institutional Analytics
            </h3>
            <p className="text-[11px] text-stone-500">
              Visual telemetry of monthly disbursement velocities, points liquidations, and school performance
            </p>
          </div>
        </div>

        {isFiltered && (
          <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-0.5 text-[10px] font-semibold text-stone-700 border border-stone-200 self-start sm:self-auto">
            <Filter className="h-3 w-3 text-stone-500" />
            Charts reactively aligned with active filters
          </span>
        )}
      </div>

      {/* 2x2 Responsive Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Chart 1: Monthly Cash Payout Trends */}
        <MonthlyPayoutTrendChart data={trends} isLoading={isLoading} />

        {/* Chart 2: Monthly Points Redemption Trends */}
        <MonthlyPointsTrendChart data={trends} isLoading={isLoading} />

        {/* Chart 3: School-wise Financial Comparison */}
        <SchoolComparisonChart schools={schools} isLoading={isLoading} />

        {/* Chart 4: Payout Settlement Status Distribution */}
        <PayoutStatusChart stats={stats} isLoading={isLoading} />
      </div>
    </div>
  );
}
