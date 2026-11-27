/**
 * serviceConfig.ts
 *
 * Single source of truth for section-specific, role-based header and sidebar
 * configuration across the Urban Services Portal Balangoda (USPB).
 *
 * Mappings:
 *  - /garbage-fees/*  -> Garbage Collection Fee Management
 *  - /environmental/* -> Environmental Certificate Management
 *  - /schools/*       -> School Garbage Collection & Rewards
 *  - /admin/*         -> System Administration
 *
 * Server-side authorization / authentication remains separate; this file drives
 * dynamic route-based UI presentation without duplicating detection logic.
 */

export interface NavItem {
  /** Label shown in the sidebar */
  name: string;
  /** Next.js destination route or '#' if page is not yet implemented */
  href: string;
  /** Optional icon (emoji or SVG identifier) */
  icon?: string;
  /** Optional status badge */
  badge?: string;
}

export interface ServiceConfig {
  /** Unique key identifying the digital service */
  key: "garbage-fees" | "environmental" | "schools" | "admin" | "default";
  /** Full official service identity displayed in Header */
  serviceName: string;
  /** Secondary branding or council name */
  serviceSubtitle: string;
  /** Role title for the assigned officer */
  roleTitle: string;
  /** Default display name for the officer when no authenticated profile is provided */
  defaultUserName: string;
  /** Section heading rendered above sidebar navigation items */
  navSectionLabel: string;
  /** Service-specific navigation items */
  navItems: NavItem[];
}

// ---------------------------------------------------------------------------
// Service Configurations
// ---------------------------------------------------------------------------

/**
 * 1. Garbage Collection Fee Management
 *
 * Per requirements:
 * - Service identity: Garbage Collection Fee Management
 * - Role title: Garbage Management Fee Collection Officer
 * - Sidebar items in exact order:
 *     1. Dashboard (navigates to /garbage-fees/dashboard)
 *     2. Business List
 *     3. Payment Management
 *     4. Annual Payment Records
 *
 * Note on routes: As confirmed by inspecting the existing project structure,
 * only the Dashboard page (/garbage-fees/dashboard) is currently implemented.
 * Following the strict instruction ("Do not invent route destinations or create
 * new pages as part of this task"), the other three items point to '#' with
 * an informative badge until their respective routes are built.
 */
export const GARBAGE_FEES_SERVICE_CONFIG: ServiceConfig = {
  key: "garbage-fees",
  serviceName: "Garbage Collection Fee Management",
  serviceSubtitle: "Health Division — Balangoda Urban Council",
  roleTitle: "Garbage Management Fee Collection Officer",
  defaultUserName: "Municipal Revenue Officer",
  navSectionLabel: "Fee Management",
  navItems: [
    {
      name: "Dashboard",
      href: "/garbage-fees/dashboard",
      icon: "📊",
    },
    {
      name: "Business List",
      href: "/garbage-fees/business",
      icon: "🏪",
    },
    {
      name: "Payment Management",
      href: "/garbage-fees/payment",
      icon: "💳",
    },
    {
      name: "Annual Payment Records",
      href: "/garbage-fees/annual",
      icon: "📁",
    },
  ],
};

/**
 * 2. Environmental Certificate Management
 *
 * Per requirements:
 * - Service identity: Environmental Certificate Management
 * - Role title: Environmental Certificate Officer (or Authorized PHI)
 * - Navigation: Uses the existing /environmental route
 */
export const ENVIRONMENTAL_SERVICE_CONFIG: ServiceConfig = {
  key: "environmental",
  serviceName: "Environmental Certificate Management",
  serviceSubtitle: "Health Division — Balangoda Urban Council",
  roleTitle: "Environmental Certificate Officer",
  defaultUserName: "Public Health Inspector (PHI)",
  navSectionLabel: "Environmental Services",
  navItems: [
    {
      name: "Clearances & Certifications",
      href: "/environmental",
      icon: "🛡️",
    },
  ],
};

/**
 * 3. School Garbage Collection & Rewards
 *
 * Per requirements:
 * - Service identity: School Garbage Collection & Rewards
 * - Role title: School Garbage Collection & Rewards Officer
 * - Navigation: Uses the existing /schools route
 */
