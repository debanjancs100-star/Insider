
DROP POLICY IF EXISTS "Profiles are publicly viewable" ON public.profiles;

CREATE POLICY "Public profile fields are viewable"
ON public.profiles FOR SELECT
TO anon, authenticated
USING (true);

REVOKE SELECT ON public.profiles FROM anon;
GRANT SELECT (id, company_name, slug, logo_url, website, bio, verified, created_at, updated_at) ON public.profiles TO anon;
GRANT SELECT ON public.profiles TO authenticated;
