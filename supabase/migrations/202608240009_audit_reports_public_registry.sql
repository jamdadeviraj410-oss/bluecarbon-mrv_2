-- Migration 9: Audit Logs, Immutability Trigger, Reports, Community Tables, and Public Registry View

-- 1. Central Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ref_id TEXT UNIQUE NOT NULL,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    actor_name TEXT NOT NULL DEFAULT 'System',
    actor_role TEXT DEFAULT 'USER',
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    organization_name TEXT,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    project_name TEXT,
    description TEXT NOT NULL,
    previous_value JSONB,
    new_value JSONB,
    status TEXT DEFAULT 'Verified',
    ip_address TEXT DEFAULT '127.0.0.1',
    tx_hash TEXT,
    block_number BIGINT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Immutability enforcement trigger on audit_logs (append-only)
CREATE OR REPLACE FUNCTION public.prevent_audit_log_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit logs are strictly append-only and cannot be modified or deleted.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_audit_update ON public.audit_logs;
CREATE TRIGGER trg_prevent_audit_update
    BEFORE UPDATE OR DELETE ON public.audit_logs
    FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_log_mutation();

-- 2. Shared Audit Logging Helper Function
CREATE OR REPLACE FUNCTION public.log_audit_event(
    p_action TEXT,
    p_entity_type TEXT,
    p_entity_id TEXT,
    p_description TEXT,
    p_project_id UUID DEFAULT NULL,
    p_status TEXT DEFAULT 'Verified',
    p_prev_val JSONB DEFAULT NULL,
    p_new_val JSONB DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
    v_ref_id TEXT;
    v_user_id UUID := auth.uid();
    v_user_name TEXT := 'System Auto';
    v_user_role TEXT := 'SYSTEM';
    v_org_id UUID;
    v_org_name TEXT := '-';
    v_proj_name TEXT;
BEGIN
    IF v_user_id IS NOT NULL THEN
        SELECT full_name, role INTO v_user_name, v_user_role FROM public.profiles WHERE id = v_user_id;
        SELECT organization_id INTO v_org_id FROM public.organization_members WHERE user_id = v_user_id LIMIT 1;
        IF v_org_id IS NOT NULL THEN
            SELECT name INTO v_org_name FROM public.organizations WHERE id = v_org_id;
        END IF;
    END IF;

    IF p_project_id IS NOT NULL THEN
        SELECT name INTO v_proj_name FROM public.projects WHERE id = p_project_id;
    END IF;

    v_ref_id := 'ACT-' || (floor(random() * 8999 + 1000))::TEXT;

    INSERT INTO public.audit_logs (
        ref_id,
        actor_id,
        actor_name,
        actor_role,
        organization_id,
        organization_name,
        action,
        entity_type,
        entity_id,
        project_id,
        project_name,
        description,
        previous_value,
        new_value,
        status,
        metadata
    )
    VALUES (
        v_ref_id,
        v_user_id,
        COALESCE(v_user_name, 'System Auto'),
        COALESCE(v_user_role, 'SYSTEM'),
        v_org_id,
        v_org_name,
        p_action,
        p_entity_type,
        p_entity_id,
        p_project_id,
        v_proj_name,
        p_description,
        p_prev_val,
        p_new_val,
        COALESCE(p_status, 'Verified'),
        p_metadata
    )
    RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Reports & Analytics Table
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_code TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    report_type TEXT NOT NULL,
    description TEXT,
    parameters JSONB DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'COMPLETED' CHECK (status IN ('PENDING', 'GENERATING', 'COMPLETED', 'FAILED')),
    generated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    generated_by_name TEXT,
    period TEXT DEFAULT 'Q3 2023',
    data_summary JSONB DEFAULT '{}'::jsonb,
    export_formats TEXT[] DEFAULT ARRAY['CSV', 'JSON', 'PDF'],
    created_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Community Profiles & Engagement Tables
CREATE TABLE IF NOT EXISTS public.community_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    community_name TEXT NOT NULL,
    role TEXT DEFAULT 'PANCHAYAT',
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.community_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID REFERENCES public.community_profiles(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    role_in_project TEXT DEFAULT 'FIELD_MONITOR',
    assigned_area_ha NUMERIC(10,2) DEFAULT 0.00,
    planted_trees INT DEFAULT 0,
    active_field_volunteers INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.community_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID REFERENCES public.community_profiles(id) ON DELETE SET NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,
    title TEXT NOT NULL,
    detail TEXT,
    icon TEXT DEFAULT 'upload_file',
    icon_bg TEXT DEFAULT 'bg-surface-container-high',
    actor_name TEXT,
    has_image BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. System Settings Table
CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Public Registry Secure Database View (Strictly excluding private data)
CREATE OR REPLACE VIEW public.public_registry_entries AS
SELECT
    p.id AS project_db_id,
    p.project_code AS id,
    p.name AS name,
    p.location AS location,
    p.country AS country,
    p.type AS type,
    to_char(p.created_at, 'YYYY') AS est_year,
    o.name AS developer,
    'Project Developer' AS developer_role,
    CASE 
        WHEN p.status = 'VERIFIED' THEN 'Verified Active'
        WHEN p.status = 'UNDER_REVIEW' THEN 'In Review'
        WHEN p.status = 'ACTIVE' THEN 'Active'
        ELSE 'Registered'
    END AS status,
    CASE 
        WHEN p.status = 'VERIFIED' THEN 'verified'
        WHEN p.status = 'UNDER_REVIEW' THEN 'pending'
        ELSE 'registered'
    END AS status_category,
    COALESCE(to_char(p.est_co2e, 'FM999,999,999.00'), '0') AS total_sequestered,
    COALESCE(p.est_co2e, 0) AS total_sequestered_num,
    to_char(p.area, 'FM999,999.00') AS area_coverage,
    p.area AS area_coverage_ha,
    COALESCE(cc.unit_price_usd, 28.00) AS credit_price,
    '$' || COALESCE(cc.unit_price_usd::TEXT, '28') || ' / tCO2e' AS price_display,
    p.metadata->>'imageUrl' AS image_url,
    p.description AS description,
    jsonb_build_object('lat', p.latitude, 'lng', p.longitude) AS coordinates,
    p.created_at
FROM public.projects p
LEFT JOIN public.organizations o ON p.organization_id = o.id
LEFT JOIN LATERAL (
    SELECT unit_price_usd FROM public.carbon_credits
    WHERE project_id = p.id
    ORDER BY created_at DESC
    LIMIT 1
) cc ON true
WHERE p.status IN ('VERIFIED', 'ACTIVE', 'UNDER_REVIEW', 'COMPLETED');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_project ON public.audit_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_reports_type ON public.reports(report_type);

-- RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- RLS role helper used by the reports management policy.
CREATE OR REPLACE FUNCTION public.is_auditor()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
          AND role = 'AUDITOR'
    );
END;
$$;

CREATE POLICY "Audit Logs Read Policy" ON public.audit_logs
    FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "Audit Logs Insert Policy" ON public.audit_logs
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Reports Read Policy" ON public.reports
    FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "Reports Manage Policy" ON public.reports
    FOR ALL TO authenticated
    USING (public.is_nccr_admin() OR public.is_auditor())
    WITH CHECK (public.is_nccr_admin() OR public.is_auditor());

CREATE POLICY "Community Profiles Read Policy" ON public.community_profiles
    FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "Community Projects Read Policy" ON public.community_projects
    FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "Community Activities Read Policy" ON public.community_activities
    FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "Community Activities Insert Policy" ON public.community_activities
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Settings Read Policy" ON public.system_settings
    FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "Settings Manage Policy" ON public.system_settings
    FOR ALL TO authenticated
    USING (public.is_nccr_admin())
    WITH CHECK (public.is_nccr_admin());
