
-- 1. Role enum + user_roles table
CREATE TYPE public.app_role AS ENUM ('developer', 'company');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 2. has_role() security definer
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 3. Grandfather every existing user (created before this feature) as a developer.
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'developer'::public.app_role FROM auth.users
ON CONFLICT (user_id, role) DO NOTHING;

-- 4. Default new signups to 'company'. handle_new_user() already creates the
--    profile row; extend it here.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, company_name, contact_email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'company_name', split_part(NEW.email, '@', 1)),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;

  -- Default role is 'company'. The developer server function elevates via service role.
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'company')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Ensure the trigger exists (it may already; recreate idempotently).
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Tighten write policies: developer role required in addition to ownership.

-- projects
DROP POLICY IF EXISTS "Users can insert their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON public.projects;

CREATE POLICY "Developers can insert own projects"
ON public.projects FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id AND public.has_role(auth.uid(), 'developer'));

CREATE POLICY "Developers can update own projects"
ON public.projects FOR UPDATE
TO authenticated
USING (auth.uid() = owner_id AND public.has_role(auth.uid(), 'developer'))
WITH CHECK (auth.uid() = owner_id AND public.has_role(auth.uid(), 'developer'));

CREATE POLICY "Developers can delete own projects"
ON public.projects FOR DELETE
TO authenticated
USING (auth.uid() = owner_id AND public.has_role(auth.uid(), 'developer'));

-- project_milestones (owned via projects.owner_id)
DROP POLICY IF EXISTS "Users can insert own milestones" ON public.project_milestones;
DROP POLICY IF EXISTS "Users can update own milestones" ON public.project_milestones;
DROP POLICY IF EXISTS "Users can delete own milestones" ON public.project_milestones;

CREATE POLICY "Developers can insert own milestones"
ON public.project_milestones FOR INSERT
TO authenticated
WITH CHECK (
  public.has_project_ownership(project_id) AND public.has_role(auth.uid(), 'developer')
);

CREATE POLICY "Developers can update own milestones"
ON public.project_milestones FOR UPDATE
TO authenticated
USING (
  public.has_project_ownership(project_id) AND public.has_role(auth.uid(), 'developer')
)
WITH CHECK (
  public.has_project_ownership(project_id) AND public.has_role(auth.uid(), 'developer')
);

CREATE POLICY "Developers can delete own milestones"
ON public.project_milestones FOR DELETE
TO authenticated
USING (
  public.has_project_ownership(project_id) AND public.has_role(auth.uid(), 'developer')
);

-- project_images
DROP POLICY IF EXISTS "Users can insert own images" ON public.project_images;
DROP POLICY IF EXISTS "Users can update own images" ON public.project_images;
DROP POLICY IF EXISTS "Users can delete own images" ON public.project_images;

CREATE POLICY "Developers can insert own images"
ON public.project_images FOR INSERT
TO authenticated
WITH CHECK (
  public.has_project_ownership(project_id) AND public.has_role(auth.uid(), 'developer')
);

CREATE POLICY "Developers can update own images"
ON public.project_images FOR UPDATE
TO authenticated
USING (
  public.has_project_ownership(project_id) AND public.has_role(auth.uid(), 'developer')
)
WITH CHECK (
  public.has_project_ownership(project_id) AND public.has_role(auth.uid(), 'developer')
);

CREATE POLICY "Developers can delete own images"
ON public.project_images FOR DELETE
TO authenticated
USING (
  public.has_project_ownership(project_id) AND public.has_role(auth.uid(), 'developer')
);

-- profiles: developers may update; companies may not edit the public profile
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Developers can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id AND public.has_role(auth.uid(), 'developer'))
WITH CHECK (auth.uid() = id AND public.has_role(auth.uid(), 'developer'));
