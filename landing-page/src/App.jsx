import { LandingNavbar } from './components/layout/LandingNavbar';
import { HeroSection } from './components/sections/HeroSection';
import { FeaturesSection } from './components/sections/FeaturesSection';
import { PreviewSection } from './components/sections/PreviewSection';
import { LandingFooter } from './components/layout/LandingFooter';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-cream-50 text-ink-900 font-sans antialiased selection:bg-gold-300 selection:text-brand-900">
      <LandingNavbar />
      <main className="flex-1 w-full">
        <HeroSection />
        <FeaturesSection />
        <PreviewSection />
      </main>
      <LandingFooter />
    </div>
  );
}
