-- Migration 20: Harden evidence-vault storage policies: revoke unauthenticated public writes and updates
DROP POLICY IF EXISTS "Evidence Vault Public Update" ON storage.objects;
DROP POLICY IF EXISTS "Evidence Vault Public Insert" ON storage.objects;

DROP POLICY IF EXISTS "Evidence Vault Update Policy" ON storage.objects;
CREATE POLICY "Evidence Vault Update Policy" ON storage.objects
    FOR UPDATE TO authenticated
    USING (bucket_id = 'evidence-vault' AND (public.is_nccr_admin() OR auth.uid() = owner))
    WITH CHECK (bucket_id = 'evidence-vault' AND (public.is_nccr_admin() OR auth.uid() = owner));
