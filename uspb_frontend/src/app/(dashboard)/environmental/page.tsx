export default function EnvironmentalCertsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-[22px] text-[#5a0000] leading-tight">
            Environmental Clearances & Certifications
          </h2>
          <p className="text-[13px] text-[#8a5a58] mt-1">
            Process business environmental compliance applications and inspections.
          </p>
        </div>
        <button className="btn-hover-fx rounded bg-[#800000] px-4 py-2 text-[13px] font-semibold text-white shadow-sm hover:bg-[#5a0000] transition">
          + New Application
        </button>
      </div>

      <div className="rounded-lg border border-[#f0e6e5] bg-white p-6 shadow-[0_2px_10px_rgba(90,0,0,0.08)]">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#f0e6e5] text-left text-sm">
            <thead className="bg-[#fcf8f7] text-xs uppercase font-semibold text-[#8a5a58]">
              <tr>
                <th className="px-4 py-3">Registration No</th>
                <th className="px-4 py-3">Business Name</th>
                <th className="px-4 py-3">Applicant</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0e6e5] text-[#4a4a4a]">
              <tr className="hover:bg-[#fcf8f7] transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-[#8a5a58]">ENV-BAL-2026-004</td>
                <td className="px-4 py-3 font-medium text-[#5a0000]">Saman Tea Factory</td>
                <td className="px-4 py-3">S. D. Saman</td>
                <td className="px-4 py-3">Category A (High Impact)</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800">
                    Inspected
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
