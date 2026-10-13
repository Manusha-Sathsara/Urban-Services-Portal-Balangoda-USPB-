export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          Admin Overview
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Balangoda Urban Council municipal services & system operations dashboard.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Total Garbage Revenue
          </p>
          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
            LKR 1,842,500
          </p>
          <span className="mt-1 inline-block text-xs font-medium text-emerald-600 dark:text-emerald-400">
            +12.4% this quarter
          </span>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Pending Certifications
          </p>
          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
            24
          </p>
          <span className="mt-1 inline-block text-xs font-medium text-amber-600 dark:text-amber-400">
            Requires field inspection
          </span>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Registered Schools
          </p>
          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
            18
          </p>
          <span className="mt-1 inline-block text-xs font-medium text-blue-600 dark:text-blue-400">
            Green rewards active
          </span>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Monthly Jobs Status
          </p>
          <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            Healthy
          </p>
          <span className="mt-1 inline-block text-xs font-medium text-gray-500 dark:text-gray-400">
            Next cron runs in 14 days
          </span>
        </div>
      </div>
    </div>
  );
}
