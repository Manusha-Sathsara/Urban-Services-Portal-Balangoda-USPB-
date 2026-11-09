export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-[22px] text-[#5a0000] leading-tight">
          Admin Overview
        </h2>
        <p className="text-[13px] text-[#8a5a58] mt-1">
          Balangoda Urban Council municipal services & system operations dashboard.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-[#f0e6e5] bg-white p-5 shadow-[0_2px_10px_rgba(90,0,0,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#8a5a58]">
            Total Garbage Revenue
          </p>
          <p className="mt-2 text-2xl font-bold text-[#5a0000]">
            LKR 1,842,500
          </p>
          <span className="mt-1 inline-block text-xs font-medium text-emerald-600">
            +12.4% this quarter
          </span>
        </div>

        <div className="rounded-lg border border-[#f0e6e5] bg-white p-5 shadow-[0_2px_10px_rgba(90,0,0,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#8a5a58]">
            Pending Certifications
          </p>
          <p className="mt-2 text-2xl font-bold text-[#5a0000]">
            24
          </p>
          <span className="mt-1 inline-block text-xs font-medium text-amber-600">
            Requires field inspection
          </span>
        </div>

        <div className="rounded-lg border border-[#f0e6e5] bg-white p-5 shadow-[0_2px_10px_rgba(90,0,0,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#8a5a58]">
            Registered Schools
          </p>
          <p className="mt-2 text-2xl font-bold text-[#5a0000]">
            18
          </p>
          <span className="mt-1 inline-block text-xs font-medium text-blue-600">
            Green rewards active
          </span>
        </div>

        <div className="rounded-lg border border-[#f0e6e5] bg-white p-5 shadow-[0_2px_10px_rgba(90,0,0,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#8a5a58]">
            Monthly Jobs Status
          </p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">
            Healthy
          </p>
          <span className="mt-1 inline-block text-xs font-medium text-[#8a5a58]">
            Next cron runs in 14 days
          </span>
        </div>
      </div>
    </div>
  );
}
