import Link from "next/link";
import Image from "next/image";

export function HeroSection() {
  return (
    <section className="py-[70px] pb-20">
      <div className="max-w-[1180px] mx-auto px-5 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        <div>
          <h1 className="font-serif text-[#5a0000] text-[28px] sm:text-[34px] leading-[1.35] mb-[22px]">
            Smarter Management for a{" "}
            <span className="border-b-4 border-[#fbbf24]">Cleaner Community</span>
          </h1>
          <p className="text-[15px] max-w-[460px] mb-7 text-[#4a4a4a]">
            A centralized digital platform to manage garbage collection fees, environmental
            certificates, and school waste collection programs efficiently and transparently.
          </p>

          <div className="flex flex-wrap gap-[14px] mb-[34px]">
            <Link
              href="/login"
              className="btn-hover-fx inline-block px-[22px] py-[13px] rounded bg-[#800000] text-white text-[13px] font-semibold hover:bg-[#5a0000] shadow-sm hover:shadow"
            >
              &#128274; Access System
            </Link>
            <Link
              href="#services"
              className="btn-hover-fx inline-block px-[22px] py-[13px] rounded bg-white border border-[#d9c9c8] text-[#5a0000] text-[13px] font-semibold hover:bg-[#f0e0df] shadow-xs hover:shadow-sm"
            >
              Explore Services &#8964;
            </Link>
          </div>

          <div className="flex flex-wrap gap-6 font-serif text-[10px] text-[#5a0000]">
            <span className="border-l-[3px] border-[#fbbf24] pl-2">
              Centralized Digital Records
            </span>
            <span className="border-l-[3px] border-[#fbbf24] pl-2">
              Efficient Service Management
            </span>
            <span className="border-l-[3px] border-[#fbbf24] pl-2">
              Sustainable Community Initiatives
            </span>
          </div>
        </div>

        <div className="flex justify-center items-center">
          <div className="relative w-full max-w-[480px] h-[300px] sm:h-[360px]">
            <Image
              src="/images/Hero.png"
              alt="Health Division IMS Banner"
              fill
              className="object-contain scale-110 sm:scale-135 origin-center"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
