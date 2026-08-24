-- Migration 16: Role System Unification, Auth User Trigger, and RLS Hardening
-- Safe, non-destructive migration ensuring strict RBAC, anti-escalation triggers, and profile integrity

-- 1. Harmonize Role Check Constraint on Profiles (Canonical Vocabulary)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
    CHECK (role IN (
        'NCCR_ADMIN',
        'VERIFIER',
        'NGO',
        'PANCHAYAT',
        'COMMUNITY',
        'PROJECT_MANAGER'
    ));

ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'COMMUNITY';

-- 2. Automatic Profile Provisioning Trigger on auth.users (Strict Non-Escalation)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_full_name TEXT;
    v_phone TEXT;
BEGIN
    -- Security Guard: All public self-signups strictly default to COMMUNITY role
    -- Organization and Verifier roles MUST be provisioned via onboarding approval or admin provisioning

    -- Extract name & metadata safely
    v_full_name := COALESCE(
        NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
        NULLIF(NEW.raw_user_meta_data->>'name', ''),
        split_part(NEW.email, '@', 1),
        'User'
    );
    v_phone := NEW.raw_user_meta_data->>'phone';

    -- Upsert profile with matching auth user ID, role=COMMUNITY, organization_id=NULL
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        role,
        organization_id,
        phone,
        is_active,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        v_full_name,
        'COMMUNITY',
        NULL,
        v_phone,
        true,
        now(),
        now()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), public.profiles.full_name),
        phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
        updated_at = now();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Prevent Self-Role, Organization, and Status Modification at Database Level
CREATE OR REPLACE FUNCTION public.prevent_self_role_escalation()
RETURNS TRIGGER AS $$
BEGIN
    -- NCCR Admins have privilege to manage profiles and roles
    IF public.is_nccr_admin() THEN
        RETURN NEW;
    END IF;

    -- Non-admin users cannot alter their own role
    IF NEW.role IS DISTINCT FROM OLD.role THEN
        RAISE EXCEPTION 'Unauthorized: Users cannot modify their assigned role.';
    END IF;

    -- Non-admin users cannot alter their organization association
    IF NEW.organization_id IS DISTINCT FROM OLD.organization_id THEN
        RAISE EXCEPTION 'Unauthorized: Users cannot modify their organization association.';
    END IF;

    -- Non-admin users cannot alter active status
    IF NEW.is_active IS DISTINCT FROM OLD.is_active THEN
        RAISE EXCEPTION 'Unauthorized: Users cannot modify account active status.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_self_role_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_self_role_escalation
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.prevent_self_role_escalation();

-- 4. Hardened RLS Policies for Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read profiles in same org or public" ON public.profiles;
DROP POLICY IF EXISTS "Public read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile or org profiles or admins" ON public.profiles;

CREATE POLICY "Users can read own profile or org profiles or admins" ON public.profiles
    FOR SELECT TO authenticated
    USING (
        auth.uid() = id 
        OR public.is_nccr_admin() 
        OR (organization_id IS NOT NULL AND public.is_org_member(organization_id))
    );

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = id OR public.is_nccr_admin())
    WITH CHECK (auth.uid() = id OR public.is_nccr_admin());

DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles" ON public.profiles
    FOR ALL TO authenticated
    USING (public.is_nccr_admin())
    WITH CHECK (public.is_nccr_admin());

-- 5. Hardened RLS Policies for Onboarding Requests (No Public Table Exposure)
ALTER TABLE public.onboarding_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view application status" ON public.onboarding_requests;
DROP POLICY IF EXISTS "Public can view application status with code" ON public.onboarding_requests;
DROP POLICY IF EXISTS "Users can read own onboarding requests" ON public.onboarding_requests;
DROP POLICY IF EXISTS "Public and authenticated can submit onboarding requests" ON public.onboarding_requests;
DROP POLICY IF EXISTS "NCCR Admins can manage onboarding requests" ON public.onboarding_requests;

-- Authenticated applicants can only read their own submitted requests
CREATE POLICY "Users can read own onboarding requests" ON public.onboarding_requests
    FOR SELECT TO authenticated
    USING (
        auth.uid() = submitted_by 
        OR primary_contact_email = (SELECT email FROM auth.users WHERE id = auth.uid())
        OR public.is_nccr_admin()
    );

