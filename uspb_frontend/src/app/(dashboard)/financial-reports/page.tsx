"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CategoryValuation,
  DisbursementRecord,
  FinancialStats,
  SchoolFinancialStatement,
  SettlementStatus,
} from "@/types";
import financialService from "@/services/financialService";
import { StatCard } from "@/components/shared/StatCard";
import {
  BarChart3,
  Coins,
  TrendingUp,
  CreditCard,
  Clock,
  CheckCircle2,
  AlertCircle,
  Download,
  RotateCcw,
  Search,
  School as SchoolIcon,
  Recycle,
  Receipt,
  Eye,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Building2,
  Calendar,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";

type ActiveTab = "schools" | "categories" | "disbursements";

// Currency formatter
function formatLKR(amount: number): string {
  return `LKR ${amount.toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function FinancialReportsPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("schools");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Global Financial KPIs
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

  // Tab 1: School Statements State
  const [schoolStatements, setSchoolStatements] = useState<SchoolFinancialStatement[]>([]);
  const [schoolSearch, setSchoolSearch] = useState("");
  const [settlementFilter, setSettlementFilter] = useState<string>("all");
  const [schoolPage, setSchoolPage] = useState(1);
  const [schoolTotalPages, setSchoolTotalPages] = useState(1);
  const [schoolTotalCount, setSchoolTotalCount] = useState(0);

  // Tab 2: Category Valuation State
  const [categoryValuations, setCategoryValuations] = useState<CategoryValuation[]>([]);
  const [totalCategoryWeight, setTotalCategoryWeight] = useState(0);
  const [totalCategoryValue, setTotalCategoryValue] = useState(0);

  // Tab 3: Disbursements State
  const [disbursements, setDisbursements] = useState<DisbursementRecord[]>([]);
  const [disbursementSearch, setDisbursementSearch] = useState("");
  const [disbursementStatusFilter, setDisbursementStatusFilter] = useState("all");
  const [disbursementPage, setDisbursementPage] = useState(1);
  const [disbursementTotalPages, setDisbursementTotalPages] = useState(1);
  const [disbursementTotalCount, setDisbursementTotalCount] = useState(0);

  // Modal / Inspection state (for Stage 1 layout inspection)
  const [selectedSchoolStatement, setSelectedSchoolStatement] = useState<SchoolFinancialStatement | null>(null);
  const [selectedDisbursement, setSelectedDisbursement] = useState<DisbursementRecord | null>(null);

  // Auto-dismiss notification
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Fetch KPI Stats
  const fetchStats = useCallback(async () => {
    try {
      const data = await financialService.getFinancialStats();
      setStats(data);
    } catch (err: unknown) {
      console.warn("Failed to load financial statistics:", err);
    }
  }, []);

  // Fetch School Statements (Tab 1)
  const fetchSchoolStatements = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await financialService.getSchoolStatements({
        search: schoolSearch.trim() || undefined,
        status: settlementFilter !== "all" ? settlementFilter : undefined,
        page: schoolPage,
        limit: 10,
      });
      setSchoolStatements(result.records || []);
      setSchoolTotalPages(result.total_pages || 1);
      setSchoolTotalCount(result.total_count || 0);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load school statements");
      setSchoolStatements([]);
    } finally {
      setIsLoading(false);
    }
  }, [schoolSearch, settlementFilter, schoolPage]);

  // Fetch Category Valuations (Tab 2)
  const fetchCategoryValuations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await financialService.getCategoryValuation();
      setCategoryValuations(result.categories || []);
      setTotalCategoryWeight(result.total_weight_kg || 0);
      setTotalCategoryValue(result.total_value_lkr || 0);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load category valuation report");
      setCategoryValuations([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch Disbursements (Tab 3)
  const fetchDisbursements = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await financialService.getDisbursements({
        search: disbursementSearch.trim() || undefined,
        status: disbursementStatusFilter !== "all" ? disbursementStatusFilter : undefined,
        page: disbursementPage,
        limit: 10,
      });
      setDisbursements(result.disbursements || []);
      setDisbursementTotalPages(result.total_pages || 1);
      setDisbursementTotalCount(result.total_count || 0);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load disbursements ledger");
      setDisbursements([]);
    } finally {
      setIsLoading(false);
    }
  }, [disbursementSearch, disbursementStatusFilter, disbursementPage]);

  // Initial load
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Tab-dependent load
  useEffect(() => {
    if (activeTab === "schools") {
      fetchSchoolStatements();
    } else if (activeTab === "categories") {
      fetchCategoryValuations();
    } else if (activeTab === "disbursements") {
      fetchDisbursements();
    }
  }, [activeTab, fetchSchoolStatements, fetchCategoryValuations, fetchDisbursements]);

  // Export CSV handler
  const handleExportCsv = async () => {
    try {
      await financialService.exportFinancialCsv({
        search: activeTab === "schools" ? schoolSearch : disbursementSearch,
        status: activeTab === "schools" ? settlementFilter : disbursementStatusFilter,
      });
      setSuccessMessage("Financial statement CSV exported successfully.");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to export financial report");
    }
  };

  // Helper for Settlement Badge
  const renderSettlementBadge = (status: SettlementStatus) => {
    switch (status) {
      case "settled":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3" /> Fully Settled
          </span>
        );
      case "partial":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
            <Clock className="h-3 w-3" /> Partially Settled
          </span>
        );
      case "pending":
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 border border-rose-200">
            <AlertCircle className="h-3 w-3" /> Outstanding
          </span>
        );
    }
  };

  // Helper for Payment Method Label
  const formatPaymentMethod = (method: string) => {
    switch (method) {
      case "bank_transfer":
        return "Bank Direct Transfer";
      case "cheque":
        return "Municipal Cheque";
      case "eco_grant":
        return "Eco-Equipment Grant";
      case "cash_voucher":
        return "Redemption Cash Voucher";
      default:
        return method;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-md bg-[#800000]/10 px-2.5 py-0.5 text-xs font-semibold text-[#800000] mb-2">
            <span>MUNICIPAL ADMINISTRATION</span>
            <span className="text-[#800000]/40">•</span>
            <span className="text-stone-600 font-normal">School Waste Rewards</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 font-serif">
            Financial Reports & Payout Statements
          </h1>
          <p className="text-xs text-stone-500 mt-1 max-w-3xl leading-relaxed">
            Audit municipal recyclable waste economic valuation, monitor educational eco-reward liabilities,
            inspect school-by-school payout statements, and authorize official Urban Council financial disbursements.
          </p>
        </div>

        {/* Global Header Actions */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={fetchStats}
            className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition shadow-2xs cursor-pointer"
            title="Refresh financial data"
          >
            <RotateCcw className="h-3.5 w-3.5 text-stone-500" />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#800000] px-4 py-2 text-xs font-semibold text-white hover:bg-[#680000] transition shadow-xs cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="flex items-center justify-between rounded-xl bg-rose-50 p-4 text-xs text-rose-800 border border-rose-200 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-rose-500 hover:text-rose-700 p-1 rounded"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center justify-between rounded-xl bg-emerald-50 p-4 text-xs text-emerald-800 border border-emerald-200 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-500 hover:text-emerald-700 p-1 rounded"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Municipal Financial KPI Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Recycled Value"
          value={formatLKR(stats.total_recycled_value_lkr)}
          description="Gross economic worth of all recovered recyclables"
          icon={<Coins className="h-5 w-5" />}
          variant="revenue"
        />

        <StatCard
          label="Points Liability Incurred"
          value={`${stats.total_points_liability.toLocaleString("en-LK")} pts`}
          description="Total eco-points earned across participating schools"
          icon={<Sparkles className="h-5 w-5" />}
          variant="default"
        />

        <StatCard
          label="Disbursed Rewards"
          value={formatLKR(stats.total_disbursed_lkr)}
          description={`${stats.settled_schools_count} of ${stats.total_participating_schools} schools settled with council grants`}
          icon={<CheckCircle2 className="h-5 w-5" />}
          variant="success"
        />

        <StatCard
          label="Outstanding Balance"
          value={formatLKR(stats.outstanding_balance_lkr)}
          description="Accrued rewards liability pending council disbursement"
          icon={<AlertCircle className="h-5 w-5" />}
          variant="warning"
        />
      </div>

      {/* Council Eco-Economics Banner */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 rounded-xl border border-[#dcc6c4] bg-[#fbf8f7] p-4 text-xs text-stone-700">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#800000]/10 text-[#800000]">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-bold text-stone-900">
              Municipal Waste Diversion Impact & Council Savings
            </h4>
            <p className="text-[11px] text-stone-500">
              Total waste diverted:{" "}
              <strong className="text-stone-800">
                {stats.total_collected_kg.toLocaleString("en-LK")} kg
              </strong>{" "}
              • Landfill management cost avoidance:{" "}
              <strong className="text-emerald-700">
                {formatLKR(stats.landfill_savings_lkr)}
              </strong>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
          <span className="inline-flex items-center gap-1 font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
            <ShieldCheck className="h-3.5 w-3.5" />
            Audit Ready
          </span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-stone-200">
        <nav className="-mb-px flex space-x-6" aria-label="Financial Report Sections">
          <button
            onClick={() => setActiveTab("schools")}
            className={`flex items-center gap-2 py-3 px-1 border-b-2 text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === "schools"
                ? "border-[#800000] text-[#800000]"
                : "border-transparent text-stone-500 hover:text-stone-800 hover:border-stone-300"
            }`}
          >
            <SchoolIcon className="h-4 w-4" />
            <span>School Financial Statements</span>
            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] text-stone-600">
              {stats.total_participating_schools}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("categories")}
            className={`flex items-center gap-2 py-3 px-1 border-b-2 text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === "categories"
                ? "border-[#800000] text-[#800000]"
                : "border-transparent text-stone-500 hover:text-stone-800 hover:border-stone-300"
            }`}
          >
            <Recycle className="h-4 w-4" />
            <span>Category Material Valuation</span>
          </button>

          <button
            onClick={() => setActiveTab("disbursements")}
            className={`flex items-center gap-2 py-3 px-1 border-b-2 text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === "disbursements"
                ? "border-[#800000] text-[#800000]"
                : "border-transparent text-stone-500 hover:text-stone-800 hover:border-stone-300"
            }`}
          >
            <Receipt className="h-4 w-4" />
            <span>Disbursement & Payout Ledger</span>
          </button>
        </nav>
      </div>

      {/* ================================================================== */}
      {/* TAB 1: SCHOOL FINANCIAL STATEMENTS                                 */}
      {/* ================================================================== */}
      {activeTab === "schools" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-stone-200">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
              <input
                type="text"
                value={schoolSearch}
                onChange={(e) => {
                  setSchoolSearch(e.target.value);
                  setSchoolPage(1);
                }}
                placeholder="Search by school name or municipal code..."
                className="w-full rounded-lg border border-stone-200 pl-9 pr-8 py-1.5 text-xs text-stone-900 placeholder-stone-400 focus:border-[#800000] focus:ring-1 focus:ring-[#800000] focus:outline-hidden"
              />
              {schoolSearch && (
                <button
                  onClick={() => setSchoolSearch("")}
                  className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-600 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5 text-stone-400" />
                <span className="text-xs text-stone-500">Status:</span>
              </div>
              <select
                value={settlementFilter}
                onChange={(e) => {
                  setSettlementFilter(e.target.value);
                  setSchoolPage(1);
                }}
                className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 shadow-2xs focus:border-[#800000] focus:ring-1 focus:ring-[#800000] cursor-pointer"
              >
                <option value="all">All Settlement Statuses</option>
                <option value="settled">Fully Settled</option>
                <option value="partial">Partially Settled</option>
                <option value="pending">Outstanding / Pending</option>
              </select>

              {(schoolSearch || settlementFilter !== "all") && (
                <button
                  onClick={() => {
                    setSchoolSearch("");
                    setSettlementFilter("all");
                    setSchoolPage(1);
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs text-stone-600 hover:bg-stone-100 transition cursor-pointer"
                >
                  <X className="h-3 w-3" />
                  <span>Clear</span>
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-stone-600">
                <thead className="border-b border-stone-200 bg-stone-50/80 text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                  <tr>
                    <th scope="col" className="px-4 py-3">
                      School Identity
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Total Collected
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Points Earned
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Recycled Worth (LKR)
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Disbursed (LKR)
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Outstanding (LKR)
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Settlement Status
                    </th>
                    <th scope="col" className="px-4 py-3 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-stone-100">
                  {isLoading ? (
                    Array.from({ length: 4 }).map((_, idx) => (
                      <tr key={idx} className="animate-pulse">
                        <td className="px-4 py-3.5">
                          <div className="h-4 w-36 bg-stone-200 rounded mb-1" />
                          <div className="h-3 w-20 bg-stone-100 rounded" />
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="h-4 w-16 bg-stone-100 rounded" />
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="h-4 w-20 bg-stone-100 rounded" />
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="h-4 w-24 bg-stone-200 rounded" />
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="h-4 w-24 bg-stone-100 rounded" />
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="h-4 w-24 bg-stone-200 rounded" />
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="h-5 w-20 bg-stone-100 rounded-full" />
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="h-6 w-8 bg-stone-100 rounded ml-auto" />
                        </td>
                      </tr>
                    ))
                  ) : schoolStatements.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-stone-500">
                        <SchoolIcon className="mx-auto h-8 w-8 text-stone-300 mb-2" />
                        <p className="text-sm font-semibold text-stone-800">
                          No school statements found
                        </p>
                        <p className="text-xs text-stone-400 mt-0.5">
                          Try adjusting your search criteria or settlement status filter.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    schoolStatements.map((s) => (
                      <tr key={s.school_id} className="hover:bg-stone-50/70 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-stone-900">{s.school_name}</div>
                          <div className="flex items-center gap-2 text-[11px] text-stone-400 font-mono mt-0.5">
                            <span>{s.school_code}</span>
                            <span>•</span>
                            <span className="font-sans text-stone-500">{s.principal_name}</span>
                          </div>
                        </td>

                        <td className="px-4 py-3.5 font-medium text-stone-700">
                          {s.total_collections_kg.toLocaleString("en-LK")} kg
                        </td>

                        <td className="px-4 py-3.5 font-semibold text-[#800000]">
                          {s.total_points_earned.toLocaleString("en-LK")} pts
                        </td>

                        <td className="px-4 py-3.5 font-bold text-stone-900">
                          {formatLKR(s.total_value_lkr)}
                        </td>

                        <td className="px-4 py-3.5 font-semibold text-emerald-700">
                          {formatLKR(s.total_disbursed_lkr)}
                        </td>

                        <td className="px-4 py-3.5 font-bold text-rose-700">
                          {formatLKR(s.pending_balance_lkr)}
                        </td>

                        <td className="px-4 py-3.5">{renderSettlementBadge(s.settlement_status)}</td>

                        <td className="px-4 py-3.5 text-right">
                          <button
                            onClick={() => setSelectedSchoolStatement(s)}
                            className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-50 hover:text-stone-900 transition shadow-2xs cursor-pointer"
                            title="Inspect complete school statement"
                          >
                            <Eye className="h-3.5 w-3.5 text-stone-500" />
                            <span>Statement</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-stone-200 bg-stone-50/60 px-4 py-3 text-xs text-stone-600">
              <div>
                Showing{" "}
                <span className="font-semibold text-stone-900">
                  {schoolStatements.length > 0 ? (schoolPage - 1) * 10 + 1 : 0}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-stone-900">
                  {Math.min(schoolPage * 10, schoolTotalCount)}
                </span>{" "}
                of <span className="font-semibold text-stone-900">{schoolTotalCount}</span>{" "}
                participating schools
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setSchoolPage((p) => Math.max(p - 1, 1))}
                  disabled={schoolPage <= 1 || isLoading}
                  className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Previous
                </button>
                <span className="px-2 font-medium text-stone-700">
                  Page {schoolPage} of {Math.max(1, schoolTotalPages)}
                </span>
                <button
                  onClick={() => setSchoolPage((p) => Math.min(p + 1, schoolTotalPages))}
                  disabled={schoolPage >= schoolTotalPages || isLoading}
                  className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* TAB 2: CATEGORY MATERIAL VALUATION                                 */}
      {/* ================================================================== */}
      {activeTab === "categories" && (
        <div className="space-y-4">
          {/* Summary Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-2xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                Gross Material Recovered
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-xl font-bold text-stone-900">
                  {totalCategoryWeight.toLocaleString("en-LK")}
                </span>
                <span className="text-xs text-stone-500 font-medium">kg total</span>
              </div>
            </div>

            <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-2xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                Gross Material Value
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-xl font-bold text-[#800000]">
                  {formatLKR(totalCategoryValue)}
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-2xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                Top Volume Category
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-xl font-bold text-emerald-800">Plastic & PET</span>
                <span className="text-xs text-emerald-600 font-medium">(43.9% share)</span>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-stone-600">
                <thead className="border-b border-stone-200 bg-stone-50/80 text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                  <tr>
                    <th scope="col" className="px-4 py-3">
                      Recyclable Category
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Measurement Unit
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Rate (pts/kg)
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Total Volume (kg)
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Material Valuation (LKR)
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Volume Share
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Economic Value Share
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-stone-100">
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, idx) => (
                      <tr key={idx} className="animate-pulse">
                        <td className="px-4 py-3.5">
                          <div className="h-4 w-32 bg-stone-200 rounded" />
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="h-4 w-12 bg-stone-100 rounded" />
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="h-4 w-16 bg-stone-100 rounded" />
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="h-4 w-20 bg-stone-200 rounded" />
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="h-4 w-24 bg-stone-200 rounded" />
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="h-4 w-28 bg-stone-100 rounded" />
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="h-4 w-28 bg-stone-100 rounded" />
                        </td>
                      </tr>
                    ))
                  ) : categoryValuations.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-stone-500">
                        <Recycle className="mx-auto h-8 w-8 text-stone-300 mb-2" />
                        <p className="text-sm font-semibold text-stone-800">
                          No category valuation records
                        </p>
                      </td>
                    </tr>
                  ) : (
                    categoryValuations.map((c) => (
                      <tr key={c.category_id} className="hover:bg-stone-50/70 transition-colors">
                        <td className="px-4 py-3.5 font-bold text-stone-900">
                          {c.category_name}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-stone-500">
                          {c.measurement_unit}
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-[#800000]">
                          {c.current_rate.toFixed(2)} pts
                        </td>
                        <td className="px-4 py-3.5 font-medium text-stone-800">
                          {c.total_weight_kg.toLocaleString("en-LK")} kg
                        </td>
                        <td className="px-4 py-3.5 font-bold text-stone-900">
                          {formatLKR(c.total_value_lkr)}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 rounded-full bg-stone-100 overflow-hidden">
                              <div
                                className="h-full bg-stone-600 rounded-full"
                                style={{ width: `${Math.min(c.volume_share_percentage, 100)}%` }}
                              />
                            </div>
                            <span className="font-mono text-[11px] text-stone-600">
                              {c.volume_share_percentage}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 rounded-full bg-stone-100 overflow-hidden">
                              <div
                                className="h-full bg-[#800000] rounded-full"
                                style={{ width: `${Math.min(c.value_share_percentage, 100)}%` }}
                              />
                            </div>
                            <span className="font-mono text-[11px] text-[#800000] font-semibold">
                              {c.value_share_percentage}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* TAB 3: DISBURSEMENT & PAYOUT LEDGER                                */}
      {/* ================================================================== */}
      {activeTab === "disbursements" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-stone-200">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
              <input
                type="text"
                value={disbursementSearch}
                onChange={(e) => {
                  setDisbursementSearch(e.target.value);
                  setDisbursementPage(1);
                }}
                placeholder="Search by voucher reference, school code, or school name..."
                className="w-full rounded-lg border border-stone-200 pl-9 pr-8 py-1.5 text-xs text-stone-900 placeholder-stone-400 focus:border-[#800000] focus:ring-1 focus:ring-[#800000] focus:outline-hidden"
              />
              {disbursementSearch && (
                <button
                  onClick={() => setDisbursementSearch("")}
                  className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-600 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <select
                value={disbursementStatusFilter}
                onChange={(e) => {
                  setDisbursementStatusFilter(e.target.value);
                  setDisbursementPage(1);
                }}
                className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 shadow-2xs focus:border-[#800000] focus:ring-1 focus:ring-[#800000] cursor-pointer"
              >
                <option value="all">All Payout Statuses</option>
                <option value="disbursed">Disbursed / Paid</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending Approval</option>
              </select>

              {(disbursementSearch || disbursementStatusFilter !== "all") && (
                <button
                  onClick={() => {
                    setDisbursementSearch("");
                    setDisbursementStatusFilter("all");
                    setDisbursementPage(1);
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs text-stone-600 hover:bg-stone-100 transition cursor-pointer"
                >
                  <X className="h-3 w-3" />
                  <span>Clear</span>
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-stone-600">
                <thead className="border-b border-stone-200 bg-stone-50/80 text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                  <tr>
                    <th scope="col" className="px-4 py-3">
                      Voucher Reference
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Recipient School
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Points Redeemed
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Disbursed Amount (LKR)
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Payment Method
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Disbursement Date
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Status
                    </th>
                    <th scope="col" className="px-4 py-3 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-stone-100">
                  {isLoading ? (
                    Array.from({ length: 3 }).map((_, idx) => (
                      <tr key={idx} className="animate-pulse">
                        <td className="px-4 py-3.5">
                          <div className="h-4 w-28 bg-stone-200 rounded" />
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="h-4 w-40 bg-stone-200 rounded mb-1" />
                          <div className="h-3 w-16 bg-stone-100 rounded" />
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="h-4 w-16 bg-stone-100 rounded" />
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="h-4 w-24 bg-stone-200 rounded" />
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="h-4 w-24 bg-stone-100 rounded" />
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="h-4 w-20 bg-stone-100 rounded" />
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="h-5 w-20 bg-stone-100 rounded-full" />
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="h-6 w-8 bg-stone-100 rounded ml-auto" />
                        </td>
                      </tr>
                    ))
                  ) : disbursements.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-stone-500">
                        <Receipt className="mx-auto h-8 w-8 text-stone-300 mb-2" />
                        <p className="text-sm font-semibold text-stone-800">
                          No disbursement vouchers recorded
                        </p>
                      </td>
                    </tr>
                  ) : (
                    disbursements.map((d) => (
                      <tr key={d.id} className="hover:bg-stone-50/70 transition-colors">
                        <td className="px-4 py-3.5 font-mono font-bold text-[#800000]">
                          {d.voucher_reference}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-stone-900">{d.school_name}</div>
                          <div className="text-[11px] text-stone-400 font-mono">
                            {d.school_code}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 font-medium text-stone-700">
                          {d.points_redeemed.toLocaleString("en-LK")} pts
                        </td>
                        <td className="px-4 py-3.5 font-bold text-emerald-800">
                          {formatLKR(d.amount_lkr)}
                        </td>
                        <td className="px-4 py-3.5 text-stone-600">
                          {formatPaymentMethod(d.payment_method)}
                        </td>
                        <td className="px-4 py-3.5 text-stone-600">{d.disbursement_date}</td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="h-3 w-3" /> Disbursed
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <button
                            onClick={() => setSelectedDisbursement(d)}
                            className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition shadow-2xs cursor-pointer"
                            title="Inspect payment voucher certificate"
                          >
                            <Eye className="h-3.5 w-3.5 text-stone-500" />
                            <span>Voucher</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-stone-200 bg-stone-50/60 px-4 py-3 text-xs text-stone-600">
              <div>
                Showing{" "}
                <span className="font-semibold text-stone-900">
                  {disbursements.length > 0 ? (disbursementPage - 1) * 10 + 1 : 0}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-stone-900">
                  {Math.min(disbursementPage * 10, disbursementTotalCount)}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-stone-900">
                  {disbursementTotalCount}
                </span>{" "}
                disbursement vouchers
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setDisbursementPage((p) => Math.max(p - 1, 1))}
                  disabled={disbursementPage <= 1 || isLoading}
                  className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Previous
                </button>
                <span className="px-2 font-medium text-stone-700">
                  Page {disbursementPage} of {Math.max(1, disbursementTotalPages)}
                </span>
                <button
                  onClick={() => setDisbursementPage((p) => Math.min(p + 1, disbursementTotalPages))}
                  disabled={disbursementPage >= disbursementTotalPages || isLoading}
                  className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* STATEMENT PREVIEW MODAL (Stage 1 Inspection Modal)                 */}
      {/* ================================================================== */}
      {selectedSchoolStatement && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#800000]/10 text-[#800000]">
                  <SchoolIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900 font-serif">
                    {selectedSchoolStatement.school_name}
                  </h3>
                  <p className="text-xs text-stone-500 font-mono">
                    Code: {selectedSchoolStatement.school_code} • Principal:{" "}
                    {selectedSchoolStatement.principal_name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedSchoolStatement(null)}
                className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="my-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-3">
                  <span className="text-[11px] text-stone-500 font-semibold uppercase">
                    Recycled Volume
                  </span>
                  <p className="text-base font-bold text-stone-900 mt-0.5">
                    {selectedSchoolStatement.total_collections_kg.toLocaleString("en-LK")} kg
                  </p>
                </div>
                <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-3">
                  <span className="text-[11px] text-stone-500 font-semibold uppercase">
                    Eco-Points Earned
                  </span>
                  <p className="text-base font-bold text-[#800000] mt-0.5">
                    {selectedSchoolStatement.total_points_earned.toLocaleString("en-LK")} pts
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl border border-stone-200 bg-white p-3">
                  <span className="text-[10px] text-stone-400 font-semibold uppercase">
                    Total Value
                  </span>
                  <p className="text-sm font-bold text-stone-900 mt-0.5">
                    {formatLKR(selectedSchoolStatement.total_value_lkr)}
                  </p>
                </div>
                <div className="rounded-xl border border-stone-200 bg-white p-3">
                  <span className="text-[10px] text-stone-400 font-semibold uppercase">
                    Disbursed
                  </span>
                  <p className="text-sm font-bold text-emerald-700 mt-0.5">
                    {formatLKR(selectedSchoolStatement.total_disbursed_lkr)}
                  </p>
                </div>
                <div className="rounded-xl border border-stone-200 bg-white p-3">
                  <span className="text-[10px] text-stone-400 font-semibold uppercase">
                    Outstanding
                  </span>
                  <p className="text-sm font-bold text-rose-700 mt-0.5">
                    {formatLKR(selectedSchoolStatement.pending_balance_lkr)}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 text-xs text-stone-600 space-y-1">
                <div className="flex justify-between">
                  <span className="text-stone-400">Settlement Status:</span>
                  <span>{renderSettlementBadge(selectedSchoolStatement.settlement_status)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Last Collection Activity:</span>
                  <span className="font-medium text-stone-800">
                    {selectedSchoolStatement.last_collection_date || "None"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Last Council Disbursement:</span>
                  <span className="font-medium text-stone-800">
                    {selectedSchoolStatement.last_disbursement_date || "Pending"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end border-t border-stone-100 pt-3">
              <button
                onClick={() => setSelectedSchoolStatement(null)}
                className="rounded-lg bg-stone-900 px-4 py-2 text-xs font-semibold text-white hover:bg-stone-800 transition cursor-pointer"
              >
                Close Statement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* VOUCHER PREVIEW MODAL (Stage 1 Inspection Modal)                   */}
      {/* ================================================================== */}
      {selectedDisbursement && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#800000]/10 text-[#800000]">
                  <Receipt className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900 font-serif">
                    Disbursement Payment Voucher
                  </h3>
                  <p className="text-xs text-stone-500 font-mono">
                    Ref: {selectedDisbursement.voucher_reference}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDisbursement(null)}
                className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="my-4 space-y-3 text-xs">
              <div className="rounded-xl border border-stone-200 bg-stone-50/60 p-4 text-center">
                <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                  Amount Disbursed
                </span>
                <p className="text-2xl font-bold text-emerald-800 mt-1">
                  {formatLKR(selectedDisbursement.amount_lkr)}
                </p>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Equivalent to {selectedDisbursement.points_redeemed.toLocaleString("en-LK")} eco-points redeemed
                </p>
              </div>

              <div className="rounded-xl border border-stone-200 bg-white p-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-stone-400">Recipient School:</span>
                  <span className="font-semibold text-stone-900">
                    {selectedDisbursement.school_name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Payment Instrument:</span>
                  <span className="font-medium text-stone-800">
                    {formatPaymentMethod(selectedDisbursement.payment_method)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Disbursement Date:</span>
                  <span className="font-mono text-stone-800">
                    {selectedDisbursement.disbursement_date}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Authorizing Officer:</span>
                  <span className="font-mono text-stone-800">
                    {selectedDisbursement.authorized_by}
                  </span>
                </div>
                {selectedDisbursement.notes && (
                  <div className="pt-2 border-t border-stone-100">
                    <span className="text-stone-400 block mb-0.5">Voucher Purpose / Notes:</span>
                    <p className="italic text-stone-700 bg-stone-50 p-2 rounded-lg">
                      &ldquo;{selectedDisbursement.notes}&rdquo;
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end border-t border-stone-100 pt-3">
              <button
                onClick={() => setSelectedDisbursement(null)}
                className="rounded-lg bg-stone-900 px-4 py-2 text-xs font-semibold text-white hover:bg-stone-800 transition cursor-pointer"
              >
                Close Voucher
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
