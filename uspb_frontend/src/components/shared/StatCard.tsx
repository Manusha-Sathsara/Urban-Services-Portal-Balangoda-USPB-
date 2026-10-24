/**
 * StatCard — Reusable summary card for dashboard statistics.
 *
 * Uses the project's existing brand theme (maroon, gold, pink).
 * Follows the card pattern from landing/ServicesSection and WhyChooseSection.
 */

interface StatCardProps {
  label: string;
  value: string | number;
  description: string;
  icon: string; // Unicode emoji / HTML entity string
  /** Optional accent variant to visually differentiate cards */
  variant?: "default" | "success" | "warning" | "revenue";
}

const variantStyles: Record<
  NonNullable<StatCardProps["variant"]>,
  { iconBg: string; iconColor: string; valueColor: string; border: string }
> = {
  default: {
    iconBg: "bg-[#f0e0df]",
    iconColor: "text-[#5a0000]",
    valueColor: "text-[#5a0000]",
    border: "border-[#f0e6e5]",
  },
  success: {
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-700",
    valueColor: "text-emerald-700",
    border: "border-emerald-100",
  },
  warning: {
    iconBg: "bg-amber-50",
    iconColor: "text-amber-700",
    valueColor: "text-amber-700",
    border: "border-amber-100",
  },
  revenue: {
    iconBg: "bg-[#fef3c7]",
    iconColor: "text-[#92400e]",
    valueColor: "text-[#5a0000]",
    border: "border-[#fde68a]",
  },
};

export function StatCard({
  label,
  value,
  description,
  icon,
  variant = "default",
}: StatCardProps) {
  const styles = variantStyles[variant];

  return (
    <div
      className={`card-hover-fx bg-white rounded-lg p-5 shadow-[0_2px_10px_rgba(90,0,0,0.08)] border ${styles.border} flex flex-col gap-3`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#8a5a58]">
            {label}
          </p>
          <p className={`mt-1.5 text-2xl font-bold ${styles.valueColor}`}>
            {value}
          </p>
        </div>
        <div
          className={`w-10 h-10 rounded-lg ${styles.iconBg} ${styles.iconColor} grid place-items-center text-xl shrink-0`}
          aria-hidden="true"
        >
          {icon}
        </div>
      </div>
      <p className="text-[11.5px] text-[#8a5a58] leading-snug">{description}</p>
    </div>
  );
}
