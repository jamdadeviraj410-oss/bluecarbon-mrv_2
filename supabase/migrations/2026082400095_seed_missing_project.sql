-- Migration 00095: Seed missing project and organization for transparency data

INSERT INTO public.organizations (id, name, type, country, state, contact_email)
VALUES ('c0000000-0000-0000-0000-000000000001', 'BioMarine NGO', 'NGO', 'India', 'Maharashtra', 'contact@biomarine.org')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (
    id, project_code, name, organization_id, type, location, state, country, area, est_co2e, status, start_date
)
VALUES (
    'b0000000-0000-0000-0000-000000000001',
    'PRJ-BC-0924',
    'Maharashtra Mangrove Restoration',
    'c0000000-0000-0000-0000-000000000001',
    'Mangrove Restoration',
    'Ratnagiri',
    'Maharashtra',
    'India',
    1200,
    14200,
    'VERIFIED',
    '2023-01-15'
)
ON CONFLICT (id) DO NOTHING;
