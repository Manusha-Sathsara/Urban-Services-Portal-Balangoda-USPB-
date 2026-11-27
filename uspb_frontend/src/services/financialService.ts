import api from "@/lib/api";
import {
  ApiResponse,
  CategoryValuationListResult,
  CreateDisbursementDto,
  DisbursementListResult,
  DisbursementRecord,
  FinancialFilterParams,
  FinancialStats,
  SchoolFinancialListResult,
  SchoolFinancialStatement,
} from "@/types";

// ============================================================================
// BASELINE DEMO DATA (For Stage 1 Layout & Testing Preview)
// ============================================================================

const BASELINE_FINANCIAL_STATS: FinancialStats = {
  total_recycled_value_lkr: 485250.0,
  total_points_liability: 323500.0,
  total_disbursed_lkr: 295000.0,
  outstanding_balance_lkr: 190250.0,
  total_collected_kg: 28450.0,
  landfill_savings_lkr: 142250.0,
  settled_schools_count: 2,
  total_participating_schools: 5,
};

const BASELINE_SCHOOL_STATEMENTS: SchoolFinancialStatement[] = [
  {
    school_id: 1,
    school_code: "SCH-001",
    school_name: "Balangoda Ananda Maithreya Central College",
    contact_number: "045-2287234",
    principal_name: "D.M. Bandara",
    total_collections_kg: 10450.0,
    total_points_earned: 125400.0,
    total_value_lkr: 188100.0,
    total_disbursed_lkr: 120000.0,
    pending_balance_lkr: 68100.0,
    settlement_status: "partial",
    last_collection_date: "2026-11-20",
    last_disbursement_date: "2026-10-15",
  },
  {
    school_id: 2,
    school_code: "SCH-002",
    school_name: "St. Agnes Convent Balangoda",
    contact_number: "045-2287345",
    principal_name: "Sr. Mary Fernando",
    total_collections_kg: 8120.0,
    total_points_earned: 97440.0,
    total_value_lkr: 146160.0,
    total_disbursed_lkr: 146160.0,
    pending_balance_lkr: 0.0,
    settlement_status: "settled",
    last_collection_date: "2026-11-22",
    last_disbursement_date: "2026-11-25",
  },
  {
    school_id: 3,
    school_code: "SCH-003",
    school_name: "Meddakanda Maha Vidyalaya",
    contact_number: "045-2287456",
    principal_name: "K.G. Jayasinghe",
    total_collections_kg: 4320.0,
    total_points_earned: 51840.0,
    total_value_lkr: 77760.0,
    total_disbursed_lkr: 28840.0,
    pending_balance_lkr: 48920.0,
    settlement_status: "partial",
    last_collection_date: "2026-11-18",
    last_disbursement_date: "2026-09-30",
  },
  {
    school_id: 4,
    school_code: "SCH-004",
    school_name: "Sri Shariputhra Maha Vidyalaya",
    contact_number: "045-2287567",
    principal_name: "W.M. Dharmadasa",
    total_collections_kg: 3560.0,
    total_points_earned: 42720.0,
    total_value_lkr: 64080.0,
    total_disbursed_lkr: 0.0,
    pending_balance_lkr: 64080.0,
    settlement_status: "pending",
    last_collection_date: "2026-11-15",
    last_disbursement_date: null,
  },
  {
    school_id: 5,
    school_code: "SCH-005",
    school_name: "Balangoda Tamil Maha Vidyalayam",
    contact_number: "045-2287678",
    principal_name: "S. Rajendran",
    total_collections_kg: 2000.0,
    total_points_earned: 6100.0,
    total_value_lkr: 9150.0,
    total_disbursed_lkr: 0.0,
    pending_balance_lkr: 9150.0,
    settlement_status: "pending",
    last_collection_date: "2026-11-12",
    last_disbursement_date: null,
  },
];

