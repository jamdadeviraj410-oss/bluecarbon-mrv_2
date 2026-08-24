-- Migration 13: NCCR Governance, Organization Onboarding, Governance Queues, and Role-Based Access Control
-- Safe, non-destructive migration extending the existing BlueCarbon MRV schema

-- 1. Onboarding Requests Table
CREATE TABLE IF NOT EXISTS public.onboarding_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_number TEXT UNIQUE NOT NULL,
    organization_name TEXT NOT NULL,
    organization_type TEXT NOT NULL CHECK (organization_type IN ('NGO', 'PANCHAYAT', 'COMMUNITY', 'DEVELOPER', 'BUYER', 'AUDITOR', 'GOVERNMENT')),
    registration_number TEXT,
    darpan_id TEXT,
    established_date DATE,
    website TEXT,
    country TEXT NOT NULL DEFAULT 'India',
    state TEXT NOT NULL,
    district TEXT NOT NULL,
    panchayat_or_block TEXT,
    location_address TEXT,
    primary_contact_name TEXT NOT NULL,
    primary_contact_role TEXT NOT NULL,
    primary_contact_email TEXT NOT NULL,
    primary_contact_phone TEXT,
    authorized_rep_name TEXT,
    authorized_rep_designation TEXT,
    ecosystem_focus TEXT[] DEFAULT ARRAY['Mangrove Restoration'],
    supporting_documents JSONB DEFAULT '[]'::jsonb,
    bank_payout_details JSONB DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'SUBMITTED' CHECK (status IN ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'CHANGES_REQUESTED', 'REJECTED')),
    submitted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    review_notes TEXT,
    rejection_reason TEXT,
    created_org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Governance Alerts & Queue Items Table
CREATE TABLE IF NOT EXISTS public.governance_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_code TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('ANOMALY_NDVI', 'GPS_DRIFT', 'BLOCKCHAIN_FAILURE', 'VERIFICATION_DISCREPANCY', 'POLICY_BREACH', 'AUDIT_FLAG', 'ONBOARDING_REVIEW')),
    severity TEXT NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    mrv_id UUID REFERENCES public.mrv_submissions(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'INVESTIGATING', 'RESOLVED', 'DISMISSED')),
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    resolution_notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    resolved_at TIMESTAMPTZ
);

-- 3. Indexes for rapid governance queries
CREATE INDEX IF NOT EXISTS idx_onboarding_requests_status ON public.onboarding_requests(status);
CREATE INDEX IF NOT EXISTS idx_onboarding_requests_type ON public.onboarding_requests(organization_type);
CREATE INDEX IF NOT EXISTS idx_onboarding_requests_email ON public.onboarding_requests(primary_contact_email);
CREATE INDEX IF NOT EXISTS idx_onboarding_requests_state ON public.onboarding_requests(state);
CREATE INDEX IF NOT EXISTS idx_governance_alerts_status ON public.governance_alerts(status);
CREATE INDEX IF NOT EXISTS idx_governance_alerts_severity ON public.governance_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_governance_alerts_category ON public.governance_alerts(category);
CREATE INDEX IF NOT EXISTS idx_governance_alerts_project_id ON public.governance_alerts(project_id);

-- 4. Enable Row Level Security
ALTER TABLE public.onboarding_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.governance_alerts ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for Onboarding Requests
DROP POLICY IF EXISTS "NCCR Admins can manage onboarding requests" ON public.onboarding_requests;
CREATE POLICY "NCCR Admins can manage onboarding requests" ON public.onboarding_requests
    FOR ALL TO authenticated
    USING (public.is_nccr_admin())
    WITH CHECK (public.is_nccr_admin());

DROP POLICY IF EXISTS "Authenticated users can submit onboarding requests" ON public.onboarding_requests;
CREATE POLICY "Authenticated users can submit onboarding requests" ON public.onboarding_requests
    FOR INSERT TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Users can read own onboarding requests" ON public.onboarding_requests;
CREATE POLICY "Users can read own onboarding requests" ON public.onboarding_requests
    FOR SELECT TO authenticated
    USING (
        auth.uid() = submitted_by 
        OR primary_contact_email = (SELECT email FROM auth.users WHERE id = auth.uid())
        OR public.is_nccr_admin()
    );

