-- Migration 4: MRV, Evidence, Storage and Verification Domain Schema

-- 1. MRV Submissions Table
CREATE TABLE IF NOT EXISTS public.mrv_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_code TEXT UNIQUE NOT NULL,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SUBMITTED', 'UNDER_VALIDATION', 'VALIDATED', 'UNDER_VERIFICATION', 'VERIFIED', 'REJECTED')),
    carbon_estimate NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    claimed_metrics JSONB DEFAULT '{}'::jsonb,
    submitted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    submitted_at TIMESTAMPTZ,
    verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Evidence Files Table
CREATE TABLE IF NOT EXISTS public.evidence_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES public.mrv_submissions(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    sha256_hash TEXT NOT NULL,
    uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    validation_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (validation_status IN ('PENDING', 'VALIDATED', 'FLAGGED', 'REJECTED')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Evidence Metadata Table
CREATE TABLE IF NOT EXISTS public.evidence_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evidence_id UUID NOT NULL REFERENCES public.evidence_files(id) ON DELETE CASCADE,
    captured_at TIMESTAMPTZ,
    device_model TEXT,
    drone_sensor_type TEXT,
    latitude NUMERIC(10,6),
    longitude NUMERIC(10,6),
    altitude_meters NUMERIC(8,2),
    ndvi_mean NUMERIC(6,4),
    canopy_cover_percent NUMERIC(5,2),
    raw_exif JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Evidence Validation Results Table
CREATE TABLE IF NOT EXISTS public.evidence_validation_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evidence_id UUID NOT NULL REFERENCES public.evidence_files(id) ON DELETE CASCADE,
    rule_name TEXT NOT NULL,
    is_passed BOOLEAN NOT NULL,
    score NUMERIC(5,2) DEFAULT 100.00,
    details TEXT,
    validated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. MRV Measurements Table
CREATE TABLE IF NOT EXISTS public.mrv_measurements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES public.mrv_submissions(id) ON DELETE CASCADE,
    evidence_id UUID REFERENCES public.evidence_files(id) ON DELETE SET NULL,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    plot_id TEXT NOT NULL,
    sample_type TEXT NOT NULL CHECK (sample_type IN ('SOIL_CORE', 'CANOPY_SURVEY', 'TREE_DIAMETER_DBH', 'SEDIMENT_SALINITY', 'BIOMASS_DENSITY')),
    measured_value NUMERIC(12,4) NOT NULL,
    unit TEXT NOT NULL,
    confidence_interval NUMERIC(5,2) DEFAULT 95.00,
    measured_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Verification Cases Table
CREATE TABLE IF NOT EXISTS public.verification_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_code TEXT UNIQUE NOT NULL,
    submission_id UUID NOT NULL REFERENCES public.mrv_submissions(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    lead_auditor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'ASSIGNED' CHECK (status IN ('ASSIGNED', 'IN_PROGRESS', 'FINDINGS_ISSUED', 'RECOMMENDED_APPROVAL', 'APPROVED', 'REJECTED')),
    overall_confidence_score NUMERIC(5,2),
    auditor_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Verification Reviews Table
CREATE TABLE IF NOT EXISTS public.verification_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    verification_case_id UUID NOT NULL REFERENCES public.verification_cases(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    recommendation TEXT NOT NULL CHECK (recommendation IN ('APPROVE', 'REJECT', 'REQUEST_CHANGES')),
    comments TEXT,
    signed_hash TEXT,
    reviewed_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Verification Findings Table
CREATE TABLE IF NOT EXISTS public.verification_findings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    verification_case_id UUID NOT NULL REFERENCES public.verification_cases(id) ON DELETE CASCADE,
    evidence_id UUID REFERENCES public.evidence_files(id) ON DELETE SET NULL,
    severity TEXT NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    category TEXT NOT NULL CHECK (category IN ('METRIC_DISCREPANCY', 'IMAGE_RESOLUTION_LOW', 'GPS_DRIFT', 'DATE_MISMATCH', 'CORRUPT_TELEMETRY')),
    description TEXT NOT NULL,
    is_resolved BOOLEAN DEFAULT false,
    resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create secure storage bucket for evidence
INSERT INTO storage.buckets (id, name, public)
VALUES ('evidence-vault', 'evidence-vault', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies
CREATE POLICY "Evidence Vault Upload Policy" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'evidence-vault');

CREATE POLICY "Evidence Vault Read Policy" ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = 'evidence-vault');

CREATE POLICY "Evidence Vault Delete Policy" ON storage.objects
    FOR DELETE TO authenticated
    USING (
        bucket_id = 'evidence-vault'
        AND (public.is_nccr_admin() OR auth.uid() = owner)
    );
