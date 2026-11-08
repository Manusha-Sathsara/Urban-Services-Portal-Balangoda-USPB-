/**
 * MOCK DATA — Garbage Collection Fee Management Dashboard
 *
 * This file contains isolated temporary mock data for visual development only.
 * Replace this with real API responses once backend integration is available.
 * API endpoint expected: GET /api/v1/garbage-fees/dashboard?year={year}
 */

export interface BusinessFeeRecord {
  id: string;
  businessName: string;
  ownerName?: string;
  businessType?: string;
  ward: string;
  feeYear: number;
  feeAmount: number;
  status: "paid" | "unpaid" | "overdue";
  paymentDate?: string; // ISO date string, undefined if unpaid
}

export interface DashboardStats {
  totalBusinesses: number;
  paidBusinesses: number;
  unpaidBusinesses: number;
  totalCollected: number; // LKR
}

// ---------------------------------------------------------------------------
// Mock business records across available fee years
// ---------------------------------------------------------------------------
export const MOCK_BUSINESS_RECORDS: BusinessFeeRecord[] = [
  // ── FY 2026 Records ───────────────────────────────────────────────────────
  {
    id: "BAL-BUS-2026-001",
    businessName: "Balangoda Commercial Hub",
    ownerName: "Sunil K. Perera",
    businessType: "General Trade / Retail",
    ward: "Ward 01",
    feeYear: 2026,
    feeAmount: 4500,
    status: "paid",
    paymentDate: "2026-02-14",
  },
  {
    id: "BAL-BUS-2026-002",
    businessName: "K. G. Perera General Store",
    ownerName: "Kamala G. Perera",
    businessType: "General Trade / Retail",
    ward: "Ward 03",
    feeYear: 2026,
    feeAmount: 1200,
    status: "paid",
    paymentDate: "2026-01-28",
  },
  {
    id: "BAL-BUS-2026-003",
    businessName: "Balangoda Bakery & Sweets",
    ownerName: "Priyantha D. Silva",
    businessType: "Bakery / Confectionery",
    ward: "Ward 02",
    feeYear: 2026,
    feeAmount: 2000,
    status: "unpaid",
  },
  {
    id: "BAL-BUS-2026-004",
    businessName: "Sunrise Pharmacy (Pvt) Ltd",
    ownerName: "Dr. Nimal R. Fernando",
    businessType: "Pharmacy / Medical",
    ward: "Ward 05",
    feeYear: 2026,
    feeAmount: 3200,
    status: "paid",
    paymentDate: "2026-03-05",
  },
  {
    id: "BAL-BUS-2026-005",
    businessName: "Ratnapura Road Hardware",
    ownerName: "Lasantha P. Gunasekara",
    businessType: "Hardware / Building Materials",
    ward: "Ward 04",
    feeYear: 2026,
    feeAmount: 1800,
    status: "unpaid",
  },
  {
    id: "BAL-BUS-2026-006",
    businessName: "Lanka Textile Emporium",
    ownerName: "Sandya A. Wijesinghe",
    businessType: "Textile / Clothing",
    ward: "Ward 01",
    feeYear: 2026,
    feeAmount: 2500,
    status: "overdue",
  },
  {
    id: "BAL-BUS-2026-007",
    businessName: "City Supermarket (Pvt) Ltd",
    ownerName: "Ruwan C. Jayawardena",
    businessType: "Supermarket / Grocery",
    ward: "Ward 06",
    feeYear: 2026,
    feeAmount: 6000,
    status: "paid",
    paymentDate: "2026-04-02",
  },
  {
    id: "BAL-BUS-2026-008",
    businessName: "Green Valley Restaurant",
    ownerName: "Malkanthi S. Ranasinghe",
    businessType: "Food & Beverage",
    ward: "Ward 03",
    feeYear: 2026,
    feeAmount: 2800,
    status: "unpaid",
  },

  // ── FY 2025 Records ───────────────────────────────────────────────────────
  {
    id: "BAL-BUS-2025-001",
    businessName: "Balangoda Commercial Hub",
    ownerName: "Sunil K. Perera",
    businessType: "General Trade / Retail",
    ward: "Ward 01",
    feeYear: 2025,
    feeAmount: 4500,
    status: "paid",
    paymentDate: "2025-02-10",
  },
  {
    id: "BAL-BUS-2025-002",
    businessName: "K. G. Perera General Store",
    ownerName: "Kamala G. Perera",
    businessType: "General Trade / Retail",
    ward: "Ward 03",
    feeYear: 2025,
    feeAmount: 1200,
    status: "paid",
    paymentDate: "2025-01-20",
  },
  {
    id: "BAL-BUS-2025-003",
    businessName: "Balangoda Bakery & Sweets",
    ownerName: "Priyantha D. Silva",
    businessType: "Bakery / Confectionery",
    ward: "Ward 02",
    feeYear: 2025,
    feeAmount: 2000,
    status: "paid",
    paymentDate: "2025-03-15",
  },
  {
    id: "BAL-BUS-2025-004",
    businessName: "Sunrise Pharmacy (Pvt) Ltd",
    ownerName: "Dr. Nimal R. Fernando",
    businessType: "Pharmacy / Medical",
    ward: "Ward 05",
    feeYear: 2025,
    feeAmount: 3200,
    status: "paid",
    paymentDate: "2025-02-28",
  },
  {
    id: "BAL-BUS-2025-007",
    businessName: "City Supermarket (Pvt) Ltd",
    ownerName: "Ruwan C. Jayawardena",
    businessType: "Supermarket / Grocery",
    ward: "Ward 06",
    feeYear: 2025,
    feeAmount: 6000,
    status: "paid",
    paymentDate: "2025-03-30",
  },

  // ── FY 2024 Records ───────────────────────────────────────────────────────
  {
    id: "BAL-BUS-2024-001",
    businessName: "Balangoda Commercial Hub",
    ownerName: "Sunil K. Perera",
    businessType: "General Trade / Retail",
    ward: "Ward 01",
    feeYear: 2024,
    feeAmount: 4500,
    status: "paid",
    paymentDate: "2024-02-15",
  },
  {
    id: "BAL-BUS-2024-002",
    businessName: "K. G. Perera General Store",
    ownerName: "Kamala G. Perera",
    businessType: "General Trade / Retail",
    ward: "Ward 03",
    feeYear: 2024,
    feeAmount: 1200,
    status: "paid",
    paymentDate: "2024-01-25",
  },
];

// ---------------------------------------------------------------------------
// Helper: derive dashboard stats from mock records for a given year
// ---------------------------------------------------------------------------
export function computeDashboardStats(
  records: BusinessFeeRecord[],
  year: number
): DashboardStats {
  const yearRecords = records.filter((r) => r.feeYear === year);
  const totalBusinesses = yearRecords.length;
  const paidRecords = yearRecords.filter((r) => r.status === "paid");
  const paidBusinesses = paidRecords.length;
  const unpaidBusinesses = totalBusinesses - paidBusinesses;
  const totalCollected = paidRecords.reduce((sum, r) => sum + r.feeAmount, 0);

  return { totalBusinesses, paidBusinesses, unpaidBusinesses, totalCollected };
}

// Available fee years
export const AVAILABLE_YEARS = [2024, 2025, 2026];
export const DEFAULT_YEAR = 2026;
