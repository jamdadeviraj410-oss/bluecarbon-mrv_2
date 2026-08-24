import { useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getPublicProjectById } from './publicRegistryService';

export default function PublicRegistryDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const project = useMemo(() => {
    return getPublicProjectById(id);
  }, [id]);

  const handleDownload = () => {
    const data = {
      registryId: project.id,
      projectName: project.name,
      location: project.location,
      country: project.countryName,
      restorationType: project.type,
      establishedYear: project.estYear,
      developer: project.developer,
      totalSequestered: `${project.totalSequestered} tCO2e`,
      areaCoverage: `${project.areaCoverage} ha`,
      creditPrice: project.priceDisplay,
      status: project.status,
      ledgerVerification: project.ledgerTimeline,
      verificationAuthority: 'National Centre for Coastal Research (NCCR)',
      dltNetwork: 'Polygon Mainnet (ERC-1155 EcoToken)',
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${project.id}-public-record.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col w-full px-4 sm:px-6 lg:px-8 py-8 gap-6 font-body-md text-on-surface bg-surface max-w-7xl mx-auto">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-label-md text-on-surface-variant">
          <Link to="/public" className="hover:text-primary transition-colors">
            Public Registry
          </Link>
          <span>/</span>
          <span className="text-on-surface font-semibold">{project.name}</span>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container border border-outline-variant/60 text-xs font-label-md text-on-surface hover:bg-surface-variant transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Back to Explorer
        </button>
      </div>

      {/* Hero Banner Card */}
      <div className="bg-surface rounded-2xl shadow-sm border border-outline-variant overflow-hidden flex flex-col md:flex-row">
        <div
          className="md:w-1/2 h-64 md:h-auto bg-cover bg-center relative"
          style={{ backgroundImage: `url('${project.imageUrl}')` }}
        >
          <div className="absolute top-4 left-4 px-3 py-1 bg-secondary text-on-secondary rounded-lg font-label-md text-xs font-semibold shadow-md flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">verified</span>
            {project.status}
          </div>
        </div>

        <div className="p-6 md:p-8 md:w-1/2 flex flex-col justify-between gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-on-surface-variant text-xs font-label-md">
              <span className="material-symbols-outlined text-[16px] text-primary">location_on</span>
              <span>{project.location}</span>
              <span>•</span>
              <span className="font-mono-data">ID: {project.id}</span>
            </div>
            <h1 className="font-headline-lg text-2xl sm:text-3xl font-bold text-on-surface tracking-tight m-0">
              {project.name}
            </h1>
            <p className="font-body-md text-xs sm:text-sm text-on-surface-variant leading-relaxed m-0">
              {project.description}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-outline-variant/40">
            <div>
              <span className="text-[11px] text-on-surface-variant block uppercase font-label-md">
                Total Sequestered
              </span>
              <span className="text-xl font-bold text-secondary font-headline-md">
                {project.totalSequestered} tCO2e
              </span>
            </div>
            <div>
              <span className="text-[11px] text-on-surface-variant block uppercase font-label-md">
                Area Coverage
              </span>
              <span className="text-xl font-bold text-on-surface font-headline-md">
                {project.areaCoverage} ha
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleDownload}
              className="flex-1 py-2.5 px-4 bg-primary text-on-primary rounded-xl font-label-md text-xs font-semibold hover:bg-primary-container transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              Download Registry Record
            </button>
          </div>
        </div>
      </div>

      {/* Ledger & Technical Verification */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (2 cols): Ledger Verification Timeline */}
        <div className="lg:col-span-2 bg-surface rounded-2xl shadow-sm border border-outline-variant p-6">
          <h3 className="font-title-lg text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">link</span>
            Cryptographic Ledger Timeline
          </h3>

          <div className="relative pl-6 py-2 border-l-2 border-outline-variant/60 ml-3 flex flex-col gap-6">
            {(project.ledgerTimeline || []).map((node) => (
              <div key={node.id} className="relative">
                <div
                  className={`absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full shadow-[0_0_0_4px_#f8f9ff] ${
                    node.active ? 'bg-primary' : 'bg-outline'
                  }`}
                ></div>
                <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/40 flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-title-md text-sm font-bold text-on-surface">{node.title}</span>
                    <span className="font-mono-data text-xs text-on-surface-variant">{node.date}</span>
                  </div>
                  <p className="font-body-md text-xs text-on-surface-variant m-0">{node.description}</p>
                  {node.txShort && (
                    <a
                      href={`https://polygonscan.com/tx/${node.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-primary font-mono-data text-xs hover:underline mt-1 bg-primary/5 px-2.5 py-1 rounded w-fit"
                    >
                      {node.txShort}
                      <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right (1 col): Developer & Certification */}
        <div className="flex flex-col gap-6">
          <div className="bg-surface rounded-2xl shadow-sm border border-outline-variant p-6 flex flex-col gap-3">
            <h3 className="font-title-lg text-base font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">corporate_fare</span>
              Project Developer
            </h3>
            <div className="text-xs">
              <span className="font-semibold text-sm text-on-surface block">{project.developer}</span>
              <span className="text-on-surface-variant block mt-0.5">{project.developerRole}</span>
              <span className="text-on-surface-variant block mt-2">
                Region: <strong className="text-on-surface">{project.region}</strong>
              </span>
              <span className="text-on-surface-variant block mt-1">
                Restoration Type: <strong className="text-on-surface">{project.type}</strong>
              </span>
            </div>
          </div>

          <div className="bg-surface rounded-2xl shadow-sm border border-outline-variant p-6 flex flex-col gap-3">
            <h3 className="font-title-lg text-base font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[20px]">verified_user</span>
              Trust Framework
            </h3>
            <p className="font-body-md text-xs text-on-surface-variant leading-relaxed m-0">
              This project is validated under the National Centre for Coastal Research (NCCR) Blue Carbon MRV Standards and anchored onto the Polygon blockchain.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
