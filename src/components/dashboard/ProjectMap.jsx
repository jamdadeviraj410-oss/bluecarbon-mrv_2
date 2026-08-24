import { Link } from 'react-router-dom';
import { ROUTES } from '../../utils/constants';

export default function ProjectMap() {
  return (
    <div className="lg:col-span-8 bg-surface rounded-2xl border border-outline-variant/30 shadow-sm flex flex-col overflow-hidden">
      <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-container-lowest border-b border-outline-variant/30">
        <div>
          <h2 className="font-headline-sm text-on-surface text-[18px] font-bold m-0">National Coastal Project Distribution</h2>
          <p className="text-xs text-on-surface-variant m-0">Live spatial status across India's maritime mangrove & seagrass ecosystems</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex gap-3 text-xs font-bold text-on-surface-variant">
            <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>Verified</div>
            <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>Pending</div>
            <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-primary"></span>Under Review</div>
          </div>
          <Link
            to={ROUTES.ADMIN_NATIONAL_MAP}
            className="px-3 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-on-primary text-xs font-bold flex items-center gap-1 shadow-sm transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">open_in_full</span>
            National Explorer
          </Link>
        </div>
      </div>
      <div className="relative w-full h-[460px] overflow-hidden bg-slate-900">
        {/* Map Image */}
        <div
          className="w-full h-full bg-cover bg-center opacity-85"
          title="India Coastline, Bay of Bengal & Arabian Sea"
          style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDFP2ZKxjWPZy2p8VQLUC-WABJ7EeqQ_3mxsXLua_dM6iXYAqdfwZ58Y5od3LoxfoCGjl9fAYvF44XKqF-ZMO2y_jiO2uo3ExfVkiOkUAwGMizsb2dapPELg8hCUMZvFzIzGyInWekFDkQvRR0yZzpnfPp0_e3fiv3oTu6R2TlYUREX6rbXB7kzfEiyPANNZVTBeSCME22eLl7svQCGTt7_pTQMgz-VoHQP1TbXM3Yon6gkMG7GLV27Iw')" }}
        ></div>

        {/* Overlay Markers */}
        <Link 
          to={ROUTES.ADMIN_NATIONAL_MAP}
          className="absolute top-[30%] left-[65%] w-4 h-4 bg-secondary rounded-full shadow-[0_0_12px_rgba(27,109,36,0.9)] animate-pulse border-2 border-white cursor-pointer"
          title="Sundarbans West Bengal - 450 ha Verified"
        ></Link>
        <Link 
          to={ROUTES.ADMIN_NATIONAL_MAP}
          className="absolute top-[45%] left-[55%] w-3.5 h-3.5 bg-amber-500 rounded-full shadow-md border border-white cursor-pointer"
          title="Bhitarkanika Odisha - 320 ha Pending"
        ></Link>
        <Link 
          to={ROUTES.ADMIN_NATIONAL_MAP}
          className="absolute top-[60%] left-[45%] w-3.5 h-3.5 bg-secondary rounded-full shadow-md border border-white cursor-pointer"
          title="Godavari Mangrove Delta AP - Verified"
        ></Link>
        <Link 
          to={ROUTES.ADMIN_NATIONAL_MAP}
          className="absolute top-[75%] left-[32%] w-4 h-4 bg-primary-fixed-dim rounded-full shadow-md animate-pulse border-2 border-white cursor-pointer"
          title="Pichavaram Tamil Nadu - 280 ha Under Review"
        ></Link>
        <Link 
          to={ROUTES.ADMIN_NATIONAL_MAP}
          className="absolute top-[35%] left-[20%] w-3.5 h-3.5 bg-secondary rounded-full shadow-md border border-white cursor-pointer"
          title="Gulf of Kutch Gujarat - 58,000 ha"
        ></Link>

        {/* Floating Map Footer */}
        <div className="absolute bottom-3 left-3 right-3 bg-black/75 backdrop-blur-md rounded-xl p-2.5 border border-white/10 text-white flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 font-mono-data">
            <span className="w-2 h-2 rounded-full bg-secondary"></span>
            105 Coastal Restoration Sites Monitored
          </div>
          <Link
            to={ROUTES.ADMIN_NATIONAL_MAP}
            className="text-tertiary-fixed font-bold hover:underline flex items-center gap-1"
          >
            Drilldown to Plots
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
