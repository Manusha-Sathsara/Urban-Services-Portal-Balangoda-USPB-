export default function GarbageFeesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Garbage Collection Fees
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage municipal waste management fee collection, assessment records, and payments.
          </p>
        </div>
        <button className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 transition">
          + Add Assessment
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left text-sm dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase font-semibold text-gray-500">
              <tr>
                <th className="px-4 py-3">Assessment No</th>
                <th className="px-4 py-3">Tax Payer</th>
                <th className="px-4 py-3">Ward</th>
                <th className="px-4 py-3">Quarter</th>
                <th className="px-4 py-3">Amount (LKR)</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
              <tr>
                <td className="px-4 py-3 font-mono text-xs">BAL-GF-2026-001</td>
                <td className="px-4 py-3">K. G. Perera</td>
                <td className="px-4 py-3">Ward 03</td>
                <td className="px-4 py-3">2026-Q1</td>
                <td className="px-4 py-3 font-medium">1,200.00</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    Paid
                  </span>
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono text-xs">BAL-GF-2026-002</td>
                <td className="px-4 py-3">Balangoda Commercial Hub</td>
                <td className="px-4 py-3">Ward 01</td>
                <td className="px-4 py-3">2026-Q1</td>
                <td className="px-4 py-3 font-medium">4,500.00</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    Pending
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
