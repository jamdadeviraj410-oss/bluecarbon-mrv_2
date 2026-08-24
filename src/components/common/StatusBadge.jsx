export default function StatusBadge({ status, showDot = true, className = '' }) {
  const getStatusStyles = (statusStr) => {
    const s = String(statusStr || '').toLowerCase().trim();
    switch (s) {
      case 'verified':
      case 'active':
      case 'minted':
      case 'completed':
      case 'confirmed':
      case 'approved':
        return {
          wrapper: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
          dot: 'bg-emerald-600',
        };
      case 'blockchain verified':
      case 'anchored':
      case 'verified_on_chain':
      case 'tokenized':
        return {
          wrapper: 'bg-cyan-50 text-cyan-800 border-cyan-200/80',
          dot: 'bg-cyan-600',
        };
      case 'pending':
      case 'pending anchor':
      case 'pending_anchor':
      case 'under review':
      case 'under validation':
      case 'under verification':
      case 'submitted':
      case 'changes requested':
        return {
          wrapper: 'bg-amber-50 text-amber-800 border-amber-200/80',
          dot: 'bg-amber-600',
        };
      case 'rejected':
      case 'retired':
      case 'suspended':
      case 'flagged':
      case 'critical':
      case 'high':
        return {
          wrapper: 'bg-rose-50 text-rose-800 border-rose-200/80',
          dot: 'bg-rose-600',
        };
      case 'draft':
      case 'demo':
      case 'simulated':
      case 'demo_simulated':
      default:
        return {
          wrapper: 'bg-slate-100 text-slate-700 border-slate-200',
          dot: 'bg-slate-500',
        };
    }
  };

  const styles = getStatusStyles(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-label-md text-xs font-semibold border tracking-wide uppercase ${styles.wrapper} ${className}`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${styles.dot}`} />}
      <span className="truncate">{status || 'Unknown'}</span>
    </span>
  );
}

