-- Migration 1: Shared Foundation Schema
-- Organizations, Profiles, Organization Members, Projects, Project Members, Project Status History

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Organizations Table
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('GOVERNMENT', 'NGO', 'COMMUNITY', 'DEVELOPER', 'BUYER', 'AUDITOR')),
    country TEXT NOT NULL DEFAULT 'India',
    state TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    website TEXT,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Profiles Table (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'COMMUNITY_USER' CHECK (role IN ('NCCR_ADMIN', 'ORG_ADMIN', 'FIELD_OFFICER', 'AUDITOR', 'BUYER', 'COMMUNITY_USER', 'NGO')),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    phone TEXT,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Organization Membership Table
CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role_in_org TEXT NOT NULL DEFAULT 'MEMBER' CHECK (role_in_org IN ('OWNER', 'ADMIN', 'MEMBER', 'VIEWER')),
    joined_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(organization_id, user_id)
);

-- 4. Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
    type TEXT NOT NULL CHECK (type IN ('Mangrove Restoration', 'Seagrass Conservation', 'Salt Marsh Protection', 'Coastal Wetland Rehabilitation')),
    location TEXT NOT NULL,
    state TEXT NOT NULL,
    country TEXT NOT NULL DEFAULT 'India',
    latitude NUMERIC(10,6),
    longitude NUMERIC(10,6),
    area NUMERIC(10,2) NOT NULL, -- in hectares
    est_co2e NUMERIC(12,2) NOT NULL DEFAULT 0, -- in tCO2e
    total_credits NUMERIC(12,2) DEFAULT 0,
    active_credits NUMERIC(12,2) DEFAULT 0,
    retired_credits NUMERIC(12,2) DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'ACTIVE', 'VERIFIED', 'REJECTED', 'COMPLETED')),
    start_date DATE NOT NULL,
    end_date DATE,
    description TEXT,
    team_lead TEXT,
    verification_date DATE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Project Members Table
CREATE TABLE IF NOT EXISTS public.project_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role_in_project TEXT NOT NULL DEFAULT 'CONTRIBUTOR' CHECK (role_in_project IN ('LEAD', 'FIELD_AGENT', 'AUDITOR', 'CONTRIBUTOR', 'OBSERVER')),
    assigned_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(project_id, user_id)
);

-- 6. Project Status History Table
CREATE TABLE IF NOT EXISTS public.project_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    old_status TEXT,
    new_status TEXT NOT NULL,
    changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    notes TEXT,
    changed_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON public.profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_organization_id ON public.projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON public.project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON public.project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_status_history_project_id ON public.project_status_history(project_id);
