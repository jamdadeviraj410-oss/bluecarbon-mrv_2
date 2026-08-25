import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ROLES, ROUTES } from '../../utils/constants';
import { checkRegistryHealth, logoutUser } from '../../services/authService';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [nodeStatus, setNodeStatus] = useState({ checking: true, online: false });
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    async function testHealth() {
      const res = await checkRegistryHealth();
      if (isMounted) {
        setNodeStatus({ checking: false, online: res.online });
      }
    }
    testHealth();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    setError('');

    try {
      const user = await login(email, password);
      // Strict role check: Only NCCR_ADMIN is permitted through this portal
      if (user && user.role === ROLES.NCCR_ADMIN) {
        navigate(ROUTES.ADMIN_DASHBOARD);
      } else {
        // Immediate non-admin session termination
        await logoutUser();
        setError('Access Denied: Administrator privileges required for this portal.');
      }
    } catch (err) {
      setError(err.message || 'Invalid administrative credentials.');
    }
  };

  return (
    <div className="flex flex-col lg:flex-row w-full h-screen bg-background">
      {/* Left Panel: Branding & Imagery */}
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
            <span className="inline-block px-3 py-1 mb-4 rounded-full bg-primary-container text-on-primary-container font-label-md uppercase tracking-wider">National Administration</span>
            <h1 className="font-display-lg text-on-primary mb-6 leading-tight">National Registry Governance & Policy.</h1>
            <p className="font-body-lg text-on-primary/80 max-w-[512px]">Restricted portal for National Coastal Carbon Registry officers, policy managers, and national administrative oversight.</p>
          </div>
          <div className="grid grid-cols-2 gap-8 mt-12 border-t border-on-primary/20 pt-12">
            <div>
              <div className="font-headline-md text-tertiary-fixed mb-1">NCCR</div>
              <div className="font-label-md text-on-primary/60 uppercase">Registry Authority</div>
            </div>
            <div>
              <div className="font-headline-md text-secondary-fixed mb-1">Level 4</div>
              <div className="font-label-md text-on-primary/60 uppercase">Administrative Scope</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel: Login Form */}
      <div className="flex flex-col justify-center w-full lg:w-1/2 p-8 sm:p-12 lg:p-24 bg-surface relative overflow-y-auto">
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-fixed-dim/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="w-full max-w-[440px] mx-auto relative z-10 py-6">
          {/* Logo & Heading */}
          <div className="mb-8 text-center lg:text-left">
            <img alt="BlueCarbon MRV Registry Logo" className="h-16 w-auto mb-6 mx-auto lg:mx-0 object-contain drop-shadow-sm" src="https://lh3.googleusercontent.com/aida/AEtjO1VW17fNGVMtPR23qYyffLAVoeuR5Kdj9tUp6MT_5V8XfzIDrHbzRM0w4PQKao_zH8sPwHYenPV-Jk0xV6OTTfahEdaecImu4vFWpKKvMTLzgxJcizYNc3V9LNKyURj8rSEiORjN6gv5kMJl4-b38UctUSP2ENOzee6PP9s7MFtDKB2fDGiOFf1-ioktRKCW2MLcv19djw8fd54LKOVv0ZW-P6PUX-kHqOjDZj3hZuhUuDgD2_B3JtzI4OU-"/>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-mono-data text-xs font-semibold mb-3">
              <span className="material-symbols-outlined text-[14px]">shield</span>
              NCCR Administrator Portal
            </div>
            <h2 className="font-headline-lg text-on-surface mb-2">Administrator Sign In</h2>
            <p className="font-body-lg text-on-surface-variant">Sign in with verified registry administrator credentials</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-error-container/40 border border-error/20 flex items-start gap-3 text-on-error-container animate-fade-in">
              <span className="material-symbols-outlined text-error text-[20px] shrink-0 mt-0.5">error</span>
              <p className="font-body-md text-sm text-error">{error}</p>
            </div>
          )}

          {/* Form */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="block font-label-md text-on-surface" htmlFor="admin-email">Administrator Email</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">admin_panel_settings</span>
                <input 
                  className="w-full pl-10 pr-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-tertiary-container focus:ring-2 focus:ring-tertiary-container/20 transition-all shadow-sm" 
                  id="admin-email" 
                  name="email" 
                  placeholder="admin@nccr.gov.in" 
                  required 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block font-label-md text-on-surface" htmlFor="admin-password">Password</label>
                <Link className="font-label-md text-primary hover:text-primary/80 transition-colors underline-offset-4 hover:underline text-xs" to={ROUTES.FORGOT_PASSWORD}>
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">lock</span>
                <input 
                  className="w-full pl-10 pr-10 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-tertiary-container focus:ring-2 focus:ring-tertiary-container/20 transition-all shadow-sm" 
                  id="admin-password" 
                  name="password" 
                  placeholder="••••••••" 
                  required 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors focus:outline-none p-1 rounded" 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            <button 
              className="w-full py-3.5 px-4 bg-primary text-on-primary hover:bg-primary/90 rounded-lg font-title-md transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 mt-6 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer" 
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Admin Portal</span>
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          {/* User Login Navigation Link */}
          <div className="mt-8 pt-6 border-t border-outline-variant/30 text-center space-y-3">
            <p className="font-body-md text-on-surface-variant text-sm">
              Not an NCCR Administrator?{' '}
              <Link className="font-title-md text-primary hover:underline font-bold" to={ROUTES.LOGIN}>
                Go to User Sign In
              </Link>
            </p>
            <div>
              <Link className="font-label-md text-secondary hover:underline inline-flex items-center gap-1 font-bold text-xs" to={ROUTES.PUBLIC_REGISTRY}>
                <span className="material-symbols-outlined text-[16px]">public</span>
                View Public Carbon Registry
              </Link>
            </div>
          </div>

          {/* Real Registry Status */}
          <div className="mt-8 flex items-center justify-center gap-2 px-4 py-1.5 bg-surface-container rounded-full w-max mx-auto border border-outline-variant/40">
            {nodeStatus.checking ? (
              <>
                <span className="w-2 h-2 rounded-full bg-outline-variant animate-pulse"></span>
                <span className="font-label-md text-on-surface-variant text-[11px]">Registry Status: Checking...</span>
              </>
            ) : nodeStatus.online ? (
              <>
                <span className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_8px_rgba(27,109,36,0.6)]"></span>
                <span className="font-label-md text-on-surface text-[11px]">Registry Status: Connected & Online</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span className="font-label-md text-on-surface-variant text-[11px]">Registry Status: Offline / Standby</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
