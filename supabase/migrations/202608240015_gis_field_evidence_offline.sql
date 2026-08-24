-- Migration 15: GIS Boundary, Field Evidence GPS Accuracy & Offline Sync Tracking
-- Safe, non-destructive migration ensuring point-in-polygon validation and offline sync metadata

-- 1. Ensure projects have boundary_geojson and centroid fields
ALTER TABLE public.projects 
    ADD COLUMN IF NOT EXISTS boundary_geojson JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS boundary_type TEXT DEFAULT 'POLYGON',
    ADD COLUMN IF NOT EXISTS center_latitude NUMERIC(10,6),
    ADD COLUMN IF NOT EXISTS center_longitude NUMERIC(10,6),
    ADD COLUMN IF NOT EXISTS boundary_area_hectares NUMERIC(10,2);

-- 2. Ensure evidence_files has GPS accuracy, capture source, verification status & offline hash tracking
ALTER TABLE public.evidence_files
    ADD COLUMN IF NOT EXISTS gps_accuracy_meters NUMERIC(6,2),
    ADD COLUMN IF NOT EXISTS location_source TEXT DEFAULT 'DEVICE_GPS' CHECK (location_source IN ('DEVICE_GPS', 'EXIF_METADATA', 'MANUAL', 'DRONE_TELEMETRY')),
    ADD COLUMN IF NOT EXISTS location_validation_status TEXT DEFAULT 'PENDING' CHECK (location_validation_status IN ('VERIFIED_INSIDE_BOUNDARY', 'OUTSIDE_BOUNDARY_FLAGGED', 'UNAVAILABLE_MANUAL_REVIEW', 'PENDING')),
    ADD COLUMN IF NOT EXISTS is_offline_sync BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS synced_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS device_metadata JSONB DEFAULT '{}'::jsonb;

-- 3. Offline Evidence Sync Queue Table (for tracking client-side batch synchronization)
CREATE TABLE IF NOT EXISTS public.offline_evidence_sync_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_sync_id TEXT UNIQUE NOT NULL,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    file_name TEXT NOT NULL,
    file_hash TEXT NOT NULL,
    latitude NUMERIC(10,6),
    longitude NUMERIC(10,6),
    gps_accuracy NUMERIC(6,2),
    captured_at TIMESTAMPTZ NOT NULL,
    sync_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (sync_status IN ('PENDING', 'SYNCING', 'SYNCED', 'FAILED')),
    sync_error TEXT,
    evidence_id UUID REFERENCES public.evidence_files(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexing
CREATE INDEX IF NOT EXISTS idx_offline_sync_project_id ON public.offline_evidence_sync_queue(project_id);
CREATE INDEX IF NOT EXISTS idx_offline_sync_status ON public.offline_evidence_sync_queue(sync_status);

-- Enable RLS
ALTER TABLE public.offline_evidence_sync_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read/write offline sync queue" ON public.offline_evidence_sync_queue
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon insert offline sync queue" ON public.offline_evidence_sync_queue
    FOR INSERT TO anon WITH CHECK (true);
