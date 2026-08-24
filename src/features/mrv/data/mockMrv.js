export const MRV_DATA = {
  projectDetails: {
    id: "M-78392-BD",
    name: "Sundarbans Sector B-14 Restoration",
    type: "Mangrove",
    status: "In Review",
  },
  imageryReconciliation: {
    resolution: "0.5m/px",
    aiConfidence: "98.4%",
    description: "Computer vision models confirm the uploaded drone imagery matches the spatial coordinates and geographical features of the baseline satellite sector."
  },
  claimedMetrics: {
    carbonSequestration: "4,250",
    restorationArea: "185.4",
    treeDensity: "2,100"
  },
  protocolChecklist: [
    {
      id: "v4.2-1",
      title: "Geospatial Boundary Validated",
      description: "KML overlaps baseline without gaps.",
      status: "verified"
    },
    {
      id: "v4.2-2",
      title: "Species Diversity Verified",
      description: "AI confirms >3 endemic mangrove species.",
      status: "verified"
    },
    {
      id: "v4.2-3",
      title: "Ground Truth Data Matching",
      description: "Awaiting correlation with sensor log #892.",
      status: "pending"
    },
    {
      id: "v4.2-4",
      title: "Permanence Buffer Calculated",
      description: "Requires manual auditor sign-off.",
      status: "pending"
    }
  ],
  workspace: {
    id: "PRJ-2023-089",
    name: "Verification Workspace: Sundarbans Sector B-14",
    status: "Awaiting Verification",
    totalArea: "1,240 ha",
    sensorStatus: "24/24 Active",
    droneData: {
      flightDate: "Oct 12, 2023",
      resolution: "0.5m / pixel",
      imageCount: "450 Captures",
      coverage: "100% Validated"
    },
    aiAnalysis: {
      status: "Verified",
      description: "Computer vision models confirm 98.4% correlation between claimed plantation boundary and visible canopy cover."
    },
    auditTrail: [
      { step: "Data Submitted", date: "Oct 15, 2023", actor: "System", status: "completed" },
      { step: "Automated Validation", date: "Oct 15, 2023", actor: "MRV Engine v2.1", status: "completed" },
      { step: "Field Evidence Checked", status: "In Review", assigner: "Admin" },
      { step: "Drone Evidence Checked", status: "Pending" }
    ],
    verificationSummary: {
      confidenceScore: "98.2%",
      evidenceCompleteness: "100%",
      estimatedYield: "14,200",
      hash: "0x8f7a...3b2c"
    }
  },
  uploadEvidence: {
    currentProject: "Maharashtra Mangrove Restoration",
    validationSummary: {
      total: 1248,
      valid: 1240,
      invalid: 6,
      duplicates: 2
    },
    uploads: [
      { name: "field_survey_siteA_photos.zip", size: "42.5 MB", status: "Validated" },
      { name: "drone_ortho_maharashtra.tif", size: "156 MB", status: "Uploading... 65%" }
    ],
    checklist: [
      { id: "c1", title: "Field Observation CSV", checked: true },
      { id: "c2", title: "Drone Imagery (Optional)", checked: false },
      { id: "c3", title: "Sensor Telemetry (Optional)", checked: false },
      { id: "c4", title: "Project Metadata Document", checked: true }
    ]
  }
};