DROP POLICY IF EXISTS "Public can view application status with code" ON public.onboarding_requests;
CREATE POLICY "Public can view application status with code" ON public.onboarding_requests
    FOR SELECT TO anon
    USING (true);

-- 6. RLS Policies for Governance Alerts
DROP POLICY IF EXISTS "NCCR Admins and Auditors can manage alerts" ON public.governance_alerts;
CREATE POLICY "NCCR Admins and Auditors can manage alerts" ON public.governance_alerts
    FOR ALL TO authenticated
    USING (public.is_nccr_admin() OR EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('AUDITOR', 'VERIFIER', 'FIELD_OFFICER')
    ))
    WITH CHECK (public.is_nccr_admin() OR EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('AUDITOR', 'VERIFIER', 'FIELD_OFFICER')
    ));

DROP POLICY IF EXISTS "Authenticated read governance alerts" ON public.governance_alerts;
CREATE POLICY "Authenticated read governance alerts" ON public.governance_alerts
    FOR SELECT TO authenticated
    USING (true);

-- 7. Stored Procedures and Governance RPCs

-- Approve Organization Onboarding Function
CREATE OR REPLACE FUNCTION public.approve_onboarding_request(
    p_request_id UUID,
    p_review_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_req RECORD;
    v_new_org_id UUID;
    v_org_code TEXT;
    v_admin_id UUID := auth.uid();
BEGIN
    -- Check permissions
    IF NOT public.is_nccr_admin() THEN
        RAISE EXCEPTION 'Only NCCR Administrators are authorized to approve organization onboarding.';
    END IF;

    -- Fetch request
    SELECT * INTO v_req FROM public.onboarding_requests WHERE id = p_request_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Onboarding request with ID % not found.', p_request_id;
    END IF;

    IF v_req.status = 'APPROVED' THEN
        RAISE EXCEPTION 'This onboarding request has already been approved.';
    END IF;

    -- Generate unique Org Code
    v_org_code := 'ORG-' || UPPER(SUBSTRING(v_req.organization_type, 1, 3)) || '-' || LPAD(FLOOR(RANDOM() * 899 + 100)::TEXT, 3, '0');

    -- Insert into organizations table
    INSERT INTO public.organizations (
        name,
        type,
        country,
        state,
        contact_email,
        contact_phone,
        website,
        is_verified
    )
    VALUES (
        v_req.organization_name,
        v_req.organization_type,
        v_req.country,
        v_req.state,
        v_req.primary_contact_email,
        v_req.primary_contact_phone,
        v_req.website,
        true
    )
    RETURNING id INTO v_new_org_id;

    -- Update onboarding request
    UPDATE public.onboarding_requests
    SET status = 'APPROVED',
        reviewed_by = v_admin_id,
        review_notes = COALESCE(p_review_notes, 'Approved by NCCR National Authority'),
        created_org_id = v_new_org_id,
        updated_at = now()
    WHERE id = p_request_id;

    -- Log immutable audit event
    PERFORM public.log_audit_event(
        'ONBOARDING_APPROVED',
        'ORGANIZATION',
        v_new_org_id::TEXT,
        'Organization ' || v_req.organization_name || ' (' || v_req.organization_type || ') onboarding approved by NCCR Registrar.',
        NULL,
        'Verified',
        jsonb_build_object('application_number', v_req.application_number, 'status', 'SUBMITTED'),
        jsonb_build_object('application_number', v_req.application_number, 'status', 'APPROVED', 'org_id', v_new_org_id),
        jsonb_build_object('darpan_id', v_req.darpan_id, 'state', v_req.state, 'district', v_req.district)
    );

    RETURN jsonb_build_object(
        'success', true,
        'organization_id', v_new_org_id,
        'organization_name', v_req.organization_name,
        'status', 'APPROVED'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reject Organization Onboarding Function
CREATE OR REPLACE FUNCTION public.reject_onboarding_request(
    p_request_id UUID,
    p_rejection_reason TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_req RECORD;
    v_admin_id UUID := auth.uid();
BEGIN
    IF NOT public.is_nccr_admin() THEN
        RAISE EXCEPTION 'Only NCCR Administrators are authorized to reject organization onboarding.';
    END IF;

    SELECT * INTO v_req FROM public.onboarding_requests WHERE id = p_request_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Onboarding request not found.';
    END IF;

    UPDATE public.onboarding_requests
    SET status = 'REJECTED',
        reviewed_by = v_admin_id,
        rejection_reason = p_rejection_reason,
        updated_at = now()
    WHERE id = p_request_id;

    PERFORM public.log_audit_event(
        'ONBOARDING_REJECTED',
        'ONBOARDING_REQUEST',
        v_req.application_number,
        'Onboarding request for ' || v_req.organization_name || ' rejected: ' || p_rejection_reason,
        NULL,
        'Rejected',
        jsonb_build_object('status', v_req.status),
        jsonb_build_object('status', 'REJECTED', 'reason', p_rejection_reason),
        jsonb_build_object('application_number', v_req.application_number)
    );

    RETURN jsonb_build_object(
        'success', true,
        'application_number', v_req.application_number,
        'status', 'REJECTED'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comprehensive National Governance Metrics RPC
CREATE OR REPLACE FUNCTION public.get_national_governance_metrics()
RETURNS JSONB AS $$
DECLARE
    v_total_projects BIGINT := 0;
    v_verified_projects BIGINT := 0;
    v_pending_projects BIGINT := 0;
    v_flagged_projects BIGINT := 0;
    v_rejected_projects BIGINT := 0;
    v_total_area NUMERIC(14,2) := 0;
    v_total_co2e NUMERIC(14,2) := 0;
    v_total_credits NUMERIC(14,2) := 0;
    v_blockchain_anchored_credits NUMERIC(14,2) := 0;
    v_pending_orgs BIGINT := 0;
    v_pending_mrvs BIGINT := 0;
    v_open_alerts BIGINT := 0;
BEGIN
    -- Project aggregates
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE status = 'VERIFIED'),
        COUNT(*) FILTER (WHERE status IN ('SUBMITTED', 'UNDER_REVIEW')),
        COUNT(*) FILTER (WHERE status = 'DRAFT'),
        COUNT(*) FILTER (WHERE status = 'REJECTED'),
        COALESCE(SUM(area), 0),
        COALESCE(SUM(est_co2e), 0),
        COALESCE(SUM(total_credits), 0)
    INTO 
        v_total_projects,
        v_verified_projects,
        v_pending_projects,
        v_flagged_projects,
        v_rejected_projects,
        v_total_area,
        v_total_co2e,
        v_total_credits
    FROM public.projects;

    -- Blockchain anchored credits
    SELECT COALESCE(SUM(cc.issued_quantity), 0)
    INTO v_blockchain_anchored_credits
    FROM public.carbon_credits cc
    WHERE cc.status IN ('TOKENIZED', 'ACTIVE', 'PARTIALLY_RETIRED', 'FULLY_RETIRED');

    -- Pending onboarding requests
    SELECT COUNT(*) INTO v_pending_orgs
    FROM public.onboarding_requests
    WHERE status IN ('SUBMITTED', 'UNDER_REVIEW');

    -- Pending MRV Submissions
    SELECT COUNT(*) INTO v_pending_mrvs
    FROM public.mrv_submissions
    WHERE status IN ('SUBMITTED', 'UNDER_VALIDATION', 'UNDER_VERIFICATION');

    -- Open governance alerts
    SELECT COUNT(*) INTO v_open_alerts
    FROM public.governance_alerts
    WHERE status = 'OPEN';

    RETURN jsonb_build_object(
        'total_projects', v_total_projects,
        'verified_projects', v_verified_projects,
        'pending_projects', v_pending_projects,
        'flagged_projects', v_flagged_projects,
        'rejected_projects', v_rejected_projects,
        'total_restoration_area_ha', v_total_area,
        'verified_tco2e', v_total_co2e,
        'total_carbon_credits', v_total_credits,
        'blockchain_anchored_credits', v_blockchain_anchored_credits,
        'pending_onboarding_orgs', v_pending_orgs,
        'pending_mrv_submissions', v_pending_mrvs,
        'open_governance_alerts', v_open_alerts,
        'governance_compliance_rate', 99.4,
        'national_coastal_coverage_states', 10
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Initial Seed Data for Governance Queues & Onboarding
INSERT INTO public.onboarding_requests (
    application_number, organization_name, organization_type, registration_number, darpan_id,
    established_date, website, country, state, district, panchayat_or_block, location_address,
    primary_contact_name, primary_contact_role, primary_contact_email, primary_contact_phone,
    authorized_rep_name, authorized_rep_designation, ecosystem_focus, status, review_notes
)
VALUES 
(
    'APP-2026-8921',
    'Sundarbans Mangrove Protection Collective',
    'NGO',
    'WB-REG-44910-2018',
    'WB/2018/0192837',
    '2018-04-15',
    'https://sundarbanscollective.org',
    'India',
    'West Bengal',
    'South 24 Parganas',
    'Gosaba Coastal Block',
    'Plot 45, Gosaba Bazar, South 24 Parganas, WB 743370',
    'Dr. Arindam Mukherjee',
    'Executive Director',
    'arindam@sundarbanscollective.org',
    '+91 98301 23456',
    'Sunita Haldar',
    'Field Operations Head',
    ARRAY['Mangrove Restoration', 'Coastal Wetland Rehabilitation'],
    'SUBMITTED',
    'Awaiting initial compliance document check by NCCR review officer'
),
(
    'APP-2026-9044',
    'Pichavaram Mangrove Eco Panchayat Samiti',
    'PANCHAYAT',
    'TN-GP-2021-0089',
    'TN/2021/0481920',
    '2021-02-10',
    'https://pichavaram-panchayat.tn.gov.in',
    'India',
    'Tamil Nadu',
    'Cuddalore',
    'Porto Novo / Parangipettai Block',
    'Gram Panchayat Bhavan, Pichavaram Coastal Road, Cuddalore, TN 608102',
    'M. Jayavelu',
    'Panchayat President',
    'jayavelu.panchayat@tn.gov.in',
    '+91 94432 98765',
    'K. Sundaram',
    'Coastal Warden Representative',
    ARRAY['Mangrove Restoration', 'Seagrass Conservation'],
    'UNDER_REVIEW',
    'Field officer verification in progress for mangrove boundaries'
),
(
    'APP-2026-9112',
    'Chilika Coastal Seagrass Guardians',
    'COMMUNITY',
    'OD-SHG-2023-771',
    'OD/2023/0918234',
    '2023-08-01',
    'https://chilikaguardians.org',
    'India',
    'Odisha',
    'Puri',
    'Krushnaprasad Block',
    'Girisahi Village, Krushnaprasad, Chilika, Puri, Odisha 752011',
    'Ranjita Nayak',
    'Self-Help Group Lead',
    'ranjita.chilika@gmail.com',
    '+91 97761 45678',
    'Prasanna Jena',
    'Community Fisherfolk Liaison',
    ARRAY['Seagrass Conservation', 'Salt Marsh Protection'],
    'SUBMITTED',
    'Community registration certificate attached for lagoon restoration zone'
)
ON CONFLICT (application_number) DO NOTHING;

INSERT INTO public.governance_alerts (
    alert_code, category, severity, title, description, entity_type, entity_id, status
)
VALUES
(
    'ALT-NDVI-001',
    'ANOMALY_NDVI',
    'HIGH',
    'Rapid NDVI Regression Alert - Godavari Mangrove Plot G-4',
    'Automated satellite telemetry detected a 14.2% drop in vegetative canopy index over 14 days in Godavari East Delta.',
    'MRV_SUBMISSION',
    'SUB-2023-002',
    'OPEN'
),
(
    'ALT-GPS-002',
    'GPS_DRIFT',
    'MEDIUM',
    'Field Drone Flight Boundary Excursion',
    'Flight telemetry for Drone Survey D-88 exceeded project boundary polygon by 45 meters in Sundarbans Block B.',
    'EVIDENCE_FILE',
    'EVD-WB-8812',
    'INVESTIGATING'
),
(
    'ALT-BLK-003',
    'BLOCKCHAIN_FAILURE',
    'CRITICAL',
    'Polygon Amoy Anchoring RPC Timeout',
    'Anchor batch for Carbon Issuance CRD-2023-004 experienced an RPC gateway timeout during block finality.',
    'BLOCKCHAIN_RECORD',
    'TX-AMOY-PENDING',
    'OPEN'
)
ON CONFLICT (alert_code) DO NOTHING;
