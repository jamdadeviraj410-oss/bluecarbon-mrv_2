

export default function VerificationQueueTable({ queue }) {
  const getStatusStyles = (status) => {
    switch (status) {
      case 'Verified':
        return {
          badge: 'bg-secondary-container/40 text-on-secondary-container',
          dot: 'bg-secondary'
        };
      case 'Pending':
        return {
          badge: 'bg-tertiary-fixed-dim/20 text-on-tertiary-fixed-variant',
          dot: 'bg-tertiary-fixed-dim'
        };
      case 'Under Review':
        return {
          badge: 'bg-primary-fixed-dim/30 text-on-primary-fixed-variant',
          dot: 'bg-primary-fixed-dim'
        };
      case 'Rejected':
        return {
          badge: 'bg-error-container/40 text-on-error-container',
          dot: 'bg-error'
        };
      default:
        return {
          badge: 'bg-surface-container-high text-on-surface-variant',
          dot: 'bg-outline'
        };
    }
  };

  const renderActions = (status) => {
    switch (status) {
      case 'Verified':
        return (
          <button className="bg-transparent border border-outline-variant text-on-surface font-label-md px-sm py-xs rounded hover:bg-surface-container transition-colors">
            View Audit
          </button>
        );
      case 'Pending':
        return (
          <div className="flex gap-xs justify-end">
            <button className="bg-transparent text-primary font-label-md px-sm py-xs hover:bg-primary/10 transition-colors rounded">
              Review
            </button>
            <button className="bg-primary text-on-primary font-label-md px-sm py-xs rounded hover:bg-primary-container transition-colors shadow-sm">
              Verify
            </button>
          </div>
        );
      case 'Under Review':
        return (
          <button className="bg-transparent border border-outline-variant text-on-surface font-label-md px-sm py-xs rounded hover:bg-surface-container transition-colors">
            Continue
          </button>
        );
      case 'Rejected':
        return (
          <button className="bg-transparent text-on-surface-variant font-label-md px-sm py-xs hover:bg-surface-container transition-colors rounded">
            View Report
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <section className="bg-surface rounded-xl shadow-sm overflow-hidden flex flex-col">
      <div className="p-md bg-surface-container-lowest border-b border-surface-container-high/50 flex justify-between items-center">
        <h2 className="font-title-lg text-on-surface m-0">Verification Queue</h2>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-[18px] text-outline">search</span>
          <input
            className="pl-[32px] pr-sm py-xs rounded-lg border border-outline-variant bg-surface font-body-md focus:outline-none focus:border-on-tertiary-container focus:ring-2 focus:ring-on-tertiary-container/20 transition-all"
            placeholder="Filter projects..."
            type="text"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-low border-b border-outline-variant/50">
              <th className="p-md font-label-md text-on-surface-variant font-semibold whitespace-nowrap">Project ID & Name</th>
              <th className="p-md font-label-md text-on-surface-variant font-semibold">Organization</th>
              <th className="p-md font-label-md text-on-surface-variant font-semibold">Location</th>
              <th className="p-md font-label-md text-on-surface-variant font-semibold">Submitted</th>
              <th className="p-md font-label-md text-on-surface-variant font-semibold">Est. CO2e</th>
              <th className="p-md font-label-md text-on-surface-variant font-semibold">Status</th>
              <th className="p-md font-label-md text-on-surface-variant font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="font-body-md text-on-surface divide-y divide-outline-variant/30">
            {queue.map(project => {
              const styles = getStatusStyles(project.status);

              return (
                <tr key={project.id} className="hover:bg-primary/5 transition-colors group">
                  <td className="p-md">
                    <div className="flex flex-col">
                      <span className="font-semibold text-primary">{project.name}</span>
                      <span className="font-mono-data text-on-surface-variant text-[11px]">{project.id}</span>
                    </div>
                  </td>
                  <td className="p-md">{project.organization}</td>
                  <td className="p-md">{project.location}</td>
                  <td className="p-md font-mono-data">{project.submitted}</td>
                  <td className="p-md font-mono-data">{project.estCO2e.toLocaleString()}</td>
                  <td className="p-md">
                    <span className={`inline-flex items-center px-[8px] py-[2px] rounded-full ${styles.badge} font-label-md gap-xs`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`}></span> {project.status}
                    </span>
                  </td>
                  <td className={`p-md text-right ${project.status === 'Pending' ? '' : ''}`}>
                    {renderActions(project.status)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
