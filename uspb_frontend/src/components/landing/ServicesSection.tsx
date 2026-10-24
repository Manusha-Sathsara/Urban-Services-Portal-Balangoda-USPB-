import Link from "next/link";

export function ServicesSection() {
  return (
    <section id="services" className="py-[50px]">
      <div className="max-w-[1180px] mx-auto px-5">
        <h2 className="font-serif text-[#5a0000] text-[22px] mb-2">Our Digital Services</h2>
        <p className="text-[13px] text-[#4a4a4a] max-w-[520px] mb-9">
          Explore the essential services managed by the Health Division of Balangoda Urban Council through one centralized platform.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Service 1: Garbage Collection */}
          <div className="card-hover-fx bg-white rounded-lg p-[28px_18px_22px] shadow-[0_2px_10px_rgba(90,0,0,0.1)] border border-[#f0e6e5] relative flex flex-col h-full">
            <div className="w-[42px] h-[42px] rounded-lg bg-[#f0e0df] text-[#5a0000] grid place-items-center text-[18px] mb-[22px]">
              &#128202;
            </div>
            <h3 className="font-serif text-[15px] text-[#5a0000] mb-[10px] min-h-[44px]">
              Garbage Collection Fee Management
            </h3>
            <p className="text-[11.5px] text-[#8a5a58] mb-[14px] min-h-[36px]">
              Structured revenue collection and billing for municipal commercial and residential zones.
            </p>
            <ul className="list-none mb-6 flex-1 space-y-2">
              <li className="text-[11px] flex items-center gap-2">
                <span className="w-[13px] h-[13px] rounded-full border-[1.5px] border-[#800000] text-[#800000] text-[8px] flex items-center justify-center shrink-0">
                  ✓
                </span>
                Business &amp; Household Information Management
              </li>
              <li className="text-[11px] flex items-center gap-2">
                <span className="w-[13px] h-[13px] rounded-full border-[1.5px] border-[#800000] text-[#800000] text-[8px] flex items-center justify-center shrink-0">
                  ✓
                </span>
                Annual Fee Tracking &amp; Assessment Calculation
              </li>
              <li className="text-[11px] flex items-center gap-2">
                <span className="w-[13px] h-[13px] rounded-full border-[1.5px] border-[#800000] text-[#800000] text-[8px] flex items-center justify-center shrink-0">
                  ✓
                </span>
                Payment History, E-Receipts &amp; Audit Logs
              </li>
            </ul>
            <Link
              href="/garbage-fees"
              className="btn-hover-fx block text-center rounded-[2px] text-[11px] font-semibold bg-[#800000] text-white py-2 hover:bg-[#5a0000] mt-auto shadow-xs hover:shadow"
            >
              Explore Service &rarr;
            </Link>
          </div>

          {/* Service 2: Environmental Certificate */}
          <div className="card-hover-fx bg-white rounded-lg p-[28px_18px_22px] shadow-[0_2px_10px_rgba(90,0,0,0.1)] border border-[#f0e6e5] relative flex flex-col h-full">
            <span className="absolute top-[14px] right-0 bg-[#fbbf24] text-[#5a3a00] text-[9px] font-bold py-[3px] px-[10px] rounded-l-[3px]">
              3-Year Renewal
            </span>
            <div className="w-[42px] h-[42px] rounded-lg bg-[#f0e0df] text-[#5a0000] grid place-items-center text-[18px] mb-[22px]">
              &#128737;
            </div>
            <h3 className="font-serif text-[15px] text-[#5a0000] mb-[10px] min-h-[44px]">
              Environmental Certificate Management
            </h3>
            <p className="text-[11.5px] text-[#8a5a58] mb-[14px] min-h-[36px]">
              Official certification workflow for trading establishments, eateries, and commercial buildings.
            </p>
            <ul className="list-none mb-6 flex-1 space-y-2">
              <li className="text-[11px] flex items-center gap-2">
                <span className="w-[13px] h-[13px] rounded-full border-[1.5px] border-[#800000] text-[#800000] text-[8px] flex items-center justify-center shrink-0">
                  ✓
                </span>
                Online Certificate Applications &amp; Ingestion
              </li>
              <li className="text-[11px] flex items-center gap-2">
                <span className="w-[13px] h-[13px] rounded-full border-[1.5px] border-[#800000] text-[#800000] text-[8px] flex items-center justify-center shrink-0">
                  ✓
                </span>
                PHI Inspection Scheduling &amp; On-Site Audits
              </li>
              <li className="text-[11px] flex items-center gap-2">
                <span className="w-[13px] h-[13px] rounded-full border-[1.5px] border-[#800000] text-[#800000] text-[8px] flex items-center justify-center shrink-0">
                  ✓
                </span>
                Approval, QR-Secured Certificate Issuing
              </li>
            </ul>
            <Link
              href="/environmental"
              className="btn-hover-fx block text-center rounded-[2px] text-[11px] font-semibold bg-[#800000] text-white py-2 hover:bg-[#5a0000] mt-auto shadow-xs hover:shadow"
            >
              Explore Service &rarr;
            </Link>
          </div>

          {/* Service 3: School Waste & Rewards */}
          <div className="card-hover-fx bg-white rounded-lg p-[28px_18px_22px] shadow-[0_2px_10px_rgba(90,0,0,0.1)] border border-[#f0e6e5] relative flex flex-col h-full">
            <span className="absolute top-[14px] right-0 bg-[#fde8c8] text-[#5a3a00] text-[9px] font-bold py-[3px] px-[10px] rounded-l-[3px]">
              Eco-Rewards
            </span>
            <div className="w-[42px] h-[42px] rounded-lg bg-[#f0e0df] text-[#5a0000] grid place-items-center text-[18px] mb-[22px]">
              &#127891;
            </div>
            <h3 className="font-serif text-[15px] text-[#5a0000] mb-[10px] min-h-[44px]">
              School Garbage Collection &amp; Rewards
            </h3>
            <p className="text-[11.5px] text-[#8a5a58] mb-[14px] min-h-[36px]">
              Gamified segregation drive mobilizing Balangoda&apos;s primary and secondary educational network.
            </p>
            <ul className="list-none mb-6 flex-1 space-y-2">
              <li className="text-[11px] flex items-center gap-2">
                <span className="w-[13px] h-[13px] rounded-full border-[1.5px] border-[#800000] text-[#800000] text-[8px] flex items-center justify-center shrink-0">
                  ✓
                </span>
                School &amp; Preschool Roster Management
              </li>
              <li className="text-[11px] flex items-center gap-2">
                <span className="w-[13px] h-[13px] rounded-full border-[1.5px] border-[#800000] text-[#800000] text-[8px] flex items-center justify-center shrink-0">
                  ✓
                </span>
                Student Eco-Account &amp; Weight-Based Logs
              </li>
              <li className="text-[11px] flex items-center gap-2">
                <span className="w-[13px] h-[13px] rounded-full border-[1.5px] border-[#800000] text-[#800000] text-[8px] flex items-center justify-center shrink-0">
                  ✓
                </span>
                Points, Badges &amp; Council Reward Disbursement
              </li>
            </ul>
            <Link
              href="/schools"
              className="btn-hover-fx block text-center rounded-[2px] text-[11px] font-semibold bg-[#800000] text-white py-2 hover:bg-[#5a0000] mt-auto shadow-xs hover:shadow"
            >
              Explore Service &rarr;
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
