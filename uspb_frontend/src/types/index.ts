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

