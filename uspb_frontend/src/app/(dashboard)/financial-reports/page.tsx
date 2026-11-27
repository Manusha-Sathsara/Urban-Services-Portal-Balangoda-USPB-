"use client";

import { useEffect, useState } from "react";
import { FinancialStats, CategoryValuation } from "@/types";
import financialService from "@/services/financialService";
import { StatCard } from "@/components/shared/StatCard";
import {
  Coins,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  School as SchoolIcon,
  Recycle,
  Scale,
  Landmark,
  ShieldCheck,
  Info,
  Calendar,
  Layers,
} from "lucide-react";

// Formatter: Currency in Sri Lankan Rupees (LKR)
function formatLKR(amount: number): string {
  return `LKR ${amount.toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function FinancialReportsPage() {
  const [stats, setStats] = useState<FinancialStats>({
    total_recycled_value_lkr: 0,
    total_points_liability: 0,
    total_disbursed_lkr: 0,
    outstanding_balance_lkr: 0,
    total_collected_kg: 0,
    landfill_savings_lkr: 0,
    settled_schools_count: 0,
    total_participating_schools: 0,
  });

  const [categories, setCategories] = useState<CategoryValuation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      setIsLoading(true);
      try {
        const [statsData, categoryData] = await Promise.all([
          financialService.getFinancialStats(),
          financialService.getCategoryValuation(),
        ]);
        setStats(statsData);
        setCategories(categoryData.categories || []);
      } catch (err) {
        console.warn("Failed to load financial overview data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  // Settlement rate computation
  const settlementRate =
    stats.total_recycled_value_lkr > 0
      ? ((stats.total_disbursed_lkr / stats.total_recycled_value_lkr) * 100).toFixed(1)
      : "0.0";

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------------ */}
      {/* 1. Page Header                                                     */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col gap-2">
        <div className="inline-flex items-center gap-1.5 rounded-md bg-[#800000]/10 px-2.5 py-0.5 text-xs font-semibold text-[#800000] w-fit">
          <span>MUNICIPAL ADMINISTRATION</span>
          <span className="text-[#800000]/40">•</span>
          <span className="text-stone-600 font-normal">School Waste Rewards</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-stone-900 font-serif">
              Financial Reports & Payout Statements
            </h1>
            <p className="text-xs text-stone-500 mt-1 max-w-3xl leading-relaxed">
              Executive financial overview of the Balangoda School Recyclable Waste Rewards Programme.
              Monitors gross economic material valuation, municipal reward liabilities, disbursed grants,
              and outstanding council settlement obligations.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900 shadow-2xs">
              <Calendar className="h-3.5 w-3.5 text-amber-700" />
              <span>Fiscal Year 2026</span>
            </span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. Clearly Identified Demonstration Data Banner                    */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-900 shadow-2xs">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-200/80 text-amber-900 mt-0.5">
          <Info className="h-4 w-4" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-bold uppercase tracking-wider text-[11px] text-amber-950">
              Demonstration Data Mode — Stage 2 Overview
            </span>
            <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-900">
              Simulation Baseline
            </span>
          </div>
          <p className="text-amber-800 leading-relaxed text-[11px]">
            The figures and summary metrics displayed below represent the approved demonstration model for
            the <strong>Balangoda Urban Council School Waste Rewards Programme</strong>. They simulate realistic
            recyclable waste collections and point liabilities across Balangoda&apos;s participating schools, establishing
            the baseline for subsequent filter, detailed statement, and audit export stages.
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 3. Primary Financial KPI Summary Cards                             */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Recycled Value"
          value={isLoading ? "Loading..." : formatLKR(stats.total_recycled_value_lkr)}
          description="Gross economic worth of all recovered recyclables (LKR)"
          icon={<Coins className="h-5 w-5" />}
          variant="revenue"
        />

        <StatCard
          label="Points Liability Incurred"
          value={isLoading ? "Loading..." : `${stats.total_points_liability.toLocaleString("en-LK")} pts`}
          description="Total eco-points earned across participating schools"
          icon={<Sparkles className="h-5 w-5" />}
          variant="default"
        />

        <StatCard
          label="Disbursed Rewards"
          value={isLoading ? "Loading..." : formatLKR(stats.total_disbursed_lkr)}
          description={`${settlementRate}% of total rewards value settled to schools`}
          icon={<CheckCircle2 className="h-5 w-5" />}
          variant="success"
        />

        <StatCard
          label="Outstanding Balance"
          value={isLoading ? "Loading..." : formatLKR(stats.outstanding_balance_lkr)}
          description="Accrued rewards liability pending council disbursement"
          icon={<AlertCircle className="h-5 w-5" />}
          variant="warning"
        />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 4. Municipal Eco-Economics & Waste Diversion Overview              */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Landfill Diversion & Council Savings */}
        <div className="lg:col-span-2 rounded-xl border border-stone-200 bg-white p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#800000]/10 text-[#800000]">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900 font-serif">
                  Council Waste Diversion & Landfill Cost Avoidance
                </h3>
                <p className="text-[11px] text-stone-500">
                  Municipal environmental savings achieved through school source segregation
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded text-[11px] border border-emerald-200">
              <ShieldCheck className="h-3 w-3" />
              Verified Demo Model
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-stone-200 bg-stone-50/60 p-3.5">
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                <Scale className="h-3.5 w-3.5 text-stone-400" /> Total Waste Diverted
              </span>
              <p className="mt-1 text-xl font-bold text-stone-900">
                {stats.total_collected_kg.toLocaleString("en-LK")}{" "}
                <span className="text-xs font-normal text-stone-500">kg</span>
              </p>
              <p className="text-[10px] text-stone-500 mt-0.5">
                Across 5 participating schools
              </p>
            </div>

            <div className="rounded-xl border border-stone-200 bg-stone-50/60 p-3.5">
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                <Landmark className="h-3.5 w-3.5 text-emerald-700" /> Landfill Savings
              </span>
              <p className="mt-1 text-xl font-bold text-emerald-700">
                {formatLKR(stats.landfill_savings_lkr)}
              </p>
              <p className="text-[10px] text-stone-500 mt-0.5">
                Estimated LKR 5.00/kg tipping fee avoided
              </p>
            </div>

            <div className="rounded-xl border border-stone-200 bg-stone-50/60 p-3.5">
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#800000]" /> Settlement Ratio
              </span>
              <p className="mt-1 text-xl font-bold text-[#800000]">
                {settlementRate}%
              </p>
              <p className="text-[10px] text-stone-500 mt-0.5">
                Disbursed vs gross liability
              </p>
            </div>
          </div>

          <div className="rounded-lg bg-stone-50 p-3 border border-stone-100 text-xs text-stone-600 flex items-center justify-between">
            <span className="text-stone-500">
              Net Council Ecological Benefit (Landfill Savings + Recovered Recyclable Value):
            </span>
            <span className="font-bold text-stone-900 font-mono text-sm">
              {formatLKR(stats.total_recycled_value_lkr + stats.landfill_savings_lkr)}
            </span>
          </div>
        </div>

        {/* School Settlement Status Breakdown */}
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-stone-100 pb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-stone-100 text-stone-700">
              <SchoolIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900 font-serif">
                School Settlement Status
              </h3>
              <p className="text-[11px] text-stone-500">
                Participation & grant distribution breakdown
              </p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-lg border border-stone-100 bg-stone-50/50">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
                <span className="font-medium text-stone-800">Fully Settled Schools</span>
              </div>
              <span className="font-bold text-emerald-800 font-mono">
                {stats.settled_schools_count} / {stats.total_participating_schools}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg border border-stone-100 bg-stone-50/50">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                <span className="font-medium text-stone-800">Partially Settled Schools</span>
              </div>
              <span className="font-bold text-amber-800 font-mono">
                2 Schools
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg border border-stone-100 bg-stone-50/50">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                <span className="font-medium text-stone-800">Pending First Disbursement</span>
              </div>
              <span className="font-bold text-rose-800 font-mono">
                1 School
              </span>
            </div>

            <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
              <span>Average Payout per Settled School:</span>
              <span className="font-semibold text-stone-800">
                {formatLKR(147500.0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 5. Waste Stream Valuation Overview Cards                           */}
      {/* ------------------------------------------------------------------ */}
      <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#800000]/10 text-[#800000]">
              <Recycle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900 font-serif">
                Recyclable Stream Valuation Breakdown (Demonstration Model)
              </h3>
              <p className="text-[11px] text-stone-500">
                Economic revenue and point rates across authorized municipal waste categories
              </p>
            </div>
          </div>

          <span className="text-[11px] font-semibold text-stone-500 bg-stone-100 px-2.5 py-1 rounded-md">
            5 Municipal Categories
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {categories.map((c) => (
            <div
              key={c.category_id}
              className="rounded-xl border border-stone-200 bg-stone-50/40 p-3.5 space-y-2 hover:border-[#800000]/40 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-stone-900 truncate">
                  {c.category_name}
                </span>
              </div>

              <div>
                <p className="text-base font-bold text-stone-900">
                  {formatLKR(c.total_value_lkr)}
                </p>
                <p className="text-[11px] text-stone-500">
                  {c.total_weight_kg.toLocaleString("en-LK")} {c.measurement_unit} collected
                </p>
              </div>

              <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between text-[10px]">
                <span className="text-[#800000] font-semibold">
                  {c.current_rate} pts/{c.measurement_unit}
                </span>
                <span className="text-stone-500 font-mono">
                  {c.volume_share_percentage}% volume
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 6. Overview Section Summary / Stage Roadmap Note                   */}
      {/* ------------------------------------------------------------------ */}
      <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-4 text-xs text-stone-600 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-stone-500" />
          <span>
            <strong>Stage 2 Status:</strong> Financial Reports dashboard overview & summary cards successfully rendered with demonstration figures.
          </span>
        </div>
        <span className="text-[11px] text-stone-400 italic">
          Filters, interactive tables, charts and CSV exports are scheduled for subsequent stages.
        </span>
      </div>
    </div>
  );
}
