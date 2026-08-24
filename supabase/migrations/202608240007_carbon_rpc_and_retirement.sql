-- Migration 7: Carbon Sequestration Calculation, Credit Issuance, and Atomic Retirement RPCs

CREATE OR REPLACE FUNCTION public.calculate_net_carbon_sequestration(
    p_gross NUMERIC,
    p_baseline NUMERIC DEFAULT 0.00,
    p_leakage NUMERIC DEFAULT 0.00,
    p_uncertainty NUMERIC DEFAULT 0.00,
    p_buffer NUMERIC DEFAULT 0.00
)
RETURNS NUMERIC AS $$
DECLARE
    v_net NUMERIC;
BEGIN
    v_net := COALESCE(p_gross, 0.00) - COALESCE(p_baseline, 0.00) - COALESCE(p_leakage, 0.00) - COALESCE(p_uncertainty, 0.00) - COALESCE(p_buffer, 0.00);
    IF v_net < 0 THEN
        v_net := 0.00;
    END IF;
    RETURN ROUND(v_net, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION public.retire_carbon_credit(
    p_credit_id UUID,
    p_amount NUMERIC,
    p_beneficiary_name TEXT,
    p_retirement_reason TEXT,
    p_beneficiary_country TEXT DEFAULT 'India'
)
RETURNS JSONB AS $$
DECLARE
    v_credit RECORD;
    v_cert_code TEXT;
    v_tx_hash TEXT;
    v_block_number BIGINT;
    v_new_available NUMERIC;
    v_new_retired NUMERIC;
    v_new_status TEXT;
    v_retire_id UUID;
    v_network_id UUID;
    v_user_id UUID := auth.uid();
BEGIN
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Retirement amount must be strictly greater than 0.';
    END IF;

    SELECT * INTO v_credit
    FROM public.carbon_credits
    WHERE id = p_credit_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Carbon credit with ID % not found.', p_credit_id;
    END IF;

    IF v_credit.available_quantity < p_amount THEN
        RAISE EXCEPTION 'Insufficient available credits. Requested: %, Available: %', p_amount, v_credit.available_quantity;
    END IF;

    v_new_available := v_credit.available_quantity - p_amount;
    v_new_retired := v_credit.retired_quantity + p_amount;

    IF v_new_available = 0 THEN
        v_new_status := 'FULLY_RETIRED';
    ELSE
        v_new_status := 'PARTIALLY_RETIRED';
    END IF;

    UPDATE public.carbon_credits
    SET
        available_quantity = v_new_available,
        retired_quantity = v_new_retired,
        status = v_new_status,
        updated_at = now()
    WHERE id = p_credit_id;

    v_cert_code := 'RET-CERT-' || to_char(now(), 'YYYY') || '-' || (floor(random() * 89999 + 10000))::TEXT;
    v_tx_hash := NULL;
    v_block_number := NULL;

    INSERT INTO public.credit_retirements (
        certificate_code,
        credit_id,
        amount,
        beneficiary_name,
        beneficiary_country,
        retirement_reason,
        retired_by,
        tx_hash,
        retired_at
    )
    VALUES (
        v_cert_code,
        p_credit_id,
        p_amount,
        p_beneficiary_name,
        p_beneficiary_country,
        p_retirement_reason,
        v_user_id,
        NULL,
        now()
    )
    RETURNING id INTO v_retire_id;

    INSERT INTO public.carbon_credit_transactions (
        tx_code,
        credit_id,
        tx_type,
        amount,
        from_entity,
        to_entity,
        price_per_unit_usd,
        initiated_by,
        tx_hash
    )
    VALUES (
        'TX-RET-' || (floor(random() * 899999 + 100000))::TEXT,
        p_credit_id,
        'RETIREMENT',
        p_amount,
        'Active Registry Pool',
        p_beneficiary_name,
        v_credit.unit_price_usd,
        v_user_id,
        NULL
    );

    RETURN jsonb_build_object(
        'success', true,
        'certificateCode', v_cert_code,
        'creditId', p_credit_id,
        'amountRetired', p_amount,
        'remainingAvailable', v_new_available,
        'totalRetired', v_new_retired,
        'status', v_new_status,
        'txHash', NULL,
        'blockNumber', NULL,
        'beneficiaryName', p_beneficiary_name,
        'retirementReason', p_retirement_reason,
        'retiredAt', now()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_carbon_credit_stats_rpc()
RETURNS JSONB AS $$
DECLARE
    v_total_issued NUMERIC;
    v_total_available NUMERIC;
    v_total_retired NUMERIC;
    v_active_credits_count BIGINT;
    v_total_retirements_count BIGINT;
BEGIN
    SELECT
        COALESCE(SUM(issued_quantity), 0),
        COALESCE(SUM(available_quantity), 0),
        COALESCE(SUM(retired_quantity), 0),
        COUNT(*)
    INTO
        v_total_issued,
        v_total_available,
        v_total_retired,
        v_active_credits_count
    FROM public.carbon_credits;

    SELECT COUNT(*) INTO v_total_retirements_count FROM public.credit_retirements;

    RETURN jsonb_build_object(
        'totalIssued', v_total_issued,
        'totalAvailable', v_total_available,
        'totalRetired', v_total_retired,
        'activeCreditsCount', v_active_credits_count,
        'totalRetirementsCount', v_total_retirements_count
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
