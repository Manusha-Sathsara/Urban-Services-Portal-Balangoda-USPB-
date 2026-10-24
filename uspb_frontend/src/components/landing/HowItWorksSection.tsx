export function HowItWorksSection() {
  return (
    <section className="py-[50px] pb-10">
      <div className="max-w-[1180px] mx-auto px-5 text-center">
        <div className="text-[11px] font-bold tracking-[0.08em] uppercase text-[#5a0000] mb-[6px]">
          How the Portal Works
        </div>
        <h2 className="font-serif text-[#5a0000] text-[22px] mb-2">
          Simple. Organized. Efficient.
        </h2>
        <p className="text-[13px] text-[#4a4a4a] max-w-[520px] mx-auto mb-9">
          A seamless 3-stage flow tailored for citizens, school coordinators, and municipal health executives.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
          {/* Step 1 */}
          <div className="card-hover-fx bg-[#f0e0df] rounded-lg p-[28px_18px_22px] border border-[#ead5d3]">
            <div className="flex justify-between items-center mb-[18px] text-[10px] text-[#8a6e6c]">
              <span className="w-9 h-9 rounded-lg bg-[#800000] text-white font-serif grid place-items-center font-bold text-sm">
                1
              </span>
              <span>PHASE 01</span>
            </div>
            <h3 className="font-serif text-[15px] text-[#5a0000] mb-[10px]">
              Secure Access
            </h3>
            <p className="text-[11.5px] text-[#8a5a58] mb-[14px]">
              Sign in through 2FA role-restricted credentials or citizen identification to access relevant Balangoda Council forms and ledgers.
            </p>
            <small className="text-[10px] font-bold text-[#5a0000] block">
              &#127380; Identity Verification
            </small>
          </div>

          {/* Step 2 */}
          <div className="card-hover-fx bg-[#dcc7c5] rounded-lg p-[28px_18px_22px] border border-[#ead5d3]">
            <div className="flex justify-between items-center mb-[18px] text-[10px] text-[#8a6e6c]">
              <span className="w-9 h-9 rounded-lg bg-[#800000] text-white font-serif grid place-items-center font-bold text-sm">
                2
              </span>
              <span>PHASE 02</span>
            </div>
            <h3 className="font-serif text-[15px] text-[#5a0000] mb-[10px]">
              Manage Services
            </h3>
            <p className="text-[11.5px] text-[#8a5a58] mb-[14px]">
              Submit applications, schedule on-site PHI audits, settle commercial waste dues, or log school recycling points securely.
            </p>
            <small className="text-[10px] font-bold text-[#5a0000] block">
              &#9881; Automated Ingestion
            </small>
          </div>

          {/* Step 3 */}
          <div className="card-hover-fx bg-[#dcc7c5] rounded-lg p-[28px_18px_22px] border border-[#ead5d3]">
            <div className="flex justify-between items-center mb-[18px] text-[10px] text-[#8a6e6c]">
              <span className="w-9 h-9 rounded-lg bg-[#800000] text-white font-serif grid place-items-center font-bold text-sm">
                3
              </span>
              <span>PHASE 03</span>
            </div>
            <h3 className="font-serif text-[15px] text-[#5a0000] mb-[10px]">
              Track &amp; Review
            </h3>
            <p className="text-[11.5px] text-[#8a5a58] mb-[14px]">
              Monitor real-time progress, download official QR certificates, view payment receipts, and receive renewal reminders.
            </p>
            <small className="text-[10px] font-bold text-[#5a0000] block">
              &#9638; Instant Validated Records
            </small>
          </div>
        </div>
      </div>
    </section>
  );
}