-- Admins retain full governance access
CREATE POLICY "NCCR Admins can manage onboarding requests" ON public.onboarding_requests
    FOR ALL TO authenticated
    USING (public.is_nccr_admin())
    WITH CHECK (public.is_nccr_admin());

-- Public and authenticated users can insert new onboarding requests
CREATE POLICY "Public and authenticated can submit onboarding requests" ON public.onboarding_requests
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

-- 6. Secure Controlled RPC for Public Status Tracking (Sanitized Fields Only)
CREATE OR REPLACE FUNCTION public.get_onboarding_status(p_application_number TEXT)
RETURNS JSONB AS $$
DECLARE
    v_req RECORD;
BEGIN
    SELECT 
        application_number,
        organization_name,
        organization_type,
        state,
        district,
        status,
        review_notes,
        created_at,
        updated_at
    INTO v_req
    FROM public.onboarding_requests
    WHERE application_number = p_application_number;

    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    RETURN jsonb_build_object(
        'application_number', v_req.application_number,
        'organization_name', v_req.organization_name,
        'organization_type', v_req.organization_type,
        'state', v_req.state,
        'district', v_req.district,
        'status', v_req.status,
        'review_notes', v_req.review_notes,
        'created_at', v_req.created_at,
        'updated_at', v_req.updated_at
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Safe Provisioning RPC for Organization Onboarding Approval
CREATE OR REPLACE FUNCTION public.approve_onboarding_and_provision_org(
    p_request_id UUID,
    p_review_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_req RECORD;
    v_org_id UUID;
    v_org_code TEXT;
    v_user_role TEXT;
BEGIN
    -- Verify caller is NCCR Administrator
    IF NOT public.is_nccr_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Only NCCR Administrators can approve onboarding requests.';
    END IF;

    SELECT * INTO v_req FROM public.onboarding_requests WHERE id = p_request_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Onboarding request not found: %', p_request_id;
    END IF;

    -- Generate unique Org Code
    v_org_code := 'ORG-' || UPPER(SUBSTRING(v_req.organization_type FROM 1 FOR 3)) || '-' || (floor(random() * 8999 + 1000))::TEXT;

    -- Create Organization record
    INSERT INTO public.organizations (
        org_code,
        name,
        type,
        state,
        location,
        contact_email,
        contact_phone,
        status,
        is_verified,
        created_at,
        updated_at
    )
    VALUES (
        v_org_code,
        v_req.organization_name,
        v_req.organization_type,
        v_req.state,
        v_req.district || COALESCE(', ' || v_req.panchayat_or_block, ''),
        v_req.primary_contact_email,
        v_req.primary_contact_phone,
        'ACTIVE',
        true,
        now(),
        now()
    )
    RETURNING id INTO v_org_id;

    -- Determine canonical role based on organization type
    IF v_req.organization_type = 'NGO' THEN
        v_user_role := 'NGO';
    ELSIF v_req.organization_type = 'PANCHAYAT' THEN
        v_user_role := 'PANCHAYAT';
    ELSIF v_req.organization_type = 'DEVELOPER' THEN
        v_user_role := 'PROJECT_MANAGER';
    ELSE
        v_user_role := 'NGO';
    END IF;

    -- If applicant has an existing profile, link organization and assign role
    IF v_req.submitted_by IS NOT NULL THEN
        UPDATE public.profiles
        SET organization_id = v_org_id,
            role = v_user_role,
            updated_at = now()
        WHERE id = v_req.submitted_by;

        -- Insert membership
        INSERT INTO public.organization_members (organization_id, user_id, role_in_org, joined_at)
        VALUES (v_org_id, v_req.submitted_by, 'ADMIN', now())
        ON CONFLICT (organization_id, user_id) DO NOTHING;
    END IF;

    -- Update onboarding request status
    UPDATE public.onboarding_requests
    SET status = 'APPROVED',
        created_org_id = v_org_id,
        reviewed_by = auth.uid(),
        review_notes = COALESCE(p_review_notes, 'Approved by NCCR Administrator. Organization provisioned.'),
        updated_at = now()
    WHERE id = p_request_id;

    RETURN jsonb_build_object(
        'success', true,
        'organizationId', v_org_id,
        'organizationCode', v_org_code,
        'status', 'APPROVED'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
