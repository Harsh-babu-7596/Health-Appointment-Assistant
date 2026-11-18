import { useState } from "react";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";
import { ToastProvider } from "@/components/ui/Toast";
import { Contact } from "@/sections/Contact";
import { CtaBand } from "@/sections/CtaBand";
import { DemoSection } from "@/sections/demo/DemoSection";
import { Faq } from "@/sections/Faq";
import { Features } from "@/sections/Features";
import { Hero } from "@/sections/Hero";
import { Logos } from "@/sections/Logos";
import { Pricing } from "@/sections/Pricing";
import { Process } from "@/sections/Process";
import { RoiCalculator } from "@/sections/RoiCalculator";
import { Testimonials } from "@/sections/Testimonials";
import { WhySwitch } from "@/sections/WhySwitch";
import type { PlanName } from "@/types";

export default function App() {
  const [selectedPlan, setSelectedPlan] = useState<PlanName | "Not sure yet">("Not sure yet");

  return (
    <ToastProvider>
      <Navbar />
      <main>
        <Hero />
        <Logos />
        <WhySwitch />
        <DemoSection />
        <Features />
        <Process />
        <RoiCalculator />
        <Pricing onSelectPlan={setSelectedPlan} />
        <Testimonials />
        <Faq />
        <Contact plan={selectedPlan} onPlanChange={setSelectedPlan} />
        <CtaBand />
      </main>
      <Footer />
      <WhatsAppButton />
    </ToastProvider>
  );
}
