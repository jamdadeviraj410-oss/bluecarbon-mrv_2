import { Outlet, Link } from 'react-router-dom';

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-surface flex flex-col font-body-md text-on-surface">
      <header className="fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-md border-b border-outline-variant/30">
        <div className="h-16 w-full px-4 sm:px-8 flex items-center justify-between max-w-7xl mx-auto">
          <Link to="/public" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center p-1 shadow-sm">
              <span className="material-symbols-outlined text-tertiary-fixed text-[20px]">water_ec</span>
            </div>
            <div>
              <span className="font-headline-md text-base sm:text-lg font-bold text-primary tracking-tight block leading-tight">
                Marine Ledger
              </span>
              <span className="text-[10px] font-mono-data text-on-surface-variant uppercase tracking-wider block">
                NCCR BlueCarbon Registry
              </span>
            </div>
          </Link>
          <nav className="hidden lg:flex items-center gap-6">
            <Link to="/public" className="font-title-md text-sm text-primary font-bold hover:text-primary-container transition-colors">
              Public Registry
            </Link>
            <Link to="/blockchain" className="font-title-md text-sm text-on-surface-variant hover:text-primary transition-colors">
              On-Chain Lineage
            </Link>
            <Link to="/public/credit/DNA-BC-2024-001" className="font-title-md text-sm text-on-surface-variant hover:text-primary transition-colors">
              Credit DNA
            </Link>
            <Link to="/status" className="font-title-md text-sm text-on-surface-variant hover:text-primary transition-colors">
              Ledger Status
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-5 py-2 bg-primary text-on-primary font-title-md text-sm font-semibold rounded-xl hover:bg-primary-container transition-all shadow-xs"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full flex flex-col pt-16">
        <Outlet />
      </main>

      <footer className="w-full bg-surface-container-low py-10 border-t border-outline-variant/30 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col md:flex-row md:items-start gap-8 justify-between">
          <div className="flex-1 min-w-0 max-w-[32rem]">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center p-1">
                <span className="material-symbols-outlined text-tertiary-fixed text-[18px]">water_ec</span>
              </div>
              <span className="font-headline-md text-base font-bold text-primary">Marine Ledger Registry</span>
            </div>
            <p className="font-body-md text-xs text-on-surface-variant leading-relaxed">
              National coastal blue carbon ecological monitoring, reporting, and verification registry. Powered by multi-spectral drone surveys, ground telemetry, and cryptographic proofs anchored to Polygon Amoy.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 shrink-0">
            <div className="flex flex-col gap-2">
              <span className="font-label-md text-xs font-bold text-on-surface uppercase tracking-wider">Registry</span>
              <Link className="text-xs text-on-surface-variant hover:text-primary transition-colors" to="/public">
                Map Explorer
              </Link>
              <Link className="text-xs text-on-surface-variant hover:text-primary transition-colors" to="/blockchain">
                Blockchain Records
              </Link>
              <Link className="text-xs text-on-surface-variant hover:text-primary transition-colors" to="/login">
                Portal Access
              </Link>
            </div>
            <div className="flex flex-col gap-2">
              <span className="font-label-md text-xs font-bold text-on-surface uppercase tracking-wider">Infrastructure</span>
              <Link className="text-xs text-on-surface-variant hover:text-primary transition-colors" to="/status">
                System Status
              </Link>
              <Link className="text-xs text-on-surface-variant hover:text-primary transition-colors" to="/public/credit/DNA-BC-2024-001">
                Credit Lineage
              </Link>
              <span className="text-xs text-on-surface-variant font-mono-data">Polygon Amoy Testnet</span>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-8 pt-6 border-t border-outline-variant/20 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono-data text-on-surface-variant">
          <span>© 2026 Marine Ledger — NCCR BlueCarbon MRV. All rights reserved.</span>
          <span>Secured via Distributed Ledger Technology</span>
        </div>
      </footer>
    </div>
  );
}

