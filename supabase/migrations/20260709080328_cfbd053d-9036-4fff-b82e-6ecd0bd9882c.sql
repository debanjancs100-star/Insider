
-- ============ ENUMS ============
CREATE TYPE public.project_status AS ENUM ('draft', 'published', 'sold_out');
CREATE TYPE public.subscription_tier AS ENUM ('studio', 'practice', 'atelier');

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL DEFAULT '',
  slug TEXT UNIQUE,
  logo_url TEXT,
  website TEXT,
  contact_email TEXT,
  bio TEXT,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are publicly viewable"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ============ PROJECTS ============
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  cover_url TEXT,
  price_from BIGINT,
  price_to BIGINT,
  currency TEXT NOT NULL DEFAULT 'USD',
  units_total INTEGER,
  units_remaining INTEGER,
  model_url TEXT,
  walkthrough_url TEXT,
  status public.project_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX projects_owner_idx ON public.projects(owner_id);
CREATE INDEX projects_status_idx ON public.projects(status);

GRANT SELECT ON public.projects TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published projects are viewable by anyone"
  ON public.projects FOR SELECT USING (status = 'published');

CREATE POLICY "Owners can view their own projects"
  ON public.projects FOR SELECT TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can insert their own projects"
  ON public.projects FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their own projects"
  ON public.projects FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their own projects"
  ON public.projects FOR DELETE TO authenticated
  USING (auth.uid() = owner_id);

-- Security-definer helper to avoid recursive checks in child-row policies.
CREATE OR REPLACE FUNCTION public.has_project_ownership(_project_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = _project_id AND owner_id = auth.uid()
  )
$$;

CREATE OR REPLACE FUNCTION public.is_project_published(_project_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = _project_id AND status = 'published'
  )
$$;

-- ============ PROJECT MILESTONES ============
CREATE TABLE public.project_milestones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  date DATE NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX milestones_project_idx ON public.project_milestones(project_id);

GRANT SELECT ON public.project_milestones TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_milestones TO authenticated;
GRANT ALL ON public.project_milestones TO service_role;

ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Milestones of published projects are public"
  ON public.project_milestones FOR SELECT
  USING (public.is_project_published(project_id));

CREATE POLICY "Owners can view own project milestones"
  ON public.project_milestones FOR SELECT TO authenticated
  USING (public.has_project_ownership(project_id));

CREATE POLICY "Owners can insert milestones"
  ON public.project_milestones FOR INSERT TO authenticated
  WITH CHECK (public.has_project_ownership(project_id));

CREATE POLICY "Owners can update milestones"
  ON public.project_milestones FOR UPDATE TO authenticated
  USING (public.has_project_ownership(project_id))
  WITH CHECK (public.has_project_ownership(project_id));

CREATE POLICY "Owners can delete milestones"
  ON public.project_milestones FOR DELETE TO authenticated
  USING (public.has_project_ownership(project_id));

-- ============ PROJECT IMAGES ============
CREATE TABLE public.project_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  caption TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX images_project_idx ON public.project_images(project_id);

GRANT SELECT ON public.project_images TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_images TO authenticated;
GRANT ALL ON public.project_images TO service_role;

ALTER TABLE public.project_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Images of published projects are public"
  ON public.project_images FOR SELECT
  USING (public.is_project_published(project_id));

CREATE POLICY "Owners can view own project images"
  ON public.project_images FOR SELECT TO authenticated
  USING (public.has_project_ownership(project_id));

CREATE POLICY "Owners can insert images"
  ON public.project_images FOR INSERT TO authenticated
  WITH CHECK (public.has_project_ownership(project_id));

CREATE POLICY "Owners can update images"
  ON public.project_images FOR UPDATE TO authenticated
  USING (public.has_project_ownership(project_id))
  WITH CHECK (public.has_project_ownership(project_id));

CREATE POLICY "Owners can delete images"
  ON public.project_images FOR DELETE TO authenticated
  USING (public.has_project_ownership(project_id));

-- ============ SUBSCRIBERS ============
CREATE TABLE public.subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  stripe_customer_id TEXT,
  subscribed BOOLEAN NOT NULL DEFAULT false,
  subscription_tier public.subscription_tier,
  subscription_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.subscribers TO authenticated;
GRANT ALL ON public.subscribers TO service_role;

ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
  ON public.subscribers FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- ============ TRIGGERS ============
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER projects_set_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER subscribers_set_updated_at BEFORE UPDATE ON public.subscribers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, company_name, contact_email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'company_name', split_part(NEW.email, '@', 1)),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ STORAGE POLICIES ============
-- Buckets are created via storage_create_bucket tool. Path convention:
-- object name starts with `<user_id>/...` so each user can only write their own prefix.

CREATE POLICY "Anyone can read company logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'company-logos');

CREATE POLICY "Users can upload own company logo"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'company-logos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own company logo"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'company-logos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own company logo"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'company-logos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can read project covers"
  ON storage.objects FOR SELECT USING (bucket_id = 'project-covers');
CREATE POLICY "Users can upload own project covers"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'project-covers' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can update own project covers"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'project-covers' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete own project covers"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'project-covers' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can read project models"
  ON storage.objects FOR SELECT USING (bucket_id = 'project-models');
CREATE POLICY "Users can upload own project models"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'project-models' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can update own project models"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'project-models' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete own project models"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'project-models' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can read project gallery"
  ON storage.objects FOR SELECT USING (bucket_id = 'project-gallery');
CREATE POLICY "Users can upload own project gallery"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'project-gallery' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can update own project gallery"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'project-gallery' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete own project gallery"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'project-gallery' AND (storage.foldername(name))[1] = auth.uid()::text);
