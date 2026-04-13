import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import SocialProof from '@/components/SocialProof';
import HowItWorks from '@/components/HowItWorks';
import FeaturesGrid from '@/components/FeaturesGrid';
import DashboardSection from '@/components/DashboardSection';
import PricingSection from '@/components/PricingSection';
import FeatureStrip from '@/components/FeatureStrip';
import CTASection from '@/components/CTASection';
import Footer from '@/components/Footer';

const Index = () => (
  <div className="min-h-screen bg-background text-foreground">
    <Navbar />
    <HeroSection />
    <SocialProof />
    <HowItWorks />
    <FeaturesGrid />
    <DashboardSection />
    <FeatureStrip />
    <PricingSection />
    <CTASection />
    <Footer />
  </div>
);

export default Index;
