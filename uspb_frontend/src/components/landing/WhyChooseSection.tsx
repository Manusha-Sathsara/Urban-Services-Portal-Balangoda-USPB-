export function WhyChooseSection() {
  return (
    <section className="bg-[#f0e0df] py-[50px]">
      <div className="max-w-[1180px] mx-auto px-5 text-center">
        <div className="text-[11px] font-bold tracking-[0.08em] uppercase text-[#5a0000] mb-[6px]">
          Operational Advantages
        </div>
        <h2 className="font-serif text-[#5a0000] text-[22px] mb-2">
          Why Choose Our Digital System?
        </h2>
        <p className="text-[13px] text-[#800000] max-w-[520px] mx-auto mb-9">
          Improving service delivery through organized records, efficient workflows, and better access to information.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
          <div className="card-hover-fx bg-white rounded-lg p-[22px_18px] shadow-[0_2px_10px_rgba(90,0,0,0.1)] border border-[#f0e6e5]">
            <div className="w-[42px] h-[42px] rounded-lg bg-[#f0e0df] text-[#5a0000] grid place-items-center text-[18px] mb-[22px]">
              &#9638;
            </div>
            <h3 className="font-serif text-[15px] text-[#5a0000] mb-[10px]">
              Centralized Information
            </h3>
            <p className="text-[11.5px] text-[#8a5a58]">
              Unified council repository across all 16 Balangoda wards, removing departmental data silos and redundant logs.
            </p>
          </div>

          <div className="card-hover-fx bg-white rounded-lg p-[22px_18px] shadow-[0_2px_10px_rgba(90,0,0,0.1)] border border-[#f0e6e5]">
            <div className="w-[42px] h-[42px] rounded-lg bg-[#f0e0df] text-[#5a0000] grid place-items-center text-[18px] mb-[22px]">
              &#128196;
            </div>
            <h3 className="font-serif text-[15px] text-[#5a0000] mb-[10px]">
              Reduced Paperwork
            </h3>
            <p className="text-[11.5px] text-[#8a5a58]">
              Over 90% reduction in paper application bottlenecks, allowing accelerated processing of citizen health permits.
            </p>
          </div>

          <div className="card-hover-fx bg-white rounded-lg p-[22px_18px] shadow-[0_2px_10px_rgba(90,0,0,0.1)] border border-[#f0e6e5]">
            <div className="w-[42px] h-[42px] rounded-lg bg-[#f0e0df] text-[#5a0000] grid place-items-center text-[18px] mb-[22px]">
              &#9745;
            </div>
            <h3 className="font-serif text-[15px] text-[#5a0000] mb-[10px]">
              Accurate Records
            </h3>
            <p className="text-[11.5px] text-[#8a5a58]">
              Instant digital audit trails and tamper-proof verification for payments, licensing milestones, and inspections.
            </p>
          </div>

          <div className="card-hover-fx bg-white rounded-lg p-[22px_18px] shadow-[0_2px_10px_rgba(90,0,0,0.1)] border border-[#f0e6e5]">
            <div className="w-[42px] h-[42px] rounded-lg bg-[#f0e0df] text-[#5a0000] grid place-items-center text-[18px] mb-[22px]">
              &#128200;
            </div>
            <h3 className="font-serif text-[15px] text-[#5a0000] mb-[10px]">
              Better Monitoring
            </h3>
            <p className="text-[11.5px] text-[#8a5a58]">
              Real-time analytics for Public Health Inspectors (PHIs) to identify collection gaps and execute vector controls.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
