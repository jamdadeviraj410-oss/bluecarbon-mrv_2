
const StatusBadge = ({ status }) => {
  let colors = "bg-gray-100 text-gray-700";
  if (status === "Verified") {
    colors = "bg-[#4CAF50]/10 text-[#2E7D32]";
  } else if (status === "Pending") {
    colors = "bg-[#FFA000]/10 text-[#B47000]";
  } else if (status === "Suspended" || status === "Rejected") {
    colors = "bg-[#D32F2F]/10 text-[#D32F2F]";
  }

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full font-label-md text-[12px] uppercase tracking-wider ${colors}`}>
      {status}
    </span>
  );
};

const OrganizationDetailDialog = ({ organization, isOpen, onClose }) => {
  if (!isOpen || !organization) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-on-surface/20 backdrop-blur-sm transition-opacity">
      <div 
        className="w-full max-w-md h-full bg-surface shadow-2xl overflow-y-auto animate-slide-in-right flex flex-col"
      >
        <div className="flex items-center justify-between p-6 border-b border-outline-variant/30">
          <h2 className="font-headline-md text-on-surface">Organization Details</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 flex-1">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h3 className="font-title-lg text-on-surface mb-1">{organization.name}</h3>
              <p className="font-body-md text-on-surface-variant">{organization.type} • {organization.location}</p>
            </div>
            <StatusBadge status={organization.status} />
          </div>

          <div className="space-y-6">
            <div>
              <h4 className="font-label-md text-outline mb-2 uppercase">Description</h4>
              <p className="font-body-md text-on-surface">{organization.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-container-low p-4 rounded-lg border border-outline-variant/20">
                <span className="block font-label-md text-outline mb-1 uppercase">Active Projects</span>
                <span className="font-headline-sm text-primary">{organization.activeProjects}</span>
              </div>
              <div className="bg-surface-container-low p-4 rounded-lg border border-outline-variant/20">
                <span className="block font-label-md text-outline mb-1 uppercase">Verified Credits</span>
                <span className="font-headline-sm text-secondary font-mono-data">{organization.totalVerifiedCredits}</span>
              </div>
            </div>

            <div className="border-t border-outline-variant/20 pt-6 space-y-4">
              <div>
                <span className="block font-label-md text-outline mb-1 uppercase">Contact Email</span>
                <p className="font-body-md text-on-surface">{organization.contactEmail}</p>
              </div>
              <div>
                <span className="block font-label-md text-outline mb-1 uppercase">Join Date</span>
                <p className="font-body-md text-on-surface">{organization.joinDate}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-outline-variant/30 bg-surface-container-lowest flex justify-end gap-3">
          {organization.status === 'Verified' ? (
             <button className="px-4 py-2 border border-error text-error rounded-lg font-title-sm hover:bg-error/5 transition-colors">
               Suspend
             </button>
          ) : (
             <button className="px-4 py-2 bg-primary text-on-primary rounded-lg font-title-sm hover:bg-primary-container transition-colors">
               Verify
             </button>
          )}
          <button className="px-4 py-2 border border-primary text-primary rounded-lg font-title-sm hover:bg-primary/5 transition-colors">
            View Projects
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrganizationDetailDialog;
