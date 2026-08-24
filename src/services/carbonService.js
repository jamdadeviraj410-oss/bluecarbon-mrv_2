import { supabase } from '../lib/supabase';

/**
 * Carbon Credits & Calculation Service — Real Supabase Queries & Database Functions
 */

export async function getCarbonCredits(filters = {}) {
  let query = supabase
    .from('carbon_credits')
    .select(`
      *,
      project:projects(id, project_code, name, organization:organizations(name)),
      blockchain_records(*),
      lifecycle_events:blockchain_lifecycle_events(*)
    `)
    .order('created_at', { ascending: false });

  if (filters.status && filters.status !== 'All') {
    const dbStatus = filters.status.toUpperCase().replace(/\s+/g, '_');
    query = query.eq('status', dbStatus);
  }

  if (filters.projectId) {
    query = query.eq('project_id', filters.projectId);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching carbon credits:', error);
    throw error;
  }
  return data || [];
}

export async function getCreditById(id) {
  if (!id) return null;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  let query = supabase
    .from('carbon_credits')
    .select(`
      *,
      project:projects(*, organization:organizations(*)),
      calculation:carbon_calculations(*),
      blockchain_records(*),
      lifecycle_events:blockchain_lifecycle_events(*),
      retirements:credit_retirements(*),
      transactions:carbon_credit_transactions(*)
    `);

  if (isUuid) {
    query = query.eq('id', id);
  } else {
    query = query.eq('credit_code', id);
  }

  const { data, error } = await query.maybeSingle();
  if (error) {
    console.error('Error fetching credit by ID:', error);
    throw error;
  }
  return data;
}

export async function retireCredits(creditId, amount, beneficiaryName, beneficiaryOrg = null, reason = 'Voluntary Climate Commitment') {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(creditId);
  let dbCreditId = creditId;

  if (!isUuid) {
    const { data: c } = await supabase.from('carbon_credits').select('id').eq('credit_code', creditId).maybeSingle();
    if (c) dbCreditId = c.id;
  }

  const { data, error } = await supabase.rpc('retire_carbon_credit', {
    p_credit_id: dbCreditId,
    p_amount: Number(amount),
    p_beneficiary_name: beneficiaryName,
    p_beneficiary_org: beneficiaryOrg,
    p_reason: reason,
  });

  if (error) {
    console.error('Retirement RPC error:', error);
    throw new Error(error.message || 'Failed to retire carbon credits');
  }

  return data;
}
