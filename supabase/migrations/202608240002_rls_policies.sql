-- Migration 2: Row Level Security (RLS) Policies
-- Enable RLS on all foundation tables and establish security policies

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_status_history ENABLE ROW LEVEL SECURITY;

-- Helper Functions for RLS
CREATE OR REPLACE FUNCTION public.is_nccr_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'NCCR_ADMIN'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_org_admin(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE user_id = auth.uid()
          AND organization_id = org_id
          AND role_in_org IN ('OWNER', 'ADMIN')
    ) OR public.is_nccr_admin();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_org_member(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE user_id = auth.uid()
          AND organization_id = org_id
    ) OR public.is_nccr_admin();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Organizations Policies
CREATE POLICY "Public read verified organizations" ON public.organizations
    FOR SELECT USING (is_verified = true OR public.is_org_member(id));

CREATE POLICY "Admins can manage organizations" ON public.organizations
    FOR ALL USING (public.is_nccr_admin());

CREATE POLICY "Org Admins can update their organization" ON public.organizations
    FOR UPDATE USING (public.is_org_admin(id));

-- 2. Profiles Policies
CREATE POLICY "Users can read profiles in same org or public" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can manage all profiles" ON public.profiles
    FOR ALL USING (public.is_nccr_admin());

-- 3. Projects Policies
CREATE POLICY "Public read active or verified projects" ON public.projects
    FOR SELECT USING (status IN ('ACTIVE', 'VERIFIED', 'COMPLETED') OR public.is_org_member(organization_id));

CREATE POLICY "Org members can create projects" ON public.projects
    FOR INSERT WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "Org admins or NCCR admins can update projects" ON public.projects
    FOR UPDATE USING (public.is_org_admin(organization_id));

-- 4. Project Members Policies
CREATE POLICY "Read project members for visible projects" ON public.project_members
    FOR SELECT USING (true);

CREATE POLICY "Org admins can manage project members" ON public.project_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = project_members.project_id
            AND public.is_org_admin(p.organization_id)
        )
    );

-- 5. Project Status History Policies
CREATE POLICY "Read status history for visible projects" ON public.project_status_history
    FOR SELECT USING (true);

CREATE POLICY "Insert status history on change" ON public.project_status_history
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = project_status_history.project_id
            AND (public.is_org_admin(p.organization_id) OR public.is_nccr_admin())
        )
    );
