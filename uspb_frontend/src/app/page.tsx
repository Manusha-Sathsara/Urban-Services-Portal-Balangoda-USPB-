import { NoticeBanner } from "@/components/landing/NoticeBanner";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { ServicesSection } from "@/components/landing/ServicesSection";
import { WhyChooseSection } from "@/components/landing/WhyChooseSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { UserRolesSection } from "@/components/landing/UserRolesSection";
import { CharterSection } from "@/components/landing/CharterSection";
import { SupportSection } from "@/components/landing/SupportSection";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[#fcf8f7] text-[#4a4a4a]">
      <LandingNavbar />
      <NoticeBanner />
      <main className="flex-1">
        <HeroSection />
        <ServicesSection />
        <WhyChooseSection />
        <HowItWorksSection />
        <UserRolesSection />
        <CharterSection />
        <SupportSection />
      </main>
      <LandingFooter />
    </div>
  );
}
