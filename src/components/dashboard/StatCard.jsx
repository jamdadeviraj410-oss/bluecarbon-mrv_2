

const sparklinePaths = {
  'active-projects': 'M0,25 Q10,20 20,22 T40,15 T60,18 T80,5 T100,2',
  'area-restored': 'M0,28 L20,25 L40,20 L60,15 L80,10 L100,5',
  'co2e-sequestered': 'M0,28 C20,28 30,20 50,15 S80,10 100,2',
  'verified-credits': 'M0,20 L33,20 L66,10 L100,10',
  'awaiting-verification': 'M0,10 L20,15 L40,12 L60,20 L80,25 L100,22',
  'registered-orgs': 'M0,28 L20,28 L20,20 L40,20 L40,15 L60,15 L60,10 L80,10 L80,5 L100,5',
};

const ACCENT_MAP = {
  secondary: {
    bar: 'bg-secondary',
    text: 'text-secondary',
  },
  primary: {
    bar: 'bg-primary',
    text: 'text-primary',
  },
  tertiary: {
    bar: 'bg-[#00abc1]',
    text: 'text-[#00abc1]',
  },
  'on-tertiary-container': {
    bar: 'bg-emerald-600',
    text: 'text-emerald-600',
  },
  error: {
    bar: 'bg-error',
    text: 'text-error',
  },
  'on-primary-fixed-variant': {
    bar: 'bg-blue-800',
    text: 'text-blue-800',
  },
};

export default function StatCard({
  id,
  label,
  value,
  trend,
  trendDirection,
  icon,
  accentColor = 'primary',
}) {
  const isUp = trendDirection === 'up';
  const trendColorClass = isUp ? 'text-secondary' : 'text-error';
  const trendBgClass = isUp ? 'bg-secondary-container/30' : 'bg-error-container/50';
  const trendIcon = isUp ? (id === 'registered-orgs' ? 'arrow_upward' : 'trending_up') : 'trending_down';

  const formatValue = (val) => {
    if (typeof val === 'number') {
      if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
      if (val >= 1000) return val.toLocaleString();
    }
    return val;
  };

  const formattedValue = formatValue(value);
  const sparklinePath = sparklinePaths[id] || sparklinePaths['active-projects'];
  const accent = ACCENT_MAP[accentColor] || ACCENT_MAP.primary;

  return (
    <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] border border-outline-variant/30 flex flex-col gap-2 relative overflow-hidden group hover:shadow-[0_4px_16px_rgba(0,51,102,0.06)] hover:border-outline-variant/60 transition-all duration-200">
      <div className={`absolute top-0 left-0 w-full h-[3px] ${accent.bar}`}></div>
      <div className="flex justify-between items-center pt-1">
        <span className="font-label-md text-on-surface-variant uppercase tracking-wider text-[11px] font-semibold">{label}</span>
        <span className={`material-symbols-outlined ${accent.text} text-[20px]`}>{icon}</span>
      </div>
      <div className="flex items-end justify-between gap-2 mt-1">
        <span className="font-headline-lg text-2xl font-bold text-on-surface tracking-tight">{formattedValue}</span>
        <div className={`flex items-center gap-0.5 ${trendColorClass} font-label-md text-xs font-semibold ${trendBgClass} px-2 py-0.5 rounded-full`}>
          <span className="material-symbols-outlined text-[14px]">{trendIcon}</span>
          <span>{id === 'registered-orgs' ? trend : `${trend}%`}</span>
        </div>
      </div>
      <div className={`w-full h-8 mt-1 ${accent.text} opacity-75 group-hover:opacity-100 transition-opacity`}>
        <svg className="w-full h-full stroke-current" fill="none" preserveAspectRatio="none" viewBox="0 0 100 30">
          <path d={sparklinePath} strokeWidth="2" vectorEffect="non-scaling-stroke"></path>
        </svg>
      </div>
    </div>
  );
}

