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

  // 1. Query via controlled secure RPC
  try {
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('get_onboarding_status', { p_application_number: applicationNumber.trim() });

    if (!rpcError && rpcData) {
      return rpcData;
    }
  } catch (err) {
    console.warn('get_onboarding_status RPC query attempt:', err);
  }

  // 2. Query sanitized fields governed by RLS
  const { data, error } = await supabase
    .from('onboarding_requests')
    .select('application_number, organization_name, organization_type, state, district, status, review_notes, created_at, updated_at')
    .eq('application_number', applicationNumber.trim())
    .maybeSingle();

  if (error) {
    console.error('Error fetching onboarding request:', error);
    throw error;
  }

  return data;
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
