-- Migration 11: Real blockchain MRV anchoring metadata
-- The chain stores only a deterministic hash + minimal metadata.

ALTER TABLE public.blockchain_records
  ADD COLUMN IF NOT EXISTS data_hash TEXT,
  ADD COLUMN IF NOT EXISTS explorer_url TEXT,
  ADD COLUMN IF NOT EXISTS on_chain_timestamp TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS confirmations INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS confirmations_total INTEGER DEFAULT 1;

CREATE UNIQUE INDEX IF NOT EXISTS blockchain_records_data_hash_idx
  ON public.blockchain_records(data_hash)
  WHERE data_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS blockchain_records_credit_id_idx
  ON public.blockchain_records(credit_id);

CREATE INDEX IF NOT EXISTS blockchain_records_status_idx
  ON public.blockchain_records(status);

COMMENT ON COLUMN public.blockchain_records.data_hash IS
  'SHA-256 hash of the canonical verified MRV record, stored as lowercase hex.';
COMMENT ON COLUMN public.blockchain_records.explorer_url IS
  'Public blockchain explorer URL for the transaction.';

-- Restrict direct client mutation of blockchain records. Real anchoring is performed
-- by a trusted server-side function after verification.
DROP POLICY IF EXISTS "Blockchain records public read" ON public.blockchain_records;
CREATE POLICY "Blockchain records authenticated read"
  ON public.blockchain_records FOR SELECT TO authenticated USING (true);

-- Store a small immutable audit-anchor payload separately from the source MRV data.
CREATE TABLE IF NOT EXISTS public.mrv_blockchain_anchors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES public.mrv_submissions(id) ON DELETE CASCADE,
  verification_case_id UUID REFERENCES public.verification_cases(id) ON DELETE SET NULL,
  data_hash TEXT NOT NULL UNIQUE,
  network_id UUID NOT NULL REFERENCES public.blockchain_networks(id) ON DELETE RESTRICT,
  contract_id UUID REFERENCES public.smart_contracts(id) ON DELETE SET NULL,
  blockchain_record_id UUID REFERENCES public.blockchain_records(id) ON DELETE SET NULL,
  tx_hash TEXT,
  block_number BIGINT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','CONFIRMED','FAILED')),
  error_message TEXT,
  requested_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  confirmed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS mrv_blockchain_anchors_submission_idx
  ON public.mrv_blockchain_anchors(submission_id);

ALTER TABLE public.mrv_blockchain_anchors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "MRV anchors authenticated read" ON public.mrv_blockchain_anchors;
CREATE POLICY "MRV anchors authenticated read"
  ON public.mrv_blockchain_anchors FOR SELECT TO authenticated USING (true);

-- No INSERT/UPDATE/DELETE policy is intentionally exposed to the browser.
-- The trusted Edge Function uses the service role to create/update anchors.
