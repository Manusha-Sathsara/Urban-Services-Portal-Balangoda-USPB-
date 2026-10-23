import Link from "next/link";
import Image from "next/image";

export function LandingFooter() {
  return (
    <footer className="bg-[#5a0000] text-[#e8cfcf] pt-9 pb-[18px] text-[11px]">
      <div className="max-w-[1180px] mx-auto px-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_1.2fr] gap-[30px]">
          {/* Brand info */}
          <div>
            <div className="flex items-center gap-3 mb-[14px] text-white font-serif font-bold">
              <div className="relative w-8 h-8 shrink-0">
                <Image
                  src="/images/gov_logo.png"
                  alt="Government / Council Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                Balangoda Urban Council
                <small className="block text-[#fbbf24] font-sans font-normal text-[10px]">
                  Health Division IMS
                </small>
              </div>
            </div>
            <p className="text-[11px] leading-relaxed">
              Providing streamlined public municipal health services, epidemiological tracking, sanitary inspection compliance, and environmental health administration for the citizens of Balangoda.
            </p>
          </div>

          {/* Public Services */}
          <div>
            <h4 className="text-[#fbbf24] font-serif text-[12px] mb-4 tracking-[0.04em] font-bold">
              PUBLIC SERVICES
            </h4>
            <ul className="list-none space-y-3">
              <li>Public Health Inspector (PHI) Inquiries</li>
              <li>Food Handling &amp; Hygiene Certification</li>
              <li>Dengue &amp; Vector Prevention Reports</li>
              <li>Maternal &amp; Child Healthcare Clinics</li>
              <li>Environmental Health Complaints</li>
            </ul>
          </div>

          {/* Civic Governance */}
          <div>
            <h4 className="text-[#fbbf24] font-serif text-[12px] mb-4 tracking-[0.04em] font-bold">
              CIVIC GOVERNANCE
            </h4>
            <ul className="list-none space-y-3">
              <li>Council By-Laws &amp; Health Directives</li>
              <li>Right to Information (RTI) Officer</li>
              <li>Official Gazette &amp; Public Notices</li>
              <li>Annual Health Division Audit Reports</li>
              <li>Citizen Charter &amp; Service Standards</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-[#fbbf24] font-serif text-[12px] mb-4 tracking-[0.04em] font-bold">
              CONTACT HEALTH DIVISION
            </h4>
            <ul className="list-none space-y-3">
              <li>&#9906; Urban Council Complex, Barnes Ratwatte Mawatha, Balangoda 70100, Sri Lanka</li>
              <li>&#9743; +94 (0) 45 228 7275 / +94 (0) 45 228 7322</li>
              <li>&#9993; health@balangodauc.gov.lk</li>
              <li>&#9719; Weekdays: 8:30 AM – 4:15 PM</li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright row */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-[30px] pt-4 border-t border-white/10 text-[10px]">
          <span>
            &copy; 2025 Balangoda Urban Council, Sabaragamuwa Province, Sri Lanka. All Rights Reserved.
          </span>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="#" className="hover:text-white transition-colors">
              Terms of Public Service
            </Link>
            <Link href="#" className="hover:text-white transition-colors">
              Accessibility Statement
            </Link>
            <Link href="#" className="hover:text-white transition-colors">
              Gov.lk Portal
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
