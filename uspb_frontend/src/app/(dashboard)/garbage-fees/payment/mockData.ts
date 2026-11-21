/**
 * MOCK DATA — Payment Management (Garbage Collection Fee Management)
 *
 * Isolated temporary mock data for visual development and demonstration.
 * Reuses the registered business source from Business Management (MOCK_BUSINESSES).
 * Replace with real API responses once backend integration is available:
 * - GET  /api/v1/garbage-fees/payments
 * - POST /api/v1/garbage-fees/payments
 * - PUT  /api/v1/garbage-fees/payments/:id
 *
 * ⚠️ Data is stored in-memory in component state only.
 *    New or updated payment records are NOT persisted to PostgreSQL/Supabase.
 */

import {
  MOCK_BUSINESSES,
  type Business,
  BUSINESS_TYPES,
  type BusinessType,
} from "../business/mockData";

export { MOCK_BUSINESSES, BUSINESS_TYPES };
export type { Business, BusinessType };

export interface PaymentRecord {
  /** Unique payment record identifier */
  id: string;
  /** Reference to business id */
  businessId: string;
  /** Official business trade/display name */
  businessName: string;
  /** Official business registration number */
  registrationNumber: string;
  /** Category of business */
  businessType: string;
  /** Municipal assessment / fee year */
  feeYear: number;
  /** Annual garbage collection fee amount in LKR */
  amount: number;
  /** Payment status */
  status: "paid" | "unpaid";
  /** Date payment was received (ISO string YYYY-MM-DD or undefined if unpaid) */
  paymentDate?: string;
  /** Optional official council receipt or transaction reference */
  receiptNumber?: string;
  /** Officer notes or remarks */
  notes?: string;
  /** Record last updated timestamp */
  updatedAt: string;
}

export interface PaymentSummaryStats {
  totalBusinesses: number;
  paidBusinesses: number;
  unpaidBusinesses: number;
  totalCollected: number;
}

export const AVAILABLE_PAYMENT_YEARS = [2026, 2025, 2024] as const;
export const DEFAULT_PAYMENT_YEAR = 2026;

/**
 * Pre-configured established annual fee amounts per registered business.
 * Ensures realistic amounts without inventing random numbers.
 */
export const DEFAULT_BUSINESS_FEES: Record<string, number> = {
  "biz-001": 4500, // Balangoda Commercial Hub
  "biz-002": 1200, // K. G. Perera General Store
  "biz-003": 2000, // Balangoda Bakery & Sweets
  "biz-004": 3200, // Sunrise Pharmacy (Pvt) Ltd
  "biz-005": 1800, // Ratnapura Road Hardware
  "biz-006": 2500, // Lanka Textile Emporium
  "biz-007": 6000, // City Supermarket (Pvt) Ltd
  "biz-008": 2800, // Green Valley Restaurant
  "biz-009": 2400, // Balangoda IT Solutions
  "biz-010": 3500, // Saman Guest Inn
};

/**
 * Returns the established annual garbage fee for a given business ID.
 * Defaults to 2,000 LKR if not pre-configured.
 */
export function getEstablishedFee(businessId: string): number {
  return DEFAULT_BUSINESS_FEES[businessId] || 2000;
}

/**
 * Initial mock payment records for registered businesses across fee years.
 */
