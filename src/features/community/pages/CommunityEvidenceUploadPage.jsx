import { useState, useEffect } from 'react';
import PageHeader from '../../../components/common/PageHeader';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import StatusBadge from '../../../components/common/StatusBadge';
import { getProjects } from '../../../services/projectService';
import { getMRVSubmissions } from '../../../services/mrvService';

export default function CommunityEvidenceUploadPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedProject, setSelectedProject] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [projects, setProjects] = useState([]);
  const [recentUploads, setRecentUploads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [projectsData, mrvData] = await Promise.all([
          getProjects(),
          getMRVSubmissions()
        ]);
        setProjects(projectsData);
        if (projectsData.length > 0) {
          setSelectedProject(projectsData[0].id);
        }
        
        // Extract recent evidence files from MRV submissions
        const uploads = [];
        mrvData.forEach(sub => {
          if (sub.evidenceFiles && sub.evidenceFiles.length > 0) {
            sub.evidenceFiles.forEach(file => {
              uploads.push({
                file: file.originalFilename || file.name,
                project: sub.projectName,
                date: file.createdAt ? file.createdAt.split('T')[0] : sub.submittedDate,
                status: file.validationStatus === 'VALID' ? 'Verified' : 'Under Review'
              });
            });
          }
        });
        setRecentUploads(uploads.slice(0, 5));
      } catch (err) {
        console.error('Failed to load data for upload page', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setCurrentStep(1);
      }, 3000);
    }, 1500);
  };

  return (
    <div className="flex flex-col w-full p-4 sm:p-6 lg:p-8 gap-6 max-w-[1600px] mx-auto font-body-md text-on-surface min-h-screen">
      <PageHeader 
        title="Evidence Upload" 
        subtitle="Submit field evidence such as photos, GPS data, and survey results for your community projects."
      />

      {success && (
        <div className="p-4 bg-secondary-container/20 border border-secondary/30 text-secondary rounded-xl flex items-center gap-3">
          <span className="material-symbols-outlined text-[24px]">verified</span>
          <div>
            <h4 className="font-bold">Upload Successful</h4>
            <p className="text-sm">Your evidence has been securely anchored and submitted for MRV review.</p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <Card>
              <div className="flex items-center justify-between mb-6 border-b border-outline-variant/20 pb-4">
                <h2 className="font-headline-md text-lg font-bold text-primary m-0">Upload Wizard</h2>
                <span className="font-mono-data text-xs font-semibold px-3 py-1 bg-surface-container rounded-full border border-outline-variant/30">
                  Step {currentStep} of 3
                </span>
              </div>

              <div className="min-h-[300px] flex flex-col justify-between">
                {currentStep === 1 && (
                  <div className="flex flex-col gap-4">
                    <p className="font-title-md font-semibold">Select Project</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {projects.map((proj) => (
                        <label key={proj.id} className={`flex flex-col p-4 border rounded-xl cursor-pointer transition-all ${selectedProject === proj.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-outline-variant/40 hover:bg-surface-container'}`}>
                          <input type="radio" className="sr-only" checked={selectedProject === proj.id} onChange={() => setSelectedProject(proj.id)} />
                          <span className="font-bold text-on-surface mb-1">{proj.name}</span>
                          <span className="font-mono-data text-xs text-on-surface-variant">{proj.id}</span>
                        </label>
                      ))}
                      {projects.length === 0 && (
                        <p className="text-sm text-on-surface-variant col-span-full">No projects found. Please register a project first.</p>
                      )}
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="flex flex-col gap-4">
                    <p className="font-title-md font-semibold">Upload Files</p>
                    <div className="border-2 border-dashed border-outline-variant rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer">
                      <span className="material-symbols-outlined text-primary text-4xl mb-2">cloud_upload</span>
                      <p className="font-bold text-on-surface">Drag & drop files or click to browse</p>
                      <p className="text-xs text-on-surface-variant mt-1">Supports GIS, CSV, PDF, JPG (Max 5GB)</p>
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="flex flex-col gap-4">
                    <p className="font-title-md font-semibold">Metadata & Submission</p>
                    <div className="flex flex-col gap-3">
                      <input type="text" placeholder="Survey Title / Reference" className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary/20 focus:outline-none" defaultValue="October 2023 Field Survey" />
                      <textarea rows="3" placeholder="Additional Notes..." className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary/20 focus:outline-none" defaultValue="All quadrats measured successfully."></textarea>
                    </div>
                    <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/30 mt-2 flex items-start gap-3">
                      <span className="material-symbols-outlined text-secondary">shield</span>
                      <div>
                        <p className="font-bold text-sm">Blockchain Anchoring</p>
                        <p className="text-xs text-on-surface-variant">Submitting will create an immutable hash of these files on the ledger.</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between mt-8 pt-4 border-t border-outline-variant/20">
                  <Button variant="outline" disabled={currentStep === 1} onClick={() => setCurrentStep(currentStep - 1)}>Back</Button>
                  {currentStep < 3 ? (
                    <Button variant="primary" onClick={() => setCurrentStep(currentStep + 1)} disabled={currentStep === 1 && !selectedProject}>Next Step</Button>
                  ) : (
                    <Button variant="primary" isLoading={isSubmitting} onClick={handleSubmit}>Submit Evidence</Button>
                  )}
                </div>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-6">
            <Card>
              <h3 className="font-headline-md text-lg font-bold mb-4 border-b border-outline-variant/20 pb-3">Recent Uploads</h3>
              <div className="flex flex-col gap-4">
                {recentUploads.map((item, i) => (
                  <div key={i} className="flex flex-col gap-1 p-3 bg-surface-container-lowest rounded-lg border border-outline-variant/30">
                    <p className="font-bold text-sm truncate">{item.file}</p>
                    <p className="text-xs text-on-surface-variant">{item.project}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="font-mono-data text-[10px] text-on-surface-variant">{item.date}</span>
                      <StatusBadge status={item.status} />
                    </div>
                  </div>
                ))}
                {recentUploads.length === 0 && (
                  <p className="text-sm text-on-surface-variant">No recent uploads found.</p>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
