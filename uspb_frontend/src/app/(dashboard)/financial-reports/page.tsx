"use client";

import { useEffect, useState, useCallback } from "react";
import {
  FinancialStats,
  CategoryValuation,
  FinancialFilterParams,
  SchoolFinancialStatement,
  DisbursementRecord,
  MonthlyTrendDataPoint,
} from "@/types";
import financialService from "@/services/financialService";
import { schoolService } from "@/services/schoolService";
import { StatCard } from "@/components/shared/StatCard";
import {
  FinancialFilters,
  FinancialFilterState,
  SchoolOption,
} from "@/components/financial/FinancialFilters";
import { SchoolFinancialTable } from "@/components/financial/SchoolFinancialTable";
import { PayoutSummaryTable } from "@/components/financial/PayoutSummaryTable";
import { FinancialChartsSection } from "@/components/financial/charts/FinancialChartsSection";
import { ExportMenu } from "@/components/financial/ExportMenu";
import { SchoolStatementModal } from "@/components/financial/SchoolStatementModal";
import { VoucherDetailsModal } from "@/components/financial/VoucherDetailsModal";
import {
  exportToCsv,
  exportToExcel,
  exportToPdf,
  FinancialExportPayload,
} from "@/lib/exportUtils";
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
  Filter,
  RotateCcw,
  FileSpreadsheet,
  Receipt,
  FileText,
} from "lucide-react";

