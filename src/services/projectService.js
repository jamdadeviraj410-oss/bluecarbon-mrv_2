import { supabase } from '../lib/supabase.js';

/**
 * Project Service — Real Supabase Queries & Mutations
 */

export const PROJECT_STATUS_MAP = {
  DRAFT: 'Draft',
  SUBMITTED: 'Pending',
  UNDER_REVIEW: 'Under Review',
  VERIFIED: 'Verified',
  REJECTED: 'Rejected',
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
  ARCHIVED: 'Archived',
};

export const UI_TO_DB_STATUS = {
  'Draft': 'DRAFT',
  'Pending': 'SUBMITTED',
  'Under Review': 'UNDER_REVIEW',
  'Verified': 'VERIFIED',
  'Rejected': 'REJECTED',
  'Active': 'ACTIVE',
  'Completed': 'COMPLETED',
  'Archived': 'ARCHIVED',
};

/**
 * Helper to normalize DB project row to UI format
 */
export function formatProject(project) {
  if (!project) return null;

  const uiStatus = PROJECT_STATUS_MAP[project.status] || project.status || 'Draft';
  const orgName = project.organization?.name || project.organization_name || (typeof project.organization === 'string' ? project.organization : 'EcoTrust India');

  const metadata = project.metadata || {};

  return {
    id: project.project_code || project.id,
    dbId: project.id,
    project_code: project.project_code,
    name: project.name,
    organization: orgName,
    organizationId: project.organization_id,
    organizationDetails: project.organization,
    location: project.location || '',
    state: project.state || '',
    country: project.country || 'India',
    area: Number(project.area) || 0,
    estCO2e: Number(project.est_co2e) || 0,
    est_co2e: Number(project.est_co2e) || 0,
    status: uiStatus,
    dbStatus: project.status,
    type: project.type,
    startDate: project.start_date,
    start_date: project.start_date,
    endDate: project.end_date,
    end_date: project.end_date,
    description: project.description || '',
    coordinates: {
      lat: Number(project.latitude) || 16.9902,
      lng: Number(project.longitude) || 73.3120,
    },
    latitude: Number(project.latitude) || 0,
    longitude: Number(project.longitude) || 0,
    teamLead: project.team_lead || metadata.teamLead || 'Priya Sharma',
    team_lead: project.team_lead || metadata.teamLead || 'Priya Sharma',
    verificationDate: project.verification_date,
    verification_date: project.verification_date,
    totalCredits: Number(project.total_credits) || 0,
    retiredCredits: Number(project.retired_credits) || 0,
    activeCredits: Number(project.active_credits) || 0,
    // Metadata properties
    treeDensity: metadata.treeDensity || 1800,
    targetPlants: metadata.targetPlants || 260000,
    species: metadata.species || 'Avicennia marina, Rhizophora mucronata',
    socBaseline: metadata.socBaseline || 2.8,
    communityName: metadata.communityName || 'Coastal Community Trust',
    communityContact: metadata.communityContact || '',
    revenueShare: metadata.revenueShare || 35,
    localJobs: metadata.localJobs || 120,
    crzClearance: metadata.crzClearance || null,
    pddDoc: metadata.pddDoc || null,
    consentDeed: metadata.consentDeed || null,
    metadata,
    created_by: project.created_by,
    created_at: project.created_at,
    updated_at: project.updated_at,
    statusHistory: (project.status_history || []).map((h) => ({
      id: h.id,
      previousStatus: PROJECT_STATUS_MAP[h.previous_status] || h.previous_status,
      newStatus: PROJECT_STATUS_MAP[h.new_status] || h.new_status,
      reason: h.reason,
      changedBy: h.changed_by_profile?.full_name || 'System',
      createdAt: h.created_at,
    })),
  };
}

/**
 * Fetch all projects with optional filtering
 */
