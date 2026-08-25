import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { getOnboardingRequestByNumber } from '../services/onboardingService';
import { ROUTES } from '../../../utils/constants';

export default function OnboardingStatusPage() {
  const [searchParams] = useSearchParams();
  const initialApp = searchParams.get('app') || '';
  const [appNumber, setAppNumber] = useState(initialApp);
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleSearch = async (numToSearch) => {
    const term = (numToSearch || appNumber).trim();
    if (!term) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await getOnboardingRequestByNumber(term);
      if (data) {
        setResult(data);
      } else {
        setResult(null);
        setErrorMsg(`No onboarding application found with reference number "${term}". Please check the code and try again.`);
      }
    } catch (err) {
      console.error('Status fetch error:', err);
      setResult(null);
      setErrorMsg(err.message || 'Could not find an application with this tracking code. Please verify the code.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function initCheck() {
      if (!initialApp) return;
      setIsLoading(true);
      try {
        const data = await getOnboardingRequestByNumber(initialApp.trim());
        if (isMounted && data) setResult(data);
      } catch (err) {
        console.error('Auto status check failed:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    initCheck();
    return () => { isMounted = false; };
  }, [initialApp]);

  return (
    <div className="min-h-screen w-full bg-background py-8 px-4 sm:px-6 lg:px-8 flex flex-col justify-start">
      <div style={{ width: 'min(100%, 48rem)', marginInline: 'auto' }} className="space-y-6">
        {/* Top bar */}
        <div className="flex items-center justify-between pb-4 border-b border-outline-variant/30">
          <Link to={ROUTES.LOGIN} className="flex items-center gap-2 text-xs font-bold text-on-surface-variant hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to Registry Portal
          </Link>
          <Link to={ROUTES.ONBOARDING} className="text-xs font-bold text-primary hover:underline">
            New Onboarding Application
          </Link>
        </div>

        {/* Header */}
        <div className="w-full min-w-0 text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto shrink-0">
            <span className="material-symbols-outlined text-[28px]">track_changes</span>
          </div>
          <h1 className="font-headline-lg text-on-surface text-[24px] md:text-[28px] font-extrabold tracking-tight">
            Application Status Tracker
          </h1>
          <p
            style={{ width: 'min(100%, 28rem)', marginInline: 'auto' }}
            className="font-body-md text-on-surface-variant text-xs md:text-sm text-center leading-relaxed"
          >
            Enter your official BlueCarbon onboarding application number to verify your compliance review milestone.
          </p>
        </div>

        {/* Search Bar */}
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSearch(); }}
          style={{ width: 'min(100%, 28rem)', marginInline: 'auto', display: 'flex' }}
          className="items-center gap-2"
        >
          <div style={{ flex: '1 1 0%', minWidth: 0 }} className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">search</span>
            <input
              type="text"
              placeholder="e.g. APP-2026-8921"
              value={appNumber}
              onChange={(e) => setAppNumber(e.target.value)}
              style={{ width: '100%', minWidth: 0 }}
              className="pl-10 pr-4 py-2.5 rounded-xl bg-surface border border-outline-variant text-sm font-mono-data text-on-surface focus:outline-none focus:border-primary shadow-sm"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            style={{ flex: '0 0 auto', whiteSpace: 'nowrap' }}
            className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-on-primary text-xs font-bold shadow-sm transition-colors cursor-pointer"
          >
            {isLoading ? 'Checking...' : 'Track'}
          </button>
        </form>

        {errorMsg && (
          <div className="p-4 rounded-xl bg-error/15 text-error border border-error/30 text-xs font-medium text-center">
            {errorMsg}
          </div>
        )}

        {/* Tracking Result Card */}
        {result && (
          <div className="bg-surface rounded-2xl border border-outline-variant/30 shadow-lg p-6 sm:p-8 space-y-6 animate-in fade-in">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-outline-variant/30">
              <div>
                <span className="font-mono-data text-xs text-primary font-bold">{result.application_number}</span>
                <h2 className="font-headline-md text-on-surface text-[20px] font-extrabold">{result.organization_name}</h2>
                <div className="text-xs text-on-surface-variant mt-0.5">
                  {result.organization_type} • {result.district}, {result.state}
                </div>
              </div>

              <div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                  result.status === 'APPROVED' ? 'bg-secondary/15 text-secondary border border-secondary/30' :
                  result.status === 'REJECTED' ? 'bg-error/15 text-error border border-error/30' :
                  result.status === 'CHANGES_REQUESTED' ? 'bg-primary/15 text-primary border border-primary/30' :
                  'bg-amber-500/15 text-amber-600 border border-amber-500/30'
                }`}>
                  {result.status}
                </span>
              </div>
            </div>

            {/* Timeline progression */}
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Application Review Milestones
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-3 rounded-xl bg-secondary/15 text-secondary border border-secondary/30 font-bold">
                  <span className="material-symbols-outlined text-[18px] block mx-auto mb-1">check_circle</span>
                  1. Submitted
                </div>
                <div className={`p-3 rounded-xl border font-bold ${
                  result.status !== 'SUBMITTED' ? 'bg-secondary/15 text-secondary border-secondary/30' : 'bg-surface-container-lowest text-on-surface-variant'
                }`}>
                  <span className="material-symbols-outlined text-[18px] block mx-auto mb-1">policy</span>
                  2. NCCR Review
                </div>
                <div className={`p-3 rounded-xl border font-bold ${
                  result.status === 'APPROVED' ? 'bg-secondary text-on-secondary' :
                  result.status === 'REJECTED' ? 'bg-error text-on-error' :
                  'bg-surface-container-lowest text-on-surface-variant'
                }`}>
                  <span className="material-symbols-outlined text-[18px] block mx-auto mb-1">verified_user</span>
                  3. Decision
                </div>
              </div>
            </div>

            {/* Review Notes */}
            {result.review_notes && (
              <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 space-y-1 text-xs">
                <div className="font-bold text-on-surface">Official Review Remarks:</div>
                <p className="text-on-surface-variant leading-relaxed">{result.review_notes}</p>
              </div>
            )}

            {/* Rejection Reason if any */}
            {result.rejection_reason && (
              <div className="p-4 rounded-xl bg-error/10 border border-error/30 space-y-1 text-xs text-error">
                <div className="font-bold">Rejection Reason:</div>
                <p className="leading-relaxed">{result.rejection_reason}</p>
              </div>
            )}

            {/* Actions based on status */}
            <div className="pt-2 flex justify-end gap-2">
              {result.status === 'APPROVED' ? (
                <Link
                  to={ROUTES.LOGIN}
                  className="px-5 py-2.5 rounded-xl bg-secondary hover:bg-secondary/90 text-on-secondary text-xs font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[16px]">login</span>
                  Proceed to Organization Login
                </Link>
              ) : (
                <a
                  href={`mailto:nccr-support@bluecarbon.gov.in?subject=Inquiry on ${result.application_number}`}
                  className="px-4 py-2 rounded-xl border border-outline-variant text-xs font-bold text-on-surface hover:bg-surface-container inline-flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">mail</span>
                  Contact Review Officer
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