const BASELINE_CATEGORY_VALUATION: CategoryValuationListResult = {
  total_weight_kg: 28450.0,
  total_value_lkr: 485250.0,
  categories: [
    {
      category_id: 1,
      category_name: "Plastic & PET Bottles",
      measurement_unit: "kg",
      current_rate: 10.0,
      total_weight_kg: 12500.0,
      total_value_lkr: 187500.0,
      volume_share_percentage: 43.9,
      value_share_percentage: 38.6,
    },
    {
      category_id: 2,
      category_name: "Paper & Cardboard",
      measurement_unit: "kg",
      current_rate: 5.0,
      total_weight_kg: 9200.0,
      total_value_lkr: 69000.0,
      volume_share_percentage: 32.3,
      value_share_percentage: 14.2,
    },
    {
      category_id: 3,
      category_name: "Metal & Aluminium Cans",
      measurement_unit: "kg",
      current_rate: 15.0,
      total_weight_kg: 3450.0,
      total_value_lkr: 77625.0,
      volume_share_percentage: 12.1,
      value_share_percentage: 16.0,
    },
    {
      category_id: 4,
      category_name: "Glass Bottles",
      measurement_unit: "kg",
      current_rate: 3.0,
      total_weight_kg: 2300.0,
      total_value_lkr: 20700.0,
      volume_share_percentage: 8.1,
      value_share_percentage: 4.3,
    },
    {
      category_id: 5,
      category_name: "Electronic Waste (E-Waste)",
      measurement_unit: "kg",
      current_rate: 25.0,
      total_weight_kg: 1000.0,
      total_value_lkr: 130425.0,
      volume_share_percentage: 3.6,
      value_share_percentage: 26.9,
    },
  ],
};

const BASELINE_DISBURSEMENTS: DisbursementRecord[] = [
  {
    id: 1,
    voucher_reference: "VCH-2026-0001",
    school_id: 1,
    school_name: "Balangoda Ananda Maithreya Central College",
    school_code: "SCH-001",
    points_redeemed: 80000,
    amount_lkr: 120000.0,
    payment_method: "bank_transfer",
    disbursement_date: "2026-10-15",
    status: "disbursed",
    authorized_by: "supervisor@balangoda.uc.gov.lk",
    notes: "Q3 Recyclable Rewards grant for school botanical garden project",
    created_at: "2026-10-15T09:30:00Z",
    updated_at: "2026-10-15T09:30:00Z",
  },
  {
    id: 2,
    voucher_reference: "VCH-2026-0002",
    school_id: 2,
    school_name: "St. Agnes Convent Balangoda",
    school_code: "SCH-002",
    points_redeemed: 97440,
    amount_lkr: 146160.0,
    payment_method: "cheque",
    disbursement_date: "2026-11-25",
    status: "disbursed",
    authorized_by: "supervisor@balangoda.uc.gov.lk",
    notes: "Settlement of annual eco-rewards for composting barrels purchase",
    created_at: "2026-11-25T11:00:00Z",
    updated_at: "2026-11-25T11:00:00Z",
  },
  {
    id: 3,
    voucher_reference: "VCH-2026-0003",
    school_id: 3,
    school_name: "Meddakanda Maha Vidyalaya",
    school_code: "SCH-003",
    points_redeemed: 19226,
    amount_lkr: 28840.0,
    payment_method: "eco_grant",
    disbursement_date: "2026-09-30",
    status: "disbursed",
    authorized_by: "finance@balangoda.uc.gov.lk",
    notes: "Classroom colour-coded segregation bins distribution voucher",
    created_at: "2026-09-30T14:15:00Z",
    updated_at: "2026-09-30T14:15:00Z",
  },
];

// ============================================================================
// SERVICE API CLIENT
// ============================================================================

