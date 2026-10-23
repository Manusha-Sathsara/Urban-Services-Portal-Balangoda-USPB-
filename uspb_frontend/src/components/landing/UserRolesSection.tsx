import Link from "next/link";

export function UserRolesSection() {
  return (
    <section className="bg-[#faf4f3] py-[50px]">
      <div className="max-w-[1180px] mx-auto px-5">
        <div className="text-[11px] font-bold tracking-[0.08em] uppercase text-[#5a0000] mb-[6px]">
          Access Management
        </div>
        <h2 className="font-serif text-[#5a0000] text-[22px] mb-2">Designed for Every User</h2>
        <p className="text-[13px] text-[#4a4a4a] max-w-[520px] mb-9">
          Tailored user environments built with specialized access controls for each municipal responsibility level.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card-hover-fx bg-white rounded-lg p-[28px_18px_22px] shadow-[0_2px_10px_rgba(90,0,0,0.1)] border border-[#f0e6e5]">
            <div className="w-[42px] h-[42px] rounded-lg bg-[#f0e0df] text-[#5a0000] grid place-items-center text-[18px] mb-[22px]">
              &#10010;
            </div>
            <h3 className="font-serif text-[15px] text-[#5a0000] mb-[10px]">Health Officers</h3>
            <p className="text-[11.5px] text-[#8a5a58] mb-[14px]">
              Executive ledger authority, legal notices, divisional oversight, and municipal Council approvals.
            </p>
            <span className="inline-block bg-[#f8e9e8] text-[#5a0000] font-serif text-[9px] font-bold py-1 px-[10px] rounded-[3px]">
              Executive Clearance
            </span>
          </div>

          <div className="card-hover-fx bg-white rounded-lg p-[28px_18px_22px] shadow-[0_2px_10px_rgba(90,0,0,0.1)] border border-[#f0e6e5]">
            <div className="w-[42px] h-[42px] rounded-lg bg-[#f0e0df] text-[#5a0000] grid place-items-center text-[18px] mb-[22px]">
              &#9745;
            </div>
            <h3 className="font-serif text-[15px] text-[#5a0000] mb-[10px]">Authorized PHIs</h3>
            <p className="text-[11.5px] text-[#8a5a58] mb-[14px]">
              Field inspection teams, dengue vector surveys, commercial kitchen audits, and sanitary compliance.
            </p>
            <span className="inline-block bg-[#f8e9e8] text-[#5a0000] font-serif text-[9px] font-bold py-1 px-[10px] rounded-[3px]">
              Field Inspector ID
            </span>
          </div>

          <div className="card-hover-fx bg-white rounded-lg p-[28px_18px_22px] shadow-[0_2px_10px_rgba(90,0,0,0.1)] border border-[#f0e6e5]">
            <div className="w-[42px] h-[42px] rounded-lg bg-[#f0e0df] text-[#5a0000] grid place-items-center text-[18px] mb-[22px]">
              &#128100;
            </div>
            <h3 className="font-serif text-[15px] text-[#5a0000] mb-[10px]">School Staff &amp; Teachers</h3>
            <p className="text-[11.5px] text-[#8a5a58] mb-[14px]">
              Eco-club coordinators, student recycling logbook entries, badge awards, and incentive tracking.
            </p>
            <span className="inline-block bg-[#f8e9e8] text-[#5a0000] font-serif text-[9px] font-bold py-1 px-[10px] rounded-[3px]">
              Educational Portal
            </span>
          </div>

          <div className="card-hover-fx bg-white rounded-lg p-[28px_18px_22px] shadow-[0_2px_10px_rgba(90,0,0,0.1)] border border-[#f0e6e5]">
            <div className="w-[42px] h-[42px] rounded-lg bg-[#f0e0df] text-[#5a0000] grid place-items-center text-[18px] mb-[22px]">
              &#9881;
            </div>
            <h3 className="font-serif text-[15px] text-[#5a0000] mb-[10px]">System Administrators</h3>
            <p className="text-[11.5px] text-[#8a5a58] mb-[14px]">
              User provisioning, cryptographic audit logs, database backups, and central government API gateways.
            </p>
            <span className="inline-block bg-[#f8e9e8] text-[#5a0000] font-serif text-[9px] font-bold py-1 px-[10px] rounded-[3px]">
              SysAdmin Superuser
            </span>
          </div>
        </div>

        <div className="bg-white rounded-[6px] py-[14px] px-[18px] flex flex-wrap justify-between items-center gap-3 text-[11px] mt-7 border border-[#f0e6e5]">
          <span>
            &#128737; All operations are secured with TLS 1.3 encryption and monitored by Balangoda Urban Council IT Unit.
          </span>
          <Link href="/login" className="text-[#5a0000] font-serif font-bold hover:underline">
            Portal Login Details &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}
