import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-6 py-12 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <main className="mx-auto flex max-w-2xl flex-col items-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 text-3xl font-bold text-white shadow-lg shadow-emerald-600/20">
          U
        </div>
        <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl">
          Urban Services Portal
        </h1>
        <p className="mt-2 text-lg font-medium text-emerald-600 dark:text-emerald-400">
          Balangoda Urban Council (USPB)
        </p>
        <p className="mt-4 max-w-xl text-base text-gray-600 dark:text-gray-400">
          Unified digital platform for municipal operations: Assessment & Garbage
          fee tracking, Environmental clearance management, and School Green
          Rewards program.
        </p>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <Link
            href="/login"
            className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-emerald-500 transition"
          >
            Sign in to Portal
          </Link>
          <Link
            href="/admin"
            className="rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 transition"
          >
            View Dashboard
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3 text-left">
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h3 className="font-semibold text-gray-900 dark:text-white">Garbage Fees</h3>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Automated quarterly assessments & receipting</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h3 className="font-semibold text-gray-900 dark:text-white">Environmental Certs</h3>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Digital clearance workflow & renewals</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h3 className="font-semibold text-gray-900 dark:text-white">Green Rewards</h3>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">School waste segregation & eco points</p>
          </div>
        </div>
      </main>
    </div>
  );
}
