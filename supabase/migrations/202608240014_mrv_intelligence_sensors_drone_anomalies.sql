-- Migration 14: MRV Intelligence, IoT Sensors, Drone Surveys, OCR Results, and Anomaly Detection Engine
-- Safe, non-destructive migration consolidating MRV Intelligence & IoT telemetry

-- 1. OCR Results Table
CREATE TABLE IF NOT EXISTS public.ocr_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evidence_id UUID REFERENCES public.evidence_files(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL DEFAULT 'FIELD_REPORT' CHECK (document_type IN ('FIELD_REPORT', 'NURSERY_RECEIPT', 'AUDIT_CERTIFICATE', 'LAB_ASSAY', 'DRONE_CLEARANCE', 'OTHER')),
    raw_text TEXT NOT NULL,
    structured_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    confidence_score NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    confidence_level TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (confidence_level IN ('HIGH', 'MEDIUM', 'LOW')),
    engine TEXT NOT NULL DEFAULT 'Tesseract.js v5',
    is_reviewed BOOLEAN NOT NULL DEFAULT false,
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    corrections JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. IoT Sensors Registry Table
CREATE TABLE IF NOT EXISTS public.sensors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sensor_id TEXT UNIQUE NOT NULL,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('temperature', 'water_level', 'salinity', 'soil_moisture', 'ph', 'multi_sensor')),
    latitude NUMERIC(10,6) NOT NULL,
    longitude NUMERIC(10,6) NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'WARNING', 'OFFLINE', 'MAINTENANCE')),
    battery NUMERIC(5,2) NOT NULL DEFAULT 100.00,
    last_seen TIMESTAMPTZ DEFAULT now(),
    is_simulated BOOLEAN NOT NULL DEFAULT false,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Sensor Readings Table (Time-series telemetry)
CREATE TABLE IF NOT EXISTS public.sensor_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sensor_id TEXT NOT NULL,
    sensor_ref_id UUID REFERENCES public.sensors(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    reading_type TEXT NOT NULL CHECK (reading_type IN ('temperature', 'water_level', 'salinity', 'soil_moisture', 'ph', 'dissolved_oxygen', 'turbidity')),
    value NUMERIC(12,4) NOT NULL,
    unit TEXT NOT NULL,
    quality_score NUMERIC(5,2) DEFAULT 100.00,
    is_simulated BOOLEAN NOT NULL DEFAULT false,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    raw_payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Drone Surveys Table
CREATE TABLE IF NOT EXISTS public.drone_surveys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    survey_code TEXT UNIQUE NOT NULL,
    survey_date DATE NOT NULL,
    survey_type TEXT NOT NULL DEFAULT 'RESTORATION_MONITORING' CHECK (survey_type IN ('BASELINE', 'RESTORATION_MONITORING', 'POST_PLANTING', 'CANOPY_HEALTH', 'CARBON_STOCK_VERIFICATION')),
    stage TEXT NOT NULL DEFAULT 'AFTER' CHECK (stage IN ('BEFORE', 'AFTER', 'INTERMEDIATE')),
    survey_area_hectares NUMERIC(10,2) NOT NULL,
    coverage_percent NUMERIC(5,2) NOT NULL DEFAULT 100.00,
    resolution_cm_per_pixel NUMERIC(5,2) DEFAULT 2.50,
    flight_altitude_m NUMERIC(6,2) DEFAULT 60.00,
    canopy_cover_percent NUMERIC(5,2),
    estimated_tree_count INTEGER,
    health_ndvi_mean NUMERIC(6,4),
    orthomosaic_url TEXT,
    ndvi_map_url TEXT,
    geojson_data JSONB DEFAULT '{}'::jsonb,
    kml_raw TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. MRV Anomaly & Risk Engine Table
CREATE TABLE IF NOT EXISTS public.mrv_anomalies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    submission_id UUID REFERENCES public.mrv_submissions(id) ON DELETE SET NULL,
    anomaly_code TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('AREA_MISMATCH', 'GPS_MISMATCH', 'DATE_MISMATCH', 'DUPLICATE_EVIDENCE', 'MISSING_SENSOR_DATA', 'OTHER_INCONSISTENCY')),
    severity TEXT NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    risk_score NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    risk_level TEXT NOT NULL CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    evidence_references JSONB DEFAULT '[]'::jsonb,
    discrepancy_details JSONB DEFAULT '{}'::jsonb,
    suggested_action TEXT,
    status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'INVESTIGATING', 'DISMISSED', 'RESOLVED')),
    resolution_notes TEXT,
    detected_at TIMESTAMPTZ DEFAULT now(),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_ocr_results_project_id ON public.ocr_results(project_id);
CREATE INDEX IF NOT EXISTS idx_ocr_results_evidence_id ON public.ocr_results(evidence_id);
CREATE INDEX IF NOT EXISTS idx_sensors_project_id ON public.sensors(project_id);
CREATE INDEX IF NOT EXISTS idx_sensors_status ON public.sensors(status);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_sensor_id ON public.sensor_readings(sensor_id);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_project_id ON public.sensor_readings(project_id);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_recorded_at ON public.sensor_readings(recorded_at);
CREATE INDEX IF NOT EXISTS idx_drone_surveys_project_id ON public.drone_surveys(project_id);
CREATE INDEX IF NOT EXISTS idx_drone_surveys_date ON public.drone_surveys(survey_date);
CREATE INDEX IF NOT EXISTS idx_mrv_anomalies_project_id ON public.mrv_anomalies(project_id);
CREATE INDEX IF NOT EXISTS idx_mrv_anomalies_severity ON public.mrv_anomalies(severity);
CREATE INDEX IF NOT EXISTS idx_mrv_anomalies_status ON public.mrv_anomalies(status);

-- Enable Row Level Security (RLS)
ALTER TABLE public.ocr_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sensors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sensor_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drone_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mrv_anomalies ENABLE ROW LEVEL SECURITY;

-- Permissive RLS Policies for authenticated users and public read where applicable
CREATE POLICY "Allow authenticated read OCR results" ON public.ocr_results
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert/update OCR results" ON public.ocr_results
    FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow public read sensors" ON public.sensors
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow authenticated manage sensors" ON public.sensors
    FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow public read sensor readings" ON public.sensor_readings
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow authenticated insert sensor readings" ON public.sensor_readings
    FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Allow public read drone surveys" ON public.drone_surveys
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow authenticated manage drone surveys" ON public.drone_surveys
    FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow public read MRV anomalies" ON public.mrv_anomalies
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow authenticated manage MRV anomalies" ON public.mrv_anomalies
    FOR ALL TO authenticated USING (true);
