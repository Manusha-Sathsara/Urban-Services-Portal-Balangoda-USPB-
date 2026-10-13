export default function EnvironmentalCertsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Environmental Clearances & Certifications
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Process business environmental compliance applications and inspections.
          </p>
        </div>
        <button className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 transition">
          + New Application
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left text-sm dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase font-semibold text-gray-500">
              <tr>
                <th className="px-4 py-3">Registration No</th>
                <th className="px-4 py-3">Business Name</th>
                <th className="px-4 py-3">Applicant</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
              <tr>
                <td className="px-4 py-3 font-mono text-xs">ENV-BAL-2026-004</td>
                <td className="px-4 py-3">Saman Tea Factory</td>
                <td className="px-4 py-3">S. D. Saman</td>
                <td className="px-4 py-3">Category A (High Impact)</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800 dark:bg-blue-950 dark:text-blue-300">
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
