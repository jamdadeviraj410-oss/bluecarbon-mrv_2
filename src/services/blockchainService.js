import { supabase } from '../lib/supabase';

export async function getBlockchainTransactions(filters = {}) {
  let query = supabase.from('blockchain_records').select(`*, credit:carbon_credits(*, project:projects(*, organization:organizations(*))), network:blockchain_networks(*), contract:smart_contracts(*)`).order('on_chain_timestamp', { ascending: false });
  if (filters.status && filters.status !== 'All') query = query.eq('status', filters.status.toUpperCase());
  if (filters.recordType && filters.recordType !== 'All') query = query.eq('record_type', filters.recordType);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getBlockchainRecordById(identifier) {
  if (!identifier) return null;
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
  let query = supabase.from('blockchain_records').select(`*, credit:carbon_credits(*, project:projects(*, organization:organizations(*))), network:blockchain_networks(*), contract:smart_contracts(*)`);
  if (uuid) query = query.eq('id', identifier);
  else if (identifier.startsWith('0x')) query = query.eq('tx_hash', identifier);
  else query = query.eq('record_code', identifier);
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data;
}

export async function anchorMRVSubmission(submissionId) {
  if (!submissionId) throw new Error('submissionId is required');
  const { data, error } = await supabase.functions.invoke('anchor-mrv', { body: { submissionId } });
  if (error) throw error;
  if (!data?.success) throw new Error(data?.error || 'Blockchain anchoring failed');
  return data;
}

export async function verifyMRVAnchor(submissionId) {
  if (!submissionId) throw new Error('submissionId is required');
  const { data, error } = await supabase.functions.invoke('verify-mrv', { body: { submissionId } });
  if (error) throw error;
  return data || { verified: false, reason: 'EMPTY_RESPONSE' };
}

/** Random transaction generation has intentionally been removed. */
export async function mintCarbonCredits() {
  throw new Error('mintCarbonCredits is deprecated. Use anchorMRVSubmission(submissionId).');
}
