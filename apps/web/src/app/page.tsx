import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Benefits } from "@/components/landing/Benefits";
import { Audience } from "@/components/landing/Audience";
import { Architecture } from "@/components/landing/Architecture";
import { FAQ } from "@/components/landing/FAQ";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  return (
    <div className="landing-page min-h-screen bg-black text-white selection:bg-lime/30 selection:text-white">
      {/* Navigation */}
      <Navbar />

      {/* Main Content */}
      <main>
        {/* Hero Section */}
        <Hero />

        {/* How it Works / Stepper Flow */}
        <HowItWorks />

        {/* Value Proposition / Benefits Grid */}
        <Benefits />

        {/* Target Audience (Clients vs Developers) */}
        <Audience />

        {/* Architecture / Interactive Terminal */}
        <Architecture />

        {/* Frequently Asked Questions */}
        <FAQ />

        {/* Final CTA / Waitlist Pre-registration */}
        <CTASection />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
