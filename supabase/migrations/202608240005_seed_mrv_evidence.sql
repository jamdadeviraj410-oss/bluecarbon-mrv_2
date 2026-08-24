-- Migration 5: Seed MRV & Verification Data, and Verification Helper RPCs

CREATE OR REPLACE FUNCTION public.is_mrv_verified(p_project_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.mrv_submissions
        WHERE project_id = p_project_id
          AND status = 'VERIFIED'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_verified_carbon_yield(p_project_id UUID)
RETURNS NUMERIC AS $$
DECLARE
    v_total NUMERIC := 0.00;
BEGIN
    SELECT COALESCE(SUM(carbon_estimate), 0.00) INTO v_total
    FROM public.mrv_submissions
    WHERE project_id = p_project_id
      AND status = 'VERIFIED';
    RETURN v_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