export async function getProjects(filters = {}) {
  let query = supabase
    .from('projects')
    .select(`
      *,
      organization:organizations(id, org_code, name, type, location, state)
    `)
    .order('created_at', { ascending: false });

  if (filters.status && filters.status !== 'All') {
    const dbStatus = UI_TO_DB_STATUS[filters.status] || filters.status.toUpperCase();
    query = query.eq('status', dbStatus);
  }

  if (filters.type && filters.type !== 'All') {
    query = query.eq('type', filters.type);
  }

  if (filters.state && filters.state !== 'All') {
    query = query.eq('state', filters.state);
  }

  if (filters.organizationId) {
    query = query.eq('organization_id', filters.organizationId);
  }

  if (filters.search) {
    const q = `%${filters.search}%`;
    query = query.or(`name.ilike.${q},project_code.ilike.${q},location.ilike.${q}`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }

  return (data || []).map(formatProject);
}

/**
 * Fetch single project by UUID or project_code
 */
export async function getProjectById(idOrCode) {
  if (!idOrCode) return null;

  let query = supabase
    .from('projects')
    .select(`
      *,
      organization:organizations(id, org_code, name, type, location, state, contact_person, email),
      status_history:project_status_history(
        id, previous_status, new_status, reason, created_at,
        changed_by_profile:profiles(id, full_name, email, role)
      ),
      members:project_members(
        id, role, joined_at,
        user:profiles(id, full_name, email, role, avatar_url)
      )
    `);

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrCode);
  if (isUuid) {
    query = query.eq('id', idOrCode);
  } else {
    query = query.eq('project_code', idOrCode);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    console.error('Error fetching project by ID:', error);
    throw error;
  }

  return formatProject(data);
}

/**
 * Create a new project in Supabase
 */
export async function createProject(formData) {
  const year = new Date().getFullYear();
  const seq = String(Math.floor(Math.random() * 900) + 100);
  const projectCode = formData.project_code || formData.projectCode || `PRJ-${year}-${seq}`;

  // Get current user id
  const { data: { session } } = await supabase.auth.getSession();
  const currentUserId = session?.user?.id || null;

  // Resolve organization id if string passed
  let organizationId = formData.organization_id || formData.organizationId;
  if (!organizationId && formData.organization) {
    // Try to lookup organization by name
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .ilike('name', formData.organization)
      .maybeSingle();
    if (org) {
      organizationId = org.id;
    }
  }

  // If still no org, default to first existing organization
  if (!organizationId) {
    const { data: firstOrg } = await supabase.from('organizations').select('id').limit(1).maybeSingle();
    organizationId = firstOrg?.id || null;
  }

  const dbStatus = formData.status ? (UI_TO_DB_STATUS[formData.status] || formData.status) : 'DRAFT';

  const metadata = {
    treeDensity: formData.treeDensity !== '' && formData.treeDensity != null ? Number(formData.treeDensity) : null,
    targetPlants: formData.targetPlants !== '' && formData.targetPlants != null ? Number(formData.targetPlants) : null,
    species: formData.species || null,
    socBaseline: formData.socBaseline !== '' && formData.socBaseline != null ? Number(formData.socBaseline) : null,
    communityName: formData.communityName || null,
    communityContact: formData.communityContact || null,
    revenueShare: formData.revenueShare !== '' && formData.revenueShare != null ? Number(formData.revenueShare) : null,
    localJobs: formData.localJobs !== '' && formData.localJobs != null ? Number(formData.localJobs) : null,
    crzClearance: formData.crzClearance || null,
    pddDoc: formData.pddDoc || null,
    consentDeed: formData.consentDeed || null,
    geoJsonBoundary: formData.geoJsonBoundary || null,
    boundaryVertices: formData.boundaryVertices || null,
  };

  const payload = {
    project_code: projectCode,
    name: formData.name || 'Untitled Project',
    organization_id: organizationId,
    type: formData.type || 'Mangrove Restoration',
    location: formData.location || '',
    state: formData.state || '',
    country: formData.country || 'India',
    latitude: formData.lat != null ? Number(formData.lat) : (formData.latitude != null ? Number(formData.latitude) : null),
    longitude: formData.lng != null ? Number(formData.lng) : (formData.longitude != null ? Number(formData.longitude) : null),
    area: formData.area !== '' && formData.area != null ? Number(formData.area) : 0,
    est_co2e: formData.estCO2e !== '' && formData.estCO2e != null ? Number(formData.estCO2e) : (formData.est_co2e != null ? Number(formData.est_co2e) : 0),
    total_credits: Number(formData.totalCredits) || 0,
    retired_credits: 0,
    active_credits: 0,
    status: dbStatus,
    start_date: formData.startDate || formData.start_date || new Date().toISOString().split('T')[0],
    end_date: formData.endDate || formData.end_date || null,
    description: formData.description || '',
    team_lead: formData.teamLead || formData.team_lead || null,
    metadata,
    created_by: currentUserId,
  };

  const { data, error } = await supabase
    .from('projects')
    .insert([payload])
    .select(`
      *,
      organization:organizations(id, org_code, name, type, location, state)
    `)
    .single();

  if (error) {
    console.error('Error creating project:', error);
    throw error;
  }

  return formatProject(data);
}

