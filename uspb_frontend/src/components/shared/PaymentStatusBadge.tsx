/**
 * PaymentStatusBadge — Reusable badge for payment status.
 *
 * Displays "Paid", "Unpaid", or "Overdue" with appropriate color coding
 * consistent with the existing project patterns (see garbage-fees/page.tsx).
 */

interface PaymentStatusBadgeProps {
  status: "paid" | "unpaid" | "overdue";
}

const badgeStyles: Record<
  PaymentStatusBadgeProps["status"],
  { bg: string; text: string; label: string }
> = {
  paid: {
    bg: "bg-emerald-100",
    text: "text-emerald-800",
    label: "Paid",
  },
  unpaid: {
    bg: "bg-amber-100",
    text: "text-amber-800",
    label: "Unpaid",
  },
  overdue: {
    bg: "bg-red-100",
    text: "text-[#800000]",
    label: "Overdue",
  },
};

export function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  const { bg, text, label } = badgeStyles[status];
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${bg} ${text}`}
    >
      {label}
    </span>
  );
}
