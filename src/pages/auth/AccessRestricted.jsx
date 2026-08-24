import { Link } from 'react-router-dom';
import { ROUTES } from '../../utils/constants';

export default function AccessRestricted() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-xl px-md bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-surface-container-low via-surface to-surface">
      <header className="mb-xl flex flex-col items-center gap-md text-center">
        <Link to="/" className="flex items-center gap-sm group">
          <img alt="Logo" className="h-12 w-auto transition-transform group-hover:scale-105" src="https://lh3.googleusercontent.com/aida/AEtjO1VuXdVS3_ouXrk6fe0rT7-G3igAkpwJZEXqAIIZALEEFi_NaOmQV35klFZ_GWj62R3AJO67zPrnVWHM_aimyjr_HW8lSgOjaMCawORCHMSKiRJuDJdWlCvV7l_gPj6McRIsG5DR0OYw0WVsxcvO9HNF8EHUwb0CE5Koyyq6mPLkwXo4UUQiiUBmPxs61eW1ObKhPibZxtlvGJA1g_Du5dPNdAx3XZ4kzIredZ7RA1brQBWBel-ZtHw9K5DG"/>
          <span className="font-headline-md text-headline-md text-primary tracking-tight">BlueCarbon MRV</span>
        </Link>
        <p className="text-body-md text-on-surface-variant max-w-[384px]">Secure cryptographic registry for blue carbon ecosystem services.</p>
      </header>

      <main className="w-full max-w-[480px] bg-surface-container-lowest p-xl rounded-xl shadow-[0_4px_24px_rgba(0,51,102,0.06)] flex flex-col gap-lg border border-outline-variant/30">
        <div className="flex flex-col items-center text-center gap-md">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-sm">
            <span className="material-symbols-outlined text-[32px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>hourglass_top</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Account Pending Approval</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-[340px]">
            Your organization's registration is currently under review by the NCCR. You will be notified once access is granted.
          </p>
        </div>
        
        <div className="flex flex-col gap-md w-full pt-md border-t border-outline-variant/20">
          <button className="w-full bg-primary text-on-primary py-3 px-6 rounded-lg font-title-md text-title-md hover:bg-primary-container hover:shadow-md transition-all active:scale-[0.98]">
            Contact Support
          </button>
          <Link to={ROUTES.LOGIN} className="w-full bg-transparent text-primary py-3 px-6 rounded-lg font-title-md text-title-md border border-primary hover:bg-primary/5 transition-all active:scale-[0.98] text-center">
            Return to Login
          </Link>
        </div>
      </main>

      <footer className="mt-xl flex items-center gap-lg text-label-md text-on-surface-variant">
        <a className="hover:text-primary transition-colors" href="#">Terms of Service</a>
        <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
        <a className="hover:text-primary transition-colors" href="#">Privacy Policy</a>
        <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
        <a className="hover:text-primary transition-colors" href="#">Support</a>
      </footer>
    </div>
  );
}
