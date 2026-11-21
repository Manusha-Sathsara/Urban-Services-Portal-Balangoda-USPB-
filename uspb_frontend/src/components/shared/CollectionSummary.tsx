/**
 * CollectionSummary — Annual Fee Collection Summary section.
 *
 * Displays total collected, paid/unpaid counts, and a progress bar
 * visualising the payment completion percentage.
 * Uses only existing project UI patterns — no new chart library required.
 */

interface CollectionSummaryProps {
  totalBusinesses: number;
  paidBusinesses: number;
  unpaidBusinesses: number;
  totalCollected: number;
  year: number;
}

function formatLKR(amount: number): string {
  return `LKR ${amount.toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function CollectionSummary({
  totalBusinesses,
  paidBusinesses,
  unpaidBusinesses,
  totalCollected,
  year,
}: CollectionSummaryProps) {
  const completionPct =
    totalBusinesses > 0
      ? Math.round((paidBusinesses / totalBusinesses) * 100)
      : 0;

  return (
    <section className="bg-white rounded-lg border border-[#f0e6e5] shadow-[0_2px_10px_rgba(90,0,0,0.08)] p-6">
      {/* Section header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
        <div>
          <h3 className="font-serif text-[15px] text-[#5a0000]">
            Annual Fee Collection Summary
          </h3>
          <p className="text-[11.5px] text-[#8a5a58] mt-0.5">
            Payment completion status for fee year {year}
          </p>
        </div>
        <span className="text-[11px] font-bold tracking-[0.06em] uppercase bg-[#f0e0df] text-[#5a0000] px-3 py-1 rounded-full">
          FY {year}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-[#5a0000]">
            Payment Completion
          </span>
          <span className="text-xs font-bold text-[#5a0000]">
            {completionPct}%
          </span>
        </div>
        <div
          className="w-full bg-[#f0e0df] rounded-full h-3 overflow-hidden"
          role="progressbar"
          aria-valuenow={completionPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${completionPct}% of businesses have paid`}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${completionPct}%`,
              background:
                completionPct >= 75
                  ? "#047857" // emerald-700
                  : completionPct >= 40
                  ? "#d97706" // amber-600
                  : "#800000", // brand red
            }}
          />
        </div>
        <p className="text-[10.5px] text-[#8a5a58] mt-1.5">
          {paidBusinesses} of {totalBusinesses} registered businesses have paid
          their annual fee.
        </p>
      </div>

      {/* Summary figures */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-[#f0e6e5] pt-5">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#8a5a58]">
            Total Collected
          </p>
          <p className="text-lg font-bold text-[#5a0000] mt-1">
            {formatLKR(totalCollected)}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#8a5a58]">
            Businesses Paid
          </p>
          <p className="text-lg font-bold text-emerald-700 mt-1">
            {paidBusinesses}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#8a5a58]">
            Businesses Unpaid
          </p>
          <p className="text-lg font-bold text-amber-700 mt-1">
            {unpaidBusinesses}
          </p>
        </div>
      </div>
    </section>
  );
}
