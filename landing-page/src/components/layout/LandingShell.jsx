import { LandingNavbar } from './LandingNavbar';
import { LandingFooter } from './LandingFooter';

export const LandingShell = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-cream-50 text-ink-900 font-sans antialiased">
      <LandingNavbar />
      <main className="flex-1 w-full flex flex-col">{children}</main>
      <LandingFooter />
    </div>
  );
};

export default LandingShell;
