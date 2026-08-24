-- Migration 10: Seed Baseline Transparency, Reports, Community Engagement, and System Settings

-- 1. Insert Baseline Audit Logs
INSERT INTO public.audit_logs (
    id, ref_id, actor_name, actor_role, organization_name, action,
    entity_type, entity_id, project_id, project_name, description,
    previous_value, new_value, status, ip_address, tx_hash, block_number, created_at
)
VALUES
    (
        'a0000000-0000-0000-0000-000000000001',
        'ACT-8271',
        'Dr. Sarah Jenkins',
        'Lead Verifier',
        'BioMarine NGO',
        'MRV Approved',
        'Carbon Credit',
        'BC-CREDIT-2026-008420',
        'b0000000-0000-0000-0000-000000000001',
        'Maharashtra Mangrove Restoration',
        'Final approval of Monitoring, Reporting, and Verification (MRV) report Q3 2023. Validated spatial biomass growth of 4.2% against baseline.',
        '{"mrv_status": "Pending_Review"}'::jsonb,
        '{"mrv_status": "Approved"}'::jsonb,
        'Verified',
        '192.168.1.145',
        '0x8f2a994b9c3e12a4b8109d77f24098231a4781bc',
        48199201,
        '2023-10-24 14:20:05+00'
    ),
    (
        'a0000000-0000-0000-0000-000000000002',
        'ACT-8270',
        'Ahmed Al-Fayed',
        'GIS Specialist',
        'Ministry of Env',
        'Survey Uploaded',
        'Drone Survey',
        'd0000000-0000-0000-0000-000000000001',
        'b0000000-0000-0000-0000-000000000001',
        'Maharashtra Mangrove Restoration',
        'High-resolution multispectral survey dataset (GeoTIFF, 1.4 GB) uploaded for Ratnagiri Sector B-14.',
        '{"survey_quality": "Under_Analysis"}'::jsonb,
        '{"survey_quality": "Cloud_Cover_Excess_Rejected"}'::jsonb,
        'Rejected',
        '172.16.44.12',
        '0x3c1d09f4a7b2e8a1d5f9c0e2a4b6c8e0a29481bc',
        48198940,
        '2023-10-24 11:15:30+00'
    ),
    (
        'a0000000-0000-0000-0000-000000000003',
        'ACT-8269',
        'System Auto',
        'Automated Oracle',
        '-',
        'Sensor Data Added',
        'Telemetry',
        'd0000000-0000-0000-0000-000000000003',
        'b0000000-0000-0000-0000-000000000001',
        'Maharashtra Mangrove Restoration',
        'Automated ingestion of IoT soil salinity and water table level telemetry from 24 sensor nodes in Ratnagiri sector 3.',
        '{"sensor_sync_epoch": 1698048000}'::jsonb,
        '{"sensor_sync_epoch": 1698054312}'::jsonb,
        'Verified',
        '10.0.8.204',
        '0x9e2b4d7c0f1a3b5e7d9c1b3a5f7e9d1c810427bc',
        48197410,
        '2023-10-23 09:45:12+00'
    ),
    (
        'a0000000-0000-0000-0000-000000000004',
        'ACT-8268',
        'Elena Rostova',
        'Auditor',
        'Global Carbon Audit',
        'Issuance Signed',
        'Smart Contract',
        'f3000000-0000-0000-0000-000000000001',
        'b0000000-0000-0000-0000-000000000001',
        'Maharashtra Mangrove Restoration',
        'Cryptographic multi-signature applied for 14,200 carbon credit issuance on Polygon smart contract.',
        '{"contract_state": "Pending_Signatures"}'::jsonb,
        '{"contract_state": "Fully_Signed_Minted"}'::jsonb,
        'Verified',
        '192.168.10.88',
        '0x7a3f8b2ec049281a029384712039847120398b2e',
        48196120,
        '2023-10-22 16:30:00+00'
    )
ON CONFLICT (ref_id) DO NOTHING;