export const INITIAL_PAYMENT_RECORDS: PaymentRecord[] = [
  // ── FY 2026 Records ───────────────────────────────────────────────────────
  {
    id: "PAY-2026-001",
    businessId: "biz-001",
    businessName: "Balangoda Commercial Hub",
    registrationNumber: "BAL-BUS-2024-001",
    businessType: "General Trade / Retail",
    feeYear: 2026,
    amount: 4500,
    status: "paid",
    paymentDate: "2026-02-14",
    receiptNumber: "REC-2026-0841",
    notes: "Annual fee paid in full via counter cash payment.",
    updatedAt: "2026-02-14",
  },
  {
    id: "PAY-2026-002",
    businessId: "biz-002",
    businessName: "K. G. Perera General Store",
    registrationNumber: "BAL-BUS-2024-002",
    businessType: "General Trade / Retail",
    feeYear: 2026,
    amount: 1200,
    status: "paid",
    paymentDate: "2026-01-28",
    receiptNumber: "REC-2026-0412",
    notes: "Direct bank transfer payment confirmed.",
    updatedAt: "2026-01-28",
  },
  {
    id: "PAY-2026-003",
    businessId: "biz-003",
    businessName: "Balangoda Bakery & Sweets",
    registrationNumber: "BAL-BUS-2024-003",
    businessType: "Bakery / Confectionery",
    feeYear: 2026,
    amount: 2000,
    status: "unpaid",
    notes: "First payment notice issued in January 2026.",
    updatedAt: "2026-01-10",
  },
  {
    id: "PAY-2026-004",
    businessId: "biz-004",
    businessName: "Sunrise Pharmacy (Pvt) Ltd",
    registrationNumber: "BAL-BUS-2024-004",
    businessType: "Pharmacy / Medical",
    feeYear: 2026,
    amount: 3200,
    status: "paid",
    paymentDate: "2026-03-05",
    receiptNumber: "REC-2026-1120",
    notes: "Paid at Urban Council revenue counter.",
    updatedAt: "2026-03-05",
  },
  {
    id: "PAY-2026-005",
    businessId: "biz-005",
    businessName: "Ratnapura Road Hardware",
    registrationNumber: "BAL-BUS-2024-005",
    businessType: "Hardware / Building Materials",
    feeYear: 2026,
    amount: 1800,
    status: "unpaid",
    notes: "Bill delivered. Awaiting proprietor confirmation.",
    updatedAt: "2026-01-15",
  },
  {
    id: "PAY-2026-006",
    businessId: "biz-006",
    businessName: "Lanka Textile Emporium",
    registrationNumber: "BAL-BUS-2024-006",
    businessType: "Textile / Clothing",
    feeYear: 2026,
    amount: 2500,
    status: "unpaid",
    notes: "Follow-up reminder scheduled for next week.",
    updatedAt: "2026-02-01",
  },
  {
    id: "PAY-2026-007",
    businessId: "biz-007",
    businessName: "City Supermarket (Pvt) Ltd",
    registrationNumber: "BAL-BUS-2024-007",
    businessType: "Supermarket / Grocery",
    feeYear: 2026,
    amount: 6000,
    status: "paid",
    paymentDate: "2026-04-02",
    receiptNumber: "REC-2026-1590",
    notes: "Corporate cheque payment cleared.",
    updatedAt: "2026-04-02",
  },
  {
    id: "PAY-2026-008",
    businessId: "biz-008",
    businessName: "Green Valley Restaurant",
    registrationNumber: "BAL-BUS-2024-008",
    businessType: "Food & Beverage",
    feeYear: 2026,
    amount: 2800,
    status: "unpaid",
    notes: "Payment due date extended on request.",
    updatedAt: "2026-02-18",
  },
  {
    id: "PAY-2026-009",
    businessId: "biz-009",
    businessName: "Balangoda IT Solutions",
    registrationNumber: "BAL-BUS-2024-009",
    businessType: "Electronic / IT Services",
    feeYear: 2026,
    amount: 2400,
    status: "unpaid",
    notes: "Assessment notice issued.",
    updatedAt: "2026-01-20",
  },
  {
    id: "PAY-2026-010",
    businessId: "biz-010",
    businessName: "Saman Guest Inn",
    registrationNumber: "BAL-BUS-2025-010",
    businessType: "Hotel / Guest House",
    feeYear: 2026,
    amount: 3500,
    status: "paid",
    paymentDate: "2026-01-18",
    receiptNumber: "REC-2026-0294",
    notes: "Early settlement with receipt issued.",
    updatedAt: "2026-01-18",
  },

  // ── FY 2025 Records ───────────────────────────────────────────────────────
  {
    id: "PAY-2025-001",
    businessId: "biz-001",
    businessName: "Balangoda Commercial Hub",
    registrationNumber: "BAL-BUS-2024-001",
    businessType: "General Trade / Retail",
    feeYear: 2025,
    amount: 4500,
    status: "paid",
    paymentDate: "2025-02-10",
    receiptNumber: "REC-2025-0720",
    updatedAt: "2025-02-10",
  },
  {
    id: "PAY-2025-002",
    businessId: "biz-002",
    businessName: "K. G. Perera General Store",
    registrationNumber: "BAL-BUS-2024-002",
    businessType: "General Trade / Retail",
    feeYear: 2025,
    amount: 1200,
    status: "paid",
    paymentDate: "2025-01-20",
    receiptNumber: "REC-2025-0315",
    updatedAt: "2025-01-20",
  },
  {
    id: "PAY-2025-003",
    businessId: "biz-003",
    businessName: "Balangoda Bakery & Sweets",
    registrationNumber: "BAL-BUS-2024-003",
    businessType: "Bakery / Confectionery",
    feeYear: 2025,
    amount: 2000,
    status: "paid",
    paymentDate: "2025-03-15",
    receiptNumber: "REC-2025-1044",
    updatedAt: "2025-03-15",
  },
  {
    id: "PAY-2025-004",
    businessId: "biz-004",
    businessName: "Sunrise Pharmacy (Pvt) Ltd",
    registrationNumber: "BAL-BUS-2024-004",
    businessType: "Pharmacy / Medical",
    feeYear: 2025,
    amount: 3200,
    status: "paid",
    paymentDate: "2025-02-28",
    receiptNumber: "REC-2025-0980",
    updatedAt: "2025-02-28",
  },
  {
    id: "PAY-2025-007",
    businessId: "biz-007",
    businessName: "City Supermarket (Pvt) Ltd",
    registrationNumber: "BAL-BUS-2024-007",
    businessType: "Supermarket / Grocery",
    feeYear: 2025,
    amount: 6000,
    status: "paid",
    paymentDate: "2025-03-30",
    receiptNumber: "REC-2025-1422",
    updatedAt: "2025-03-30",
  },

  // ── FY 2024 Records ───────────────────────────────────────────────────────
  {
    id: "PAY-2024-001",
    businessId: "biz-001",
    businessName: "Balangoda Commercial Hub",
    registrationNumber: "BAL-BUS-2024-001",
    businessType: "General Trade / Retail",
    feeYear: 2024,
    amount: 4500,
    status: "paid",
    paymentDate: "2024-02-15",
    receiptNumber: "REC-2024-0610",
    updatedAt: "2024-02-15",
  },
  {
    id: "PAY-2024-002",
    businessId: "biz-002",
    businessName: "K. G. Perera General Store",
    registrationNumber: "BAL-BUS-2024-002",
    businessType: "General Trade / Retail",
    feeYear: 2024,
    amount: 1200,
    status: "paid",
    paymentDate: "2024-01-25",
    receiptNumber: "REC-2024-0280",
    updatedAt: "2024-01-25",
  },
];

/**
 * Computes dashboard/summary stats for the specified fee year (or all years).
 */
export function computePaymentStats(
  records: PaymentRecord[],
  selectedYear: number | "all"
): PaymentSummaryStats {
  const filtered =
    selectedYear === "all"
      ? records
      : records.filter((r) => r.feeYear === selectedYear);

  const totalBusinesses = filtered.length;
  const paidRecords = filtered.filter((r) => r.status === "paid");
  const paidBusinesses = paidRecords.length;
  const unpaidBusinesses = filtered.filter((r) => r.status === "unpaid").length;
  const totalCollected = paidRecords.reduce((sum, r) => sum + r.amount, 0);

  return {
    totalBusinesses,
    paidBusinesses,
    unpaidBusinesses,
    totalCollected,
  };
}

