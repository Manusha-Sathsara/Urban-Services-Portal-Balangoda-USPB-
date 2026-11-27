// USPB Core Domain Models matching Go Backend Structs

export type UserRole =
  | "ADMIN"
  | "FEE_OFFICER"
  | "ENV_OFFICER"
  | "GARBAGE_SUPERVISOR"
  | "TEACHER";

export interface User {
  id: number;
  name: string;
  username: string;
  role: UserRole;
  school_id?: number | null;
  created_at: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface GarbageFeeRecord {
  id: string;
  tax_payer_name: string;
  ward_no: string;
  assessment_no: string;
  amount: number;
  status: "paid" | "pending" | "overdue";
  period: string; // e.g. "2026-Q1"
  paid_at?: string;
  created_at: string;
}

export interface EnvironmentalCert {
  id: string;
  business_name: string;
  registration_no: string;
  applicant_name: string;
  category: string;
  status: "submitted" | "inspected" | "approved" | "rejected";
  expiry_date?: string;
  created_at: string;
  updated_at: string;
}

export interface SchoolReward {
  id: string;
  school_name: string;
  waste_type: "plastic" | "paper" | "electronic" | "organic";
  quantity_kg: number;
  points_earned: number;
  recorded_by: string;
  created_at: string;
}

export interface School {
  id: number;
  school_name: string;
  school_code: string;
  address: string;
  contact_number: string;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
  student_count?: number | null;
}

export interface CreateSchoolDto {
  school_name: string;
  school_code: string;
  address: string;
  contact_number: string;
  status?: "active" | "inactive";
}

export interface UpdateSchoolDto {
  school_name: string;
  school_code: string;
  address: string;
  contact_number: string;
  status: "active" | "inactive";
}

export interface SchoolListResult {
  schools: School[];
  total_count: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface SchoolStats {
  total_registered: number;
  active_schools: number;
  inactive_schools: number;
  program_coverage: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// Waste Category Management Domain Models
export interface WasteCategory {
  id: number;
  name: string;
  description: string;
  measurement_unit: string;
  current_points_per_unit: number;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
  total_collections?: number;
}

export interface CategoryRateHistory {
  id: number;
  category_id: number;
  points_per_unit: number;
  effective_from: string;
  effective_to?: string | null;
  reason: string;
  changed_by: string;
  created_at: string;
}

export interface CreateCategoryDto {
  name: string;
  description: string;
  measurement_unit: string;
  points_per_unit: number;
  status?: "active" | "inactive";
}

export interface UpdateCategoryDto {
  name: string;
  description: string;
  measurement_unit: string;
  status: "active" | "inactive";
}

export interface UpdateRateDto {
  points_per_unit: number;
  reason: string;
}

export interface CategoryListResult {
  categories: WasteCategory[];
  total_count: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface CategoryStats {
  total_categories: number;
  active_categories: number;
  inactive_categories: number;
  average_rate: number;
}

// Badge Management Domain Models
export interface BadgeDefinition {
  id: number;
  name: string;
  description: string;
  icon_name: string;
  milestone_threshold: number;
  eligibility_metric: "lifetime_earned" | "available_points";
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
  award_count: number;
}

export interface BadgeThresholdHistory {
  id: number;
  badge_id: number;
  milestone_threshold: number;
  eligibility_metric: "lifetime_earned" | "available_points";
  effective_from: string;
  effective_to?: string | null;
  reason: string;
  changed_by: string;
  created_at: string;
}

export interface StudentEligibility {
  student_id: number;
  student_identifier: string;
  student_name: string;
  school_id: number;
  school_name: string;
  grade: string;
  badge_id: number;
  badge_name: string;
  badge_icon: string;
  milestone_threshold: number;
  eligibility_metric: "lifetime_earned" | "available_points";
  qualifying_points: number;
  is_eligible: boolean;
  is_awarded: boolean;
  award_id?: number | null;
  award_reference?: string | null;
  award_date?: string | null;
}

export interface StudentBadgeAward {
  id: number;
  award_reference: string;
  student_id: number;
  student_name: string;
  student_identifier: string;
  school_id: number;
  school_name: string;
  grade: string;
  badge_id: number;
  badge_name: string;
  badge_icon: string;
  qualifying_points: number;
  threshold_at_award: number;
  award_date: string;
  awarded_by: string;
  notes: string;
  status: "awarded" | "revoked";
  created_at: string;
  updated_at: string;
}

export interface BadgeStats {
  total_badges: number;
  active_badges: number;
  inactive_badges: number;
  total_awards: number;
}

export interface CreateBadgeDto {
  name: string;
  description: string;
  icon_name: string;
  milestone_threshold: number;
  eligibility_metric: "lifetime_earned" | "available_points";
  status?: "active" | "inactive";
}

export interface UpdateBadgeDto {
  name: string;
  description: string;
  icon_name: string;
  status: "active" | "inactive";
}

export interface UpdateThresholdDto {
  milestone_threshold: number;
  eligibility_metric: "lifetime_earned" | "available_points";
  reason: string;
}

export interface CreateAwardDto {
  student_id: number;
  badge_id: number;
  award_date?: string;
  notes?: string;
}

export interface UpdateAwardStatusDto {
  status: "awarded" | "revoked";
  reason?: string;
  notes?: string;
}

export interface TakeBackAwardDto {
  award_id?: number;
  student_id?: number;
  badge_id?: number;
  reason: string;
  hard_delete?: boolean;
}

export interface BadgeListResult {
  badges: BadgeDefinition[];
  total_count: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface EligibilityListResult {
  records: StudentEligibility[];
  total_count: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface AwardListResult {
  awards: StudentBadgeAward[];
  total_count: number;
  page: number;
  limit: number;
  total_pages: number;
}

// ==========================================
// FINANCIAL REPORTS MODULE TYPES
// ==========================================

export interface FinancialStats {
  total_recycled_value_lkr: number;
  total_points_liability: number;
  total_disbursed_lkr: number;
  outstanding_balance_lkr: number;
  total_collected_kg: number;
  landfill_savings_lkr: number;
  settled_schools_count: number;
  total_participating_schools: number;
}

export type SettlementStatus = "settled" | "partial" | "pending";

export interface SchoolFinancialStatement {
  school_id: number;
  school_code: string;
  school_name: string;
  contact_number: string;
  principal_name: string;
  total_collections_kg: number;
  total_points_earned: number;
  total_value_lkr: number;
  total_disbursed_lkr: number;
  pending_balance_lkr: number;
  settlement_status: SettlementStatus;
  last_collection_date?: string | null;
  last_disbursement_date?: string | null;
}

export interface CategoryValuation {
  category_id: number;
  category_name: string;
  measurement_unit: string;
  current_rate: number;
  total_weight_kg: number;
  total_value_lkr: number;
  volume_share_percentage: number;
  value_share_percentage: number;
}

export type PaymentMethod = "bank_transfer" | "cheque" | "eco_grant" | "cash_voucher";
export type DisbursementStatus = "pending" | "approved" | "disbursed" | "rejected";

export interface DisbursementRecord {
  id: number;
  voucher_reference: string;
  school_id: number;
  school_name: string;
  school_code: string;
  points_redeemed: number;
  amount_lkr: number;
  payment_method: PaymentMethod;
  disbursement_date: string;
  status: DisbursementStatus;
  authorized_by: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateDisbursementDto {
  school_id: number;
  points_to_redeem: number;
  amount_lkr: number;
  payment_method: PaymentMethod;
  disbursement_date?: string;
  notes?: string;
}

export interface FinancialFilterParams {
  school_id?: number;
  status?: string;
  start_date?: string;
  end_date?: string;
  report_type?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface SchoolFinancialListResult {
  records: SchoolFinancialStatement[];
  total_count: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface DisbursementListResult {
  disbursements: DisbursementRecord[];
  total_count: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface CategoryValuationListResult {
  categories: CategoryValuation[];
  total_weight_kg: number;
  total_value_lkr: number;
}


