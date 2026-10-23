import Link from "next/link";

export function NoticeBanner() {
  return (
    <div className="bg-[#fff8e1] border-b border-[#eee3c4] text-[11px]">
      <div className="max-w-[1180px] mx-auto px-5 py-[9px] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center">
          <span className="inline-block w-2 h-2 rounded-full bg-[#fbbf24] mr-2 shrink-0" />
          <span>
            <strong className="text-[#5a0000] font-serif tracking-wider mr-1">
              NOTICE TO BALANGODA RATEPAYERS:
            </strong>
            Q2 Environmental Certificate renewals &amp; commercial waste assessments are now open online.
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-[#777] whitespace-nowrap">
          <Link href="#services" className="font-bold text-[#5a0000] hover:underline">
            Review Guidelines &rarr;
          </Link>
          <span>Gazette No. 2381/14 Compliant</span>
        </div>
      </div>
    </div>
  );
}
