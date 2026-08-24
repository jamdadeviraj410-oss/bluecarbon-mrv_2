import { supabase } from '../lib/supabase';

/**
 * Organization Service — Real Supabase Queries
 */

/**
 * Helper to normalize DB organization to UI format
 */
export function formatOrganization(org) {
  if (!org) return null;

  const projects = org.projects || [];
  const activeProjectsCount = projects.filter(
    (p) => p.status === 'ACTIVE' || p.status === 'Active' || p.status === 'VERIFIED' || p.status === 'Verified'
  ).length;

  const totalArea = projects.reduce((acc, p) => acc + (Number(p.area) || 0), 0);
  const totalVerifiedCredits = projects
    .filter((p) => p.status === 'VERIFIED' || p.status === 'Verified')
    .reduce((acc, p) => acc + (Number(p.total_credits) || 0), 0);

  return {
    id: org.org_code || org.id,
    dbId: org.id,
    org_code: org.org_code,
    name: org.name,
    type: org.type,
    status: org.status || 'Verified',
    registrationDate: org.registration_date,
    registration_date: org.registration_date,
    registrationNumber: org.registration_number,
    registration_number: org.registration_number,
    location: org.location || '',
    state: org.state || '',
    country: org.country || 'India',
    contactPerson: org.contact_person || '',
    contact_person: org.contact_person || '',
    contactEmail: org.email || '',
    email: org.email || '',
    phone: org.phone || '',
    description: org.description || '',
    activeProjects: activeProjectsCount || org.project_count || 0,
    projectCount: projects.length || org.project_count || 0,
    totalArea: totalArea || org.total_area || 0,
    totalVerifiedCredits: totalVerifiedCredits.toLocaleString() || '0',
    rawCredits: totalVerifiedCredits,
    createdAt: org.created_at,
    updatedAt: org.updated_at,
  };
}

/**
 * Fetch all organizations with optional filtering
 */
export async function getOrganizations(filters = {}) {
  let query = supabase
    .from('organizations')
    .select(`
      *,
      projects:projects(id, status, area, total_credits)
    `)
    .order('name', { ascending: true });

  if (filters.status && filters.status !== 'All') {
    query = query.eq('status', filters.status);
  }

  if (filters.type && filters.type !== 'All') {
    query = query.eq('type', filters.type);
  }

  if (filters.search) {
    const q = `%${filters.search}%`;
    query = query.or(`name.ilike.${q},org_code.ilike.${q},location.ilike.${q}`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching organizations:', error);
    throw error;
  }

  return (data || []).map(formatOrganization);
}

/**
 * Fetch a single organization by UUID or org_code
 */
export async function getOrganizationById(idOrCode) {
  if (!idOrCode) return null;

  let query = supabase
    .from('organizations')
    .select(`
      *,
      projects:projects(*),
      members:organization_members(
        id, role, status, joined_at,
        user:profiles(id, email, full_name, role, avatar_url, phone)
      )
    `);

  // Check if uuid format
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrCode);
  if (isUuid) {
    query = query.eq('id', idOrCode);
  } else {
    query = query.eq('org_code', idOrCode);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    console.error('Error fetching organization by ID:', error);
    throw error;
  }

  return formatOrganization(data);
}

/**
 * Create a new organization
 */
export async function createOrganization(orgData) {
  // Generate org code if not provided
  let orgCode = orgData.org_code || orgData.orgCode;
  if (!orgCode) {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    orgCode = `ORG-${randomSuffix}`;
  }

  const payload = {
    org_code: orgCode,
    name: orgData.name,
    type: orgData.type || 'NGO',
    registration_number: orgData.registration_number || orgData.registrationNumber || null,
    registration_date: orgData.registration_date || orgData.registrationDate || new Date().toISOString().split('T')[0],
    location: orgData.location || null,
    state: orgData.state || null,
    country: orgData.country || 'India',
    contact_person: orgData.contact_person || orgData.contactPerson || null,
    email: orgData.email || orgData.contactEmail || null,
    phone: orgData.phone || null,
    description: orgData.description || null,
    status: orgData.status || 'Verified',
  };

  const { data, error } = await supabase
    .from('organizations')
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error('Error creating organization:', error);
    throw error;
  }

  return formatOrganization(data);
}

/**
 * Update an existing organization
 */
export async function updateOrganization(id, updates) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  let query = supabase.from('organizations').update(updates);
  if (isUuid) {
    query = query.eq('id', id);
  } else {
    query = query.eq('org_code', id);
  }

  const { data, error } = await query.select().single();

  if (error) {
    console.error('Error updating organization:', error);
    throw error;
  }

  return formatOrganization(data);
}

/**
 * Fetch members for an organization
 */
export async function getOrganizationMembers(organizationId) {
  const { data, error } = await supabase
    .from('organization_members')
    .select(`
      id,
      role,
      status,
      joined_at,
      profile:profiles(id, email, full_name, role, avatar_url, phone)
    `)
    .eq('organization_id', organizationId);

  if (error) {
    console.error('Error fetching organization members:', error);
    throw error;
  }

  return data;
}

/**
 * Add a member to an organization
 */
export async function addOrganizationMember({ organizationId, userId, role = 'MEMBER', status = 'ACTIVE' }) {
  const { data, error } = await supabase
    .from('organization_members')
    .insert([
      {
        organization_id: organizationId,
        user_id: userId,
        role,
        status,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error adding organization member:', error);
    throw error;
  }

  return data;
}

export const organizationTypes = ['NGO', 'Government', 'Panchayat', 'Community', 'Research', 'Private Enterprise'];
