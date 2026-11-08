/**
 * BusinessStatusBadge — Reusable badge for business active/inactive status.
 *
 * Uses the same styling pattern as PaymentStatusBadge to remain consistent
 * with the existing project design system.
 */

export type BusinessStatus = "active" | "inactive";

interface BusinessStatusBadgeProps {
  status: BusinessStatus;
}

const badgeStyles: Record<
  BusinessStatus,
  { bg: string; text: string; dot: string; label: string }
> = {
  active: {
    bg: "bg-emerald-100",
    text: "text-emerald-800",
    dot: "bg-emerald-500",
    label: "Active",
  },
  inactive: {
    bg: "bg-[#f0e0df]",
    text: "text-[#5a0000]",
    dot: "bg-[#8a5a58]",
    label: "Inactive",
  },
};

export function BusinessStatusBadge({ status }: BusinessStatusBadgeProps) {
  const { bg, text, dot, label } = badgeStyles[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${bg} ${text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dot} shrink-0`} aria-hidden="true" />
      {label}
    </span>
  );
}

