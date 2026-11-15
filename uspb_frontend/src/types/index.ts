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
  is_active: boolean;
  must_change_password: boolean;
  created_at: string;
  updated_at?: string;
}

export interface AuthResponse {
  user: User;
  csrf_token?: string;
}

export interface AuditLog {
  id: number;
  actor_user_id?: number | null;
  action: string;
  target_type: string;
  target_id: string;
  ip_address: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface AuditLogPage {
  logs: AuditLog[];
  total: number;
  page: number;
  limit: number;
}

export interface School {
  id: number;
  name: string;
  code: string;
  address: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ActiveSession {
  id: string;
  user_id: number;
  username: string;
  role: UserRole;
  user_agent: string;
  ip_address: string;
  created_at: string;
  expires_at: string;
}

export interface CreateUserInput {
  name: string;
  username: string;
  temporary_password: string;
  role: UserRole;
  school_id?: number | null;
}

export interface UpdateUserInput {
  name?: string;
  role?: UserRole;
  school_id?: number | null;
  is_active?: boolean;
}

export interface GarbageFeeRecord {
  id: string;
  tax_payer_name: string;
  ward_no: string;
  assessment_no: string;
  amount: number;
  status: "paid" | "pending" | "overdue";
  period: string;
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

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}
