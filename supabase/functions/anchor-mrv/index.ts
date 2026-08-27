// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { ethers } from 'https://esm.sh/ethers@6.15.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

const CONTRACT_ABI = [
  'function anchorMRV(bytes32 dataHash,string recordId,uint256 carbonAmountCentiTonne) returns (bool)',
  'function getAnchor(bytes32 dataHash) view returns (uint64 timestamp,uint64 blockNumber,uint256 carbonAmountCentiTonne,string recordId,bool exists)',
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
  const privateKey = Deno.env.get('POLYGON_PRIVATE_KEY');
  const contractAddress = Deno.env.get('MRV_ANCHOR_CONTRACT_ADDRESS');
  const networkId = Deno.env.get('MRV_BLOCKCHAIN_NETWORK_ID');
  const contractId = Deno.env.get('MRV_SMART_CONTRACT_ID');

  if (!supabaseUrl || !serviceRoleKey || !rpcUrl || !privateKey || !contractAddress || !networkId) {
    return json(500, {
      success: false,
      error: 'Blockchain server configuration is incomplete (missing RPC, private key, or contract address)',
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
  const { data: { user }, error: userError } = await admin.auth.getUser(token);
  if (userError || !user) {
    return json(401, {
      success: false,
      error: 'Invalid or expired session token',
      code: 'INVALID_TOKEN',
    });
  }

  // Server-side RBAC Authorization check
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const role = profile?.role;
  const allowedRoles = ['NCCR_ADMIN', 'VERIFIER', 'AUDITOR'];
  if (!role || !allowedRoles.includes(role)) {
    return json(403, {
      success: false,
      error: 'Forbidden: Only authorized NCCR_ADMIN or VERIFIER roles may anchor MRV records on blockchain',
      code: 'FORBIDDEN',
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
      .select('id, submission_code, project_id, status, carbon_estimate, claimed_metrics, period_start, period_end, verified_at, verified_by, verification_cases(id, status, overall_confidence_score)')
      .eq('id', submissionId)
      .maybeSingle();

    if (submissionError || !submission) {
      return json(404, {
        success: false,
        error: 'MRV submission not found for provided UUID',
        code: 'NOT_FOUND',
      });
    }

    if (submission.status !== 'VERIFIED') {
      return json(409, {
        success: false,
        error: `Only VERIFIED MRV submissions can be anchored to blockchain (current status: ${submission.status})`,
        code: 'STATUS_CONFLICT',
      });
    }

    if (
      submission.carbon_estimate == null ||
      isNaN(Number(submission.carbon_estimate)) ||
      Number(submission.carbon_estimate) <= 0
    ) {
      return json(422, {
        success: false,
        error: 'Valid positive carbon_estimate is required for blockchain anchoring',
        code: 'INVALID_CARBON_ESTIMATE',
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
    const bytes32Hash = `0x${dataHash}`;

    // Idempotency: Check existing confirmed anchor
    const { data: existing } = await admin
      .from('mrv_blockchain_anchors')
      .select('*')
      .eq('data_hash', dataHash)
      .maybeSingle();

    if (existing?.status === 'CONFIRMED' && existing?.tx_hash) {
      return json(200, {
        success: true,
        alreadyAnchored: true,
        dataHash,
        transactionHash: existing.tx_hash,
        blockNumber: existing.block_number,
        explorerUrl: `https://amoy.polygonscan.com/tx/${existing.tx_hash}`,
      });
    }

    const { data: pending, error: insertError } = await admin
      .from('mrv_blockchain_anchors')
      .upsert({
        submission_id: submissionId,
        verification_case_id: submission.verification_cases?.[0]?.id || null,
        data_hash: dataHash,
        network_id: networkId,
        contract_id: contractId || null,
        status: 'PENDING',
        requested_by: user.id,
      }, { onConflict: 'data_hash' })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const network = await provider.getNetwork();
    const isAmoy = network.chainId === 80002n;
    const explorerBase = isAmoy ? 'https://amoy.polygonscan.com' : 'https://polygonscan.com';

    const wallet = new ethers.Wallet(privateKey, provider);
    const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, wallet);
    const carbonAmountCentiTonne = BigInt(Math.round(Number(submission.carbon_estimate) * 100));

    const tx = await contract.anchorMRV(bytes32Hash, submission.submission_code, carbonAmountCentiTonne);
    const receipt = await tx.wait(1);
    const explorerUrl = `${explorerBase}/tx/${tx.hash}`;

    const { data: record, error: recordError } = await admin
      .from('blockchain_records')
      .insert({
        record_code: `ANCHOR-${submission.submission_code}`,
        credit_id: null,
        network_id: networkId,
        contract_id: contractId || null,
        tx_hash: tx.hash,
        block_number: receipt.blockNumber,
        token_id: null,
        record_type: 'AUDIT_ANCHOR',
        payload: {
          submission_id: submissionId,
          data_hash: dataHash,
          record_id: submission.submission_code,
          carbon_estimate: Number(submission.carbon_estimate),
        },
        status: 'CONFIRMED',
        on_chain_timestamp: new Date().toISOString(),
        explorer_url: explorerUrl,
        data_hash: dataHash,
        confirmations: 1,
        confirmations_total: 1,
      })
      .select()
      .single();

    if (recordError) {
      console.error('Failed to create blockchain_record:', recordError);
    }

    await admin
      .from('mrv_blockchain_anchors')
      .update({
        status: 'CONFIRMED',
        tx_hash: tx.hash,
        block_number: receipt.blockNumber,
        blockchain_record_id: record?.id || null,
        confirmed_at: new Date().toISOString(),
        error_message: null,
      })
      .eq('id', pending.id);

    return json(200, {
      success: true,
      dataHash,
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      explorerUrl,
      networkChainId: network.chainId.toString(),
    });
  } catch (error) {
    console.error('Blockchain anchor execution error:', error);
    return json(500, {
      success: false,
      error: error instanceof Error ? error.message : 'Blockchain anchoring failed',
      code: 'INTERNAL_ERROR',
    });
  }
});
