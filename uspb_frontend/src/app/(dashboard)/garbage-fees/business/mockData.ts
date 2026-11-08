/**
 * MOCK DATA — Business Management (Garbage Collection Fee Management)
 *
 * Isolated temporary mock data for visual development only.
 * Replace with real API responses once backend integration is available.
 * API endpoint expected: GET /api/v1/garbage-fees/businesses
 *
 * ⚠️  Data is stored in-memory in component state only.
 *     New entries added via the "Add Business" form are NOT persisted to any
 *     database — they live only for the current browser session.
 *     Connect to the backend API when it becomes available.
 */

// ---------------------------------------------------------------------------
// Business Types / Categories
// ---------------------------------------------------------------------------
export const BUSINESS_TYPES = [
  "General Trade / Retail",
  "Food & Beverage",
  "Pharmacy / Medical",
  "Hardware / Building Materials",
  "Textile / Clothing",
  "Supermarket / Grocery",
  "Hotel / Guest House",
  "Bakery / Confectionery",
  "Electronic / IT Services",
  "Professional Services",
  "Manufacturing / Industry",
  "Transport / Logistics",
  "Other",
] as const;

export type BusinessType = (typeof BUSINESS_TYPES)[number];

// ---------------------------------------------------------------------------
// Business Status
// ---------------------------------------------------------------------------
export type BusinessStatus = "active" | "inactive";

// ---------------------------------------------------------------------------
// Core Business Entity
// ---------------------------------------------------------------------------
export interface Business {
  /** Internal unique identifier */
  id: string;
  /** Official business registration number issued by Urban Council */
  registrationNumber: string;
  /** Trading / display name of the business */
  businessName: string;
  /** Full legal name of the owner */
  ownerName: string;
  /** Category of business activity */
  businessType: BusinessType;
  /** Physical address */
  address: string;
  /** Primary contact telephone number */
  contactNumber: string;
  /** Whether the business is currently registered as active */
  status: BusinessStatus;
  /** ISO date string when the record was created */
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Mock Business Records
// ---------------------------------------------------------------------------
export const MOCK_BUSINESSES: Business[] = [
  {
    id: "biz-001",
    registrationNumber: "BAL-BUS-2024-001",
    businessName: "Balangoda Commercial Hub",
    ownerName: "Sunil K. Perera",
    businessType: "General Trade / Retail",
    address: "No. 12, Main Street, Balangoda, Ratnapura",
    contactNumber: "0712345678",
    status: "active",
    createdAt: "2024-01-15",
  },
  {
    id: "biz-002",
    registrationNumber: "BAL-BUS-2024-002",
    businessName: "K. G. Perera General Store",
    ownerName: "Kamala G. Perera",
    businessType: "General Trade / Retail",
    address: "No. 34, Temple Road, Balangoda, Ratnapura",
    contactNumber: "0778901234",
    status: "active",
    createdAt: "2024-02-20",
  },
  {
    id: "biz-003",
    registrationNumber: "BAL-BUS-2024-003",
    businessName: "Balangoda Bakery & Sweets",
    ownerName: "Priyantha D. Silva",
    businessType: "Bakery / Confectionery",
    address: "No. 7, New Town Road, Balangoda, Ratnapura",
    contactNumber: "0714567890",
    status: "active",
    createdAt: "2024-03-10",
  },
  {
    id: "biz-004",
    registrationNumber: "BAL-BUS-2024-004",
    businessName: "Sunrise Pharmacy (Pvt) Ltd",
    ownerName: "Dr. Nimal R. Fernando",
    businessType: "Pharmacy / Medical",
    address: "No. 56, Hospital Road, Balangoda, Ratnapura",
    contactNumber: "0453456789",
    status: "active",
    createdAt: "2024-01-28",
  },
  {
    id: "biz-005",
    registrationNumber: "BAL-BUS-2024-005",
    businessName: "Ratnapura Road Hardware",
    ownerName: "Lasantha P. Gunasekara",
    businessType: "Hardware / Building Materials",
    address: "No. 89, Ratnapura Road, Balangoda, Ratnapura",
    contactNumber: "0459012345",
    status: "active",
    createdAt: "2024-04-05",
  },
  {
    id: "biz-006",
    registrationNumber: "BAL-BUS-2024-006",
    businessName: "Lanka Textile Emporium",
    ownerName: "Sandya A. Wijesinghe",
    businessType: "Textile / Clothing",
    address: "No. 23, Market Street, Balangoda, Ratnapura",
    contactNumber: "0769876543",
    status: "inactive",
    createdAt: "2024-02-14",
  },
  {
    id: "biz-007",
    registrationNumber: "BAL-BUS-2024-007",
    businessName: "City Supermarket (Pvt) Ltd",
    ownerName: "Ruwan C. Jayawardena",
    businessType: "Supermarket / Grocery",
    address: "No. 45, New Road, Balangoda, Ratnapura",
    contactNumber: "0712233445",
    status: "active",
    createdAt: "2024-01-05",
  },
  {
    id: "biz-008",
    registrationNumber: "BAL-BUS-2024-008",
    businessName: "Green Valley Restaurant",
    ownerName: "Malkanthi S. Ranasinghe",
    businessType: "Food & Beverage",
    address: "No. 11, Colombo Road, Balangoda, Ratnapura",
    contactNumber: "0455678901",
    status: "active",
    createdAt: "2024-05-18",
  },
  {
    id: "biz-009",
    registrationNumber: "BAL-BUS-2024-009",
    businessName: "Balangoda IT Solutions",
    ownerName: "Chathura N. Dissanayake",
    businessType: "Electronic / IT Services",
    address: "No. 3, Industrial Zone, Balangoda, Ratnapura",
    contactNumber: "0774433221",
    status: "inactive",
    createdAt: "2024-06-02",
  },
  {
    id: "biz-010",
    registrationNumber: "BAL-BUS-2025-010",
    businessName: "Saman Guest Inn",
    ownerName: "Saman P. Kumarasinghe",
    businessType: "Hotel / Guest House",
    address: "No. 67, Tourist Lane, Balangoda, Ratnapura",
    contactNumber: "0459988776",
    status: "active",
    createdAt: "2025-01-12",
  },
];

// ---------------------------------------------------------------------------
// Helper: Compute business summary stats
// ---------------------------------------------------------------------------
export interface BusinessSummaryStats {
  total: number;
  active: number;
  inactive: number;
}

export function computeBusinessStats(businesses: Business[]): BusinessSummaryStats {
  const total = businesses.length;
  const active = businesses.filter((b) => b.status === "active").length;
  const inactive = businesses.filter((b) => b.status === "inactive").length;
  return { total, active, inactive };
}

// ---------------------------------------------------------------------------
// Helper: generate a new registration number based on existing records
// ---------------------------------------------------------------------------
export function generateRegistrationNumber(existing: Business[]): string {
  const year = new Date().getFullYear();
  const count = existing.length + 1;
  return `BAL-BUS-${year}-${String(count).padStart(3, "0")}`;
}

