import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Benefits } from "@/components/landing/Benefits";
import { Audience } from "@/components/landing/Audience";
import { Architecture } from "@/components/landing/Architecture";
import { FAQ } from "@/components/landing/FAQ";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/landing/Footer";
import { ShaderCanvas } from "@/components/landing/gpu/ShaderCanvas";
import { HERO_FIELD_SHADER } from "@/components/landing/gpu/heroField.wgsl";

export default function Home() {
  return (
    <div className="landing-page relative isolate min-h-screen text-white selection:bg-lime/30 selection:text-white">
      {/* One fixed shader behind the whole page. The CSS layers are the fallback when WebGPU is unavailable. */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <ShaderCanvas shader={HERO_FIELD_SHADER} interactive className="block h-full w-full" />
        <div className="hero-grid" />
        <div className="hero-halo" />
      </div>

      <Navbar />

      <main className="relative z-10">
        <Hero />

        {/* Everything after the hero sits on a translucent scrim so body copy stays readable. */}
        <div className="landing-body">
          <HowItWorks />
          <Benefits />
          <Audience />
          <Architecture />
          <FAQ />
          <CTASection />
        </div>
      </main>

      <Footer />
    </div>
  );
}
