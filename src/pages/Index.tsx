import { useState, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import TopBar from "@/components/TopBar";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import AdmissionTicker from "@/components/AdmissionTicker";
import WhyChooseUs from "@/components/WhyChooseUs";
import AboutSection from "@/components/AboutSection";
import VisionMission from "@/components/VisionMission";
import GoalsSection from "@/components/GoalsSection";
import DirectorMessage from "@/components/DirectorMessage";
import PrincipalMessage from "@/components/PrincipalMessage";
import AcademicsSection from "@/components/AcademicsSection";
import FeeStructure from "@/components/FeeStructure";
import TestimonialsSection from "@/components/TestimonialsSection";
import GallerySection from "@/components/GallerySection";
import FAQSection from "@/components/FAQSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";
import SplashScreen from "@/components/SplashScreen";
import ScrollReveal from "@/components/ScrollReveal";

const Index = () => {
  const [showSplash, setShowSplash] = useState(true);
  const handleSplashComplete = useCallback(() => setShowSplash(false), []);

  return (
    <>
      <AnimatePresence>
        {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      </AnimatePresence>

      <div className="min-h-screen">
        <TopBar />
        <Navbar />
        <HeroSection />
        <AdmissionTicker />

        <ScrollReveal direction="up"><WhyChooseUs /></ScrollReveal>
        <ScrollReveal direction="left"><AboutSection /></ScrollReveal>
        <ScrollReveal direction="right"><VisionMission /></ScrollReveal>
        <ScrollReveal direction="up"><GoalsSection /></ScrollReveal>
        <ScrollReveal direction="left"><DirectorMessage /></ScrollReveal>
        <ScrollReveal direction="right"><PrincipalMessage /></ScrollReveal>
        <ScrollReveal direction="up"><AcademicsSection /></ScrollReveal>
        <ScrollReveal direction="up" delay={0.1}><FeeStructure /></ScrollReveal>
        <ScrollReveal direction="up"><TestimonialsSection /></ScrollReveal>
        <ScrollReveal direction="up"><GallerySection /></ScrollReveal>
        <ScrollReveal direction="up"><FAQSection /></ScrollReveal>
        <ScrollReveal direction="up"><ContactSection /></ScrollReveal>

        <Footer />
      </div>
    </>
  );
};

export default Index;