-- 2. Insert Baseline Reports
INSERT INTO public.reports (
    id, report_code, title, report_type, description, parameters, status,
    generated_by_name, period, data_summary
)
VALUES
    (
        'b1000000-0000-0000-0000-000000000001',
        'REP-2023-001',
        'Annual Coastal Blue Carbon Audit 2023',
        'EXECUTIVE_SUMMARY',
        'Comprehensive annual report on verified coastal restoration, total biomass carbon yield, and credit retirement ledger.',
        '{"methodology": "VM0033", "year": 2023}'::jsonb,
        'COMPLETED',
        'Dr. A. Sharma',
        'Annual 2023',
        '{"totalRestorationAreaHa": 14200, "totalCarbonSequesteredT": 1200000, "verifiedCreditsCount": 850000, "verifiedProjectsCount": 142}'::jsonb
    ),
    (
        'b1000000-0000-0000-0000-000000000002',
        'REP-2023-002',
        'MRV Geospatial & Telemetry Reconciliation Q3',
        'MRV_AUDIT_REPORT',
        'Quarterly reconciliation report comparing drone multispectral NDVI imagery with ground soil core samples.',
        '{"quarter": "Q3", "year": 2023}'::jsonb,
        'COMPLETED',
        'Elena Rostova',
        'Q3 2023',
        '{"evaluatedProjects": 18, "conformanceRate": "98.4%", "discrepanciesResolved": 12}'::jsonb
    )
ON CONFLICT (report_code) DO NOTHING;

-- 3. Insert Community Baseline Engagement Data
INSERT INTO public.community_profiles (
    id, display_name, community_name, role, phone
)
VALUES
    (
        'c1000000-0000-0000-0000-000000000001',
        'Coastal Restoration Society',
        'Ratnagiri Coastal Panchayat Unit',
        'PANCHAYAT',
        '+91 98200 12345'
    )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.community_projects (
    id, community_id, project_id, role_in_project, assigned_area_ha, planted_trees, active_field_volunteers
)
VALUES
    (
        'c2000000-0000-0000-0000-000000000001',
        'c1000000-0000-0000-0000-000000000001',
        'b0000000-0000-0000-0000-000000000001',
        'FIELD_LEAD',
        128.00,
        18000,
        48
    )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.community_activities (
    id, community_id, project_id, activity_type, title, detail, icon, icon_bg, actor_name
)
VALUES
    (
        'c3000000-0000-0000-0000-000000000001',
        'c1000000-0000-0000-0000-000000000001',
        'b0000000-0000-0000-0000-000000000001',
        'SURVEY_UPLOADED',
        'Survey uploaded for',
        'Ratnagiri Mangrove Plot B',
        'upload_file',
        'bg-surface-container-high',
        'Sarah Jenkins'
    ),
    (
        'c3000000-0000-0000-0000-000000000002',
        'c1000000-0000-0000-0000-000000000001',
        'b0000000-0000-0000-0000-000000000001',
        'DRONE_PROCESSED',
        'Drone data processed and validated for',
        'Ratnagiri Sector 3',
        'precision_manufacturing',
        'bg-tertiary-fixed-dim/20 text-on-tertiary-fixed-variant',
        'System Oracle'
    ),
    (
        'c3000000-0000-0000-0000-000000000003',
        'c1000000-0000-0000-0000-000000000001',
        'b0000000-0000-0000-0000-000000000001',
        'MRV_VERIFIED',
        'MRV verified successfully for',
        'Maharashtra Mangrove Restoration',
        'verified',
        'bg-secondary-container text-on-secondary-container',
        'Dr. A. Sharma'
    )
ON CONFLICT (id) DO NOTHING;

-- 4. Insert System Settings
INSERT INTO public.system_settings (
    setting_key, setting_value, description
)
VALUES
    (
        'registry_config',
        '{"network": "Polygon POS", "verificationThreshold": 0.95, "autoMintVerified": true, "maxUploadMb": 500}'::jsonb,
        'Global registry parameters and verification thresholds'
    ),
    (
        'export_defaults',
        '{"csvDelimiter": ",", "defaultCurrency": "USD", "includeProofHash": true}'::jsonb,
        'Report export configurations'
    )
ON CONFLICT (setting_key) DO UPDATE
SET setting_value = EXCLUDED.setting_value;
