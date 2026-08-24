-- Migration 6: Carbon Calculations, Carbon Credits, Blockchain Ledger, Smart Contracts, Retirement

-- 1. Carbon Calculations Table
CREATE TABLE IF NOT EXISTS public.carbon_calculations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    calculation_code TEXT UNIQUE NOT NULL,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    submission_id UUID NOT NULL REFERENCES public.mrv_submissions(id) ON DELETE CASCADE,
    verification_case_id UUID REFERENCES public.verification_cases(id) ON DELETE SET NULL,
    methodology TEXT NOT NULL CHECK (methodology IN ('VM0033', 'VM0007', 'IPCC_TIER_3', 'NCCR_BLUE_CARBON_V1')),
    baseline_carbon_tco2e NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    project_carbon_tco2e NUMERIC(12,2) NOT NULL,
    buffer_pool_deduction_percent NUMERIC(5,2) DEFAULT 10.00,
    uncertainty_deduction_percent NUMERIC(5,2) DEFAULT 5.00,
    leakage_deduction_percent NUMERIC(5,2) DEFAULT 0.00,
    net_eligible_credits NUMERIC(12,2) NOT NULL,
    formula_parameters JSONB DEFAULT '{}'::jsonb,
    calculated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Blockchain Networks Table
CREATE TABLE IF NOT EXISTS public.blockchain_networks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    chain_id BIGINT NOT NULL UNIQUE,
    network_type TEXT NOT NULL CHECK (network_type IN ('MAINNET', 'TESTNET', 'SIMULATED')),
    rpc_endpoint TEXT,
    explorer_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Smart Contracts Table
CREATE TABLE IF NOT EXISTS public.smart_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    network_id UUID NOT NULL REFERENCES public.blockchain_networks(id) ON DELETE CASCADE,
    contract_name TEXT NOT NULL,
    contract_address TEXT NOT NULL UNIQUE,
    token_standard TEXT NOT NULL CHECK (token_standard IN ('ERC1155', 'ERC721', 'ERC20')),
    abi JSONB,
    deployed_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Carbon Credits Table
CREATE TABLE IF NOT EXISTS public.carbon_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    credit_code TEXT UNIQUE NOT NULL,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    submission_id UUID NOT NULL REFERENCES public.mrv_submissions(id) ON DELETE CASCADE,
    verification_case_id UUID REFERENCES public.verification_cases(id) ON DELETE SET NULL,
    calculation_id UUID REFERENCES public.carbon_calculations(id) ON DELETE SET NULL,
    vintage_year INT NOT NULL,
    methodology TEXT NOT NULL,
    issued_quantity NUMERIC(12,2) NOT NULL CHECK (issued_quantity > 0),
    available_quantity NUMERIC(12,2) NOT NULL CHECK (available_quantity >= 0),
    retired_quantity NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (retired_quantity >= 0),
    unit_price_usd NUMERIC(10,2) DEFAULT 25.00,
    status TEXT NOT NULL DEFAULT 'ISSUED' CHECK (status IN ('PENDING_APPROVAL', 'ISSUED', 'TOKENIZED', 'ACTIVE', 'PARTIALLY_RETIRED', 'FULLY_RETIRED', 'CANCELLED')),
    issuer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT chk_credit_quantities CHECK (available_quantity + retired_quantity <= issued_quantity)
);

-- 5. Carbon Credit Transactions Table
CREATE TABLE IF NOT EXISTS public.carbon_credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tx_code TEXT UNIQUE NOT NULL,
    credit_id UUID NOT NULL REFERENCES public.carbon_credits(id) ON DELETE CASCADE,
    tx_type TEXT NOT NULL CHECK (tx_type IN ('ISSUANCE', 'TOKENIZATION', 'TRANSFER', 'RETIREMENT', 'BUY_ORDER')),
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    from_entity TEXT,
    to_entity TEXT,
    price_per_unit_usd NUMERIC(10,2),
    initiated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    tx_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Credit Retirements Table
CREATE TABLE IF NOT EXISTS public.credit_retirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    certificate_code TEXT UNIQUE NOT NULL,
    credit_id UUID NOT NULL REFERENCES public.carbon_credits(id) ON DELETE CASCADE,
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    beneficiary_name TEXT NOT NULL,
    beneficiary_country TEXT DEFAULT 'India',
    retirement_reason TEXT NOT NULL,
    certificate_url TEXT,
    retired_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    tx_hash TEXT,
    retired_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Blockchain Records Table
CREATE TABLE IF NOT EXISTS public.blockchain_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_code TEXT UNIQUE NOT NULL,
    credit_id UUID REFERENCES public.carbon_credits(id) ON DELETE SET NULL,
    network_id UUID NOT NULL REFERENCES public.blockchain_networks(id) ON DELETE RESTRICT,
    contract_id UUID REFERENCES public.smart_contracts(id) ON DELETE SET NULL,
    tx_hash TEXT UNIQUE NOT NULL,
    block_number BIGINT NOT NULL,
    token_id TEXT,
    record_type TEXT NOT NULL CHECK (record_type IN ('MINT', 'TRANSFER', 'RETIRE', 'AUDIT_ANCHOR')),
    payload JSONB DEFAULT '{}'::jsonb,
    gas_used BIGINT,
    status TEXT NOT NULL DEFAULT 'CONFIRMED' CHECK (status IN ('PENDING', 'CONFIRMED', 'FAILED')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Blockchain Lifecycle Events Table
CREATE TABLE IF NOT EXISTS public.blockchain_lifecycle_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id UUID NOT NULL REFERENCES public.blockchain_records(id) ON DELETE CASCADE,
    credit_id UUID REFERENCES public.carbon_credits(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    state_delta JSONB NOT NULL,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);
