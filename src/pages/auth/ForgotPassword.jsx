import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTES } from '../../utils/constants';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success
  const [errorMsg, setErrorMsg] = useState('');
  const { resetPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    try {
      await resetPassword(email);
      setStatus('success');
      setTimeout(() => {
        setStatus('idle');
      }, 5000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to send password reset link');
      setStatus('idle');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-xl px-md bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-surface-container-low via-surface to-surface">
      <header className="mb-xl flex flex-col items-center gap-md text-center">
        <Link to="/" className="flex items-center gap-sm group">
          <img alt="Logo" className="h-12 w-auto transition-transform group-hover:scale-105" src="https://lh3.googleusercontent.com/aida/AEtjO1VuXdVS3_ouXrk6fe0rT7-G3igAkpwJZEXqAIIZALEEFi_NaOmQV35klFZ_GWj62R3AJO67zPrnVWHM_aimyjr_HW8lSgOjaMCawORCHMSKiRJuDJdWlCvV7l_gPj6McRIsG5DR0OYw0WVsxcvO9HNF8EHUwb0CE5Koyyq6mPLkwXo4UUQiiUBmPxs61eW1ObKhPibZxtlvGJA1g_Du5dPNdAx3XZ4kzIredZ7RA1brQBWBel-ZtHw9K5DG" />
          <span className="font-headline-md text-headline-md text-primary tracking-tight">BlueCarbon MRV</span>
        </Link>
        <p className="text-body-md text-on-surface-variant max-w-[384px]">Secure cryptographic registry for blue carbon ecosystem services.</p>
      </header>

      <main className="w-full max-w-[440px] bg-surface-container-lowest p-xl rounded-xl shadow-[0_4px_24px_rgba(0,51,102,0.06)] border border-outline-variant/30 relative overflow-hidden group hover:shadow-xl transition-shadow duration-300">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none transition-all duration-500 group-hover:scale-150"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-tertiary-fixed-dim/10 rounded-full blur-xl -ml-12 -mb-12 pointer-events-none transition-all duration-500 group-hover:scale-150"></div>

        <div className="relative z-10 flex flex-col items-center">
          <img alt="BlueCarbon MRV Logo" className="h-16 w-16 mb-6 rounded-lg object-contain bg-surface-container-low p-2 shadow-sm transition-transform duration-300 hover:scale-105" src="https://lh3.googleusercontent.com/aida/AEtjO1VuXdVS3_ouXrk6fe0rT7-G3igAkpwJZEXqAIIZALEEFi_NaOmQV35klFZ_GWj62R3AJO67zPrnVWHM_aimyjr_HW8lSgOjaMCawORCHMSKiRJuDJdWlCvV7l_gPj6McRIsG5DR0OYw0WVsxcvO9HNF8EHUwb0CE5Koyyq6mPLkwXo4UUQiiUBmPxs61eW1ObKhPibZxtlvGJA1g_Du5dPNdAx3XZ4kzIredZ7RA1brQBWBel-ZtHw9K5DG" />
          <h2 className="font-headline-md text-headline-md text-primary mb-2 text-center w-full">Reset Your Password</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mb-8 text-center max-w-[384px] mx-auto">
            Enter your registered email address and we'll send you instructions to reset your password.
          </p>

          {errorMsg && <p className="text-error font-body-md mb-4 text-center">{errorMsg}</p>}

          <form className="w-full flex flex-col gap-6 relative z-20" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-2 group/input">
              <label className="font-label-md text-label-md text-on-surface uppercase tracking-wider pl-1" htmlFor="email">Email Address</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant transition-colors group-focus-within/input:text-on-tertiary-container">mail</span>
                <input
                  className="w-full bg-surface py-3 pl-10 pr-4 rounded-xl text-on-surface font-body-md placeholder:text-outline-variant focus:outline-none focus:ring-2 focus:ring-on-tertiary-container/30 transition-all shadow-sm focus:shadow-md bg-transparent relative z-10"
                  id="email"
                  placeholder="name@organization.com"
                  required
                  style={{ border: '1px solid var(--color-outline-variant)' }}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={status !== 'idle'}
                />
              </div>
            </div>

            <button
              className={`w-full text-on-primary font-title-md text-title-md py-3 px-6 rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 overflow-hidden relative group/btn ${status === 'success' ? 'bg-secondary text-on-secondary hover:shadow-md' : 'bg-primary hover:shadow-lg hover:bg-primary/90'
                } ${status === 'loading' ? 'opacity-80 pointer-events-none' : ''}`}
              type="submit"
              disabled={status !== 'idle'}
            >
              {status === 'idle' && (
                <>
                  <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite]"></span>
                  <span>Send Reset Link</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </>
              )}
              {status === 'loading' && (
                <>
                  <span className="material-symbols-outlined animate-spin">autorenew</span>
                  <span>Sending...</span>
                </>
              )}
              {status === 'success' && (
                <>
                  <span className="material-symbols-outlined">check_circle</span>
                  <span>Link Sent</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 flex flex-col items-center gap-4 w-full relative z-20">
            <div className="w-full h-px bg-outline-variant/30"></div>
            <Link to={ROUTES.LOGIN} className="font-label-md text-label-md text-primary hover:text-on-tertiary-container transition-colors flex items-center gap-1 group/link">
              <span className="material-symbols-outlined text-[14px] transition-transform group-hover/link:-translate-x-1">arrow_back</span>
              Back to Login
            </Link>
          </div>
        </div>
      </main>

      <footer className="mt-xl flex items-center gap-lg text-label-md text-on-surface-variant">
        <a className="hover:text-primary transition-colors" href="#">Terms of Service</a>
        <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
        <a className="hover:text-primary transition-colors" href="#">Privacy Policy</a>
        <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
        <a className="hover:text-primary transition-colors" href="#">Support</a>
      </footer>

      <style>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}
