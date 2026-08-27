-- Migration 17: Reports Artifacts Storage, Schema Extension and Legacy Data Normalization

-- 1. Add artifact and file columns to public.reports
ALTER TABLE public.reports 
    ADD COLUMN IF NOT EXISTS file_path TEXT NULL,
    ADD COLUMN IF NOT EXISTS file_name TEXT NULL,
    ADD COLUMN IF NOT EXISTS mime_type TEXT NULL DEFAULT 'application/pdf',
    ADD COLUMN IF NOT EXISTS file_size_bytes BIGINT NULL,
    ADD COLUMN IF NOT EXISTS generated_at TIMESTAMPTZ NULL DEFAULT now();

-- 2. Normalize legacy malformed rows in public.reports (JSON-encoded titles & 'undefined' descriptions)
UPDATE public.reports
SET 
    title = CASE
        WHEN title LIKE '{"reportType"%' OR title LIKE '{%' THEN
            COALESCE(
                (title::jsonb->>'reportType'),
                'National Summary Report'
            ) || 
            CASE 
                WHEN (title::jsonb->>'state') IS NOT NULL AND (title::jsonb->>'state') != 'All States' 
                THEN ' — ' || (title::jsonb->>'state') 
                ELSE '' 
            END ||
            ' (' || COALESCE(title::jsonb->>'dateRange', title::jsonb->>'period', period, 'Last 12 Months') || ')'
        ELSE title
    END,
    description = CASE
        WHEN description IS NULL OR description LIKE '%undefined%' THEN
            'Official ' || 
            COALESCE(
                CASE 
                    WHEN title LIKE '{%' THEN (title::jsonb->>'reportType')
                    ELSE REPLACE(report_type, '_', ' ')
                END,
                'National Summary Report'
            ) || 
            ' covering national coastal restoration zones for the period ' || 
            COALESCE(period, 'Last 12 Months') || 
            '. Comprehensive audit reconciles on-ground sensor telemetry, satellite GIS boundaries, and verified carbon credit issuance.'
        ELSE description
    END
WHERE title LIKE '{%' OR description IS NULL OR description LIKE '%undefined%';

-- 3. Create private Supabase Storage bucket for report files
INSERT INTO storage.buckets (id, name, public)
VALUES ('report-files', 'report-files', false)
ON CONFLICT (id) DO NOTHING;

-- 4. Storage RLS Policies for report-files
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Report Files Read Policy'
    ) THEN
        CREATE POLICY "Report Files Read Policy" ON storage.objects
            FOR SELECT TO authenticated, anon
            USING (bucket_id = 'report-files');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Report Files Upload Policy'
    ) THEN
        CREATE POLICY "Report Files Upload Policy" ON storage.objects
            FOR INSERT TO authenticated
            WITH CHECK (bucket_id = 'report-files');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Report Files Manage Policy'
    ) THEN
        CREATE POLICY "Report Files Manage Policy" ON storage.objects
            FOR ALL TO authenticated
            USING (bucket_id = 'report-files' AND (public.is_nccr_admin() OR public.is_auditor()))
            WITH CHECK (bucket_id = 'report-files' AND (public.is_nccr_admin() OR public.is_auditor()));
    END IF;
END $$;