export const financialService = {
  /**
   * Fetch aggregated financial overview KPIs
   */
  async getFinancialStats(params: FinancialFilterParams = {}): Promise<FinancialStats> {
    try {
      const query = new URLSearchParams();
      if (params.school_id) query.append("school_id", params.school_id.toString());
      if (params.status && params.status !== "all") query.append("status", params.status);
      if (params.start_date) query.append("start_date", params.start_date);
      if (params.end_date) query.append("end_date", params.end_date);
      if (params.report_type) query.append("report_type", params.report_type);

      const response = await api.get<ApiResponse<FinancialStats>>(
        `/financial-reports/stats?${query.toString()}`
      );
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
    } catch {
      // Fallback for development & Stage 1-3 preview
    }

    let filteredSchools = [...BASELINE_SCHOOL_STATEMENTS];

    if (params.school_id) {
      filteredSchools = filteredSchools.filter((s) => s.school_id === Number(params.school_id));
    }

    if (params.status && params.status !== "all") {
      filteredSchools = filteredSchools.filter((s) => s.settlement_status === params.status);
    }

    if (params.start_date) {
      filteredSchools = filteredSchools.filter(
        (s) => !s.last_collection_date || s.last_collection_date >= params.start_date!
      );
    }

    if (params.end_date) {
      filteredSchools = filteredSchools.filter(
        (s) => !s.last_collection_date || s.last_collection_date <= params.end_date!
      );
    }

    const total_recycled_value_lkr = filteredSchools.reduce((acc, s) => acc + s.total_value_lkr, 0);
    const total_points_liability = filteredSchools.reduce((acc, s) => acc + s.total_points_earned, 0);
    const total_disbursed_lkr = filteredSchools.reduce((acc, s) => acc + s.total_disbursed_lkr, 0);
    const outstanding_balance_lkr = filteredSchools.reduce((acc, s) => acc + s.pending_balance_lkr, 0);
    const total_collected_kg = filteredSchools.reduce((acc, s) => acc + s.total_collections_kg, 0);
    const landfill_savings_lkr = total_collected_kg * 5.0;
    const settled_schools_count = filteredSchools.filter((s) => s.settlement_status === "settled").length;
    const total_participating_schools = filteredSchools.length;

    return {
      total_recycled_value_lkr,
      total_points_liability,
      total_disbursed_lkr,
      outstanding_balance_lkr,
      total_collected_kg,
      landfill_savings_lkr,
      settled_schools_count,
      total_participating_schools,
    };
  },

  /**
   * Fetch school financial performance statements
   */
  async getSchoolStatements(
    params: FinancialFilterParams = {}
  ): Promise<SchoolFinancialListResult> {
    try {
      const query = new URLSearchParams();
      if (params.school_id) query.append("school_id", params.school_id.toString());
      if (params.status && params.status !== "all") query.append("status", params.status);
      if (params.search) query.append("search", params.search);
      if (params.page) query.append("page", params.page.toString());
      if (params.limit) query.append("limit", params.limit.toString());

      const response = await api.get<ApiResponse<SchoolFinancialListResult>>(
        `/financial-reports/schools?${query.toString()}`
      );
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
    } catch {
      // Fallback for development & Stage 1 preview
    }

    let filtered = [...BASELINE_SCHOOL_STATEMENTS];
    if (params.search) {
      const q = params.search.toLowerCase().trim();
      filtered = filtered.filter(
        (s) =>
          s.school_name.toLowerCase().includes(q) ||
          s.school_code.toLowerCase().includes(q)
      );
    }
    if (params.status && params.status !== "all") {
      filtered = filtered.filter((s) => s.settlement_status === params.status);
    }
    if (params.school_id) {
      filtered = filtered.filter((s) => s.school_id === Number(params.school_id));
    }
    if (params.start_date) {
      filtered = filtered.filter(
        (s) => !s.last_collection_date || s.last_collection_date >= params.start_date!
      );
    }
    if (params.end_date) {
      filtered = filtered.filter(
        (s) => !s.last_collection_date || s.last_collection_date <= params.end_date!
      );
    }

    const page = params.page || 1;
    const limit = params.limit || 10;
    const totalCount = filtered.length;
    const totalPages = Math.ceil(totalCount / limit) || 1;
    const offset = (page - 1) * limit;

    return {
      records: filtered.slice(offset, offset + limit),
      total_count: totalCount,
      page,
      limit,
      total_pages: totalPages,
    };
  },

  /**
   * Fetch single school statement details
   */
  async getSchoolStatementById(id: number): Promise<SchoolFinancialStatement> {
    try {
      const response = await api.get<ApiResponse<SchoolFinancialStatement>>(
        `/financial-reports/schools/${id}`
      );
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
    } catch {
      // Fallback for development & Stage 1 preview
    }
    const found = BASELINE_SCHOOL_STATEMENTS.find((s) => s.school_id === id);
    if (found) return found;
    throw new Error("School financial record not found");
  },

  /**
   * Fetch category economic valuation breakdown
   */
  async getCategoryValuation(
    params: FinancialFilterParams = {}
  ): Promise<CategoryValuationListResult> {
    try {
      const query = new URLSearchParams();
      if (params.school_id) query.append("school_id", params.school_id.toString());
      if (params.start_date) query.append("start_date", params.start_date);
      if (params.end_date) query.append("end_date", params.end_date);

      const response = await api.get<ApiResponse<CategoryValuationListResult>>(
        `/financial-reports/categories?${query.toString()}`
      );
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
    } catch {
      // Fallback for development & Stage 1-3 preview
    }

    let filteredSchools = [...BASELINE_SCHOOL_STATEMENTS];
    if (params.school_id) {
      filteredSchools = filteredSchools.filter((s) => s.school_id === Number(params.school_id));
    }
    if (params.status && params.status !== "all") {
      filteredSchools = filteredSchools.filter((s) => s.settlement_status === params.status);
    }
    if (params.start_date) {
      filteredSchools = filteredSchools.filter(
        (s) => !s.last_collection_date || s.last_collection_date >= params.start_date!
      );
    }
    if (params.end_date) {
      filteredSchools = filteredSchools.filter(
        (s) => !s.last_collection_date || s.last_collection_date <= params.end_date!
      );
    }

    const baselineTotalWeight = BASELINE_CATEGORY_VALUATION.total_weight_kg;
    const total_collected_kg = filteredSchools.reduce((acc, s) => acc + s.total_collections_kg, 0);
    const ratio = baselineTotalWeight > 0 ? total_collected_kg / baselineTotalWeight : 1;

    const scaledCategories = BASELINE_CATEGORY_VALUATION.categories.map((c) => {
      const weight = Math.round(c.total_weight_kg * ratio * 10) / 10;
      const value = Math.round(c.total_value_lkr * ratio * 100) / 100;
      return {
        ...c,
        total_weight_kg: weight,
        total_value_lkr: value,
      };
    });

    const totalVal = scaledCategories.reduce((acc, c) => acc + c.total_value_lkr, 0);

    return {
      total_weight_kg: total_collected_kg,
      total_value_lkr: totalVal,
      categories: scaledCategories,
    };
  },

  /**
   * Fetch paginated list of payout disbursements
   */
  async getDisbursements(
    params: FinancialFilterParams = {}
  ): Promise<DisbursementListResult> {
    try {
      const query = new URLSearchParams();
      if (params.school_id) query.append("school_id", params.school_id.toString());
      if (params.status && params.status !== "all") query.append("status", params.status);
      if (params.search) query.append("search", params.search);
      if (params.page) query.append("page", params.page.toString());
      if (params.limit) query.append("limit", params.limit.toString());

      const response = await api.get<ApiResponse<DisbursementListResult>>(
        `/financial-reports/disbursements?${query.toString()}`
      );
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
    } catch {
      // Fallback for development & Stage 1 preview
    }

    let filtered = [...BASELINE_DISBURSEMENTS];
    if (params.search) {
      const q = params.search.toLowerCase().trim();
      filtered = filtered.filter(
        (d) =>
          d.school_name.toLowerCase().includes(q) ||
          d.voucher_reference.toLowerCase().includes(q) ||
          d.school_code.toLowerCase().includes(q)
      );
    }
    if (params.status && params.status !== "all") {
      filtered = filtered.filter((d) => d.status === params.status);
    }
    if (params.school_id) {
      filtered = filtered.filter((d) => d.school_id === params.school_id);
    }

    const page = params.page || 1;
    const limit = params.limit || 10;
    const totalCount = filtered.length;
    const totalPages = Math.ceil(totalCount / limit) || 1;
    const offset = (page - 1) * limit;

    return {
      disbursements: filtered.slice(offset, offset + limit),
      total_count: totalCount,
      page,
      limit,
      total_pages: totalPages,
    };
  },

  /**
   * Record and authorize a new reward payout disbursement
   */
  async createDisbursement(dto: CreateDisbursementDto): Promise<DisbursementRecord> {
    const response = await api.post<ApiResponse<DisbursementRecord>>(
      "/financial-reports/disbursements",
      dto
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || "Failed to record disbursement voucher");
    }
    return response.data.data;
  },

  /**
   * Export financial ledger as downloadable CSV
   */
  async exportFinancialCsv(params: FinancialFilterParams = {}): Promise<void> {
    const query = new URLSearchParams();
    if (params.school_id) query.append("school_id", params.school_id.toString());
    if (params.status && params.status !== "all") query.append("status", params.status);
    if (params.search) query.append("search", params.search);
    if (params.start_date) query.append("start_date", params.start_date);
    if (params.end_date) query.append("end_date", params.end_date);

    try {
      const response = await api.get(
        `/financial-reports/export/csv?${query.toString()}`,
        {
          responseType: "blob",
        }
      );

      const blob = new Blob([response.data], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `uspb_financial_statement_${new Date().toISOString().slice(0, 10)}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      // Create client-side export fallback for Stage 1 preview
      const headers = [
        "School Code,School Name,Total Weight (kg),Total Points,Total Value (LKR),Disbursed (LKR),Pending (LKR),Status",
      ];
      const rows = BASELINE_SCHOOL_STATEMENTS.map(
        (s) =>
          `"${s.school_code}","${s.school_name}",${s.total_collections_kg},${s.total_points_earned},${s.total_value_lkr},${s.total_disbursed_lkr},${s.pending_balance_lkr},"${s.settlement_status}"`
      );
      const csvContent = [headers, ...rows].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `uspb_financial_statement_${new Date().toISOString().slice(0, 10)}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    }
  },
};

export default financialService;
