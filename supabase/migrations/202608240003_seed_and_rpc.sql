-- Migration 3: Seed Foundation Data and RPC Functions

CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS JSONB AS $$
DECLARE
    total_projects BIGINT;
    verified_projects BIGINT;
    active_credits NUMERIC;
    total_area NUMERIC;
    est_co2e NUMERIC;
    pending_verifications BIGINT;
BEGIN
    SELECT COUNT(*), COALESCE(SUM(area), 0), COALESCE(SUM(est_co2e), 0)
    INTO total_projects, total_area, est_co2e
    FROM public.projects;

    SELECT COUNT(*) INTO verified_projects
    FROM public.projects
    WHERE status = 'VERIFIED';

    SELECT COALESCE(SUM(available_quantity), 0) INTO active_credits
    FROM public.carbon_credits
    WHERE status = 'ACTIVE';

    SELECT COUNT(*) INTO pending_verifications
    FROM public.projects
    WHERE status = 'UNDER_REVIEW';

    RETURN jsonb_build_object(
        'totalProjects', total_projects,
        'verifiedProjects', verified_projects,
        'totalAreaHa', total_area,
        'totalCO2e', est_co2e,
        'activeCredits', active_credits,
        'pendingVerifications', pending_verifications
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
