import { Link } from "react-router-dom";
import { ArrowRight, AlertTriangle } from "lucide-react";
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
      {/* NO FAKES Act announcement banner */}
      <div className="bg-[#C0392B] text-white pt-20 lg:pt-24">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-center gap-3 flex-wrap text-center">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span className="text-sm font-medium">
            The NO FAKES Act is coming. Register your face now and establish your claim date.
          </span>
          <Link
            to="/signup"
            className="inline-flex items-center gap-1 text-sm font-bold underline-offset-2 hover:underline"
          >
            Get My Certificate <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
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