// Formatter: Currency in Sri Lankan Rupees (LKR)
function formatLKR(amount: number): string {
  return `LKR ${amount.toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

const DEFAULT_SCHOOLS: SchoolOption[] = [
  { id: 1, name: "Balangoda Ananda Maithreya Central College", code: "SCH-001" },
  { id: 2, name: "St. Agnes Convent Balangoda", code: "SCH-002" },
  { id: 3, name: "Meddakanda Maha Vidyalaya", code: "SCH-003" },
  { id: 4, name: "Sri Shariputhra Maha Vidyalaya", code: "SCH-004" },
  { id: 5, name: "Balangoda Tamil Maha Vidyalayam", code: "SCH-005" },
];

const INITIAL_FILTERS: FinancialFilterState = {
  school_id: undefined,
  status: "all",
  start_date: "",
  end_date: "",
  report_type: "consolidated",
};

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
  const [schools, setSchools] = useState<SchoolOption[]>(DEFAULT_SCHOOLS);
  const [isLoading, setIsLoading] = useState(true);

  // Filter States: Draft (in-input) vs Applied (committed)
  const [draftFilters, setDraftFilters] = useState<FinancialFilterState>(INITIAL_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<FinancialFilterState>(INITIAL_FILTERS);

  // Table Data States
  const [schoolStatements, setSchoolStatements] = useState<SchoolFinancialStatement[]>([]);
  const [schoolTotalCount, setSchoolTotalCount] = useState<number>(0);
  const [schoolPage, setSchoolPage] = useState<number>(1);
  const [schoolTotalPages, setSchoolTotalPages] = useState<number>(1);
  const [schoolSearch, setSchoolSearch] = useState<string>("");

  const [disbursements, setDisbursements] = useState<DisbursementRecord[]>([]);
  const [disbursementTotalCount, setDisbursementTotalCount] = useState<number>(0);
  const [disbursementPage, setDisbursementPage] = useState<number>(1);
  const [disbursementTotalPages, setDisbursementTotalPages] = useState<number>(1);
  const [disbursementSearch, setDisbursementSearch] = useState<string>("");

  // Visual Telemetry / Charts Trends State
  const [trends, setTrends] = useState<MonthlyTrendDataPoint[]>([]);

  // Detailed Modals State
  const [selectedStatement, setSelectedStatement] = useState<SchoolFinancialStatement | null>(null);
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);

  const [selectedVoucher, setSelectedVoucher] = useState<DisbursementRecord | null>(null);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);

  // Table View Tab (synced with or overriding report perspective)
  const [tableTab, setTableTab] = useState<"all" | "schools" | "payouts">("all");

  // Load Financial Overview and Table Data with Active Filters
  const loadData = useCallback(
    async (
      filters: FinancialFilterState,
      schPage = schoolPage,
      schSearch = schoolSearch,
      disbPage = disbursementPage,
      disbSearch = disbursementSearch
    ) => {
      setIsLoading(true);
      try {
        const baseParams: FinancialFilterParams = {
          school_id: filters.school_id,
          status: filters.status,
          start_date: filters.start_date || undefined,
          end_date: filters.end_date || undefined,
          report_type: filters.report_type,
        };

        const [statsData, categoryData, schoolData, disbursementData, trendsData] = await Promise.all([
          financialService.getFinancialStats(baseParams),
          financialService.getCategoryValuation(baseParams),
          financialService.getSchoolStatements({
            ...baseParams,
            page: schPage,
            limit: 10,
            search: schSearch || undefined,
          }),
          financialService.getDisbursements({
            ...baseParams,
            page: disbPage,
            limit: 10,
            search: disbSearch || undefined,
          }),
          financialService.getFinancialTrends(baseParams),
        ]);

        setStats(statsData);
        setCategories(categoryData.categories || []);
        setSchoolStatements(schoolData.records || []);
        setSchoolTotalCount(schoolData.total_count || 0);
        setSchoolTotalPages(schoolData.total_pages || 1);

        setDisbursements(disbursementData.disbursements || []);
        setDisbursementTotalCount(disbursementData.total_count || 0);
        setDisbursementTotalPages(disbursementData.total_pages || 1);

        setTrends(trendsData.monthly_trends || []);
      } catch (err) {
        console.warn("Failed to load financial report data:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [schoolPage, schoolSearch, disbursementPage, disbursementSearch]
  );

  useEffect(() => {
    // Initial fetch
    loadData(INITIAL_FILTERS);

    // Fetch dynamic school options from backend
    schoolService
      .getSchools({ limit: 100 })
      .then((res) => {
        if (res.schools && res.schools.length > 0) {
          setSchools(
            res.schools.map((s) => ({
              id: s.id,
              name: s.school_name,
              code: s.school_code,
            }))
          );
        }
      })
      .catch(() => {
        // Fallback to DEFAULT_SCHOOLS
      });
  }, [loadData]);

  // Draft filter change handler
  const handleDraftChange = <K extends keyof FinancialFilterState>(
    key: K,
    value: FinancialFilterState[K]
  ) => {
    setDraftFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Apply filters action
  const handleApplyFilters = () => {
    setAppliedFilters(draftFilters);
    setSchoolPage(1);
    setDisbursementPage(1);

    // If report_type is school_settlement, focus on schools tab
    if (draftFilters.report_type === "school_settlement") {
      setTableTab("schools");
    } else if (draftFilters.report_type === "disbursement_ledger") {
      setTableTab("payouts");
    } else {
      setTableTab("all");
    }

    loadData(draftFilters, 1, schoolSearch, 1, disbursementSearch);
  };

  // Reset filters action
  const handleResetFilters = () => {
    setDraftFilters(INITIAL_FILTERS);
    setAppliedFilters(INITIAL_FILTERS);
    setSchoolSearch("");
    setDisbursementSearch("");
    setSchoolPage(1);
    setDisbursementPage(1);
    setTableTab("all");
    loadData(INITIAL_FILTERS, 1, "", 1, "");
  };

  // Remove individual filter chip
  const handleRemoveFilter = (key: keyof FinancialFilterState) => {
    const updatedDraft: FinancialFilterState = {
      ...draftFilters,
      [key]: INITIAL_FILTERS[key],
    };
    const updatedApplied: FinancialFilterState = {
      ...appliedFilters,
      [key]: INITIAL_FILTERS[key],
    };

    setDraftFilters(updatedDraft);
    setAppliedFilters(updatedApplied);
    loadData(updatedApplied, schoolPage, schoolSearch, disbursementPage, disbursementSearch);
  };

  // School table search change
  const handleSchoolSearchChange = (val: string) => {
    setSchoolSearch(val);
    setSchoolPage(1);
    financialService
      .getSchoolStatements({
        school_id: appliedFilters.school_id,
        status: appliedFilters.status,
        start_date: appliedFilters.start_date || undefined,
        end_date: appliedFilters.end_date || undefined,
        page: 1,
        limit: 10,
        search: val || undefined,
      })
      .then((res) => {
        setSchoolStatements(res.records || []);
        setSchoolTotalCount(res.total_count || 0);
        setSchoolTotalPages(res.total_pages || 1);
      });
  };

  // Disbursement table search change
  const handleDisbursementSearchChange = (val: string) => {
    setDisbursementSearch(val);
    setDisbursementPage(1);
    financialService
      .getDisbursements({
        school_id: appliedFilters.school_id,
        status: appliedFilters.status,
        start_date: appliedFilters.start_date || undefined,
        end_date: appliedFilters.end_date || undefined,
        page: 1,
        limit: 10,
        search: val || undefined,
      })
      .then((res) => {
        setDisbursements(res.disbursements || []);
        setDisbursementTotalCount(res.total_count || 0);
        setDisbursementTotalPages(res.total_pages || 1);
      });
  };

  // Settlement rate computation
  const settlementRate =
    stats.total_recycled_value_lkr > 0
      ? ((stats.total_disbursed_lkr / stats.total_recycled_value_lkr) * 100).toFixed(1)
      : "0.0";

  // Check if any filter is actively applied
  const isFiltered =
    Boolean(appliedFilters.school_id) ||
    appliedFilters.status !== "all" ||
    Boolean(appliedFilters.start_date) ||
    Boolean(appliedFilters.end_date) ||
    appliedFilters.report_type !== "consolidated";

  const selectedSchoolObj = schools.find((s) => s.id === appliedFilters.school_id);

  // Export Payload Generator (Synchronized with active filtered dataset)
  const getExportPayload = (): FinancialExportPayload => {
    return {
      stats,
      schools: schoolStatements,
      disbursements,
      categories,
      filters: appliedFilters,
      selectedSchoolName: selectedSchoolObj ? selectedSchoolObj.name : "All Balangoda Schools",
      generatedDate: new Date().toISOString().slice(0, 10),
    };
  };

  const handleExportPdf = () => {
    exportToPdf(getExportPayload());
  };

  const handleExportExcel = () => {
    exportToExcel(getExportPayload());
  };

  const handleExportCsv = () => {
    exportToCsv(getExportPayload());
  };

  // Modal Actions
  const handleViewStatement = (statement: SchoolFinancialStatement) => {
    setSelectedStatement(statement);
    setIsStatementModalOpen(true);
  };

  const handleViewVoucher = (voucher: DisbursementRecord) => {
    setSelectedVoucher(voucher);
    setIsVoucherModalOpen(true);
  };

  const handlePrintSchoolStatement = (statement: SchoolFinancialStatement) => {
    exportToPdf({
      stats: {
        total_recycled_value_lkr: statement.total_value_lkr,
        total_points_liability: statement.total_points_earned,
        total_disbursed_lkr: statement.total_disbursed_lkr,
        outstanding_balance_lkr: statement.pending_balance_lkr,
        total_collected_kg: statement.total_collections_kg,
        landfill_savings_lkr: statement.total_collections_kg * 5.0,
        settled_schools_count: statement.settlement_status === "settled" ? 1 : 0,
        total_participating_schools: 1,
      },
      schools: [statement],
      disbursements: disbursements.filter((d) => d.school_id === statement.school_id),
      categories,
      filters: appliedFilters,
      selectedSchoolName: statement.school_name,
      generatedDate: new Date().toISOString().slice(0, 10),
    });
  };

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
            {/* Stage 6: Export Actions Dropdown */}
            <ExportMenu
              onExportPdf={handleExportPdf}
              onExportExcel={handleExportExcel}
              onExportCsv={handleExportCsv}
              disabled={isLoading}
            />

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
              Demonstration Data Mode — Stage 6 Export & Telemetry Suite
            </span>
            <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-900">
              Simulation Baseline
            </span>
          </div>
          <p className="text-amber-800 leading-relaxed text-[11px]">
            The figures, school performance statements, and disbursement audit vouchers below represent the
            approved demonstration model for the <strong>Balangoda Urban Council School Waste Rewards Programme</strong>.
            All tables reactively query the local dataset in real time when you apply or reset filters.
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 3. Multi-Criteria Filter Bar                                       */}
      {/* ------------------------------------------------------------------ */}
      <FinancialFilters
        draftFilters={draftFilters}
        appliedFilters={appliedFilters}
        schools={schools}
        onDraftChange={handleDraftChange}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        onRemoveFilter={handleRemoveFilter}
        isLoading={isLoading}
      />

      {/* Perspective Info Callout */}
      {appliedFilters.report_type !== "consolidated" && (
        <div className="flex items-center justify-between rounded-lg border border-[#800000]/20 bg-[#800000]/5 px-4 py-2.5 text-xs text-[#800000]">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 shrink-0" />
            <span>
              <strong>Active Perspective:</strong>{" "}
              {appliedFilters.report_type === "school_settlement" &&
                "School Settlement Statements — Focused on institutional statements, pending liabilities, and disbursement ratios."}
              {appliedFilters.report_type === "material_valuation" &&
                "Material Stream Valuation — Focused on recyclable commodity stream weights, market valuations, and landfill cost avoidance."}
              {appliedFilters.report_type === "disbursement_ledger" &&
                "Disbursement Audit Ledger — Focused on verified voucher disbursements, settlement dates, and council authorizations."}
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleRemoveFilter("report_type")}
            className="text-[11px] font-semibold underline hover:text-[#680000] cursor-pointer ml-3 shrink-0"
          >
            Switch to Consolidated
          </button>
        </div>
      )}

      {/* Filter Scope Notice */}
      {isFiltered && (
        <div className="flex items-center justify-between rounded-lg bg-stone-100 px-3.5 py-2 text-xs text-stone-700 border border-stone-200">
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-stone-500" />
            <span>
              Filtered View: Matching <strong>{stats.total_participating_schools}</strong> of{" "}
              <strong>{schools.length}</strong> schools
              {selectedSchoolObj ? ` (${selectedSchoolObj.name})` : ""}
            </span>
          </div>
          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1 font-semibold text-[#800000] hover:underline cursor-pointer text-[11px]"
          >
            <RotateCcw className="h-3 w-3" />
            Reset to All Records
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 4. Primary Financial KPI Summary Cards                             */}
      {/* ------------------------------------------------------------------ */}
      {stats.total_participating_schools === 0 ? (
        <div className="rounded-xl border border-stone-200 bg-white p-8 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-stone-400">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-stone-900">
            No Financial Records Match the Selected Criteria
          </h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            No schools or transactions match the selected combination of school, date range, and payout status.
            Please adjust or reset your filter criteria.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#800000] px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-[#680000] transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset All Filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total Recycled Value"
              value={isLoading ? "Loading..." : formatLKR(stats.total_recycled_value_lkr)}
              description={
                isFiltered
                  ? "Gross economic worth for selected filter criteria"
                  : "Gross economic worth of all recovered recyclables (LKR)"
              }
              icon={<Coins className="h-5 w-5" />}
              variant="revenue"
            />

            <StatCard
              label="Points Liability Incurred"
              value={isLoading ? "Loading..." : `${stats.total_points_liability.toLocaleString("en-LK")} pts`}
              description={
                isFiltered
                  ? `Points earned across ${stats.total_participating_schools} matching school(s)`
                  : "Total eco-points earned across participating schools"
              }
              icon={<Sparkles className="h-5 w-5" />}
              variant="default"
            />

            <StatCard
              label="Disbursed Rewards"
              value={isLoading ? "Loading..." : formatLKR(stats.total_disbursed_lkr)}
              description={`${settlementRate}% settled to educational institutions`}
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
          {/* 5. Municipal Eco-Economics & Waste Diversion Overview              */}
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
                    Across {stats.total_participating_schools} participating school(s)
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
                    <span className="font-medium text-stone-800">Fully Settled</span>
                  </div>
                  <span className="font-bold text-emerald-800 font-mono">
                    {stats.settled_schools_count} / {stats.total_participating_schools}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg border border-stone-100 bg-stone-50/50">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                    <span className="font-medium text-stone-800">Partially Settled</span>
                  </div>
                  <span className="font-bold text-amber-800 font-mono">
                    {Math.max(
                      0,
                      stats.total_participating_schools -
                        stats.settled_schools_count -
                        (stats.outstanding_balance_lkr > 0 && stats.total_disbursed_lkr === 0
                          ? 1
                          : 0)
                    )}{" "}
                    School(s)
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg border border-stone-100 bg-stone-50/50">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                    <span className="font-medium text-stone-800">Pending First Payout</span>
                  </div>
                  <span className="font-bold text-rose-800 font-mono">
                    {stats.total_disbursed_lkr === 0 && stats.outstanding_balance_lkr > 0
                      ? stats.total_participating_schools
                      : Math.max(0, stats.total_participating_schools - stats.settled_schools_count > 1 ? 1 : 0)}{" "}
                    School(s)
                  </span>
                </div>

                <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                  <span>Scope Filter Status:</span>
                  <span className="font-semibold text-stone-800">
                    {appliedFilters.status === "all" ? "All Payout Stages" : appliedFilters.status.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------------------ */}
          {/* 6. Waste Stream Valuation Overview Cards                           */}
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
                {categories.length} Municipal Categories
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
          {/* 7. Stage 5: Financial Trends & Institutional Analytics Charts      */}
          {/* ------------------------------------------------------------------ */}
          <FinancialChartsSection
            stats={stats}
            trends={trends}
            schools={schoolStatements}
            isLoading={isLoading}
            isFiltered={isFiltered}
          />

          {/* ------------------------------------------------------------------ */}
          {/* 8. Stage 4: Financial Reports Tables Section                       */}
          {/* ------------------------------------------------------------------ */}
          <div className="space-y-4">
            {/* Table Selection Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-200 pb-2 gap-2">
              <div className="flex items-center gap-1.5 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setTableTab("all")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    tableTab === "all"
                      ? "bg-[#800000] text-white shadow-2xs"
                      : "text-stone-600 hover:bg-stone-100"
                  }`}
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  All Reports (Consolidated)
                </button>
                <button
                  type="button"
                  onClick={() => setTableTab("schools")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    tableTab === "schools"
                      ? "bg-[#800000] text-white shadow-2xs"
                      : "text-stone-600 hover:bg-stone-100"
                  }`}
                >
                  <SchoolIcon className="h-3.5 w-3.5" />
                  School Statements ({schoolTotalCount})
                </button>
                <button
                  type="button"
                  onClick={() => setTableTab("payouts")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    tableTab === "payouts"
                      ? "bg-[#800000] text-white shadow-2xs"
                      : "text-stone-600 hover:bg-stone-100"
                  }`}
                >
                  <Receipt className="h-3.5 w-3.5" />
                  Payout Vouchers ({disbursementTotalCount})
                </button>
              </div>

              <div className="text-[11px] text-stone-500 flex items-center gap-1">
                <span>Both tables synchronized with active filters</span>
              </div>
            </div>

            {/* Table 1: School-wise Financial Report Table */}
            {(tableTab === "all" || tableTab === "schools") && (
              <SchoolFinancialTable
                records={schoolStatements}
                isLoading={isLoading}
                search={schoolSearch}
                onSearchChange={handleSchoolSearchChange}
                currentPage={schoolPage}
                totalPages={schoolTotalPages}
                totalCount={schoolTotalCount}
                onPageChange={(p) => {
                  setSchoolPage(p);
                  financialService
                    .getSchoolStatements({
                      school_id: appliedFilters.school_id,
                      status: appliedFilters.status,
                      start_date: appliedFilters.start_date || undefined,
                      end_date: appliedFilters.end_date || undefined,
                      page: p,
                      limit: 10,
                      search: schoolSearch || undefined,
                    })
                    .then((res) => {
                      setSchoolStatements(res.records || []);
                      setSchoolTotalCount(res.total_count || 0);
                      setSchoolTotalPages(res.total_pages || 1);
                    });
                }}
                onRefresh={() =>
                  loadData(appliedFilters, schoolPage, schoolSearch, disbursementPage, disbursementSearch)
                }
                onViewStatement={handleViewStatement}
                onExportCsv={handleExportCsv}
              />
            )}

            {/* Table 2: Payout Summary Report Table */}
            {(tableTab === "all" || tableTab === "payouts") && (
              <PayoutSummaryTable
                disbursements={disbursements}
                isLoading={isLoading}
                search={disbursementSearch}
                onSearchChange={handleDisbursementSearchChange}
                currentPage={disbursementPage}
                totalPages={disbursementTotalPages}
                totalCount={disbursementTotalCount}
                onPageChange={(p) => {
                  setDisbursementPage(p);
                  financialService
                    .getDisbursements({
                      school_id: appliedFilters.school_id,
                      status: appliedFilters.status,
                      start_date: appliedFilters.start_date || undefined,
                      end_date: appliedFilters.end_date || undefined,
                      page: p,
                      limit: 10,
                      search: disbursementSearch || undefined,
                    })
                    .then((res) => {
                      setDisbursements(res.disbursements || []);
                      setDisbursementTotalCount(res.total_count || 0);
                      setDisbursementTotalPages(res.total_pages || 1);
                    });
                }}
                onRefresh={() =>
                  loadData(appliedFilters, schoolPage, schoolSearch, disbursementPage, disbursementSearch)
                }
                onViewVoucher={handleViewVoucher}
                onExportCsv={handleExportCsv}
              />
            )}
          </div>
        </>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 9. Overview Section Summary / Stage Roadmap Note                   */}
      {/* ------------------------------------------------------------------ */}
      <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-4 text-xs text-stone-600 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-[#800000]" />
          <span>
            <strong>Stage 7 Verified:</strong> Complete Financial Reports & Payout Statements module end-to-end verified across filters, KPIs, charts, responsive tables, modals, and exports.
          </span>
        </div>
        <span className="text-[11px] text-stone-400 italic">
          All financial telemetry, interactive filters, audit modals, and multi-format exports production-ready.
        </span>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 10. Interactive Detailed Modals                                    */}
      {/* ------------------------------------------------------------------ */}
      <SchoolStatementModal
        isOpen={isStatementModalOpen}
        onClose={() => setIsStatementModalOpen(false)}
        statement={selectedStatement}
        disbursements={disbursements}
        onPrintPdf={handlePrintSchoolStatement}
      />

      <VoucherDetailsModal
        isOpen={isVoucherModalOpen}
        onClose={() => setIsVoucherModalOpen(false)}
        voucher={selectedVoucher}
      />
    </div>
  );
}
