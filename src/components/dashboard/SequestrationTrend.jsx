

export default function SequestrationTrend() {
  return (
    <div className="bg-surface rounded-xl shadow-sm p-md flex flex-col">
      <h3 className="font-title-md text-on-surface m-0 mb-sm">Carbon Sequestration Trend</h3>
      <p className="font-label-md text-on-surface-variant mb-md">Cumulative tCO2e over 12 months</p>
      <div className="w-full h-32 relative mt-auto text-secondary">
        <svg className="w-full h-full stroke-current" fill="none" preserveAspectRatio="none" viewBox="0 0 200 100">
          <path d="M0,90 Q40,85 80,60 T140,40 T200,10" strokeLinecap="round" strokeWidth="3" vectorEffect="non-scaling-stroke"></path>
          {/* Area under curve simulation */}
          <path d="M0,90 Q40,85 80,60 T140,40 T200,10 L200,100 L0,100 Z" fill="currentColor" fillOpacity="0.1" stroke="none"></path>
        </svg>
      </div>
    </div>
  );
}
