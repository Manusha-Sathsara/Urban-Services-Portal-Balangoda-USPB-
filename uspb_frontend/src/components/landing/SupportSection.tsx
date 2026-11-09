import Link from "next/link";

export function SupportSection() {
  return (
    <section className="bg-[#f6f0ef] py-[50px]" id="help">
      <div className="max-w-[1180px] mx-auto px-5 grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-[30px]">
        {/* Left Column */}
        <div>
          <div className="text-[11px] font-bold tracking-[0.08em] uppercase text-[#5a0000] mb-[6px]">
            Public Support &amp; Counters
          </div>
          <h2 className="font-serif text-[#5a0000] text-[24px] mb-[14px]">
            Need Assistance with Digital Services?
          </h2>
          <p className="text-[13px] text-[#4a4a4a]">
            Our municipal public health desk provides hands-on technical guidance for certificate renewals, payment verification, and community school submissions.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-[14px] mt-[22px]">
            <div className="card-hover-fx bg-white p-[14px_16px] rounded text-[10.5px] text-[#7a5a58] border border-[#f0e6e5]">
              <b className="block font-serif text-[#5a0000] text-[11px] mb-[3px]">Council Headquarters</b>
              Health Division, Balangoda Urban Council, Barnes Ratwatte Mawatha, Balangoda 70190
            </div>

            <div className="card-hover-fx bg-white p-[14px_16px] rounded text-[10.5px] text-[#7a5a58] border border-[#f0e6e5]">
              <b className="block font-serif text-[#5a0000] text-[11px] mb-[3px]">Telephone Helpdesk</b>
              +94 (0) 45 228 7275 / Ext 14<br />
              +94 (0) 45 228 7322
            </div>

            <div className="card-hover-fx bg-white p-[14px_16px] rounded text-[10.5px] text-[#7a5a58] border border-[#f0e6e5]">
              <b className="block font-serif text-[#5a0000] text-[11px] mb-[3px]">Official Email</b>
              health@balangodauc.gov.lk<br />
              support@balangodauc.gov.lk
            </div>

            <div className="card-hover-fx bg-white p-[14px_16px] rounded text-[10.5px] text-[#7a5a58] border border-[#f0e6e5]">
              <b className="block font-serif text-[#5a0000] text-[11px] mb-[3px]">Public Counter Hours</b>
              Mon – Fri: 8:30 AM – 4:15 PM<br />
              Closed on Public &amp; Bank Holidays
            </div>
          </div>
        </div>

        {/* Right Column: Helpdesk Ticket Card */}
        <div className="card-hover-fx bg-white border-t-4 border-[#800000] rounded-[6px] p-[22px] shadow-[0_4px_14px_rgba(0,0,0,0.08)]">
          <span className="inline-block bg-[#eee] text-[#555] font-serif text-[9px] font-bold py-1 px-[10px] rounded-[3px]">
            MUNICIPAL DESK 24/7 TICKET
          </span>
          <h3 className="font-serif text-[17px] text-[#5a0000] mt-[18px] mb-3">
            Public Health Helpline
          </h3>
          <p className="text-[11px] text-[#4a4a4a] mb-[14px]">
            Facing issues accessing your account or scheduling a mandatory PHI visit for your commercial license? Contact our support staff for accelerated assistance.
          </p>

          <div className="bg-[#f6eeed] p-[10px_12px] text-[10.5px] mb-[18px] text-[#7a5a58] rounded">
            <div className="flex justify-between py-[3px]">
              <span>Average In-Person Response</span>
              <b className="text-[#2e7d32]">Under 15 Mins</b>
            </div>
            <div className="flex justify-between py-[3px]">
              <span>Ticket Resolution Index</span>
              <b className="text-[#2e7d32]">99.1% Verified</b>
            </div>
          </div>

          <Link
            href="tel:+94452287275"
            className="btn-hover-fx block text-center rounded-[3px] text-[13px] font-semibold bg-[#800000] text-white py-3 mb-[10px] hover:bg-[#5a0000] shadow-xs hover:shadow"
          >
            &#9743; Contact Municipal Desk
          </Link>
          <Link
            href="#help"
            className="btn-hover-fx block text-center rounded-[3px] text-[10.5px] font-semibold bg-[#eee] text-[#444] py-3 hover:bg-[#ddd]"
          >
            View Ratepayer FAQ Documentation
          </Link>
        </div>
      </div>
    </section>
  );
}
