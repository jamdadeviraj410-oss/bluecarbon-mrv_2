import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ROLES, ROUTES } from '../../utils/constants';
import { checkRegistryHealth } from '../../services/authService';
import bluecarbonLogo from '../../assets/bluecarbon-logo.svg';
import loginBackground from '../../assets/login-background.jpg';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [nodeStatus, setNodeStatus] = useState({ checking: true, online: false });
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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

  const getRoleLandingRoute = (role) => {
    switch (role) {
      case ROLES.NCCR_ADMIN:
        return ROUTES.ADMIN_DASHBOARD;
      case ROLES.VERIFIER:
        return ROUTES.ADMIN_MRV_WORKSPACE.replace(':projectId', 'PRJ-2023-089');
      case ROLES.NGO:
      case ROLES.PANCHAYAT:
      case ROLES.PROJECT_MANAGER:
        return ROUTES.ORG_DASHBOARD;
      case ROLES.COMMUNITY:
        return ROUTES.COMMUNITY_DASHBOARD;
      default:
        return ROUTES.ACCESS_RESTRICTED;
    }
  };

  const isRouteAllowedForRole = (path, role) => {
    if (!path || !role) return false;
    if (role === ROLES.NCCR_ADMIN) return true;
    if (role === ROLES.VERIFIER) {
      const verifierAllowedPrefixes = [
        '/mrv',
        '/projects',
        '/admin/ocr-review',
        '/admin/sensors',
        '/sensors',
        '/admin/drone-survey',
        '/drone',
        '/admin/mrv-intelligence',
        '/admin/mrv-anomalies',
        '/admin/carbon-credits',
        '/carbon-credits',
        '/admin/blockchain',
        '/blockchain',
        '/admin/reports',
        '/admin/audit',
      ];
      return verifierAllowedPrefixes.some((prefix) => path.startsWith(prefix));
    }
    if (role === ROLES.NGO || role === ROLES.PANCHAYAT || role === ROLES.PROJECT_MANAGER) {
      return path.startsWith('/organization');
    }
    if (role === ROLES.COMMUNITY) {
      return path.startsWith('/community') || path.startsWith('/public');
    }
    return false;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    setError('');

    try {
      const user = await login(email, password);
      setPassword('');
      const targetFrom = location.state?.from?.pathname;

      if (targetFrom && isRouteAllowedForRole(targetFrom, user?.role)) {
        navigate(targetFrom);
      } else {
        navigate(getRoleLandingRoute(user?.role));
      }
    } catch (err) {
      setPassword('');
      setError(err.message || 'Invalid email or password.');
    }
  };

  return (
    <div className="flex flex-col lg:flex-row w-full h-screen bg-background">
      {/* Left Panel: Branding & Imagery */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-primary overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div 
            className="w-full h-full bg-cover bg-center mix-blend-overlay opacity-80" 
            style={{ backgroundImage: `url(${loginBackground})` }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/50 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-transparent"></div>
        </div>
        <div className="relative z-10 flex flex-col justify-end p-12 lg:p-24 h-full text-on-primary max-w-2xl">
          <div className="mb-8">
            <span className="inline-block px-3 py-1 mb-4 rounded-full bg-primary-container text-on-primary-container font-label-md uppercase tracking-wider">Secure Access</span>
            <h1 className="font-display-lg text-on-primary mb-6 leading-tight">Digital Permanence for Blue Carbon.</h1>
            <p className="font-body-lg text-on-primary/80 max-w-[512px]">Access the central registry for verified marine carbon sequestration data, immutable audit trails, and global ecological monitoring.</p>
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

      {/* Right Panel: Login Form */}
      <div className="flex flex-col justify-center w-full lg:w-1/2 p-8 sm:p-12 lg:p-24 bg-surface relative overflow-y-auto">
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-fixed-dim/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="w-full max-w-[440px] mx-auto relative z-10 py-6">
          {/* Logo */}
          <div className="mb-8 text-center lg:text-left">
            <img alt="BlueCarbon MRV Registry Logo" className="h-16 w-auto mb-6 mx-auto lg:mx-0 object-contain drop-shadow-sm" src={bluecarbonLogo}/>
            <h2 className="font-headline-lg text-on-surface mb-2">Welcome back</h2>
            <p className="font-body-lg text-on-surface-variant">Sign in to access the BlueCarbon MRV Registry</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-error-container/40 border border-error/20 flex items-start gap-3 text-on-error-container animate-fade-in">
              <span className="material-symbols-outlined text-error text-[20px] shrink-0 mt-0.5">error</span>
              <p className="font-body-md text-sm text-error">{error}</p>
            </div>
          )}

          {/* Form */}
          <form key={location.key || 'login-form'} className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="block font-label-md text-on-surface" htmlFor="email">Email Address</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">mail</span>
                <input 
                  className="w-full pl-10 pr-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-tertiary-container focus:ring-2 focus:ring-tertiary-container/20 transition-all shadow-sm" 
                  id="email" 
                  name="email" 
                  placeholder="name@organization.com" 
                  required 
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block font-label-md text-on-surface" htmlFor="password">Password</label>
                <Link className="font-label-md text-primary hover:text-primary/80 transition-colors underline-offset-4 hover:underline text-xs" to={ROUTES.FORGOT_PASSWORD}>
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">lock</span>
                <input 
                  className="w-full pl-10 pr-10 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-tertiary-container focus:ring-2 focus:ring-tertiary-container/20 transition-all shadow-sm" 
                  id="password" 
                  name="password" 
                  placeholder="••••••••" 
                  required 
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
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
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          {/* Create Account & Onboarding Navigation */}
          <div className="mt-8 pt-6 border-t border-outline-variant/30 text-center space-y-3">
            <p className="font-body-md text-on-surface-variant text-sm">
              Don't have an account?{' '}
              <Link className="font-title-md text-primary hover:underline font-bold" to={ROUTES.SIGNUP || '/signup'}>
                Create Account
              </Link>
            </p>
            <p className="font-body-md text-on-surface-variant text-xs">
              New NGO, Panchayat, or Community?{' '}
              <Link className="font-title-md text-primary hover:underline font-semibold" to={ROUTES.ONBOARDING}>
                Apply for Onboarding
              </Link>
            </p>
            <p className="font-body-md text-on-surface-variant text-xs">
              Registry Officer?{' '}
              <Link className="font-title-md text-primary hover:underline font-semibold" to={ROUTES.ADMIN_LOGIN}>
                Sign in to Admin Portal
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
