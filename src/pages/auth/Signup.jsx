import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ROLES, ROUTES } from '../../utils/constants';

export default function Signup() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const { signup, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleValidation = () => {
    if (!fullName.trim() || fullName.trim().length < 2) {
      setError('Please enter your full name.');
      return false;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please provide a valid email address.');
      return false;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters in length.');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    setError('');

    if (!handleValidation()) return;

    try {
      // Security: Public self-registration always defaults to COMMUNITY role and null organization
      const res = await signup({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        role: ROLES.COMMUNITY,
        organizationId: null,
        phone: phone.trim() || null,
      });

      if (res.requiresConfirmation) {
        setEmailSent(true);
      } else if (res.user) {
        navigate(ROUTES.COMMUNITY_DASHBOARD);
      }
    } catch (err) {
      setError(err.message || 'Unable to create account. Please try again.');
    }
  };

  return (
    <div className="flex flex-col lg:flex-row w-full h-screen bg-background">
      {/* Left Panel: Branding & Imagery (Identical to Login) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-primary overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div 
            className="w-full h-full bg-cover bg-center mix-blend-overlay opacity-80" 
            style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida/AEtjO1XF6iodfOZFgCH81TtI3mY-O5cJW2XSR1Y0JzxpThBRoDvtux3h53NfKEGEDrr2zDHYeCMLG2DFoDpV_Ze3ZyRgKwbfgnz_GrvQUXUf8urffqRqiess4yTPQpjrJngMuc02gJ6CNva6gQOUvtcfMpzt1KxXMW7eNIhr_VthVejaYxSrCAkbzJqSF0xwepMhsh3_uV0efu0idRY-QGxzBOpD54iyNSTXsQIFRbU47OuPbxSGqETfh6Amr4UZ')" }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/50 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-transparent"></div>
        </div>
        <div className="relative z-10 flex flex-col justify-end p-12 lg:p-24 h-full text-on-primary max-w-2xl">
          <div className="mb-8">
            <span className="inline-block px-3 py-1 mb-4 rounded-full bg-primary-container text-on-primary-container font-label-md uppercase tracking-wider">Community Registration</span>
            <h1 className="font-display-lg text-on-primary mb-6 leading-tight">Empowering Coastal Restoration.</h1>
            <p className="font-body-lg text-on-primary/80 max-w-[512px]">Join the national blue carbon infrastructure to participate in community monitoring, upload field evidence, and view transparent registry data.</p>
          </div>
          <div className="grid grid-cols-2 gap-8 mt-12 border-t border-on-primary/20 pt-12">
            <div>
              <div className="font-headline-md text-tertiary-fixed mb-1">2.4M+</div>
              <div className="font-label-md text-on-primary/60 uppercase">Hectares Monitored</div>
            </div>
            <div>
              <div className="font-headline-md text-secondary-fixed mb-1">100%</div>
              <div className="font-label-md text-on-primary/60 uppercase">Blockchain Verified</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel: Signup Form or Email Confirmation */}
      <div className="flex flex-col justify-center w-full lg:w-1/2 p-8 sm:p-12 lg:p-20 bg-surface relative overflow-y-auto">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-fixed-dim/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        
        <div className="w-full max-w-[440px] mx-auto relative z-10 py-6">
          {/* Logo */}
          <div className="mb-6 text-center lg:text-left">
            <img alt="BlueCarbon MRV Registry Logo" className="h-14 w-auto mb-4 mx-auto lg:mx-0 object-contain drop-shadow-sm" src="https://lh3.googleusercontent.com/aida/AEtjO1VW17fNGVMtPR23qYyffLAVoeuR5Kdj9tUp6MT_5V8XfzIDrHbzRM0w4PQKao_zH8sPwHYenPV-Jk0xV6OTTfahEdaecImu4vFWpKKvMTLzgxJcizYNc3V9LNKyURj8rSEiORjN6gv5kMJl4-b38UctUSP2ENOzee6PP9s7MFtDKB2fDGiOFf1-ioktRKCW2MLcv19djw8fd54LKOVv0ZW-P6PUX-kHqOjDZj3hZuhUuDgD2_B3JtzI4OU-"/>
            <h2 className="font-headline-lg text-on-surface mb-1">Create an Account</h2>
            <p className="font-body-lg text-on-surface-variant text-sm">Register as a Community Contributor</p>
          </div>

          {emailSent ? (
            <div className="p-8 rounded-xl bg-surface-container-lowest border border-outline-variant/40 shadow-sm text-center space-y-4 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-secondary-container/40 text-secondary flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-[36px]">mark_email_read</span>
              </div>
              <h3 className="font-headline-md text-on-surface text-xl font-bold">Check Your Email</h3>
              <p className="font-body-md text-on-surface-variant text-sm">
                We've sent a verification link to <strong className="text-on-surface font-semibold">{email}</strong>. Please confirm your email address to activate your account.
              </p>
              <div className="pt-4">
                <Link 
                  to={ROUTES.LOGIN}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-primary text-on-primary rounded-lg font-title-md hover:bg-primary/90 transition-all shadow-sm"
                >
                  <span>Return to Sign In</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </Link>
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-5 p-4 rounded-lg bg-error-container/40 border border-error/20 flex items-start gap-3 text-on-error-container animate-fade-in">
                  <span className="material-symbols-outlined text-error text-[20px] shrink-0 mt-0.5">error</span>
                  <p className="font-body-md text-sm text-error">{error}</p>
                </div>
              )}

              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-1.5">
                  <label className="block font-label-md text-on-surface text-xs font-semibold" htmlFor="fullName">Full Name</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">person</span>
                    <input 
                      className="w-full pl-10 pr-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-tertiary-container focus:ring-2 focus:ring-tertiary-container/20 transition-all shadow-sm text-sm" 
                      id="fullName" 
                      name="fullName" 
                      placeholder="e.g. Ramesh Chandra" 
                      required 
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block font-label-md text-on-surface text-xs font-semibold" htmlFor="email">Email Address</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">mail</span>
                    <input 
                      className="w-full pl-10 pr-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-tertiary-container focus:ring-2 focus:ring-tertiary-container/20 transition-all shadow-sm text-sm" 
                      id="email" 
                      name="email" 
                      placeholder="name@example.com" 
                      required 
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block font-label-md text-on-surface text-xs font-semibold" htmlFor="phone">Phone (Optional)</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">call</span>
                    <input 
                      className="w-full pl-10 pr-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-tertiary-container focus:ring-2 focus:ring-tertiary-container/20 transition-all shadow-sm text-sm" 
                      id="phone" 
                      name="phone" 
                      placeholder="+91 98765 43210" 
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block font-label-md text-on-surface text-xs font-semibold" htmlFor="password">Password (min. 6 characters)</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">lock</span>
                    <input 
                      className="w-full pl-10 pr-10 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-tertiary-container focus:ring-2 focus:ring-tertiary-container/20 transition-all shadow-sm text-sm" 
                      id="password" 
                      name="password" 
                      placeholder="••••••••" 
                      required 
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button 
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors p-1" 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <span className="material-symbols-outlined text-[18px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block font-label-md text-on-surface text-xs font-semibold" htmlFor="confirmPassword">Confirm Password</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">lock_reset</span>
                    <input 
                      className="w-full pl-10 pr-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-tertiary-container focus:ring-2 focus:ring-tertiary-container/20 transition-all shadow-sm text-sm" 
                      id="confirmPassword" 
                      name="confirmPassword" 
                      placeholder="••••••••" 
                      required 
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>

                <button 
                  className="w-full py-3 px-4 bg-primary text-on-primary hover:bg-primary/90 rounded-lg font-title-md transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 mt-6 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer" 
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Complete Registration</span>
                      <span className="material-symbols-outlined text-[20px]">how_to_reg</span>
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-4 border-t border-outline-variant/30 text-center space-y-2">
                <p className="font-body-md text-on-surface-variant text-sm">
                  Already registered?{' '}
                  <Link className="font-title-md text-primary hover:underline font-bold" to={ROUTES.LOGIN}>
                    Sign In
                  </Link>
                </p>
                <p className="font-body-md text-on-surface-variant text-xs">
                  Representing an NGO or Panchayat?{' '}
                  <Link className="font-title-md text-primary hover:underline font-semibold" to={ROUTES.ONBOARDING}>
                    Apply for Onboarding
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
