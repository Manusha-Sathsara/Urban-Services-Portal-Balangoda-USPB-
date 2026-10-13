export default function SchoolsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            School Green Rewards
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Encouraging sustainable school waste segregation with gamified eco-points.
          </p>
        </div>
        <button className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 transition">
          + Record Collection
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            Balangoda Ananda Maithreya Central College
          </h3>
          <p className="mt-1 text-xs text-gray-500">Collected: 480 kg recyclable</p>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-2xl font-bold text-emerald-600">960 pts</span>
            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              Rank #1 🏆
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            St. Agnes Convent Balangoda
          </h3>
          <p className="mt-1 text-xs text-gray-500">Collected: 310 kg recyclable</p>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-2xl font-bold text-emerald-600">620 pts</span>
            <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-950 dark:text-blue-300">
              Rank #2 🥈
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            Meddakanda Maha Vidyalaya
          </h3>
          <p className="mt-1 text-xs text-gray-500">Collected: 195 kg recyclable</p>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-2xl font-bold text-emerald-600">390 pts</span>
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              Rank #3 🥉
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
