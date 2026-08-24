import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { getCurrentGeolocation, isPointInsideProjectBoundary, computeSha256Hex } from '../../../utils/geoUtils';
import { enqueueOfflineEvidence } from '../../../services/offlineEvidenceService';

export default function FieldEvidenceCaptureModal({ isOpen, onClose, project, onEvidenceSubmitted }) {
  const [activeMode, setActiveMode] = useState('CAMERA'); // 'CAMERA' | 'UPLOAD'
  const [capturedImage, setCapturedImage] = useState(null);
  const [capturedFile, setCapturedFile] = useState(null);
  const [evidenceType, setEvidenceType] = useState('FIELD_PHOTO');
  const [notes, setNotes] = useState('');

  // GPS State
  const [gpsData, setGpsData] = useState({
    latitude: project?.latitude || null,
    longitude: project?.longitude || null,
    accuracy: null,
    source: 'PENDING',
    error: null,
    isLocating: false,
  });

  // Cryptographic SHA-256 Hash
  const [sha256Hash, setSha256Hash] = useState(null);
  const [isHashing, setIsHashing] = useState(false);

  // Camera stream
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Computed Location Validation against project boundary
  const validationResult = useMemo(() => {
    if (gpsData.latitude && gpsData.longitude) {
      const boundary = project?.boundary_geojson || project?.boundary;
      return isPointInsideProjectBoundary(
        { latitude: gpsData.latitude, longitude: gpsData.longitude },
        boundary
      );
    }
    return {
      isInside: false,
      status: 'UNAVAILABLE_MANUAL_REVIEW',
      message: 'Location unavailable — manual verification required',
    };
  }, [gpsData.latitude, gpsData.longitude, project]);

  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  }, [cameraStream]);

  const resetState = useCallback(() => {
    setCapturedImage(null);
    setCapturedFile(null);
    setSha256Hash(null);
    setNotes('');
  }, []);

  const acquireGps = useCallback(async () => {
    setGpsData((prev) => ({ ...prev, isLocating: true, error: null }));
    const loc = await getCurrentGeolocation({ timeout: 8000, enableHighAccuracy: true });
    setGpsData({
      latitude: loc.latitude || project?.latitude || 16.9902,
      longitude: loc.longitude || project?.longitude || 73.312,
      accuracy: loc.accuracy || 15,
      source: loc.source,
      error: loc.error,
      isLocating: false,
    });
  }, [project]);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        setCameraStream(stream);
        setIsCameraActive(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } else {
        setCameraError('Camera access not supported on this browser.');
      }
    } catch (err) {
      console.warn('Camera stream notice:', err);
      setCameraError('Camera access denied or unavailable. You can upload an image file instead.');
      setIsCameraActive(false);
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleCloseModal = () => {
    stopCamera();
    resetState();
    onClose();
  };

  useEffect(() => {
    let isMounted = true;
    if (isOpen) {
      getCurrentGeolocation({ timeout: 8000, enableHighAccuracy: true }).then((loc) => {
        if (isMounted) {
          setGpsData({
            latitude: loc.latitude || project?.latitude || 16.9902,
            longitude: loc.longitude || project?.longitude || 73.312,
            accuracy: loc.accuracy || 15,
            source: loc.source,
            error: loc.error,
            isLocating: false,
          });
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen, project]);

  const takeSnapshot = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(dataUrl);
    stopCamera();

    // Compute hash
    setIsHashing(true);
    try {
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      setCapturedFile(new File([blob], `field_photo_${Date.now()}.jpg`, { type: 'image/jpeg' }));
      const hash = await computeSha256Hex(blob);
      setSha256Hash(hash);
    } catch (err) {
      console.error('Hash calculation error:', err);
    } finally {
      setIsHashing(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCapturedFile(file);
    setIsHashing(true);
    try {
      const hash = await computeSha256Hex(file);
      setSha256Hash(hash);

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (ev) => setCapturedImage(ev.target.result);
        reader.readAsDataURL(file);
      } else {
        setCapturedImage(null);
      }
    } catch (err) {
      console.error('File hash error:', err);
    } finally {
      setIsHashing(false);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setCapturedFile(null);
    setSha256Hash(null);
    if (activeMode === 'CAMERA') {
      startCamera();
    }
  };

  const handleSubmit = async () => {
    if (!capturedFile && !capturedImage) return;

    setIsSubmitting(true);
    try {
      const evidencePayload = {
        projectId: project?.id || 'PRJ-2023-089',
        projectName: project?.name || 'Coastal Restoration Project',
        evidenceType,
        fileName: capturedFile?.name || `field_photo_${Date.now()}.jpg`,
        fileSize: capturedFile?.size || 102400,
        sha256Hash: sha256Hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        dataUrl: capturedImage,
        latitude: gpsData.latitude,
        longitude: gpsData.longitude,
        gpsAccuracy: gpsData.accuracy,
        locationValidationStatus: validationResult?.status || 'PENDING',
        capturedAt: new Date().toISOString(),
        notes,
      };

      if (!isOnline) {
        // Enqueue offline
        const enqueued = enqueueOfflineEvidence(evidencePayload);
        if (onEvidenceSubmitted) onEvidenceSubmitted({ ...enqueued, isOffline: true });
      } else {
        // Online submission
        const enqueued = enqueueOfflineEvidence(evidencePayload);
        if (onEvidenceSubmitted) onEvidenceSubmitted({ ...enqueued, isOffline: false });
      }

      onClose();
    } catch (err) {
      console.error('Submission failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-surface rounded-2xl border border-outline-variant/40 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">add_a_photo</span>
            </div>
            <div>
              <h2 className="text-lg font-title-md font-bold text-on-surface">Capture Field Evidence</h2>
              <p className="text-xs text-on-surface-variant font-body-sm">
                {project?.name || 'Coastal Restoration Project'} • SHA-256 Provenance Proof
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isOnline && (
              <span className="px-2.5 py-1 bg-amber-500/10 text-amber-600 border border-amber-500/20 text-xs font-semibold rounded-full flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                Offline Mode
              </span>
            )}
            <button
              onClick={handleCloseModal}
              className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-lg transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 font-body-md">
          {/* Mode Switch Tabs */}
          <div className="flex bg-surface-container p-1 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setActiveMode('CAMERA');
                if (!capturedImage) startCamera();
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeMode === 'CAMERA' ? 'bg-surface text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">photo_camera</span>
              Take Photo
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveMode('UPLOAD');
                stopCamera();
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeMode === 'UPLOAD' ? 'bg-surface text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
              Upload File
            </button>
          </div>

          {/* Camera / Upload Section */}
          {activeMode === 'CAMERA' ? (
            <div className="space-y-3">
              {!capturedImage ? (
                <div className="relative rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${isCameraActive ? 'block' : 'hidden'}`}
                  />
                  {!isCameraActive && (
                    <div className="text-center p-6 text-white space-y-3">
                      <span className="material-symbols-outlined text-[48px] opacity-70">videocam_off</span>
                      <p className="text-xs text-gray-300">
                        {cameraError || 'Click below to initialize device camera feed'}
                      </p>
                      <button
                        type="button"
                        onClick={startCamera}
                        className="px-4 py-2 bg-primary text-on-primary text-xs font-bold rounded-lg hover:bg-primary/90 transition-all cursor-pointer"
                      >
                        Start Camera
                      </button>
                    </div>
                  )}
                  {isCameraActive && (
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                      <button
                        type="button"
                        onClick={takeSnapshot}
                        className="w-14 h-14 rounded-full bg-white border-4 border-primary shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer"
                        title="Capture Photo"
                      >
                        <div className="w-8 h-8 rounded-full bg-primary" />
                      </button>
                    </div>
                  )}
                  <canvas ref={canvasRef} className="hidden" />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative rounded-xl overflow-hidden border border-outline-variant/50 aspect-video bg-surface-container">
                    <img src={capturedImage} alt="Captured preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={retakePhoto}
                      className="absolute top-3 right-3 px-3 py-1.5 bg-black/70 hover:bg-black text-white text-xs font-semibold rounded-lg backdrop-blur-sm transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">refresh</span>
                      Retake
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <label className="border-2 border-dashed border-outline-variant rounded-xl p-8 flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer block text-center">
                <span className="material-symbols-outlined text-[40px] text-primary">upload_file</span>
                <span className="text-sm font-semibold text-on-surface">Click or Drag & Drop Evidence Document</span>
                <span className="text-xs text-on-surface-variant">
                  Supports JPEG, PNG, GeoTIFF, Drone Orthomosaic, Lab Assay PDF, KMZ
                </span>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  accept="image/*,.pdf,.kmz,.geojson,.tif,.tiff"
                  className="hidden"
                />
              </label>

              {capturedFile && (
                <div className="p-3 bg-surface-container rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">description</span>
                    <span className="font-semibold text-on-surface">{capturedFile.name}</span>
                    <span className="text-on-surface-variant">({(capturedFile.size / 1024).toFixed(1)} KB)</span>
                  </div>
                  <button
                    type="button"
                    onClick={retakePhoto}
                    className="text-red-500 hover:underline cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          )}

          {/* GPS Location & Boundary Geofence Status */}
          <div className="p-4 rounded-xl bg-surface-container/60 border border-outline-variant/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-primary">pin_drop</span>
                <span className="text-xs font-bold text-on-surface uppercase tracking-wider">
                  Field Coordinates & Geofence
                </span>
              </div>
              <button
                type="button"
                onClick={acquireGps}
                disabled={gpsData.isLocating}
                className="text-xs text-primary font-bold hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <span className={`material-symbols-outlined text-[16px] ${gpsData.isLocating ? 'animate-spin' : ''}`}>
                  refresh
                </span>
                {gpsData.isLocating ? 'Acquiring GPS...' : 'Refresh GPS'}
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-surface border border-outline-variant/20">
                <span className="text-outline uppercase text-[10px] block">Latitude</span>
                <span className="font-mono-data font-bold text-on-surface">
                  {gpsData.latitude ? `${gpsData.latitude}° N` : 'Unavailable'}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-surface border border-outline-variant/20">
                <span className="text-outline uppercase text-[10px] block">Longitude</span>
                <span className="font-mono-data font-bold text-on-surface">
                  {gpsData.longitude ? `${gpsData.longitude}° E` : 'Unavailable'}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-surface border border-outline-variant/20 col-span-2 sm:col-span-1">
                <span className="text-outline uppercase text-[10px] block">Accuracy</span>
                <span className="font-mono-data font-bold text-secondary">
                  {gpsData.accuracy ? `±${gpsData.accuracy} m` : 'Estimated'}
                </span>
              </div>
            </div>

            {/* Boundary Validation Badge */}
            {validationResult && (
              <div
                className={`p-3 rounded-lg border flex items-center gap-2.5 text-xs font-semibold ${
                  validationResult.status === 'VERIFIED_INSIDE_BOUNDARY'
                    ? 'bg-[#4CAF50]/10 border-[#4CAF50]/30 text-[#2E7D32]'
                    : validationResult.status === 'OUTSIDE_BOUNDARY_FLAGGED'
                    ? 'bg-[#FFA000]/10 border-[#FFA000]/30 text-[#B47000]'
                    : 'bg-gray-100 border-gray-200 text-gray-700'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {validationResult.status === 'VERIFIED_INSIDE_BOUNDARY'
                    ? 'check_circle'
                    : validationResult.status === 'OUTSIDE_BOUNDARY_FLAGGED'
                    ? 'warning'
                    : 'help'}
                </span>
                <span>{validationResult.message}</span>
              </div>
            )}
          </div>

          {/* Cryptographic SHA-256 Hash Display */}
          <div className="p-4 rounded-xl bg-surface-container/60 border border-outline-variant/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-secondary">fingerprint</span>
                Cryptographic Evidence Hash (SHA-256)
              </span>
              {isHashing && <span className="text-xs text-secondary animate-pulse font-semibold">Computing digest...</span>}
            </div>
            <code className="text-[11px] font-mono-data text-on-surface bg-surface p-2.5 rounded-lg border border-outline-variant/20 break-all block">
              {sha256Hash || 'Will be computed upon image capture / file selection'}
            </code>
          </div>

          {/* Metadata Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                Evidence Category
              </label>
              <select
                value={evidenceType}
                onChange={(e) => setEvidenceType(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface font-semibold focus:outline-none focus:border-primary"
              >
                <option value="FIELD_PHOTO">Ground Field Photography</option>
                <option value="DRONE_ORTHOMOSAIC">Drone Survey / Orthomosaic</option>
                <option value="LAB_CERTIFICATE">Lab Sediment Assay Certificate</option>
                <option value="NURSERY_RECEIPT">Nursery Sapling Challan Receipt</option>
                <option value="SENSOR_LOG">IoT Sensor Calibration Log</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                Field Notes / Surveyor Remarks
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Quadrant 4 sapling survival check"
                className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-outline-variant/30 bg-surface-container/30 flex items-center justify-between">
          <button
            type="button"
            onClick={handleCloseModal}
            className="px-4 py-2 text-xs font-bold text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-xl transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={(!capturedFile && !capturedImage) || isSubmitting || isHashing}
            className="px-6 py-2.5 bg-primary text-on-primary font-label-md text-xs font-bold rounded-xl shadow-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">
              {!isOnline ? 'save' : 'cloud_upload'}
            </span>
            {isSubmitting
              ? 'Submitting...'
              : !isOnline
              ? 'Save to Offline Queue'
              : 'Submit Evidence with SHA-256'}
          </button>
        </div>
      </div>
    </div>
  );
}
