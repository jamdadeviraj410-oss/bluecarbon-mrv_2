import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { createProject, saveProject, projectTypes, indianStates } from './projectsService';
import { calculatePolygonAreaHa, calculatePolygonPerimeterKm } from '../../utils/geoUtils';
import { ROUTES, ROLES } from '../../utils/constants';
import { useAuth } from '../../contexts/AuthContext';

// Curated offline presets for instant autocomplete and fallback resilience
const INDIAN_LOCATION_PRESETS = [
  { name: 'Ratnagiri, Maharashtra', state: 'Maharashtra', lat: 16.9902, lng: 73.3120 },
  { name: 'Sundarbans, West Bengal', state: 'West Bengal', lat: 21.9497, lng: 88.9006 },
  { name: 'East Godavari, Andhra Pradesh', state: 'Andhra Pradesh', lat: 16.7500, lng: 82.2500 },
  { name: 'Kutch, Gujarat', state: 'Gujarat', lat: 23.7337, lng: 69.8597 },
  { name: 'Chilika Lake, Puri, Odisha', state: 'Odisha', lat: 19.7200, lng: 85.3200 },
  { name: 'Pichavaram, Cuddalore, Tamil Nadu', state: 'Tamil Nadu', lat: 11.4289, lng: 79.7915 },
  { name: 'Alappuzha, Vembanad, Kerala', state: 'Kerala', lat: 9.4981, lng: 76.3388 },
  { name: 'Aghanashini, Uttara Kannada, Karnataka', state: 'Karnataka', lat: 14.5244, lng: 74.3211 },
  { name: 'Mandovi River, North Goa, Goa', state: 'Goa', lat: 15.4909, lng: 73.8278 },
  { name: 'South Andaman, Andaman & Nicobar', state: 'Andaman & Nicobar', lat: 11.7401, lng: 92.6586 },
  { name: 'Mumbai Coast, Maharashtra', state: 'Maharashtra', lat: 18.9800, lng: 72.8200 },
  { name: 'Thane Creek, Maharashtra', state: 'Maharashtra', lat: 19.1200, lng: 72.9800 },
  { name: 'Gulf of Khambhat, Gujarat', state: 'Gujarat', lat: 21.6500, lng: 72.2500 },
  { name: 'Bhitarkanika, Kendrapara, Odisha', state: 'Odisha', lat: 20.7167, lng: 86.8667 },
  { name: 'Kochi Backwaters, Kerala', state: 'Kerala', lat: 9.9312, lng: 76.2673 },
  { name: 'Mangalore Coastal Estuary, Karnataka', state: 'Karnataka', lat: 12.9141, lng: 74.8560 },
  { name: 'Chennai Coastal Marshes, Tamil Nadu', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707 },
  { name: 'Visakhapatnam Coast, Andhra Pradesh', state: 'Andhra Pradesh', lat: 17.6868, lng: 83.2185 },
];

const INITIAL_FORM_STATE = {
  // Step 1: Info
  name: '',
  type: '',
  organization: '',
  startDate: '',
  description: '',
  
  // Step 2: Location
  location: '',
  state: '',
  area: '',
  lat: null,
  lng: null,
  perimeter: 0,
  boundaryVertices: [],
  geoJsonBoundary: null,
  
  // Step 3: Restoration
  treeDensity: '',
  targetPlants: '',
  species: '',
  estCO2e: '',
  socBaseline: '',
  
  // Step 4: Community
  communityName: '',
  communityContact: '',
  revenueShare: '',
  localJobs: '',
  
  // Step 5: Documents
  crzClearance: '',
  pddDoc: '',
  consentDeed: '',
};

