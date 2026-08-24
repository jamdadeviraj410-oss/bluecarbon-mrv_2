import { Link } from 'react-router-dom';
import { ROUTES } from '../../utils/constants';
import { useState, useEffect } from 'react';

export default function StatusTransitionPage() {
  const [scenario, setScenario] = useState('reset'); // 'reset' or 'success'

  // Toggle scenario for demonstration
  useEffect(() => {
    const timer = setInterval(() => {
      setScenario(prev => prev === 'reset' ? 'success' : 'reset');
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-xl px-md bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-surface-container-low via-surface to-surface">
      <header className="mb-8 flex flex-col items-center gap-4 text-center">
        <Link to={ROUTES.LOGIN} className="flex items-center gap-2 group">
          <span className="material-symbols-outlined text-primary text-[32px] transition-transform group-hover:scale-105">water_ec</span>
          <span className="font-headline-md text-primary tracking-tight">BlueCarbon MRV</span>
        </Link>
        <p className="font-body-md text-on-surface-variant max-w-sm">Secure cryptographic registry for blue carbon ecosystem services.</p>
      </header>

      <main className="w-full max-w-[440px] bg-surface-container-lowest p-8 rounded-xl shadow-[0_4px_24px_rgba(0,51,102,0.06)] border border-outline-variant/30 flex flex-col items-center justify-center">
        {scenario === 'reset' ? (
          <div className="relative w-full">
            <div className="absolute -inset-4 bg-primary/5 rounded-[2rem] blur-xl z-0 pointer-events-none" />
            <div className="relative bg-surface rounded-xl shadow-lg z-10 overflow-hidden" style={{ boxShadow: '0px 4px 12px rgba(0, 51, 102, 0.05)' }}>
              <div className="h-[3px] w-full bg-secondary-fixed" />
              <div className="p-8 flex flex-col items-center text-center">
                <div className="mb-6 rounded-full bg-secondary-fixed/10 p-4 text-secondary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[48px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                </div>
                <h1 className="font-headline-md text-on-surface mb-2">Check Your Email</h1>
                <p className="font-body-md text-on-surface-variant mb-8 max-w-[280px]">
                  A password reset link has been sent to your email. Please check your inbox and follow the instructions.
                </p>
                <Link to={ROUTES.LOGIN} className="w-full inline-flex justify-center items-center py-4 px-6 bg-primary text-on-primary font-title-md rounded-[12px] hover:bg-primary/90 transition-colors">
                  Back to Login
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative w-full">
            <div className="relative bg-surface rounded-xl shadow-lg z-10 overflow-hidden" style={{ boxShadow: '0px 4px 12px rgba(0, 51, 102, 0.05)' }}>
              <div className="h-[3px] w-full bg-primary-fixed" />
              <div className="p-8 flex flex-col items-center text-center">
                <div className="mb-6 relative w-16 h-16 flex items-center justify-center">
                  <svg className="animate-spin text-primary w-12 h-12" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle>
                    <path className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" fill="currentColor"></path>
                  </svg>
                  <div className="absolute w-2 h-2 bg-secondary-fixed rounded-full" />
                </div>
                <h2 className="font-title-lg text-on-surface mb-1">Authentication Successful</h2>
                <p className="font-body-md text-on-surface-variant mb-4">
                  Redirecting to your dashboard...
                </p>
                <div className="mt-2 py-1 px-4 bg-surface-container-low rounded-full border border-outline-variant/20 inline-flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-secondary-fixed animate-pulse" />
                  <span className="font-mono text-primary text-[13px]">NCCR Admin</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="mt-8 flex items-center gap-6 font-label-md text-on-surface-variant">
        <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
        <span className="w-1 h-1 rounded-full bg-outline-variant" />
        <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
        <span className="w-1 h-1 rounded-full bg-outline-variant" />
        <a href="#" className="hover:text-primary transition-colors">Support</a>
      </footer>
    </div>
  );
}
