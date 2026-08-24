// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { ethers } from 'https://esm.sh/ethers@6.15.0';

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const ABI = [
  'function getAnchor(bytes32) view returns (uint64 timestamp,uint64 blockNumber,uint256 carbonAmountCentiTonne,string recordId,bool exists)',
  'function verifyMRV(bytes32 dataHash) view returns (bool exists,string recordId,uint256 carbonAmountCentiTonne,uint64 timestamp,uint64 blockNumber)',
];

const response = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

function canonicalize(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  const obj = value as Record<string, unknown>;
  return `{${Object.keys(obj).sort().map((key) => `${JSON.stringify(key)}:${canonicalize(obj[key])}`).join(',')}}`;
}

async function sha256Hex(input: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const rpcUrl = Deno.env.get('POLYGON_RPC_URL');
  const contractAddress = Deno.env.get('MRV_ANCHOR_CONTRACT_ADDRESS');
  if (!supabaseUrl || !serviceRoleKey || !rpcUrl || !contractAddress) return response(500, { error: 'Verification configuration is incomplete' });

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return response(401, { error: 'Missing authorization' });
  const admin = createClient(supabaseUrl, serviceRoleKey);
  const token = authHeader.replace(/^Bearer\s+/i, '');
  const { data: { user }, error: authError } = await admin.auth.getUser(token);
  if (authError || !user) return response(401, { error: 'Invalid session' });

  try {
    const { submissionId } = await req.json();
    if (!submissionId) return response(400, { error: 'submissionId is required' });

    const { data: submission, error: sErr } = await admin.from('mrv_submissions').select('id, submission_code, project_id, status, carbon_estimate, claimed_metrics, period_start, period_end, verified_at').eq('id', submissionId).single();
    if (sErr) throw sErr;
    const { data: evidence, error: eErr } = await admin.from('evidence_files').select('id, file_name, file_type, file_size_bytes, sha256_hash, validation_status').eq('submission_id', submissionId).order('id');
    if (eErr) throw eErr;

    const canonical = canonicalize({
      submission: { id: submission.id, code: submission.submission_code, project_id: submission.project_id, status: submission.status, carbon_estimate: submission.carbon_estimate, claimed_metrics: submission.claimed_metrics || {}, period_start: submission.period_start, period_end: submission.period_end, verified_at: submission.verified_at },
      evidence: (evidence || []).map((e) => ({ id: e.id, file_name: e.file_name, file_type: e.file_type, file_size_bytes: e.file_size_bytes, sha256_hash: e.sha256_hash, validation_status: e.validation_status })),
    });
    const dataHash = await sha256Hex(canonical);

    const { data: anchor } = await admin.from('mrv_blockchain_anchors').select('tx_hash, block_number, status, network:blockchain_networks(name,chain_id,explorer_url)').eq('submission_id', submissionId).eq('data_hash', dataHash).maybeSingle();
    if (!anchor?.tx_hash) return response(200, { verified: false, reason: 'NO_ANCHOR', dataHash });

    const provider = new ethers.JsonRpcProvider(rpcUrl);

    // Independently verify that the transaction receipt exists on the blockchain and succeeded
    let txReceipt = null;
    try {
      txReceipt = await provider.getTransactionReceipt(anchor.tx_hash);
    } catch {
      txReceipt = null;
    }
    const isTxValid = Boolean(txReceipt && txReceipt.status === 1);

    const contract = new ethers.Contract(contractAddress, ABI, provider);
    const onChain = await contract.verifyMRV(`0x${dataHash}`);
    const onChainExists = Boolean(onChain[0]);
    const onChainRecordId = onChain[1];
    const onChainCarbonCentiTonne = Number(onChain[2] || 0);
    const onChainTimestamp = Number(onChain[3] || 0);
    const onChainBlockNumber = Number(onChain[4] || txReceipt?.blockNumber || anchor.block_number || 0);
    const verified = isTxValid && onChainExists && onChainRecordId === submission.submission_code;

    return response(200, {
      verified,
      dataHash,
      transactionHash: anchor.tx_hash,
      blockNumber: onChainBlockNumber,
      timestamp: onChainTimestamp,
      recordId: onChainRecordId,
      carbonAmount: onChainCarbonCentiTonne / 100,
      explorerUrl: anchor.network?.explorer_url ? `${anchor.network.explorer_url}/tx/${anchor.tx_hash}` : null,
    });
  } catch (error) {
    console.error(error);
    return response(500, { error: error instanceof Error ? error.message : 'On-chain verification failed' });
  }
});
