import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../../utils/constants';
import { supabase } from '../../../lib/supabase';

const MOCK_ORGS = [
  {
    id: 'ORG-2023-001',
    name: 'Mangrove Foundation of Maharashtra',
    type: 'NGO / Environmental Foundation',
    location: 'Mumbai, Maharashtra',
    contactEmail: 'contact@mangrovemaharashtra.org',
    contactPerson: 'Dr. Virendra Tiwari',
    projectsCount: 4,
    verifiedCredits: '28,400 tCO2e',
    status: 'Verified',
    registrationDate: '12 Jan 2023',
    kycStatus: 'Approved',
  },
  {
    id: 'ORG-2023-002',
    name: 'Sundarbans Coastal Panchayat Union',
    type: 'Gram Panchayat',
    location: 'South 24 Parganas, West Bengal',
    contactEmail: 'sundarbans.panchayat@wb.gov.in',
    contactPerson: 'Anirban Mukherjee',
    projectsCount: 6,
    verifiedCredits: '45,200 tCO2e',
    status: 'Verified',
    registrationDate: '04 Mar 2023',
    kycStatus: 'Approved',
  },
  {
    id: 'ORG-2023-003',
    name: 'Oceanic Blue Carbon Initiative',
    type: 'Project Developer',
    location: 'Chennai, Tamil Nadu',
    contactEmail: 'info@oceanicblue.org',
    contactPerson: 'Kavitha Ramanathan',
    projectsCount: 2,
    verifiedCredits: '14,800 tCO2e',
    status: 'Pending',
    registrationDate: '19 Aug 2023',
    kycStatus: 'Under Review',
  },
  {
    id: 'ORG-2024-004',
    name: 'Andaman Marine Ecology Trust',
    type: 'NGO / Ecology Trust',
    location: 'Port Blair, Andaman & Nicobar',
    contactEmail: 'support@andamanmarine.org',
    contactPerson: 'Sanjay Chander',
    projectsCount: 3,
    verifiedCredits: '21,000 tCO2e',
    status: 'Verified',
    registrationDate: '15 Feb 2024',
    kycStatus: 'Approved',
  },
  {
    id: 'ORG-2024-005',
    name: 'Gujarat Coastal Saltmarsh Alliance',
    type: 'Cooperative Society',
    location: 'Kutch, Gujarat',
    contactEmail: 'kutch.alliance@gujaratcoastal.org',
    contactPerson: 'Bhavesh Patel',
    projectsCount: 1,
    verifiedCredits: '8,500 tCO2e',
    status: 'Under Review',
    registrationDate: '10 Jun 2024',
    kycStatus: 'Pending Verification',
  },
];

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState(MOCK_ORGS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedOrg, setSelectedOrg] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadOrgs() {
      try {
        const { data, error } = await supabase.from('organizations').select('*');
        if (!error && data && data.length > 0 && isMounted) {
          const mapped = data.map((d) => ({
            id: d.org_code || d.id,
            name: d.name,
            type: d.type || 'NGO',
            location: d.location || d.state || 'India',
            contactEmail: d.email || 'contact@org.gov.in',
            contactPerson: d.contact_person || 'Authorized Representative',
            projectsCount: 2,
            verifiedCredits: '14,200 tCO2e',
            status: d.status || 'Verified',
            registrationDate: d.registration_date ? new Date(d.registration_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '12 Jan 2023',
            kycStatus: d.status === 'Verified' ? 'Approved' : 'Under Review',
          }));
          setOrganizations(mapped);
        }
      } catch (err) {
        console.warn('Organizations live query fallback:', err);
      }
    }
    loadOrgs();
    return () => { isMounted = false; };
  }, []);

  const filteredOrgs = organizations.filter((org) => {
    const matchesSearch =
      org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || org.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col w-full p-4 sm:p-6 xl:p-8 gap-6 bg-background min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-2xl sm:text-3xl text-on-surface font-bold mb-1">
            Registered Organizations
          </h1>
          <p className="font-body-md text-sm text-on-surface-variant">
            Manage and verify participating entities in the national blue carbon registry.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 sm:flex-none">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
              search
            </span>
            <input
              type="text"
              placeholder="Search organizations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded-xl font-body-md text-xs text-on-surface focus:outline-none focus:border-primary w-full sm:w-64 transition-all shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded-xl font-title-md text-xs text-on-surface focus:outline-none cursor-pointer shadow-2xs"
            >
              <option value="ALL">All Statuses</option>
              <option value="Verified">Verified</option>
              <option value="Pending">Pending</option>
              <option value="Under Review">Under Review</option>
            </select>

            <Link
              to={ROUTES.ONBOARDING}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-xl font-title-md text-xs font-bold hover:bg-primary-container transition-all shadow-xs"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>Register Org</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Organizations Table matching Stitch */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/60 border-b border-outline-variant/30">
                <th className="px-6 py-3.5 font-label-md text-[11px] text-on-surface-variant uppercase tracking-wider font-bold">
                  Organization
                </th>
                <th className="px-6 py-3.5 font-label-md text-[11px] text-on-surface-variant uppercase tracking-wider font-bold">
                  Type & Location
                </th>
                <th className="px-6 py-3.5 font-label-md text-[11px] text-on-surface-variant uppercase tracking-wider font-bold">
                  Projects
                </th>
                <th className="px-6 py-3.5 font-label-md text-[11px] text-on-surface-variant uppercase tracking-wider font-bold">
                  Verified Credits
                </th>
                <th className="px-6 py-3.5 font-label-md text-[11px] text-on-surface-variant uppercase tracking-wider font-bold">
                  Status
                </th>
                <th className="px-6 py-3.5 font-label-md text-[11px] text-on-surface-variant uppercase tracking-wider font-bold text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {filteredOrgs.map((org) => (
                <tr
                  key={org.id}
                  onClick={() => setSelectedOrg(org)}
                  className="hover:bg-surface-container/30 transition-colors cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-primary-container/20 text-primary flex items-center justify-center font-bold font-title-md text-xs shrink-0">
                        {org.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-title-md text-xs font-bold text-on-surface truncate">
                          {org.name}
                        </span>
                        <span className="font-mono-data text-[11px] text-on-surface-variant">
                          {org.id} • Registered {org.registrationDate}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-title-md text-xs text-on-surface">{org.type}</span>
                      <span className="font-body-md text-[11px] text-on-surface-variant">{org.location}</span>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-md bg-surface-container text-on-surface font-mono-data text-xs font-bold">
                      {org.projectsCount} Active
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <span className="font-mono-data text-xs font-bold text-secondary">
                      {org.verifiedCredits}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    {org.status === 'Verified' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-label-md text-[11px] uppercase tracking-wider font-bold bg-secondary/10 text-secondary">
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                        Verified
                      </span>
                    ) : org.status === 'Pending' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-label-md text-[11px] uppercase tracking-wider font-bold bg-amber-500/10 text-amber-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                        Pending
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-label-md text-[11px] uppercase tracking-wider font-bold bg-blue-500/10 text-blue-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        Under Review
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOrg(org);
                      }}
                      className="px-3 py-1.5 bg-surface-container hover:bg-primary hover:text-on-primary text-on-surface font-title-md text-xs font-semibold rounded-lg transition-colors"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Organization Details Modal / Drawer */}
      {selectedOrg && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl max-w-lg w-full min-w-[320px] p-6 shadow-xl border border-outline-variant/30 flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-outline-variant/20 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center font-bold">
                  {selectedOrg.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-headline-md text-base font-bold text-on-surface">{selectedOrg.name}</h3>
                  <span className="font-mono-data text-xs text-on-surface-variant">{selectedOrg.id}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrg(null)}
                className="text-on-surface-variant hover:text-on-surface p-1"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-3 mb-6">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-surface-container p-3 rounded-xl">
                  <span className="font-label-md text-[10px] text-on-surface-variant uppercase block mb-0.5">Entity Type</span>
                  <span className="font-title-md text-xs text-on-surface font-semibold">{selectedOrg.type}</span>
                </div>
                <div className="bg-surface-container p-3 rounded-xl">
                  <span className="font-label-md text-[10px] text-on-surface-variant uppercase block mb-0.5">Location</span>
                  <span className="font-title-md text-xs text-on-surface font-semibold">{selectedOrg.location}</span>
                </div>
                <div className="bg-surface-container p-3 rounded-xl">
                  <span className="font-label-md text-[10px] text-on-surface-variant uppercase block mb-0.5">Representative</span>
                  <span className="font-title-md text-xs text-on-surface font-semibold">{selectedOrg.contactPerson}</span>
                </div>
                <div className="bg-surface-container p-3 rounded-xl">
                  <span className="font-label-md text-[10px] text-on-surface-variant uppercase block mb-0.5">KYC Status</span>
                  <span className="font-title-md text-xs text-secondary font-bold">{selectedOrg.kycStatus}</span>
                </div>
              </div>

              <div className="bg-surface-container p-3.5 rounded-xl">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-label-md text-[11px] text-on-surface-variant uppercase">Total Managed Projects</span>
                  <span className="font-mono-data text-xs font-bold text-on-surface">{selectedOrg.projectsCount} Active Sites</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-label-md text-[11px] text-on-surface-variant uppercase">Verified Carbon Sequestration</span>
                  <span className="font-mono-data text-xs font-bold text-secondary">{selectedOrg.verifiedCredits}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedOrg(null)}
                className="flex-1 bg-surface-container text-on-surface font-title-md text-xs font-semibold py-2.5 rounded-xl hover:bg-surface-container-high transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => setSelectedOrg(null)}
                className="flex-1 bg-primary text-on-primary font-title-md text-xs font-bold py-2.5 rounded-xl hover:bg-primary-container transition-colors shadow-xs"
              >
                Manage Organization
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
