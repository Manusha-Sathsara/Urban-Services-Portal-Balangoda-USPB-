export default function SchoolsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-[22px] text-[#5a0000] leading-tight">
            School Green Rewards
          </h2>
          <p className="text-[13px] text-[#8a5a58] mt-1">
            Encouraging sustainable school waste segregation with gamified eco-points.
          </p>
        </div>
        <button className="btn-hover-fx rounded bg-[#800000] px-4 py-2 text-[13px] font-semibold text-white shadow-sm hover:bg-[#5a0000] transition">
          + Record Collection
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="card-hover-fx rounded-lg border border-[#f0e6e5] bg-white p-6 shadow-[0_2px_10px_rgba(90,0,0,0.08)]">
          <h3 className="font-serif text-[15px] font-bold text-[#5a0000]">
            Balangoda Ananda Maithreya Central College
          </h3>
          <p className="mt-1 text-xs text-[#8a5a58]">Collected: 480 kg recyclable</p>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-2xl font-bold text-emerald-600">960 pts</span>
            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
              Rank #1 🏆
            </span>
          </div>
        </div>

        <div className="card-hover-fx rounded-lg border border-[#f0e6e5] bg-white p-6 shadow-[0_2px_10px_rgba(90,0,0,0.08)]">
          <h3 className="font-serif text-[15px] font-bold text-[#5a0000]">
            St. Agnes Convent Balangoda
          </h3>
          <p className="mt-1 text-xs text-[#8a5a58]">Collected: 310 kg recyclable</p>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-2xl font-bold text-emerald-600">620 pts</span>
            <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-800">
              Rank #2 🥈
            </span>
          </div>
        </div>

        <div className="card-hover-fx rounded-lg border border-[#f0e6e5] bg-white p-6 shadow-[0_2px_10px_rgba(90,0,0,0.08)]">
          <h3 className="font-serif text-[15px] font-bold text-[#5a0000]">
            Meddakanda Maha Vidyalaya
          </h3>
          <p className="mt-1 text-xs text-[#8a5a58]">Collected: 195 kg recyclable</p>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-2xl font-bold text-emerald-600">390 pts</span>
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
              Rank #3 🥉
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
