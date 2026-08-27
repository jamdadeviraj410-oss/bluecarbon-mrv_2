// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { ethers } from 'https://esm.sh/ethers@6.15.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

const CONTRACT_ABI = [
  'function getAnchor(bytes32) view returns (uint64 timestamp,uint64 blockNumber,uint256 carbonAmountCentiTonne,string recordId,bool exists)',
  'function verifyMRV(bytes32 dataHash) view returns (bool exists,string recordId,uint256 carbonAmountCentiTonne,uint64 timestamp,uint64 blockNumber)',
  'function isAnchored(bytes32 dataHash) view returns (bool)',
];

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export function canonicalize(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  const obj = value as Record<string, unknown>;
  return `{${Object.keys(obj).sort().map((key) => `${JSON.stringify(key)}:${canonicalize(obj[key])}`).join(',')}}`;
}

export async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const rpcUrl = Deno.env.get('POLYGON_RPC_URL');
  const contractAddress = Deno.env.get('MRV_ANCHOR_CONTRACT_ADDRESS');

  if (!supabaseUrl || !serviceRoleKey || !rpcUrl || !contractAddress) {
    return json(500, {
      success: false,
      error: 'Verification server configuration is incomplete (missing RPC or contract address)',
      code: 'CONFIG_ERROR',
    });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return json(401, {
      success: false,
      error: 'Missing authorization header',
      code: 'UNAUTHORIZED',
    });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);
  const token = authHeader.replace(/^Bearer\s+/i, '');
  const { data: { user }, error: authError } = await admin.auth.getUser(token);
  if (authError || !user) {
    return json(401, {
      success: false,
      error: 'Invalid or expired session token',
      code: 'INVALID_TOKEN',
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const submissionId = body?.submissionId;
    if (!submissionId || !UUID_REGEX.test(submissionId)) {
      return json(400, {
        success: false,
        error: `Invalid submissionId ('${submissionId}'). A valid database UUID is required.`,
        code: 'INVALID_INPUT',
      });
    }

    const { data: submission, error: submissionError } = await admin
      .from('mrv_submissions')
      .select('id, submission_code, project_id, status, carbon_estimate, claimed_metrics, period_start, period_end, verified_at')
      .eq('id', submissionId)
      .maybeSingle();

    if (submissionError || !submission) {
      return json(404, {
        success: false,
        error: 'MRV submission not found for provided UUID',
        code: 'NOT_FOUND',
      });
    }

    const { data: evidence, error: evidenceError } = await admin
      .from('evidence_files')
      .select('id, original_filename, file_name, evidence_type, file_type, file_size, file_size_bytes, checksum_sha256, sha256_hash, validation_status')
      .eq('submission_id', submissionId)
      .order('id');

    if (evidenceError) {
      console.error('Evidence lookup error:', evidenceError);
    }

    const canonical = canonicalize({
      submission: {
        id: submission.id,
        code: submission.submission_code,
        project_id: submission.project_id,
        status: submission.status,
        carbon_estimate: Number(submission.carbon_estimate),
        claimed_metrics: submission.claimed_metrics || {},
        period_start: submission.period_start || null,
        period_end: submission.period_end || null,
        verified_at: submission.verified_at || null,
      },
      evidence: (evidence || []).map((e) => ({
        id: e.id,
        file_name: e.original_filename || e.file_name || '',
        file_type: e.evidence_type || e.file_type || '',
        file_size_bytes: Number(e.file_size || e.file_size_bytes || 0),
        sha256_hash: e.checksum_sha256 || e.sha256_hash || '',
        validation_status: e.validation_status || 'VALID',
      })),
    });

    const dataHash = await sha256Hex(canonical);

    const { data: anchor } = await admin
      .from('mrv_blockchain_anchors')
      .select('tx_hash, block_number, status, network:blockchain_networks(name, chain_id, explorer_url)')
      .eq('submission_id', submissionId)
      .eq('data_hash', dataHash)
      .maybeSingle();

    if (!anchor?.tx_hash) {
      return json(200, {
        success: true,
        verified: false,
        reason: 'NOT_ANCHORED_YET',
        dataHash,
        submissionCode: submission.submission_code,
      });
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);

    // Verify transaction receipt on Polygon Amoy
    let txReceipt = null;
    try {
      txReceipt = await provider.getTransactionReceipt(anchor.tx_hash);
    } catch {
      txReceipt = null;
    }

    const isTxValid = Boolean(txReceipt && txReceipt.status === 1);

    const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, provider);
    const onChain = await contract.verifyMRV(`0x${dataHash}`);
    const onChainExists = Boolean(onChain[0]);
    const onChainRecordId = onChain[1];
    const onChainCarbonCentiTonne = Number(onChain[2] || 0);
    const onChainTimestamp = Number(onChain[3] || 0);
    const onChainBlockNumber = Number(onChain[4] || txReceipt?.blockNumber || anchor.block_number || 0);

    const verified = isTxValid && onChainExists && onChainRecordId === submission.submission_code;

    const explorerUrl = anchor.network?.explorer_url
      ? `${anchor.network.explorer_url}/tx/${anchor.tx_hash}`
      : `https://amoy.polygonscan.com/tx/${anchor.tx_hash}`;

    return json(200, {
      success: true,
      verified,
      dataHash,
      transactionHash: anchor.tx_hash,
      blockNumber: onChainBlockNumber,
      timestamp: onChainTimestamp,
      recordId: onChainRecordId,
      carbonAmount: onChainCarbonCentiTonne / 100,
      explorerUrl,
    });
  } catch (error) {
    console.error('On-chain verification error:', error);
    return json(500, {
      success: false,
      error: error instanceof Error ? error.message : 'On-chain verification failed',
      code: 'INTERNAL_ERROR',
    });
  }
});