export const SCHOOLS_SERVICE_CONFIG: ServiceConfig = {
  key: "schools",
  serviceName: "School Waste Rewards Management",
  serviceSubtitle: "Health Division — Balangoda Urban Council",
  roleTitle: "Eco-Rewards Coordinator",
  defaultUserName: "Eco-Rewards Coordinator",
  navSectionLabel: "School Programme",
  navItems: [
    {
      name: "School Management",
      href: "/schools",
      icon: "School",
    },
    {
      name: "Waste Categories",
      href: "/categories",
      icon: "Recycle",
    },
    {
      name: "Redemption & Payouts",
      href: "#",
      icon: "Gift",
      badge: "Soon",
    },
    {
      name: "Badge Management",
      href: "/badges",
      icon: "Award",
    },
    {
      name: "Financial Reports",
      href: "/financial-reports",
      icon: "BarChart3",
    },
  ],
};

/**
 * 4. System Administration
 */
export const ADMIN_SERVICE_CONFIG: ServiceConfig = {
  key: "admin",
  serviceName: "Urban Services Portal",
  serviceSubtitle: "Balangoda Urban Council",
  roleTitle: "System Administrator",
  defaultUserName: "UC System Administrator",
  navSectionLabel: "Administration",
  navItems: [
    {
      name: "Admin Overview",
      href: "/admin",
      icon: "⚙️",
    },
    {
      name: "Garbage Fees",
      href: "/garbage-fees/dashboard",
      icon: "📊",
    },
    {
      name: "Environmental Certs",
      href: "/environmental",
      icon: "🛡️",
    },
    {
      name: "School Rewards",
      href: "/schools",
      icon: "🎓",
    },
  ],
};

/**
 * Fallback configuration for any other dashboard route
 */
export const DEFAULT_SERVICE_CONFIG: ServiceConfig = {
  key: "default",
  serviceName: "Urban Services Portal",
  serviceSubtitle: "Balangoda Urban Council",
  roleTitle: "Municipal Officer",
  defaultUserName: "Municipal Officer",
  navSectionLabel: "Navigation",
  navItems: [
    {
      name: "Admin Dashboard",
      href: "/admin",
      icon: "⚙️",
    },
    {
      name: "Garbage Fees",
      href: "/garbage-fees/dashboard",
      icon: "📊",
    },
    {
      name: "Environmental Certs",
      href: "/environmental",
      icon: "🛡️",
    },
    {
      name: "School Rewards",
      href: "/schools",
      icon: "🎓",
    },
  ],
};

// ---------------------------------------------------------------------------
// Route Mapping
// ---------------------------------------------------------------------------

const SERVICE_ROUTES: Array<{ prefix: string; config: ServiceConfig }> = [
  { prefix: "/garbage-fees", config: GARBAGE_FEES_SERVICE_CONFIG },
  { prefix: "/environmental", config: ENVIRONMENTAL_SERVICE_CONFIG },
  { prefix: "/schools", config: SCHOOLS_SERVICE_CONFIG },
  { prefix: "/categories", config: SCHOOLS_SERVICE_CONFIG },
  { prefix: "/badges", config: SCHOOLS_SERVICE_CONFIG },
  { prefix: "/financial-reports", config: SCHOOLS_SERVICE_CONFIG },
  { prefix: "/admin", config: ADMIN_SERVICE_CONFIG },
];

/**
 * Dynamically resolves the active ServiceConfig based on the current Next.js pathname.
 */
export function getServiceConfig(pathname: string | null | undefined): ServiceConfig {
  if (!pathname) return DEFAULT_SERVICE_CONFIG;

  for (const { prefix, config } of SERVICE_ROUTES) {
    if (pathname.startsWith(prefix)) {
      return config;
    }
  }

  return DEFAULT_SERVICE_CONFIG;
}

/**
 * Checks whether a given navigation item should be marked as active.
 */
export function isNavItemActive(pathname: string | null | undefined, href: string): boolean {
  if (!pathname || !href || href === "#") return false;

  // Exact match
  if (pathname === href) return true;

  // Handle base route (/garbage-fees) as active for dashboard
  if (
    href === "/garbage-fees/dashboard" &&
    pathname === "/garbage-fees"
  ) {
    return true;
  }

  // Active if pathname starts with href (e.g. sub-pages under a section, excluding root)
  if (href !== "/" && pathname.startsWith(href)) {
    return true;
  }

  return false;
}
