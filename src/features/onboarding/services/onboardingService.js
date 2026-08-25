import { supabase } from '../../../lib/supabase';

/**
 * Organization Onboarding Service
 */

export async function submitOnboardingRequest(formData) {
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const applicationNumber = `APP-${new Date().getFullYear()}-${randomSuffix}`;

  const payload = {
    application_number: applicationNumber,
    organization_name: formData.organizationName,
    organization_type: formData.organizationType || 'NGO',
    registration_number: formData.registrationNumber || null,
    darpan_id: formData.darpanId || null,
    established_date: formData.establishedDate || null,
    website: formData.website || null,
    country: formData.country || 'India',
    state: formData.state,
    district: formData.district,
    panchayat_or_block: formData.panchayatOrBlock || null,
    location_address: formData.locationAddress || null,
    primary_contact_name: formData.primaryContactName,
    primary_contact_role: formData.primaryContactRole,
    primary_contact_email: formData.primaryContactEmail,
    primary_contact_phone: formData.primaryContactPhone || null,
    authorized_rep_name: formData.authorizedRepName || null,
    authorized_rep_designation: formData.authorizedRepDesignation || null,
    ecosystem_focus: formData.ecosystemFocus || ['Mangrove Restoration'],
    supporting_documents: formData.supportingDocuments || [],
    bank_payout_details: formData.bankPayoutDetails || {},
    status: 'SUBMITTED',
  };

  const { data, error } = await supabase
    .from('onboarding_requests')
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error('Error submitting onboarding request:', error);
    throw error;
  }

  return data;
}

export async function getOnboardingRequestByNumber(applicationNumber) {
  if (!applicationNumber) return null;
  const q = applicationNumber.trim();

  // 1. Query Supabase organizations table by org_code or id or registration_number
  try {
    const { data: orgData, error: orgErr } = await supabase
      .from('organizations')
      .select('*')
      .or(`org_code.ilike.%${q}%,registration_number.ilike.%${q}%,id.eq.${q.match(/^[0-9a-fA-F-]{36}$/) ? q : '00000000-0000-0000-0000-000000000000'}`)
      .maybeSingle();

    if (!orgErr && orgData) {
      return {
        application_number: orgData.org_code || orgData.id,
        organization_name: orgData.name,
        organization_type: orgData.type,
        state: orgData.state || 'India',
        district: orgData.location || 'Coastal District',
        status: (orgData.status || 'SUBMITTED').toUpperCase(),
        review_notes: orgData.description || 'Application verified and recorded in National Coastal Carbon Registry.',
        created_at: orgData.created_at,
        updated_at: orgData.updated_at,
      };
    }
  } catch (err) {
    console.warn('organizations lookup attempt:', err);
  }

  // 2. Query controlled secure RPC if available
  try {
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('get_onboarding_status', { p_application_number: q });

    if (!rpcError && rpcData) {
      return rpcData;
    }
  } catch (err) {
    console.warn('get_onboarding_status RPC query attempt:', err);
  }

  // 3. Query onboarding_requests table if populated
  try {
    const { data, error } = await supabase
      .from('onboarding_requests')
      .select('application_number, organization_name, organization_type, state, district, status, review_notes, created_at, updated_at')
      .eq('application_number', q)
      .maybeSingle();

    if (!error && data) {
      return data;
    }
  } catch (err) {
    console.warn('onboarding_requests table query attempt:', err);
  }

  return null;
}

export async function getOnboardingRequests(filters = {}) {
  let query = supabase
    .from('onboarding_requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters.status && filters.status !== 'ALL') {
    query = query.eq('status', filters.status);
  }

  if (filters.type && filters.type !== 'ALL') {
    query = query.eq('organization_type', filters.type);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching onboarding requests list:', error);
    throw error;
  }

  return data || [];
}
