import { useState } from 'react';
import { Link } from 'react-router-dom';
import { submitOnboardingRequest } from '../services/onboardingService';
import { COASTAL_STATES } from '../../governance/adapters/gisAdapter';
import { ROUTES } from '../../../utils/constants';

export default function OrganizationOnboardingPage() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const [formData, setFormData] = useState({
    organizationName: '',
    organizationType: 'NGO',
    registrationNumber: '',
    darpanId: '',
    establishedDate: '',
    website: '',
    state: 'West Bengal',
    district: '',
    panchayatOrBlock: '',
    locationAddress: '',
    primaryContactName: '',
    primaryContactRole: 'Executive Director / President',
    primaryContactEmail: '',
    primaryContactPhone: '',
    authorizedRepName: '',
    authorizedRepDesignation: '',
    ecosystemFocus: ['Mangrove Restoration'],
    supportingDocuments: [],
    bankPayoutDetails: { bankName: '', accountHolder: '', ifscCode: '' },
    agreedToTerms: false,
  });

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleEcosystem = (eco) => {
    setFormData((prev) => {
      const exists = prev.ecosystemFocus.includes(eco);
      return {
        ...prev,
        ecosystemFocus: exists
          ? prev.ecosystemFocus.filter((e) => e !== eco)
          : [...prev.ecosystemFocus, eco],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.organizationName.trim() || !formData.primaryContactEmail.trim()) {
      setErrorMsg('Please fill in the required organization name and official contact email.');
      return;
    }
    if (!formData.agreedToTerms) {
      setErrorMsg('Please agree to the BlueCarbon MRV governance and data integrity protocol.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await submitOnboardingRequest(formData);
      setSubmittedData(res);
      setStep(5);
    } catch (err) {
      console.error('Submission error:', err);
      setErrorMsg(err.message || 'Failed to submit onboarding application. Please check your network connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-[24px]">corporate_fare</span>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-primary">National Coastal Carbon Registry</div>
              <h1 className="font-headline-lg text-on-surface text-[22px] md:text-[26px] font-extrabold tracking-tight">
                Organization Onboarding Portal
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to={ROUTES.ONBOARDING_STATUS}
              className="px-3.5 py-1.5 rounded-lg border border-outline-variant text-xs font-bold text-on-surface hover:bg-surface-container transition-colors inline-flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">search</span>
              Track Existing Application
            </Link>
            <Link
              to={ROUTES.LOGIN}
              className="px-3.5 py-1.5 rounded-lg bg-surface-container-lowest text-xs font-bold text-on-surface hover:bg-surface-container transition-colors inline-flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">login</span>
              Sign In
            </Link>
          </div>
        </div>

        {/* Step Progress Indicator (when not completed) */}
        {step < 5 && (
          <div className="grid grid-cols-4 gap-2">
            {[
              { num: 1, label: 'Entity Profile' },
              { num: 2, label: 'Jurisdiction & Ecology' },
              { num: 3, label: 'Authorized Rep' },
              { num: 4, label: 'Documentation' },
            ].map((s) => (
              <div
                key={s.num}
                className={`p-3 rounded-xl border text-center transition-all ${
                  step === s.num
                    ? 'bg-primary text-on-primary border-primary shadow-sm'
                    : step > s.num
                    ? 'bg-secondary/15 text-secondary border-secondary/30 font-bold'
                    : 'bg-surface border-outline-variant/30 text-on-surface-variant'
                }`}
              >
                <div className="text-[11px] font-bold uppercase tracking-wider">Step {s.num}</div>
                <div className="text-xs font-semibold truncate mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {errorMsg && (
          <div className="p-4 rounded-xl bg-error/15 text-error border border-error/30 text-sm font-medium flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">error</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Multi-step Form Card */}
        <div className="bg-surface rounded-2xl border border-outline-variant/30 shadow-lg p-6 sm:p-8">
          {/* STEP 1: Entity Profile */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-headline-sm text-on-surface text-[18px] font-bold">1. Legal Entity Identification</h2>
                <p className="text-xs text-on-surface-variant mt-1">
                  Select your organization category and enter official registration credentials.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                    Organization Type *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { id: 'NGO', label: 'Registered NGO', desc: 'Civil society & conservation non-profit' },
                      { id: 'PANCHAYAT', label: 'Gram Panchayat', desc: 'Local coastal village administration' },
                      { id: 'COMMUNITY', label: 'Community SHG', desc: 'Fisherfolk / coastal self-help group' },
                      { id: 'DEVELOPER', label: 'Project Developer', desc: 'Ecosystem restoration developer' },
                    ].map((t) => (
                      <button
                        type="button"
                        key={t.id}
                        onClick={() => updateField('organizationType', t.id)}
                        className={`p-3.5 rounded-xl border text-left transition-all ${
                          formData.organizationType === t.id
                            ? 'bg-primary-container text-on-primary-container border-primary shadow-sm'
                            : 'bg-surface-container-lowest border-outline-variant/30 text-on-surface hover:bg-surface-container'
                        }`}
                      >
                        <div className="text-sm font-bold">{t.label}</div>
                        <div className="text-[11px] opacity-80 mt-1">{t.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      Organization Legal Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sundarbans Eco Protection Foundation"
                      value={formData.organizationName}
                      onChange={(e) => updateField('organizationName', e.target.value)}
                      className="w-full p-3 rounded-lg bg-surface border border-outline-variant text-sm text-on-surface focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      Registration Number / Society Reg *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. WB-REG-44910-2018"
                      value={formData.registrationNumber}
                      onChange={(e) => updateField('registrationNumber', e.target.value)}
                      className="w-full p-3 rounded-lg bg-surface border border-outline-variant text-sm text-on-surface focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      NITI Aayog Darpan ID (NGOs)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. WB/2018/0192837"
                      value={formData.darpanId}
                      onChange={(e) => updateField('darpanId', e.target.value)}
                      className="w-full p-3 rounded-lg bg-surface border border-outline-variant text-sm text-on-surface focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      Established / Inception Date
                    </label>
                    <input
                      type="date"
                      value={formData.establishedDate}
                      onChange={(e) => updateField('establishedDate', e.target.value)}
                      className="w-full p-3 rounded-lg bg-surface border border-outline-variant text-sm text-on-surface focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      Official Website / Social URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://example.org"
                      value={formData.website}
                      onChange={(e) => updateField('website', e.target.value)}
                      className="w-full p-3 rounded-lg bg-surface border border-outline-variant text-sm text-on-surface focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={() => {
                    if (!formData.organizationName.trim()) {
                      setErrorMsg('Please enter your organization name.');
                      return;
                    }
                    setErrorMsg(null);
                    setStep(2);
                  }}
                  className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-on-primary text-xs font-bold flex items-center gap-1.5 shadow-sm"
                >
                  Continue to Jurisdiction
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Jurisdiction & Ecosystem */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-headline-sm text-on-surface text-[18px] font-bold">2. Coastal Jurisdiction & Ecosystem Scope</h2>
                <p className="text-xs text-on-surface-variant mt-1">
                  Specify the maritime state, coastal district, and primary blue carbon habitats managed.
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      Maritime Coastal State *
                    </label>
                    <select
                      value={formData.state}
                      onChange={(e) => updateField('state', e.target.value)}
                      className="w-full p-3 rounded-lg bg-surface border border-outline-variant text-sm text-on-surface focus:outline-none focus:border-primary"
                    >
                      {COASTAL_STATES.map((st) => (
                        <option key={st.id} value={st.name}>{st.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      Coastal District *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. South 24 Parganas / Cuddalore"
                      value={formData.district}
                      onChange={(e) => updateField('district', e.target.value)}
                      className="w-full p-3 rounded-lg bg-surface border border-outline-variant text-sm text-on-surface focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      Panchayat / Tehsil / Block
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Gosaba Coastal Block"
                      value={formData.panchayatOrBlock}
                      onChange={(e) => updateField('panchayatOrBlock', e.target.value)}
                      className="w-full p-3 rounded-lg bg-surface border border-outline-variant text-sm text-on-surface focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Registered Office / Field Hub Physical Address
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Enter complete postal address with PIN code..."
                    value={formData.locationAddress}
                    onChange={(e) => updateField('locationAddress', e.target.value)}
                    className="w-full p-3 rounded-lg bg-surface border border-outline-variant text-sm text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                    Ecosystem Restoration Focus *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      'Mangrove Restoration',
                      'Seagrass Conservation',
                      'Salt Marsh Protection',
                      'Coastal Wetland Rehabilitation',
                    ].map((eco) => {
                      const selected = formData.ecosystemFocus.includes(eco);
                      return (
                        <button
                          type="button"
                          key={eco}
                          onClick={() => toggleEcosystem(eco)}
                          className={`p-3 rounded-xl border text-left text-xs font-bold flex items-center gap-2 transition-all ${
                            selected
                              ? 'bg-secondary/15 text-secondary border-secondary shadow-sm'
                              : 'bg-surface-container-lowest border-outline-variant/30 text-on-surface hover:bg-surface-container'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {selected ? 'check_box' : 'check_box_outline_blank'}
                          </span>
                          <span>{eco}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-5 py-2.5 rounded-xl border border-outline-variant text-xs font-bold text-on-surface hover:bg-surface-container"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!formData.district.trim()) {
                      setErrorMsg('Please specify the coastal district.');
                      return;
                    }
                    setErrorMsg(null);
                    setStep(3);
                  }}
                  className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-on-primary text-xs font-bold flex items-center gap-1.5 shadow-sm"
                >
                  Continue to Contacts
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Authorized Representative */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-headline-sm text-on-surface text-[18px] font-bold">3. Authorized Representative & Key Contacts</h2>
                <p className="text-xs text-on-surface-variant mt-1">
                  Designate the primary administrative signatory authorized to submit MRV claims and manage credits.
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      Primary Contact Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Arindam Mukherjee"
                      value={formData.primaryContactName}
                      onChange={(e) => updateField('primaryContactName', e.target.value)}
                      className="w-full p-3 rounded-lg bg-surface border border-outline-variant text-sm text-on-surface focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      Role / Designation *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Executive Director / Gram Pradhan"
                      value={formData.primaryContactRole}
                      onChange={(e) => updateField('primaryContactRole', e.target.value)}
                      className="w-full p-3 rounded-lg bg-surface border border-outline-variant text-sm text-on-surface focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      Official Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="contact@organization.org"
                      value={formData.primaryContactEmail}
                      onChange={(e) => updateField('primaryContactEmail', e.target.value)}
                      className="w-full p-3 rounded-lg bg-surface border border-outline-variant text-sm text-on-surface focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      Mobile / Phone Number *
                    </label>
                    <input
                      type="tel"
                      placeholder="+91 98301 23456"
                      value={formData.primaryContactPhone}
                      onChange={(e) => updateField('primaryContactPhone', e.target.value)}
                      className="w-full p-3 rounded-lg bg-surface border border-outline-variant text-sm text-on-surface focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    Secondary Signatory / Field Liaison (Optional)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Secondary representative name"
                      value={formData.authorizedRepName}
                      onChange={(e) => updateField('authorizedRepName', e.target.value)}
                      className="p-2.5 rounded-lg bg-surface border border-outline-variant text-xs text-on-surface"
                    />
                    <input
                      type="text"
                      placeholder="Designation (e.g. Field Operations Head)"
                      value={formData.authorizedRepDesignation}
                      onChange={(e) => updateField('authorizedRepDesignation', e.target.value)}
                      className="p-2.5 rounded-lg bg-surface border border-outline-variant text-xs text-on-surface"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-5 py-2.5 rounded-xl border border-outline-variant text-xs font-bold text-on-surface hover:bg-surface-container"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!formData.primaryContactName.trim() || !formData.primaryContactEmail.trim()) {
                      setErrorMsg('Please enter primary contact name and official email.');
                      return;
                    }
                    setErrorMsg(null);
                    setStep(4);
                  }}
                  className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-on-primary text-xs font-bold flex items-center gap-1.5 shadow-sm"
                >
                  Continue to Documents
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Documentation & Declaration */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-headline-sm text-on-surface text-[18px] font-bold">4. Supporting Documentation & Governance Undertaking</h2>
                <p className="text-xs text-on-surface-variant mt-1">
                  Upload verification documents and accept the sovereign BlueCarbon registry declaration.
                </p>
              </div>

              {/* Document upload dropzone simulation */}
              <div className="p-6 rounded-2xl border-2 border-dashed border-outline-variant text-center space-y-3 bg-surface-container-lowest">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-[28px]">cloud_upload</span>
                </div>
                <div>
                  <div className="text-sm font-bold text-on-surface">Upload Registration Certificate or Panchayat Resolution</div>
                  <p className="text-xs text-on-surface-variant mt-0.5">Supports PDF, PNG, JPEG up to 25MB. Will be immutably hashed on upload.</p>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface border border-outline-variant text-xs font-bold text-primary cursor-pointer hover:bg-surface-container">
                  <span className="material-symbols-outlined text-[16px]">attach_file</span>
                  Select Certificate File
                </div>
              </div>

              {/* Declaration Undertaking */}
              <div className="p-4 rounded-xl bg-primary-container/20 border border-primary/30 space-y-3">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={formData.agreedToTerms}
                    onChange={(e) => updateField('agreedToTerms', e.target.checked)}
                    className="mt-1 w-4 h-4 rounded text-primary focus:ring-primary"
                  />
                  <label htmlFor="terms" className="text-xs text-on-surface leading-relaxed cursor-pointer">
                    <strong className="block text-on-surface mb-0.5 font-bold">Official Statutory Undertaking:</strong>
                    I hereby certify that the information provided represents the lawful coastal entity and that all ecological restoration, MRV submissions, and drone imagery uploaded to this registry will adhere to NCCR sovereign integrity guidelines and biological conservation laws of India.
                  </label>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-5 py-2.5 rounded-xl border border-outline-variant text-xs font-bold text-on-surface hover:bg-surface-container"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-secondary hover:bg-secondary/90 text-on-secondary text-xs font-bold flex items-center gap-1.5 shadow-md"
                >
                  {isSubmitting ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                      Submitting Application...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">verified</span>
                      Submit Formal Onboarding Application
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: Success & Tracking Confirmation */}
          {step === 5 && submittedData && (
            <div className="text-center py-8 px-4 space-y-6 animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-secondary/15 text-secondary flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-[36px]">check_circle</span>
              </div>

              <div className="space-y-2 max-w-md mx-auto">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-secondary/10 text-secondary">
                  Application Submitted Successfully
                </span>
                <h2 className="font-headline-lg text-on-surface text-[24px] font-extrabold">
                  {submittedData.organization_name}
                </h2>
                <p className="text-xs text-on-surface-variant">
                  Your onboarding request has been assigned to the National Coastal Carbon Registry (NCCR) verification officer.
                </p>
              </div>

              {/* Reference Box */}
              <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 max-w-md mx-auto text-left space-y-2">
                <div className="text-xs text-on-surface-variant">Application Tracking Number:</div>
                <div className="text-xl font-mono-data font-extrabold text-primary select-all">
                  {submittedData.application_number}
                </div>
                <div className="text-[11px] text-on-surface-variant pt-1 border-t border-outline-variant/20">
                  Confirmation dispatched to: <strong>{formData.primaryContactEmail}</strong>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
                <Link
                  to={`${ROUTES.ONBOARDING_STATUS}?app=${submittedData.application_number}`}
                  className="px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 flex items-center gap-1.5 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[16px]">track_changes</span>
                  Track Application Status
                </Link>
                <Link
                  to={ROUTES.PUBLIC_REGISTRY}
                  className="px-5 py-2.5 rounded-xl border border-outline-variant text-xs font-bold text-on-surface hover:bg-surface-container flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">public</span>
                  Explore Public Registry
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
