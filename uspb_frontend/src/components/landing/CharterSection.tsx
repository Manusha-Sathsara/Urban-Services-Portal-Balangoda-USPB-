export function CharterSection() {
  return (
    <section className="py-[50px]" id="about">
      <div className="max-w-[1180px] mx-auto px-5">
        <div className="bg-[#5a0000] rounded-lg overflow-hidden relative text-white p-9 sm:p-10 min-h-[370px] shadow-[0_8px_24px_rgba(0,0,0,0.2)]">
          {/* Sabaragamuwa scenic artistic gradient backdrop */}
          <div
            className="absolute right-0 top-0 bottom-0 w-full sm:w-[55%] pointer-events-none opacity-40 sm:opacity-100"
            style={{
              background:
                "linear-gradient(90deg, #5a0000 0%, rgba(90,0,0,0.2) 40%, transparent 100%), linear-gradient(180deg, #9fb8c9 0%, #7e9a8a 30%, #4f7a2e 60%, #2f5a1a 100%)",
            }}
          />

          <div className="relative z-10">
            <span className="inline-block bg-[#fbbf24] text-[#5a0000] text-[10px] font-bold py-[5px] px-[14px] rounded-[20px] mb-[18px]">
              &#9851; ECO-PRESERVATION CHARTER
            </span>
            <h2 className="text-white font-serif text-[24px] sm:text-[30px] mb-4">
              Building a Cleaner, Greener Balangoda
            </h2>
            <p className="max-w-[520px] text-[12.5px] text-[#e8cfcf] mb-[22px]">
              Nestled in the Sabaragamuwa hills, Balangoda represents a fragile highland ecosystem.
              The Urban Council&apos;s Health Division combines strict regulatory enforcement with youth participation to preserve our rivers, tea estates, and urban settlements.
            </p>

            <div className="flex flex-wrap gap-7 max-w-[560px] text-[10px] text-[#d9b8b8] pb-5 border-b border-white/20">
              <div>
                <b className="block text-[#fbbf24] font-serif text-[11px]">Responsible Waste</b>
                Source separation across all wards.
              </div>
              <div>
                <b className="block text-[#fbbf24] font-serif text-[11px]">Environmental Shield</b>
                Catchment water safeguarding.
              </div>
              <div>
                <b className="block text-[#fbbf24] font-serif text-[11px]">Youth Engagement</b>
                42 school eco-brigades deployed.
              </div>
            </div>

            <div className="flex flex-wrap gap-8 sm:gap-[70px] mt-[22px]">
              <div>
                <b className="font-serif text-[25px] text-[#fbbf24] block">340+ Tn</b>
                <span className="text-[10px] text-[#d9b8b8]">Waste Segregated</span>
              </div>
              <div>
                <b className="font-serif text-[25px] text-[#fbbf24] block">14,200</b>
                <span className="text-[10px] text-[#d9b8b8]">Student Participants</span>
              </div>
              <div>
                <b className="font-serif text-[25px] text-[#fbbf24] block">100%</b>
                <span className="text-[10px] text-[#d9b8b8]">PHI Digital Audit</span>
              </div>
            </div>

            <span className="absolute right-4 bottom-4 bg-[#f5ece0] text-[#5a0000] text-[10px] font-bold py-[6px] px-3 rounded-[3px] hidden sm:inline-block">
              Balangoda Green Shield Charter
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