export default function CreateProjectPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [submittedProject, setSubmittedProject] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stepError, setStepError] = useState('');

  // Step 2 Map Mode: 'DRAW' | 'MARKER'
  const [mapMode, setMapMode] = useState('DRAW');
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState(() => INDIAN_LOCATION_PRESETS.slice(0, 6));
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Fresh empty form state for new project
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerGroupRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const searchContainerRef = useRef(null);

  // File upload input refs for Step 5
  const crzInputRef = useRef(null);
  const pddInputRef = useRef(null);
  const consentInputRef = useRef(null);

  const totalSteps = 6;

  const stepMeta = [
    { num: 1, title: 'Project Info', subtitle: 'Basic details & scope' },
    { num: 2, title: 'Location', subtitle: 'Geospatial boundary' },
    { num: 3, title: 'Restoration', subtitle: 'Ecological metrics' },
    { num: 4, title: 'Community', subtitle: 'Local stakeholders' },
    { num: 5, title: 'Documents', subtitle: 'Clearances & proposals' },
    { num: 6, title: 'Review', subtitle: 'Confirm & submit' },
  ];

  const handleInputChange = (field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === 'area') {
        const numArea = parseFloat(value) || 0;
        updated.estCO2e = Math.round(numArea * 127.4);
      }
      return updated;
    });
  };

  // Handle native file selection and validation for Step 5 documents
  const handleFileUpload = (field, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value so re-selecting the same file fires onChange
    e.target.value = '';

    const allowedExtensions = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'];
    const ext = file.name.split('.').pop().toLowerCase();
    const maxSizeBytes = 25 * 1024 * 1024; // 25 MB

    if (!allowedExtensions.includes(ext)) {
      setStepError(`Invalid file format (.${ext}). Accepted formats: PDF, DOC, DOCX, JPG, PNG.`);
      return;
    }

    if (file.size > maxSizeBytes) {
      setStepError(`File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds maximum 25MB limit.`);
      return;
    }

    setStepError('');
    handleInputChange(field, file.name);
  };

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Location search query handler with Nominatim & Local Fallback
  const handleLocationSearch = (query) => {
    setSearchQuery(query);
    handleInputChange('location', query);
    setSelectedIndex(-1);

    if (!query || query.trim().length === 0) {
      setSuggestions(INDIAN_LOCATION_PRESETS.slice(0, 6));
      setShowSuggestions(true);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    setIsSearching(true);

    searchTimeoutRef.current = setTimeout(async () => {
      const qLower = query.toLowerCase().trim();
      const localMatches = INDIAN_LOCATION_PRESETS.filter(
        (p) => p.name.toLowerCase().includes(qLower) || p.state.toLowerCase().includes(qLower)
      );

      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            query
          )}&countrycodes=in&limit=6&addressdetails=1`,
          {
            headers: {
              'Accept-Language': 'en-US,en;q=0.9',
            },
          }
        );

        if (res.ok) {
          const data = await res.json();
          const remoteResults = (data || []).map((item) => {
            const stateMatch =
              item.address?.state ||
              indianStates.find((st) => item.display_name.includes(st)) ||
              'Maharashtra';
            return {
              name: item.display_name.split(',').slice(0, 3).join(',').trim(),
              fullAddress: item.display_name,
              state: stateMatch,
              lat: parseFloat(item.lat),
              lng: parseFloat(item.lon),
            };
          });

          // Merge without duplicate coordinates
          const combined = [...localMatches];
          remoteResults.forEach((r) => {
            if (!combined.some((c) => Math.abs(c.lat - r.lat) < 0.05 && Math.abs(c.lng - r.lng) < 0.05)) {
              combined.push(r);
            }
          });

          setSuggestions(combined.length > 0 ? combined.slice(0, 6) : INDIAN_LOCATION_PRESETS.slice(0, 6));
          setShowSuggestions(true);
        } else {
          setSuggestions(localMatches.length > 0 ? localMatches : INDIAN_LOCATION_PRESETS.slice(0, 6));
          setShowSuggestions(true);
        }
      } catch {
        setSuggestions(localMatches.length > 0 ? localMatches : INDIAN_LOCATION_PRESETS.slice(0, 6));
        setShowSuggestions(true);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  // Select search suggestion
  const handleSelectSuggestion = (item) => {
    setShowSuggestions(false);
    setSearchQuery(item.name);

    const newLat = item.lat;
    const newLng = item.lng;
    const matchedState =
      indianStates.find((st) => st.toLowerCase() === item.state?.toLowerCase() || item.name.includes(st)) ||
      formData.state;

    // Generate scaled boundary for new location
    const scale = Math.sqrt((formData.area || 100) / 100) * 0.008;
    const newVertices = [
      [newLat + scale * 0.9, newLng - scale * 1.1],
      [newLat + scale * 1.1, newLng + scale * 0.8],
      [newLat - scale * 0.3, newLng + scale * 1.2],
      [newLat - scale * 1.1, newLng - scale * 0.2],
      [newLat - scale * 0.6, newLng - scale * 1.0],
    ];
    const newArea = calculatePolygonAreaHa(newVertices);
    const newPerimeter = calculatePolygonPerimeterKm(newVertices);

    setFormData((prev) => ({
      ...prev,
      location: item.name,
      state: matchedState,
      lat: newLat,
      lng: newLng,
      area: newArea,
      perimeter: newPerimeter,
      boundaryVertices: newVertices,
      estCO2e: Math.round(newArea * 127.4),
      geoJsonBoundary: {
        type: 'Feature',
        properties: { name: item.name },
        geometry: {
          type: 'Polygon',
          coordinates: [
            newVertices.map(([la, ln]) => [ln, la]).concat([[newVertices[0][1], newVertices[0][0]]]),
          ],
        },
      },
    }));

    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([newLat, newLng], 13, { duration: 1.0 });
    }
  };

  // Reverse geocode when marker is placed/dragged
  const reverseGeocode = async (rLat, rLng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${rLat}&lon=${rLng}&addressdetails=1`,
        { headers: { 'Accept-Language': 'en-US,en;q=0.9' } }
      );
      if (res.ok) {
        const data = await res.json();
        const address = data.address || {};
        const districtOrCity = address.county || address.city || address.town || address.village || address.state_district || 'Coastal Zone';
        const stName = address.state || indianStates.find((st) => (data.display_name || '').includes(st)) || formData.state;
        const placeLabel = `${districtOrCity}, ${stName}`;

        setFormData((prev) => ({
          ...prev,
          location: placeLabel,
          state: indianStates.includes(stName) ? stName : prev.state,
        }));
      }
    } catch {
      // Fallback silent
    }
  };

  // Initialize interactive Leaflet map instance for Step 2
  useEffect(() => {
    if (currentStep !== 2 || !mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const initialLat = formData.lat != null ? Number(formData.lat) : 19.0760;
    const initialLng = formData.lng != null ? Number(formData.lng) : 72.8777;
    const initialZoom = formData.lat != null ? 13 : 5;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: initialZoom,
      minZoom: 4,
      maxZoom: 18,
      zoomControl: false,
      attributionControl: false,
    });

    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    layerGroupRef.current = layerGroup;

    const timer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 150);

    const resizeObserver = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [currentStep]);

  // Handle map click for Drop Marker & Draw Boundary
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || currentStep !== 2) return;

    const handleMapClick = (e) => {
      const { lat: clickLat, lng: clickLng } = e.latlng;
      const precisionLat = parseFloat(clickLat.toFixed(5));
      const precisionLng = parseFloat(clickLng.toFixed(5));

      if (mapMode === 'MARKER') {
        setFormData((prev) => ({
          ...prev,
          lat: precisionLat,
          lng: precisionLng,
        }));
        reverseGeocode(precisionLat, precisionLng);
      } else if (mapMode === 'DRAW') {
        setFormData((prev) => {
          const currentVertices = prev.boundaryVertices || [];
          let updatedVertices = [...currentVertices, [precisionLat, precisionLng]];

          // If too far from existing cluster or starting fresh after clear
          if (currentVertices.length >= 8) {
            updatedVertices = [[precisionLat, precisionLng]];
          }

          const areaHa = updatedVertices.length >= 3 ? calculatePolygonAreaHa(updatedVertices) : prev.area;
          const perimeterKm = updatedVertices.length >= 2 ? calculatePolygonPerimeterKm(updatedVertices) : prev.perimeter;

          return {
            ...prev,
            lat: precisionLat,
            lng: precisionLng,
            boundaryVertices: updatedVertices,
            area: areaHa,
            perimeter: perimeterKm,
            estCO2e: Math.round(areaHa * 127.4),
            geoJsonBoundary: {
              type: 'Feature',
              properties: { name: prev.location || 'Project Boundary' },
              geometry: {
                type: 'Polygon',
                coordinates: [
                  updatedVertices.map(([la, ln]) => [ln, la]).concat([[updatedVertices[0][1], updatedVertices[0][0]]]),
                ],
              },
            },
          };
        });
      }
    };

    map.on('click', handleMapClick);

    return () => {
      map.off('click', handleMapClick);
    };
  }, [currentStep, mapMode]);

  // Render dynamic map layers (Marker, Boundary Polygon, Vertices)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup || currentStep !== 2) return;

    layerGroup.clearLayers();

    const vertices = formData.boundaryVertices || [];

    // 1. Render Boundary Polygon
    if (vertices.length >= 3) {
      const polygon = L.polygon(vertices, {
        color: '#1b6d24',
        weight: 2.5,
        dashArray: '4, 4',
        fillColor: '#88d982',
        fillOpacity: 0.35,
      }).addTo(layerGroup);

      polygon.bindTooltip(
        `<strong>${formData.location || 'Boundary'}</strong><br/>Area: ${formData.area} ha • Perimeter: ${formData.perimeter} km`,
        { sticky: true }
      );
    } else if (vertices.length === 2) {
      L.polyline(vertices, { color: '#1b6d24', weight: 2.5, dashArray: '4, 4' }).addTo(layerGroup);
    }

    // 2. Render Boundary Vertices (Interactive & Draggable)
    vertices.forEach((v, idx) => {
      const vertexMarker = L.circleMarker(v, {
        radius: 6,
        color: '#ffffff',
        weight: 2,
        fillColor: '#1b6d24',
        fillOpacity: 1,
      }).addTo(layerGroup);

      vertexMarker.bindTooltip(`Vertex #${idx + 1}`, { direction: 'top' });
    });

    // 3. Render Center / Project Marker
    if (formData.lat != null && formData.lng != null) {
      const curLat = Number(formData.lat);
      const curLng = Number(formData.lng);
      const markerIcon = L.divIcon({
        className: 'custom-project-pin',
        html: `
          <div style="
            width: 24px;
            height: 24px;
            background: #ba1a1a;
            border: 2.5px solid #ffffff;
            border-radius: 50%;
            box-shadow: 0 3px 10px rgba(0,0,0,0.4);
            cursor: grab;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="width: 6px; height: 6px; background: #ffffff; border-radius: 50%;"></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const centerMarker = L.marker([curLat, curLng], { icon: markerIcon, draggable: true }).addTo(layerGroup);
      
      centerMarker.bindPopup(`
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px;">
          <strong style="color: #006a6a;">${formData.location || 'Project Location'}</strong><br/>
          Lat: ${curLat}°N, Lng: ${curLng}°E<br/>
          <span style="color: #64748b;">(Drag to reposition marker)</span>
        </div>
      `);

      centerMarker.on('dragend', (e) => {
        const newPos = e.target.getLatLng();
        const nLat = parseFloat(newPos.lat.toFixed(5));
        const nLng = parseFloat(newPos.lng.toFixed(5));
        setFormData((prev) => ({
          ...prev,
          lat: nLat,
          lng: nLng,
        }));
        reverseGeocode(nLat, nLng);
      });
    }
  }, [currentStep, formData.lat, formData.lng, formData.boundaryVertices, formData.area, formData.perimeter]);

  const validateStep = (step) => {
    // Step 1: Project Information
    if (step === 1) {
      if (!formData.name?.trim()) {
        return 'Please enter the Project Name.';
      }
      if (!formData.type) {
        return 'Please select a Restoration Type.';
      }
      if (!formData.organization?.trim()) {
        return 'Please enter the Implementing Organization.';
      }
      if (!formData.startDate) {
        return 'Please select a Start Date.';
      }
      if (!formData.description?.trim()) {
        return 'Please provide a Project Description.';
      }
    }

    // Step 2: Location & Boundary
    if (step === 2) {
      if (!formData.location?.trim()) {
        return 'Please search or specify a Project Location.';
      }
      if (!formData.state) {
        return 'Please select a State.';
      }
      if (formData.lat == null || formData.lng == null || isNaN(formData.lat) || isNaN(formData.lng)) {
        return 'Please set a valid geospatial location marker on the map.';
      }
      if (!formData.area || Number(formData.area) <= 0) {
        return 'Please draw or specify a valid project boundary area (> 0 ha).';
      }
      if (!formData.boundaryVertices || formData.boundaryVertices.length < 3) {
        return 'Please complete the project boundary polygon with at least 3 vertices on the map.';
      }
      if (!formData.estCO2e || Number(formData.estCO2e) <= 0) {
        return 'Estimated CO2e sequestration must be greater than 0.';
      }
    }

    // Step 3: Restoration & Ecological Metrics
    if (step === 3) {
      if (formData.treeDensity === '' || formData.treeDensity == null || Number(formData.treeDensity) <= 0) {
        return 'Please specify a valid Tree Planting Density (> 0 stems/ha).';
      }
      if (formData.targetPlants === '' || formData.targetPlants == null || Number(formData.targetPlants) <= 0) {
        return 'Please specify Total Seedlings to Plant (> 0).';
      }
      if (!formData.species?.trim()) {
        return 'Please specify Native Plant Species.';
      }
      if (formData.socBaseline === '' || formData.socBaseline == null || Number(formData.socBaseline) <= 0) {
        return 'Please enter Baseline Soil Organic Carbon (SOC %).';
      }
    }

    // Step 4: Community & Social Safeguards
    if (step === 4) {
      if (!formData.communityName?.trim()) {
        return 'Please enter the Panchayat or Community Council Name.';
      }
      if (!formData.communityContact?.trim()) {
        return 'Please enter the Community Representative Contact.';
      }
      if (formData.revenueShare === '' || formData.revenueShare == null || Number(formData.revenueShare) <= 0) {
        return 'Please enter the Carbon Revenue Community Share (%).';
      }
      if (formData.localJobs === '' || formData.localJobs == null || Number(formData.localJobs) <= 0) {
        return 'Please enter the number of Direct Local Jobs Created.';
      }
    }

    // Step 5: Clearances & Documentation
    if (step === 5) {
      if (!formData.crzClearance) {
        return 'Please attach the CRZ & Forest Department Clearance document.';
      }
      if (!formData.pddDoc) {
        return 'Please attach the Project Design Document (PDD).';
      }
      if (!formData.consentDeed) {
        return 'Please attach the Gram Panchayat FPIC resolution document.';
      }
    }

    return null;
  };

  const handleNext = () => {
    setStepError('');

    const error = validateStep(currentStep);
    if (error) {
      setStepError(error);
      return;
    }

    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setStepError('');
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Validate all preceding steps before final submit
    for (let s = 1; s <= 5; s++) {
      const error = validateStep(s);
      if (error) {
        setCurrentStep(s);
        setStepError(error);
        return;
      }
    }

    try {
      setIsSubmitting(true);
      setStepError('');
      const newPrj = await saveProject(formData);
      setSubmittedProject(newPrj);
    } catch (err) {
      console.error('Project creation error:', err);
      try {
        const localPrj = createProject(formData);
        setSubmittedProject(localPrj);
      } catch (fallbackErr) {
        setStepError(err.message || 'Failed to submit project. Please verify inputs and try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col w-full h-[calc(100vh-var(--topbar-height,64px))] bg-surface font-body-md text-on-surface overflow-hidden">
      <div className="flex flex-1 overflow-hidden h-full">
        {/* Left Sidebar: Step Indicator */}
        <div className="w-80 bg-surface-container-low flex flex-col pt-8 px-6 shadow-sm z-10 hidden lg:flex border-r border-outline-variant/30">
          <h2 className="font-headline-md text-primary mb-6">New Project</h2>
          
          <nav className="flex flex-col gap-6">
            {stepMeta.map((s, index) => {
              const isCompleted = s.num < currentStep;
              const isCurrent = s.num === currentStep;

              return (
                <div
                  key={s.num}
                  onClick={() => s.num < currentStep && setCurrentStep(s.num)}
                  className={`flex items-start gap-4 relative group ${
                    isCompleted ? 'cursor-pointer' : isCurrent ? 'cursor-default' : 'opacity-50 cursor-not-allowed'
                  }`}
                >
                  {/* Vertical Connector Line */}
                  {index < stepMeta.length - 1 && (
                    <div
                      className={`absolute left-[15px] top-[32px] bottom-[-24px] w-[2px] transition-colors ${
                        isCompleted ? 'bg-primary' : 'bg-outline-variant'
                      }`}
                    ></div>
                  )}

                  {/* Step Number Circle */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${
                      isCompleted
                        ? 'bg-primary text-on-primary'
                        : isCurrent
                        ? 'bg-primary text-on-primary shadow-md scale-110'
                        : 'bg-surface-variant text-on-surface-variant'
                    }`}
                  >
                    {isCompleted ? (
                      <span className="material-symbols-outlined text-[16px]">check</span>
                    ) : (
                      <span className="font-label-md text-xs">{s.num}</span>
                    )}
                  </div>

                  {/* Step Info */}
                  <div className="pt-0.5">
                    <div
                      className={`font-title-md text-sm ${
                        isCurrent ? 'text-primary font-semibold' : 'text-on-surface'
                      }`}
                    >
                      {s.title}
                    </div>
                    <div className="font-body-md text-on-surface-variant text-xs">{s.subtitle}</div>
                  </div>
                </div>
              );
            })}
          </nav>

          {/* Draft Save Badge at Bottom */}
          <div className="mt-auto pb-8">
            <div className="bg-primary-container/10 p-3.5 rounded-xl flex items-center gap-3 border border-primary-container/20">
              <span className="material-symbols-outlined text-primary text-[20px]">info</span>
              <p className="font-body-md text-xs text-on-surface-variant">
                Your progress is automatically saved as a draft.
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col bg-surface relative overflow-y-auto">
          {/* Top Progress Bar */}
          <div className="w-full h-1 bg-surface-variant absolute top-0 left-0 z-20">
            <div
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            ></div>
          </div>

          <div className="flex-1 p-4 sm:p-6 lg:p-10 max-w-4xl mx-auto w-full flex flex-col">
            {/* Inline Step Validation Error Message */}
            {stepError && (
              <div className="mb-4 p-3 rounded-xl bg-error/10 border border-error/30 text-error text-xs font-title-md flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                <span>{stepError}</span>
              </div>
            )}

            {/* STEP 1: Project Information */}
            {currentStep === 1 && (
              <div className="flex flex-col w-full">
                <div className="mb-6">
                  <h1 className="font-headline-lg text-primary mb-1.5">Project Information</h1>
                  <p className="font-body-lg text-on-surface-variant">
                    Define the basic parameters and scope of your coastal restoration initiative.
                  </p>
                </div>

                <div className="bg-surface-container-lowest rounded-2xl shadow-sm p-6 sm:p-8 flex flex-col gap-5 border border-outline-variant/30">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-md text-xs text-on-surface uppercase">
                        Project Name <span className="text-error">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="e.g., Sundarbans Mangrove Revival"
                        className="px-4 py-2.5 bg-surface rounded-xl font-body-md text-on-surface border border-outline-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-md text-xs text-on-surface uppercase">
                        Restoration Type <span className="text-error">*</span>
                      </label>
                      <select
                        value={formData.type}
                        onChange={(e) => handleInputChange('type', e.target.value)}
                        className="w-full px-4 py-2.5 bg-surface rounded-xl font-body-md text-on-surface border border-outline-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm cursor-pointer"
                      >
                        <option value="">Select Restoration Type...</option>
                        {projectTypes.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-md text-xs text-on-surface uppercase">
                        Implementing Organization
                      </label>
                      <input
                        type="text"
                        value={formData.organization}
                        onChange={(e) => handleInputChange('organization', e.target.value)}
                        placeholder="Organization name"
                        className="px-4 py-2.5 bg-surface rounded-xl font-body-md text-on-surface border border-outline-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-md text-xs text-on-surface uppercase">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => handleInputChange('startDate', e.target.value)}
                        className="px-4 py-2.5 bg-surface rounded-xl font-body-md text-on-surface border border-outline-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 mt-2">
                    <label className="font-label-md text-xs text-on-surface uppercase">
                      Project Description
                    </label>
                    <textarea
                      rows={4}
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Provide a detailed overview of the project objectives, methodology, and expected ecological outcomes..."
                      className="w-full px-4 py-2.5 bg-surface rounded-xl font-body-md text-on-surface border border-outline-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm resize-none"
                    ></textarea>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Location & Boundary */}
            {currentStep === 2 && (
              <div className="flex flex-col w-full">
                <div className="mb-6">
                  <h1 className="font-headline-lg text-primary mb-1.5">Location & Boundary</h1>
                  <p className="font-body-lg text-on-surface-variant">
                    Define the geospatial boundary and geographic zone of the restoration area.
                  </p>
                </div>

                <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden flex flex-col">
                  {/* Toolbar */}
                  <div className="bg-surface-container-low px-4 py-3 flex items-center justify-between border-b border-outline-variant/30 z-[500] relative">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setMapMode('DRAW')}
                        className={`px-3 py-1.5 rounded-lg font-title-md text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                          mapMode === 'DRAW'
                            ? 'bg-primary text-on-primary shadow-sm font-semibold'
                            : 'bg-surface hover:bg-surface-variant text-on-surface border border-outline-variant/40'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">polyline</span>
                        <span>Draw Boundary</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setMapMode('MARKER')}
                        className={`px-3 py-1.5 rounded-lg font-title-md text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                          mapMode === 'MARKER'
                            ? 'bg-primary text-on-primary shadow-sm font-semibold'
                            : 'bg-surface hover:bg-surface-variant text-on-surface border border-outline-variant/40'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">location_on</span>
                        <span>Drop Marker</span>
                      </button>
                    </div>

                    {/* Location Autocomplete Input */}
                    <div ref={searchContainerRef} className="relative w-64 hidden sm:block z-[600]">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                        {isSearching ? 'sync' : 'search'}
                      </span>
                      <input
                        type="text"
                        value={searchQuery || formData.location}
                        onChange={(e) => handleLocationSearch(e.target.value)}
                        onFocus={() => {
                          if (!suggestions || suggestions.length === 0) {
                            setSuggestions(INDIAN_LOCATION_PRESETS.slice(0, 6));
                          }
                          setShowSuggestions(true);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            setShowSuggestions(false);
                          } else if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
                          } else if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
                          } else if (e.key === 'Enter' && selectedIndex >= 0 && suggestions[selectedIndex]) {
                            e.preventDefault();
                            handleSelectSuggestion(suggestions[selectedIndex]);
                          }
                        }}
                        placeholder="Search location..."
                        className="w-full pl-9 pr-3 py-1.5 bg-surface rounded-lg font-body-md text-on-surface text-xs border border-outline-variant/40 focus:outline-none focus:ring-1 focus:ring-primary"
                      />

                      {/* Suggestions Dropdown */}
                      {showSuggestions && suggestions.length > 0 && (
                        <div className="absolute left-0 right-0 top-full mt-1 bg-surface-container-lowest border border-outline-variant/40 rounded-xl shadow-2xl z-[1000] overflow-hidden text-xs max-h-60 overflow-y-auto">
                          {suggestions.map((s, idx) => (
                            <div
                              key={idx}
                              onClick={() => handleSelectSuggestion(s)}
                              onMouseEnter={() => setSelectedIndex(idx)}
                              className={`p-2.5 cursor-pointer border-b border-outline-variant/15 last:border-none flex items-center gap-2 transition-colors ${
                                selectedIndex === idx ? 'bg-primary/15' : 'hover:bg-primary/10'
                              }`}
                            >
                              <span className="material-symbols-outlined text-primary text-[16px] shrink-0">
                                location_on
                              </span>
                              <div className="truncate flex-1">
                                <div className="font-semibold text-on-surface truncate">{s.name}</div>
                                <div className="text-[10px] text-on-surface-variant font-mono-data">
                                  {s.state} • {Number(s.lat).toFixed(2)}°N, {Number(s.lng).toFixed(2)}°E
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Interactive Leaflet Map Area */}
                  <div className="h-80 relative bg-[#0b1c30] overflow-hidden flex items-center justify-center">
                    <div ref={mapContainerRef} className="w-full h-full z-10" />

                    {/* Overlay Stats Box */}
                    <div className="absolute top-4 right-4 bg-surface-container-lowest/90 backdrop-blur-md p-4 rounded-xl shadow-md w-60 border border-outline-variant/30 flex flex-col gap-2 z-[400] pointer-events-auto">
                      <h3 className="font-title-md text-xs text-on-surface flex items-center gap-1.5 border-b border-outline-variant/20 pb-1.5">
                        <span className="material-symbols-outlined text-primary text-[16px]">layers</span>
                        Boundary Stats
                      </h3>
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-label-md text-on-surface-variant">TOTAL AREA</span>
                        <span className="font-mono-data text-primary font-bold text-sm">
                          {formData.area ? `${formData.area} ha` : '—'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-label-md text-on-surface-variant">PERIMETER</span>
                        <span className="font-mono-data text-on-surface">
                          {formData.perimeter ? `${formData.perimeter} km` : '—'}
                        </span>
                      </div>
                      <div className="mt-1 pt-1.5 border-t border-outline-variant/20 text-[10px] font-mono-data text-on-surface-variant text-right">
                        {formData.lat != null && formData.lng != null
                          ? `${Number(formData.lat).toFixed(4)}°N, ${Number(formData.lng).toFixed(4)}°E`
                          : 'No marker placed'}
                      </div>
                    </div>
                  </div>

                  {/* Input Fields for Location */}
                  <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 bg-surface-container-lowest">
                    <div>
                      <label className="font-label-md text-xs text-on-surface uppercase">State</label>
                      <select
                        value={formData.state}
                        onChange={(e) => handleInputChange('state', e.target.value)}
                        className="w-full mt-1 px-3 py-2 bg-surface rounded-xl border border-outline-variant/50 text-xs font-title-md cursor-pointer"
                      >
                        <option value="">Select State...</option>
                        {indianStates.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="font-label-md text-xs text-on-surface uppercase">Total Area (ha)</label>
                      <input
                        type="number"
                        value={formData.area}
                        onChange={(e) => handleInputChange('area', parseFloat(e.target.value) || 0)}
                        placeholder="0.0"
                        className="w-full mt-1 px-3 py-2 bg-surface rounded-xl border border-outline-variant/50 text-xs font-mono-data"
                      />
                    </div>
                    <div>
                      <label className="font-label-md text-xs text-on-surface uppercase">Est. CO2e (tonnes)</label>
                      <input
                        type="number"
                        value={formData.estCO2e}
                        onChange={(e) => handleInputChange('estCO2e', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="w-full mt-1 px-3 py-2 bg-surface rounded-xl border border-outline-variant/50 text-xs font-mono-data text-primary font-bold"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Restoration Metrics */}
            {currentStep === 3 && (
              <div className="flex flex-col w-full">
                <div className="mb-6">
                  <h1 className="font-headline-lg text-primary mb-1.5">Restoration & Ecological Metrics</h1>
                  <p className="font-body-lg text-on-surface-variant">
                    Define planting density, target species, and baseline carbon parameters.
                  </p>
                </div>

                <div className="bg-surface-container-lowest rounded-2xl shadow-sm p-6 sm:p-8 flex flex-col gap-5 border border-outline-variant/30">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-md text-xs text-on-surface uppercase">
                        Tree Planting Density (stems/ha)
                      </label>
                      <input
                        type="number"
                        value={formData.treeDensity}
                        onChange={(e) => handleInputChange('treeDensity', parseInt(e.target.value) || '')}
                        placeholder="e.g. 1800"
                        className="px-4 py-2.5 bg-surface rounded-xl font-mono-data text-on-surface border border-outline-variant/50 text-sm"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-md text-xs text-on-surface uppercase">
                        Total Seedlings to Plant
                      </label>
                      <input
                        type="number"
                        value={formData.targetPlants}
                        onChange={(e) => handleInputChange('targetPlants', parseInt(e.target.value) || '')}
                        placeholder="e.g. 260000"
                        className="px-4 py-2.5 bg-surface rounded-xl font-mono-data text-on-surface border border-outline-variant/50 text-sm"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5 md:col-span-2">
                      <label className="font-label-md text-xs text-on-surface uppercase">
                        Native Plant Species (comma separated)
                      </label>
                      <input
                        type="text"
                        value={formData.species}
                        onChange={(e) => handleInputChange('species', e.target.value)}
                        placeholder="e.g. Avicennia marina, Rhizophora mucronata, Ceriops tagal"
                        className="px-4 py-2.5 bg-surface rounded-xl font-body-md text-on-surface border border-outline-variant/50 text-sm"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-md text-xs text-on-surface uppercase">
                        Baseline Soil Organic Carbon (SOC %)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.socBaseline}
                        onChange={(e) => handleInputChange('socBaseline', parseFloat(e.target.value) || '')}
                        placeholder="e.g. 2.8"
                        className="px-4 py-2.5 bg-surface rounded-xl font-mono-data text-on-surface border border-outline-variant/50 text-sm"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-md text-xs text-on-surface uppercase">
                        Verification Standard
                      </label>
                      <input
                        type="text"
                        disabled
                        value="Verra VM0033 Methodology (Blue Carbon)"
                        className="px-4 py-2.5 bg-surface-container rounded-xl font-body-md text-on-surface-variant text-sm border border-outline-variant/30"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Community Stakeholders */}
            {currentStep === 4 && (
              <div className="flex flex-col w-full">
                <div className="mb-6">
                  <h1 className="font-headline-lg text-primary mb-1.5">Community & Social Safeguards</h1>
                  <p className="font-body-lg text-on-surface-variant">
                    Record local Gram Panchayat engagement and equitable benefit-sharing plans.
                  </p>
                </div>

                <div className="bg-surface-container-lowest rounded-2xl shadow-sm p-6 sm:p-8 flex flex-col gap-5 border border-outline-variant/30">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="flex flex-col gap-1.5 md:col-span-2">
                      <label className="font-label-md text-xs text-on-surface uppercase">
                        Panchayat / Community Council Name
                      </label>
                      <input
                        type="text"
                        value={formData.communityName}
                        onChange={(e) => handleInputChange('communityName', e.target.value)}
                        placeholder="e.g. Ratnagiri Coastal Fisherfolk Co-operative"
                        className="px-4 py-2.5 bg-surface rounded-xl font-body-md text-on-surface border border-outline-variant/50 text-sm"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-md text-xs text-on-surface uppercase">
                        Community Representative Contact
                      </label>
                      <input
                        type="text"
                        value={formData.communityContact}
                        onChange={(e) => handleInputChange('communityContact', e.target.value)}
                        placeholder="e.g. Suresh Patil (+91 98201 54321)"
                        className="px-4 py-2.5 bg-surface rounded-xl font-body-md text-on-surface border border-outline-variant/50 text-sm"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-md text-xs text-on-surface uppercase">
                        Carbon Revenue Community Share (%)
                      </label>
                      <input
                        type="number"
                        value={formData.revenueShare}
                        onChange={(e) => handleInputChange('revenueShare', parseInt(e.target.value) || '')}
                        placeholder="35"
                        className="px-4 py-2.5 bg-surface rounded-xl font-mono-data text-primary font-bold border border-outline-variant/50 text-sm"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-md text-xs text-on-surface uppercase">
                        Direct Local Jobs Created
                      </label>
                      <input
                        type="number"
                        value={formData.localJobs}
                        onChange={(e) => handleInputChange('localJobs', parseInt(e.target.value) || '')}
                        placeholder="120"
                        className="px-4 py-2.5 bg-surface rounded-xl font-mono-data text-on-surface border border-outline-variant/50 text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: Clearances & Documents */}
            {currentStep === 5 && (
              <div className="flex flex-col w-full">
                <div className="mb-6">
                  <h1 className="font-headline-lg text-primary mb-1.5">Clearances & Documentation</h1>
                  <p className="font-body-lg text-on-surface-variant">
                    Attach required government environmental clearances and project design documents.
                  </p>
                </div>

                <div className="bg-surface-container-lowest rounded-2xl shadow-sm p-6 sm:p-8 flex flex-col gap-5 border border-outline-variant/30">
                  <div className="space-y-4">
                    {/* Hidden Native File Inputs */}
                    <input
                      type="file"
                      ref={crzInputRef}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileUpload('crzClearance', e)}
                    />
                    <input
                      type="file"
                      ref={pddInputRef}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileUpload('pddDoc', e)}
                    />
                    <input
                      type="file"
                      ref={consentInputRef}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileUpload('consentDeed', e)}
                    />

                    {/* Card 1: CRZ Clearance */}
                    <div
                      onClick={() => crzInputRef.current?.click()}
                      className="p-4 rounded-xl border border-dashed border-outline-variant bg-surface flex items-center justify-between cursor-pointer hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary text-[28px]">
                          description
                        </span>
                        <div>
                          <div className="font-title-md text-sm text-on-surface">
                            CRZ & Forest Department Clearance <span className="text-error">*</span>
                          </div>
                          <div className="text-xs font-mono-data text-on-surface-variant">
                            {formData.crzClearance ? `${formData.crzClearance} (Uploaded)` : 'Click to attach / upload clearance'}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          crzInputRef.current?.click();
                        }}
                        className={`text-xs font-mono-data px-2.5 py-1 rounded transition-colors cursor-pointer ${
                          formData.crzClearance ? 'text-secondary bg-[#e8f5e9]' : 'text-on-surface-variant bg-surface-container hover:bg-surface-container-high'
                        }`}
                      >
                        {formData.crzClearance ? 'Attached' : 'Attach'}
                      </button>
                    </div>

                    {/* Card 2: PDD */}
                    <div
                      onClick={() => pddInputRef.current?.click()}
                      className="p-4 rounded-xl border border-dashed border-outline-variant bg-surface flex items-center justify-between cursor-pointer hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary text-[28px]">
                          picture_as_pdf
                        </span>
                        <div>
                          <div className="font-title-md text-sm text-on-surface">
                            Project Design Document (PDD) <span className="text-error">*</span>
                          </div>
                          <div className="text-xs font-mono-data text-on-surface-variant">
                            {formData.pddDoc ? `${formData.pddDoc} (Uploaded)` : 'Click to attach / upload PDD document'}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          pddInputRef.current?.click();
                        }}
                        className={`text-xs font-mono-data px-2.5 py-1 rounded transition-colors cursor-pointer ${
                          formData.pddDoc ? 'text-secondary bg-[#e8f5e9]' : 'text-on-surface-variant bg-surface-container hover:bg-surface-container-high'
                        }`}
                      >
                        {formData.pddDoc ? 'Attached' : 'Attach'}
                      </button>
                    </div>

                    {/* Card 3: FPIC Consent Deed */}
                    <div
                      onClick={() => consentInputRef.current?.click()}
                      className="p-4 rounded-xl border border-dashed border-outline-variant bg-surface flex items-center justify-between cursor-pointer hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary text-[28px]">
                          approval
                        </span>
                        <div>
                          <div className="font-title-md text-sm text-on-surface">
                            Gram Panchayat Free & Prior Informed Consent (FPIC) <span className="text-error">*</span>
                          </div>
                          <div className="text-xs font-mono-data text-on-surface-variant">
                            {formData.consentDeed ? `${formData.consentDeed} (Uploaded)` : 'Click to attach / upload FPIC resolution'}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          consentInputRef.current?.click();
                        }}
                        className={`text-xs font-mono-data px-2.5 py-1 rounded transition-colors cursor-pointer ${
                          formData.consentDeed ? 'text-secondary bg-[#e8f5e9]' : 'text-on-surface-variant bg-surface-container hover:bg-surface-container-high'
                        }`}
                      >
                        {formData.consentDeed ? 'Attached' : 'Attach'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 6: Review & Submit */}
            {currentStep === 6 && (
              <div className="flex flex-col w-full">
                <div className="mb-6">
                  <h1 className="font-headline-lg text-primary mb-1.5">Review & Confirm</h1>
                  <p className="font-body-lg text-on-surface-variant">
                    Please verify all project details prior to registration on the BlueCarbon MRV ledger.
                  </p>
                </div>

                <div className="bg-surface-container-lowest rounded-2xl shadow-sm p-6 sm:p-8 flex flex-col gap-6 border border-outline-variant/30">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div className="p-4 bg-surface rounded-xl border border-outline-variant/30">
                      <div className="text-xs font-label-md text-on-surface-variant uppercase mb-1">
                        Project Name
                      </div>
                      <div className="font-title-md text-primary font-semibold">
                        {formData.name || '—'}
                      </div>
                    </div>

                    <div className="p-4 bg-surface rounded-xl border border-outline-variant/30">
                      <div className="text-xs font-label-md text-on-surface-variant uppercase mb-1">
                        Restoration Type
                      </div>
                      <div className="font-title-md text-on-surface font-semibold">{formData.type || '—'}</div>
                    </div>

                    <div className="p-4 bg-surface rounded-xl border border-outline-variant/30">
                      <div className="text-xs font-label-md text-on-surface-variant uppercase mb-1">
                        Location & Area
                      </div>
                      <div className="font-title-md text-on-surface">
                        {formData.location ? `${formData.location} • ` : ''}<strong className="font-mono-data">{formData.area ? `${formData.area} ha` : '—'}</strong>
                      </div>
                    </div>

                    <div className="p-4 bg-surface rounded-xl border border-outline-variant/30">
                      <div className="text-xs font-label-md text-on-surface-variant uppercase mb-1">
                        Est. Sequestration
                      </div>
                      <div className="font-headline-md text-primary font-bold">
                        {formData.estCO2e ? `${formData.estCO2e} ` : '0 '}<span className="text-xs font-normal">tCO2e</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-surface-container-low rounded-xl text-xs text-on-surface-variant space-y-2 border border-outline-variant/20">
                    <div className="font-semibold text-on-surface flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-secondary">verified</span>
                      Regulatory Declaration
                    </div>
                    <p>
                      By submitting this registration, you certify that all geospatial boundaries,
                      ecological baseline metrics, and stakeholder agreements conform to national coastal
                      wetland governance protocols.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Footer / Navigation Buttons */}
            <div className="mt-8 pt-6 border-t border-outline-variant/30 flex items-center justify-between">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-6 py-2.5 rounded-xl font-title-md text-primary border border-primary hover:bg-primary/5 transition-colors text-sm"
                >
                  Back
                </button>
              ) : (
                <div></div>
              )}

              {currentStep < totalSteps ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-8 py-2.5 rounded-xl font-title-md bg-primary text-on-primary hover:bg-primary-container transition-all flex items-center gap-2 text-sm shadow-sm ml-auto"
                >
                  <span>Next Step</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-8 py-2.5 rounded-xl font-title-md bg-secondary text-white hover:bg-[#14521b] transition-all flex items-center gap-2 text-sm shadow-sm ml-auto disabled:opacity-50 cursor-pointer"
                >
                  <span>{isSubmitting ? 'Registering...' : 'Submit Registration'}</span>
                  <span className="material-symbols-outlined text-[18px]">{isSubmitting ? 'sync' : 'verified'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Success Dialog Overlay rendered at document.body for robust centering */}
      {submittedProject && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface-container-lowest p-6 sm:p-8 md:p-10 rounded-2xl shadow-2xl w-full max-w-lg min-w-[320px] sm:min-w-[440px] text-center flex flex-col items-center border border-outline-variant/30 my-auto relative">
            <div className="w-20 h-20 bg-secondary-container rounded-full flex items-center justify-center mb-6 shrink-0">
              <span className="material-symbols-outlined text-[40px] text-on-secondary-container">
                check_circle
              </span>
            </div>
            <h2 className="font-headline-md text-on-surface mb-2 font-bold">Project Registered</h2>
            <p className="font-body-md text-on-surface-variant mb-6 text-sm text-center w-full leading-relaxed px-2">
              Your restoration project has been successfully submitted to the registry pending initial verification.
            </p>
            <div className="bg-surface p-4 rounded-xl w-full mb-6 border border-outline-variant/30">
              <div className="font-label-md text-on-surface-variant mb-1 text-xs uppercase tracking-wider">REGISTRY ID</div>
              <div className="font-mono-data text-primary text-lg font-bold tracking-wider">
                {submittedProject.id || submittedProject.project_code}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <button
                type="button"
                onClick={() => {
                  const target = user?.role === ROLES.COMMUNITY
                    ? (ROUTES.COMMUNITY_PROJECTS || '/community/projects')
                    : (user?.role === ROLES.NGO || user?.role === ROLES.PANCHAYAT || user?.role === ROLES.PROJECT_MANAGER)
                    ? (ROUTES.ORG_PROJECTS || '/organization/projects')
                    : (ROUTES.ADMIN_PROJECTS || '/admin/projects');
                  navigate(target);
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-primary text-on-primary font-title-md text-sm hover:bg-primary-container transition-colors shadow-sm cursor-pointer"
              >
                View Projects
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = user?.role === ROLES.COMMUNITY
                    ? (ROUTES.COMMUNITY_DASHBOARD || '/community/dashboard')
                    : (user?.role === ROLES.NGO || user?.role === ROLES.PANCHAYAT || user?.role === ROLES.PROJECT_MANAGER)
                    ? (ROUTES.ORG_DASHBOARD || '/organization/dashboard')
                    : (ROUTES.ADMIN_DASHBOARD || '/admin/dashboard');
                  navigate(target);
                }}
                className="flex-1 py-3 px-4 rounded-xl border border-primary text-primary font-title-md text-sm hover:bg-primary/5 transition-colors cursor-pointer"
              >
                Dashboard
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
