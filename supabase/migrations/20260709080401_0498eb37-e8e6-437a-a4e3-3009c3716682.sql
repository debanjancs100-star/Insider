
CREATE OR REPLACE FUNCTION public.has_project_ownership(_project_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY INVOKER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = _project_id AND owner_id = auth.uid()
  )
$$;

CREATE OR REPLACE FUNCTION public.is_project_published(_project_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY INVOKER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = _project_id AND status = 'published'
  )
$$;

REVOKE EXECUTE ON FUNCTION public.has_project_ownership(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_project_published(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_project_ownership(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_project_published(UUID) TO authenticated, anon;
