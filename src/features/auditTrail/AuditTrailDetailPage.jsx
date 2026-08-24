import { useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getAuditEntryById } from './auditTrailService';

export default function AuditTrailDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const activity = useMemo(() => {
    return getAuditEntryById(id);
  }, [id]);

  return (
    <div className="flex flex-col w-full px-4 sm:px-6 lg:px-8 py-6 gap-6 font-body-md text-on-surface">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-label-md text-on-surface-variant">
          <Link to="/admin/audit" className="hover:text-primary transition-colors">
            Audit Trail
          </Link>
          <span>/</span>
          <span className="text-on-surface font-semibold">{activity.refId}</span>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-outline-variant/60 text-xs font-label-md text-on-surface hover:bg-surface-container transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Back
        </button>
      </div>

      {/* Main Header Card */}
      <div className="bg-surface rounded-2xl shadow-sm border border-outline-variant p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary text-on-primary flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-[28px]">history_edu</span>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono-data text-xs px-2.5 py-0.5 rounded bg-surface-container-high text-primary font-bold">
                {activity.refId}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full font-label-md text-xs font-semibold ${
                  activity.status === 'Verified'
                    ? 'bg-secondary-container text-on-secondary-container'
                    : activity.status === 'Rejected'
                    ? 'bg-error-container text-on-error-container'
                    : 'bg-[#fff3e0] text-[#f57f17]'
                }`}
              >
                {activity.status}
              </span>
              <span className="font-mono-data text-xs text-on-surface-variant">
                {activity.timestampUtc}
              </span>
            </div>
            <h1 className="font-headline-md text-xl sm:text-2xl font-bold text-on-surface m-0 tracking-tight">
              {activity.action}
            </h1>
            <p className="font-body-md text-xs text-on-surface-variant m-0">
              Project: <span className="font-semibold text-on-surface">{activity.project}</span> • Actor:{' '}
              <span className="font-semibold text-on-surface">{activity.user} ({activity.role})</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={`https://polygonscan.com/tx/${activity.txHash}`}
            target="_blank"
            rel="noreferrer"
            className="px-5 py-2.5 bg-primary text-on-primary rounded-xl font-label-md text-xs font-semibold hover:bg-primary-container transition-all flex items-center gap-2 shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">open_in_new</span>
            Verify On Explorer
          </a>
        </div>
      </div>

      {/* Detail Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Action Description & State Change */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-surface rounded-xl shadow-sm border border-outline-variant p-6">
            <h3 className="font-title-lg text-lg font-bold text-on-surface mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">description</span>
              Audit Record Description
            </h3>
            <p className="font-body-md text-sm text-on-surface leading-relaxed">{activity.description}</p>
          </div>

          {/* State Diff */}
          {activity.stateChange && (
            <div className="bg-surface rounded-xl shadow-sm border border-outline-variant p-6">
              <h3 className="font-title-lg text-lg font-bold text-on-surface mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">difference</span>
                State Transition Diff
              </h3>
              <div className="flex flex-col gap-2 font-mono-data text-xs">
                <div className="bg-error-container text-on-error-container p-3 rounded-lg flex items-center gap-3">
                  <span className="opacity-60 font-bold w-4 text-center text-sm">-</span>
                  <span>{activity.stateChange.old}</span>
                </div>
                <div className="bg-secondary-container text-on-secondary-container p-3 rounded-lg flex items-center gap-3">
                  <span className="opacity-60 font-bold w-4 text-center text-sm">+</span>
                  <span>{activity.stateChange.new}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column (1 col): Cryptographic Proof & Authorization */}
        <div className="flex flex-col gap-6">
          <div className="bg-surface rounded-xl shadow-sm border border-outline-variant p-6">
            <h3 className="font-title-lg text-base font-bold text-on-surface mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">lock</span>
              Cryptographic Proof
            </h3>
            <div className="flex flex-col gap-3 text-xs">
              <div>
                <span className="text-on-surface-variant block font-label-md uppercase">Transaction Hash</span>
                <span className="font-mono-data text-primary font-semibold break-all">{activity.txHash}</span>
              </div>
              <div className="border-t border-outline-variant/40 pt-2">
                <span className="text-on-surface-variant block font-label-md uppercase">Block Number</span>
                <span className="font-mono-data text-on-surface font-semibold">#{activity.blockNumber || '48199201'}</span>
              </div>
              <div className="border-t border-outline-variant/40 pt-2">
                <span className="text-on-surface-variant block font-label-md uppercase">IP Address / Node</span>
                <span className="font-mono-data text-on-surface">{activity.ipAddress || '192.168.1.145'}</span>
              </div>
              <div className="border-t border-outline-variant/40 pt-2">
                <span className="text-on-surface-variant block font-label-md uppercase">Network</span>
                <span className="font-semibold text-on-surface">{activity.network || 'Polygon Mainnet'}</span>
              </div>
            </div>
          </div>

          <div className="bg-surface rounded-xl shadow-sm border border-outline-variant p-6">
            <h3 className="font-title-lg text-base font-bold text-on-surface mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">badge</span>
              Actor Authorization
            </h3>
            <div className="flex flex-col gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">User:</span>
                <span className="font-semibold text-on-surface">{activity.user}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Role:</span>
                <span className="font-semibold text-on-surface">{activity.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Organization:</span>
                <span className="font-semibold text-on-surface">{activity.organization}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
