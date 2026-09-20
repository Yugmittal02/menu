import React, { useState } from 'react';
import Header from '../components/Header';
import HeroSection from '../components/HeroSection';
import TrustStrip from '../components/TrustStrip';
import ProblemSection from '../components/ProblemSection';
import FeaturesSection from '../components/FeaturesSection';
import HowItWorks from '../components/HowItWorks';
import DashboardPreview from '../components/DashboardPreview';
import RestaurantBenefits from '../components/RestaurantBenefits';
import FAQSection from '../components/FAQSection';
import FinalCTA from '../components/FinalCTA';
import Footer from '../components/Footer';
import ApplicationModal from '../components/ApplicationModal';

const LandingPage = () => {
  const [isAppModalOpen, setIsAppModalOpen] = useState(false);

  const handleOpenApplication = () => {
    setIsAppModalOpen(true);
  };

  const handleCloseApplication = () => {
    setIsAppModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#070A11] text-gray-100 font-sans selection:bg-purple-600/30 selection:text-white relative">
      {/* Sticky Navigation Header */}
      <Header onOpenApplication={handleOpenApplication} />

      {/* Hero Section with Interactive Mockup */}
      <main>
        <HeroSection onOpenApplication={handleOpenApplication} />
        
        {/* Capability Trust Strip */}
        <TrustStrip />

        {/* Problem vs Solution Section */}
        <ProblemSection onOpenApplication={handleOpenApplication} />

        {/* 6 Core Platform Features */}
        <FeaturesSection />

        {/* 4-Step Process Walkthrough */}
        <HowItWorks />

        {/* Interactive Dashboard Command Center Preview */}
        <DashboardPreview />

        {/* Restaurant Industry Benefits */}
        <RestaurantBenefits />

        {/* Onboarding Application Form Section */}
        <section id="apply-section" className="py-16 bg-[#070A11]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ApplicationModal isOpen={true} isInline={true} />
          </div>
        </section>

        {/* Frequently Asked Questions */}
        <FAQSection onOpenApplication={handleOpenApplication} />

        {/* Final Conversion Call To Action */}
        <FinalCTA onOpenApplication={handleOpenApplication} />
      </main>

      {/* Structured Footer */}
      <Footer onOpenApplication={handleOpenApplication} />

      {/* Popup Application Modal (when triggered via header/buttons) */}
      {isAppModalOpen && (
        <ApplicationModal isOpen={isAppModalOpen} onClose={handleCloseApplication} />
      )}
    </div>
  );
};

export default LandingPage;
