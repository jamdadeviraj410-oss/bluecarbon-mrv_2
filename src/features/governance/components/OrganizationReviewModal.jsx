import { useState } from 'react';
import { approveOrganizationApplication, rejectOrganizationApplication, requestApplicationChanges } from '../services/governanceService';

export default function OrganizationReviewModal({ request, isOpen, onClose, onRefresh }) {
  const [reviewNotes, setReviewNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [activeAction, setActiveAction] = useState('VIEW'); // 'VIEW', 'APPROVE', 'REJECT', 'CHANGES'
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  if (!isOpen || !request) return null;

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      await approveOrganizationApplication(request.id, reviewNotes);
      setFeedbackMsg({ type: 'success', text: `Organization ${request.organization_name} has been successfully verified & onboarded!` });
      setTimeout(() => {
        onRefresh();
        onClose();
      }, 1200);
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to approve onboarding.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setFeedbackMsg({ type: 'error', text: 'Please provide a formal rejection justification.' });
      return;
    }
    setIsProcessing(true);
    try {
      await rejectOrganizationApplication(request.id, rejectionReason);
      setFeedbackMsg({ type: 'success', text: `Application ${request.application_number} marked as Rejected.` });
      setTimeout(() => {
        onRefresh();
        onClose();
      }, 1200);
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to reject onboarding.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRequestChanges = async () => {
    if (!reviewNotes.trim()) {
      setFeedbackMsg({ type: 'error', text: 'Please detail the clarification requested.' });
      return;
    }
    setIsProcessing(true);
    try {
      await requestApplicationChanges(request.id, reviewNotes);
      setFeedbackMsg({ type: 'success', text: `Requested changes sent to ${request.primary_contact_email}.` });
      setTimeout(() => {
        onRefresh();
        onClose();
      }, 1200);
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to request changes.' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-surface rounded-2xl border border-outline-variant shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-5 bg-surface-container-low border-b border-outline-variant/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[24px]">verified_user</span>
            </div>
            <div>
              <h2 className="font-headline-md text-on-surface text-[20px] font-bold">Onboarding Review: {request.organization_name}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono-data text-xs text-on-surface-variant">{request.application_number}</span>
                <span className="text-outline text-xs">•</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold uppercase bg-primary-container/30 text-on-primary-container">
                  {request.organization_type}
                </span>
                <span className="text-outline text-xs">•</span>
                <span className="text-xs text-on-surface-variant">{request.state}, {request.district}</span>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {feedbackMsg && (
            <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
              feedbackMsg.type === 'success' ? 'bg-secondary-container/30 text-on-secondary-container border border-secondary/30' : 'bg-error-container/30 text-error border border-error/30'
            }`}>
              <span className="material-symbols-outlined text-[20px]">
                {feedbackMsg.type === 'success' ? 'check_circle' : 'error'}
              </span>
              <span>{feedbackMsg.text}</span>
            </div>
          )}

          {/* Org Identification & Compliance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Entity Identification</div>
              <div className="text-sm"><span className="text-on-surface-variant">Legal Name:</span> <strong className="text-on-surface">{request.organization_name}</strong></div>
              <div className="text-sm"><span className="text-on-surface-variant">Registration No:</span> <span className="font-mono-data text-on-surface">{request.registration_number || 'N/A'}</span></div>
              <div className="text-sm"><span className="text-on-surface-variant">NITI Darpan ID:</span> <span className="font-mono-data text-secondary font-bold">{request.darpan_id || 'Verified Exempt'}</span></div>
              <div className="text-sm"><span className="text-on-surface-variant">Established Date:</span> <span className="text-on-surface">{request.established_date || '2021'}</span></div>
              {request.website && (
                <div className="text-sm"><span className="text-on-surface-variant">Website:</span> <a href={request.website} target="_blank" rel="noreferrer" className="text-primary hover:underline">{request.website}</a></div>
              )}
            </div>

            <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Authorized Contact & Jurisdiction</div>
              <div className="text-sm"><span className="text-on-surface-variant">Primary Rep:</span> <strong className="text-on-surface">{request.primary_contact_name}</strong> ({request.primary_contact_role})</div>
              <div className="text-sm"><span className="text-on-surface-variant">Official Email:</span> <span className="text-on-surface">{request.primary_contact_email}</span></div>
              <div className="text-sm"><span className="text-on-surface-variant">Phone:</span> <span className="text-on-surface">{request.primary_contact_phone || 'N/A'}</span></div>
              <div className="text-sm"><span className="text-on-surface-variant">Jurisdiction:</span> <span className="text-on-surface">{request.panchayat_or_block ? `${request.panchayat_or_block}, ` : ''}{request.district}, {request.state}</span></div>
            </div>
          </div>

          {/* Ecosystem Focus & Restoration Scope */}
          <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Ecosystem Focus & Operational Capability</div>
            <div className="flex flex-wrap gap-2">
              {(request.ecosystem_focus || ['Mangrove Restoration']).map((eco, idx) => (
                <span key={idx} className="px-3 py-1 bg-secondary/10 text-secondary rounded-lg text-xs font-semibold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">eco</span>
                  {eco}
                </span>
              ))}
            </div>
            {request.location_address && (
              <p className="text-xs text-on-surface-variant">
                <span className="font-semibold">Registered Office / Field Hub:</span> {request.location_address}
              </p>
            )}
          </div>

          {/* Action Choice UI */}
          {activeAction === 'APPROVE' && (
            <div className="p-4 rounded-xl bg-secondary-container/20 border border-secondary/30 space-y-3">
              <div className="font-title-md text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">verified</span>
                Approve and Issue Official BlueCarbon Organization Credentials
              </div>
              <p className="text-xs text-on-surface-variant">
                Approving this request will automatically register this entity in the national database, set verification status to active, and grant project submission capabilities.
              </p>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Optional approval notes or internal compliance remarks..."
                rows={2}
                className="w-full p-3 rounded-lg bg-surface border border-outline-variant text-sm text-on-surface focus:outline-none focus:border-secondary"
              />
              <div className="flex justify-end gap-2">
                <button 
                  onClick={() => setActiveAction('VIEW')}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-on-surface hover:bg-surface-container transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApprove}
                  disabled={isProcessing}
                  className="px-5 py-2 rounded-lg text-xs font-bold bg-secondary hover:bg-secondary/90 text-on-secondary flex items-center gap-1.5 shadow-sm"
                >
                  {isProcessing ? 'Processing...' : 'Confirm Official Approval'}
                </button>
              </div>
            </div>
          )}

          {activeAction === 'REJECT' && (
            <div className="p-4 rounded-xl bg-error-container/20 border border-error/30 space-y-3">
              <div className="font-title-md text-error flex items-center gap-2">
                <span className="material-symbols-outlined text-error">cancel</span>
                Reject Onboarding Application
              </div>
              <p className="text-xs text-on-surface-variant">
                Please provide the regulatory justification or documentation failure reason. This will be recorded immutably in the national audit ledger.
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="State rejection justification (e.g., Darpan verification mismatch, unverified coastal boundary)..."
                rows={3}
                required
                className="w-full p-3 rounded-lg bg-surface border border-error/40 text-sm text-on-surface focus:outline-none focus:border-error"
              />
              <div className="flex justify-end gap-2">
                <button 
                  onClick={() => setActiveAction('VIEW')}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-on-surface hover:bg-surface-container transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={isProcessing}
                  className="px-5 py-2 rounded-lg text-xs font-bold bg-error hover:bg-error/90 text-on-error flex items-center gap-1.5 shadow-sm"
                >
                  {isProcessing ? 'Processing...' : 'Confirm Rejection'}
                </button>
              </div>
            </div>
          )}

          {activeAction === 'CHANGES' && (
            <div className="p-4 rounded-xl bg-primary-container/20 border border-primary/30 space-y-3">
              <div className="font-title-md text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">edit_note</span>
                Request Clarification / Additional Documentation
              </div>
              <p className="text-xs text-on-surface-variant">
                Specify what documents or spatial information the applicant needs to update.
              </p>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Clarification requirements (e.g., please re-upload valid Gram Panchayat resolution)..."
                rows={3}
                required
                className="w-full p-3 rounded-lg bg-surface border border-primary/40 text-sm text-on-surface focus:outline-none focus:border-primary"
              />
              <div className="flex justify-end gap-2">
                <button 
                  onClick={() => setActiveAction('VIEW')}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-on-surface hover:bg-surface-container transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRequestChanges}
                  disabled={isProcessing}
                  className="px-5 py-2 rounded-lg text-xs font-bold bg-primary hover:bg-primary/90 text-on-primary flex items-center gap-1.5 shadow-sm"
                >
                  {isProcessing ? 'Sending...' : 'Send Request to Applicant'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        {activeAction === 'VIEW' && (
          <div className="px-6 py-4 bg-surface-container-low border-t border-outline-variant/30 flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-outline-variant text-xs font-bold text-on-surface hover:bg-surface-container transition-colors"
            >
              Close
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveAction('CHANGES')}
                className="px-3.5 py-2 rounded-lg text-xs font-bold text-primary border border-primary/30 hover:bg-primary/5 transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">edit_note</span>
                Request Info
              </button>
              <button
                onClick={() => setActiveAction('REJECT')}
                className="px-3.5 py-2 rounded-lg text-xs font-bold text-error border border-error/30 hover:bg-error/5 transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
                Reject
              </button>
              <button
                onClick={() => setActiveAction('APPROVE')}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-secondary hover:bg-secondary/90 text-on-secondary transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                Approve Organization
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
