import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, AlertTriangle, X } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import ThreeSteps from "@/components/landing/ThreeSteps";
import WhyClaimMyFace from "@/components/landing/WhyClaimMyFace";
import TrustSection from "@/components/landing/TrustSection";
import Footer from "@/components/landing/Footer";

const BANNER_KEY = "cmf-no-fakes-banner-dismissed";

const Index = () => {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    setShowBanner(typeof window !== "undefined" && localStorage.getItem(BANNER_KEY) !== "1");
  }, []);

  const dismiss = () => {
    localStorage.setItem(BANNER_KEY, "1");
    setShowBanner(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {/* NO FAKES Act announcement banner */}
      {showBanner && (
        <div className="bg-[#C0392B] text-white pt-20 lg:pt-24 relative">
          <div className="max-w-7xl mx-auto px-6 py-3 pr-12 flex items-center justify-center gap-3 flex-wrap text-center">
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
          <button
            onClick={dismiss}
            aria-label="Dismiss announcement"
            className="absolute right-3 bottom-2 p-1.5 rounded-md hover:bg-white/15 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      <HeroSection />
      <ThreeSteps />
      <WhyClaimMyFace />
      <TrustSection />
      <Footer />
    </div>
  );
};

export default Index;
