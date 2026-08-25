import { useState, useEffect, useRef } from 'react';
import PageHeader from '../../../components/common/PageHeader';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import StatusBadge from '../../../components/common/StatusBadge';
import { getProjects } from '../../../services/projectService';
import { getMRVSubmissions, uploadEvidence, submitMrv } from '../../../services/mrvService';

export default function CommunityEvidenceUploadPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedProject, setSelectedProject] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedEvidence, setUploadedEvidence] = useState(null);
  const [surveyTitle, setSurveyTitle] = useState('October 2023 Field Survey');
  const [surveyNotes, setSurveyNotes] = useState('All quadrats measured successfully.');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [projects, setProjects] = useState([]);
  const [recentUploads, setRecentUploads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef(null);

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

  const handleFileProcess = async (file) => {
    if (!file) return;

    setError('');
    const allowedExtensions = ['pdf', 'csv', 'jpg', 'jpeg', 'png', 'zip', 'json', 'tif', 'tiff', 'geojson', 'kml', 'gpkg', 'shp', 'las', 'laz'];
    const ext = file.name.split('.').pop().toLowerCase();

    if (!allowedExtensions.includes(ext)) {
      setError(`Format .${ext} is unsupported. Supported formats: GIS, CSV, PDF, JPG.`);
      return;
    }

    const maxSizeBytes = 5 * 1024 * 1024 * 1024; // 5 GB
    if (file.size > maxSizeBytes) {
      setError('File size exceeds the 5 GB maximum limit.');
      return;
    }

    if (file.size === 0) {
      setError('Selected file is empty.');
      return;
    }

    setIsUploading(true);
    try {
      const uploaded = await uploadEvidence({
        projectId: selectedProject,
        file,
        evidenceType: 'FIELD_SURVEY',
        metadata: {
          surveyTitle,
          notes: surveyNotes,
        },
      });

      setUploadedEvidence(uploaded);
      setError('');
    } catch (err) {
      console.error('Evidence upload failed:', err);
      setError(err.message || 'Failed to upload evidence file. Please try again.');
      setUploadedEvidence(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!isUploading) {
        fileInputRef.current?.click();
      }
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting || !selectedProject || !uploadedEvidence) return;
    setIsSubmitting(true);
    setError('');

    try {
      await submitMrv(selectedProject, {
        reportingPeriod: 'Q3 2023',
        submissionType: 'Community Field Survey',
        notes: surveyNotes,
        carbonEstimate: 14200,
      });

      setSuccess(true);
      setUploadedEvidence(null);

      // Reload recent uploads
      const mrvData = await getMRVSubmissions();
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

      setTimeout(() => {
        setSuccess(false);
        setCurrentStep(1);
      }, 3000);
    } catch (err) {
      console.error('Failed to submit MRV package:', err);
      setError(err.message || 'Failed to submit MRV evidence package.');
    } finally {
      setIsSubmitting(false);
    }
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

      {error && (
        <div className="p-4 bg-error-container/20 border border-error/30 text-error rounded-xl flex items-center gap-3 animate-fade-in">
          <span className="material-symbols-outlined text-[24px]">error</span>
          <div>
            <h4 className="font-bold">Upload Error</h4>
            <p className="text-sm">{error}</p>
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
                    
                    <input
                      ref={fileInputRef}
                      type="file"
                      hidden
                      accept=".pdf,.csv,.jpg,.jpeg,.png,.zip,.json,.tif,.tiff,.geojson,.kml,.gpkg,.shp,.las,.laz"
                      onChange={handleFileInputChange}
                    />

                    <div 
                      role="button"
                      tabIndex={0}
                      onClick={() => !isUploading && fileInputRef.current?.click()}
                      onKeyDown={handleKeyDown}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors cursor-pointer ${
                        isDragging 
                          ? 'border-primary bg-primary/10' 
                          : 'border-outline-variant hover:border-primary hover:bg-primary/5'
                      }`}
                    >
                      {isUploading ? (
                        <div className="flex flex-col items-center justify-center gap-2">
                          <span className="material-symbols-outlined animate-spin text-primary text-4xl mb-1">progress_activity</span>
                          <p className="font-bold text-on-surface">Uploading and validating evidence...</p>
                          <p className="text-xs text-on-surface-variant">Calculating checksum & uploading to secure evidence vault</p>
                        </div>
                      ) : uploadedEvidence ? (
                        <div className="flex flex-col items-center justify-center gap-1">
                          <span className="material-symbols-outlined text-secondary text-4xl mb-1">check_circle</span>
                          <p className="font-bold text-on-surface">{uploadedEvidence.name || uploadedEvidence.originalFilename}</p>
                          <p className="text-xs text-secondary font-semibold">{uploadedEvidence.size} • Uploaded & Validated</p>
                          <p className="text-xs text-on-surface-variant mt-2 underline">Click to replace file</p>
                        </div>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-primary text-4xl mb-2">cloud_upload</span>
                          <p className="font-bold text-on-surface">Drag & drop files or click to browse</p>
                          <p className="text-xs text-on-surface-variant mt-1">Supports GIS, CSV, PDF, JPG (Max 5GB)</p>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="flex flex-col gap-4">
                    <p className="font-title-md font-semibold">Metadata & Submission</p>
                    <div className="flex flex-col gap-3">
                      <input 
                        type="text" 
                        placeholder="Survey Title / Reference" 
                        className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary/20 focus:outline-none" 
                        value={surveyTitle}
                        onChange={(e) => setSurveyTitle(e.target.value)}
                      />
                      <textarea 
                        rows="3" 
                        placeholder="Additional Notes..." 
                        className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary/20 focus:outline-none" 
                        value={surveyNotes}
                        onChange={(e) => setSurveyNotes(e.target.value)}
                      ></textarea>
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
                    <Button 
                      variant="primary" 
                      onClick={() => setCurrentStep(currentStep + 1)} 
                      disabled={(currentStep === 1 && !selectedProject) || (currentStep === 2 && (!uploadedEvidence || isUploading))}
                    >
                      Next Step
                    </Button>
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
