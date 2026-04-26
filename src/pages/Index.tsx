import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import WhyClaimMyFace from "@/components/landing/WhyClaimMyFace";
import HowItWorks from "@/components/landing/HowItWorks";
import TrustSection from "@/components/landing/TrustSection";
import RegistryFeatures from "@/components/landing/RegistryFeatures";
import PricingSection from "@/components/landing/PricingSection";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <WhyClaimMyFace />
      <HowItWorks />
      <TrustSection />
      <RegistryFeatures />
      <PricingSection />
      <Footer />
    </div>
  );
};

export default Index;