/**
 * Update project details
 */
export async function updateProject(idOrCode, updates) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrCode);

  const payload = { ...updates };
  if (payload.status && UI_TO_DB_STATUS[payload.status]) {
    payload.status = UI_TO_DB_STATUS[payload.status];
  }
  if (payload.estCO2e !== undefined) {
    payload.est_co2e = payload.estCO2e;
    delete payload.estCO2e;
  }
  if (payload.startDate !== undefined) {
    payload.start_date = payload.startDate;
    delete payload.startDate;
  }
  if (payload.endDate !== undefined) {
    payload.end_date = payload.endDate;
    delete payload.endDate;
  }
  if (payload.teamLead !== undefined) {
    payload.team_lead = payload.teamLead;
    delete payload.teamLead;
  }

  let query = supabase.from('projects').update(payload);
  if (isUuid) {
    query = query.eq('id', idOrCode);
  } else {
    query = query.eq('project_code', idOrCode);
  }

  const { data, error } = await query
    .select(`
      *,
      organization:organizations(id, org_code, name, type, location, state)
    `)
    .single();

  if (error) {
    console.error('Error updating project:', error);
    throw error;
  }

  return formatProject(data);
}

/**
 * Update project status (triggers audit logging)
 */
export async function updateProjectStatus(idOrCode, newStatus, reason = '') {
  const dbStatus = UI_TO_DB_STATUS[newStatus] || newStatus;
  
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrCode);

  let query = supabase.from('projects').update({
    status: dbStatus,
    metadata: {
      status_change_reason: reason,
    },
  });

  if (isUuid) {
    query = query.eq('id', idOrCode);
  } else {
    query = query.eq('project_code', idOrCode);
  }

  const { data, error } = await query
    .select(`
      *,
      organization:organizations(id, org_code, name, type, location, state)
    `)
    .single();

  if (error) {
    console.error('Error updating project status:', error);
    throw error;
  }

  return formatProject(data);
}

/**
 * Compute summary statistics from projects table
 */
export async function getProjectStats() {
  const { data, error } = await supabase
    .from('projects')
    .select('status, area, est_co2e, total_credits');

  if (error) {
    console.error('Error fetching project stats:', error);
    return { total: 0, active: 0, verified: 0, pending: 0, totalArea: 0, totalCO2e: 0 };
  }

  const total = data.length;
  const active = data.filter((p) => p.status === 'ACTIVE').length;
  const verified = data.filter((p) => p.status === 'VERIFIED').length;
  const pending = data.filter((p) => p.status === 'SUBMITTED' || p.status === 'UNDER_REVIEW').length;
  const totalArea = data.reduce((sum, p) => sum + (Number(p.area) || 0), 0);
  const totalCO2e = data.reduce((sum, p) => sum + (Number(p.est_co2e) || 0), 0);

  return { total, active, verified, pending, totalArea, totalCO2e };
}

export const projectTypes = [
  'Mangrove Restoration',
  'Estuary Restoration',
  'Tidal Flat Rehabilitation',
  'Wetland Restoration',
  'Mangrove Conservation',
  'Seagrass Restoration',
  'Coral Reef Rehabilitation',
];

export const indianStates = [
  'Andhra Pradesh', 'Gujarat', 'Goa', 'Karnataka', 'Kerala',
  'Maharashtra', 'Odisha', 'Tamil Nadu', 'West Bengal',
];
