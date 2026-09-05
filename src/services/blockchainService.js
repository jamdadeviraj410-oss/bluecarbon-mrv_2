import { supabase } from '../lib/supabase.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
  const uuid = UUID_REGEX.test(identifier);
  let query = supabase.from('blockchain_records').select(`*, credit:carbon_credits(*, project:projects(*, organization:organizations(*))), network:blockchain_networks(*), contract:smart_contracts(*)`);
  if (uuid) query = query.eq('id', identifier);
  else if (identifier.startsWith('0x')) query = query.eq('tx_hash', identifier);
  else query = query.eq('record_code', identifier);
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data;
}

async function extractEdgeFunctionError(error, functionName) {
  let detail = error?.message || 'Edge Function invocation error';
  try {
    if (error?.context && typeof error.context.json === 'function') {
      const body = await error.context.json();
      if (body?.error) detail = body.error;
    } else if (error?.context?.error) {
      detail = error.context.error;
    }
  } catch {
    // fallback to original error message
  }
  return new Error(`[${functionName}] ${detail}`);
}

export async function anchorMRVSubmission(submissionId) {
  if (!submissionId) {
    throw new Error('[anchor-mrv] submissionId is required');
  }
  if (!UUID_REGEX.test(submissionId)) {
    throw new Error(`[anchor-mrv] Invalid submissionId ('${submissionId}'). Expected a valid database UUID.`);
  }

  const { data, error } = await supabase.functions.invoke('anchor-mrv', {
    body: { submissionId },
  });

  if (error) {
    throw await extractEdgeFunctionError(error, 'anchor-mrv');
  }

  if (!data?.success) {
    throw new Error(data?.error || '[anchor-mrv] Blockchain anchoring failed');
  }

  return data;
}

export async function verifyMRVAnchor(submissionId) {
  if (!submissionId) {
    throw new Error('[verify-mrv] submissionId is required');
  }
  if (!UUID_REGEX.test(submissionId)) {
    throw new Error(`[verify-mrv] Invalid submissionId ('${submissionId}'). Expected a valid database UUID.`);
  }

  const { data, error } = await supabase.functions.invoke('verify-mrv', {
    body: { submissionId },
  });

  if (error) {
    throw await extractEdgeFunctionError(error, 'verify-mrv');
  }

  return data || { success: true, verified: false, reason: 'EMPTY_RESPONSE' };
}

/** Random transaction generation has intentionally been removed. */
export async function mintCarbonCredits() {
  throw new Error('mintCarbonCredits is deprecated. Use anchorMRVSubmission(submissionId).');
}
