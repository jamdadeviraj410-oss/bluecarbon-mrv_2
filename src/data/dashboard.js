/**
 * Mock dashboard data — extracted from Stitch NCCR Admin Dashboard design
 * Replace with Supabase queries later
 */

export const dashboardStats = [
  {
    id: 'active-projects',
    label: 'Active Projects',
    value: 342,
    trend: 12,
    trendDirection: 'up',
    icon: 'forest',
    accentColor: 'secondary',
  },
  {
    id: 'area-restored',
    label: 'Area Restored (ha)',
    value: 24500,
    trend: 8,
    trendDirection: 'up',
    icon: 'map',
    accentColor: 'primary',
  },
  {
    id: 'co2e-sequestered',
    label: 'Est. CO2e (tCO2e)',
    value: 1200000,
    trend: 15,
    trendDirection: 'up',
    icon: 'co2',
    accentColor: 'tertiary',
  },
  {
    id: 'verified-credits',
    label: 'Verified Credits',
    value: 850000,
    trend: 10,
    trendDirection: 'up',
    icon: 'verified',
    accentColor: 'on-tertiary-container',
  },
  {
    id: 'awaiting-verification',
    label: 'Awaiting Verification',
    value: 18,
    trend: 5,
    trendDirection: 'down',
    icon: 'pending_actions',
    accentColor: 'error',
  },
  {
    id: 'registered-orgs',
    label: 'Registered Orgs',
    value: 42,
    trend: 2,
    trendDirection: 'up',
    icon: 'corporate_fare',
    accentColor: 'on-primary-fixed-variant',
  },
];

export const recentActivity = [
  {
    id: 'act-1',
    title: 'New project registered',
    description: 'Sundarbans West Reserve',
    time: '2 hrs ago',
    icon: 'add',
    iconColor: 'primary',
  },
  {
    id: 'act-2',
    title: 'Drone data submitted',
    description: 'Godavari Delta Sector 4',
    time: '5 hrs ago',
    icon: 'sensors',
    iconColor: 'on-tertiary-container',
  },
  {
    id: 'act-3',
    title: 'Carbon credits issued',
    description: 'Kutch Mangrove B-2 (Block #8492)',
    time: '1 day ago',
    icon: 'workspace_premium',
    iconColor: 'secondary',
  },
];

export const verificationQueue = [
  {
    id: 'PRJ-2023-089',
    name: 'Mangrove Regen Phase 3',
    organization: 'EcoTrust India',
    location: 'West Bengal',
    submitted: '2023-10-12',
    estCO2e: 14200,
    status: 'Verified',
  },
  {
    id: 'PRJ-2023-142',
    name: 'Godavari Estuary Restore',
    organization: 'Coastal Watch NGO',
    location: 'Andhra Pradesh',
    submitted: '2023-10-18',
    estCO2e: 8500,
    status: 'Pending',
  },
  {
    id: 'PRJ-2023-156',
    name: 'Kutch Tidal Flats',
    organization: 'Gujarat State Forestry',
    location: 'Gujarat',
    submitted: '2023-10-22',
    estCO2e: 22100,
    status: 'Under Review',
  },
  {
    id: 'PRJ-2023-110',
    name: 'Chilika Lake Margins',
    organization: 'Odisha Wetlands Corp',
    location: 'Odisha',
    submitted: '2023-09-30',
    estCO2e: 3400,
    status: 'Rejected',
  },
];

export const carbonSequestrationTrend = [
  { month: 'Jan', value: 85000 },
  { month: 'Feb', value: 92000 },
  { month: 'Mar', value: 110000 },
  { month: 'Apr', value: 125000 },
  { month: 'May', value: 140000 },
  { month: 'Jun', value: 155000 },
  { month: 'Jul', value: 180000 },
  { month: 'Aug', value: 210000 },
  { month: 'Sep', value: 240000 },
  { month: 'Oct', value: 280000 },
  { month: 'Nov', value: 320000 },
  { month: 'Dec', value: 350000 },
];
