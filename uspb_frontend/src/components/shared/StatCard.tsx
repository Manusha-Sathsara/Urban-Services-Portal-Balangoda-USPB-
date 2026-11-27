import React from "react";

export interface StatCardProps {
  label: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  /** Optional accent variant to visually tint the small icon or number */
  variant?: "default" | "success" | "warning" | "info" | "revenue";
}

const variantStyles: Record<
  NonNullable<StatCardProps["variant"]>,
  { iconBg: string; iconColor: string; valueColor: string }
> = {
  default: {
    iconBg: "bg-[#f0e0df]",
    iconColor: "text-[#5a0000]",
    valueColor: "text-[#5a0000]",
  },
  success: {
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-700",
    valueColor: "text-stone-900",
  },
  warning: {
    iconBg: "bg-amber-50",
    iconColor: "text-amber-700",
    valueColor: "text-stone-900",
  },
  info: {
    iconBg: "bg-stone-100",
    iconColor: "text-stone-700",
    valueColor: "text-stone-900",
  },
  revenue: {
    iconBg: "bg-amber-50",
    iconColor: "text-amber-800",
    valueColor: "text-stone-900",
  },
};

export function StatCard({
  label,
  value,
  description,
  icon,
  variant = "default",
}: StatCardProps) {
  const styles = variantStyles[variant] || variantStyles.default;

  return (
    <div className="card-hover-fx bg-white rounded-xl p-5 border border-stone-200 shadow-xs flex flex-col justify-between gap-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
            {label}
          </p>
          <p className={`mt-1.5 text-2xl font-bold tracking-tight ${styles.valueColor}`}>
            {value}
          </p>
        </div>
        <div
          className={`w-9 h-9 rounded-lg ${styles.iconBg} ${styles.iconColor} flex items-center justify-center shrink-0`}
          aria-hidden="true"
        >
          {icon}
        </div>
      </div>
      <p className="text-[11.5px] text-stone-500 leading-snug">{description}</p>
    </div>
  );
}

export default StatCard;
