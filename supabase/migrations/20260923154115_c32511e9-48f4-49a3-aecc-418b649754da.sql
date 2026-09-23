DO $$
DECLARE t text; col text;
BEGIN
  FOREACH t IN ARRAY ARRAY['profiles','applications','application_events','screenshots','notes','skills','contacts','followups','email_import_drafts'] LOOP
    col := CASE WHEN t = 'profiles' THEN 'id' ELSE 'user_id' END;
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', CASE t
      WHEN 'profiles' THEN 'own profile' WHEN 'applications' THEN 'own applications'
      WHEN 'application_events' THEN 'own events' WHEN 'email_import_drafts' THEN 'own email import drafts'
      ELSE 'own ' || t END, t);
    EXECUTE format('CREATE POLICY "%s select own" ON public.%I FOR SELECT TO authenticated USING (auth.uid() = %I)', t, t, col);
    EXECUTE format('CREATE POLICY "%s insert own" ON public.%I FOR INSERT TO authenticated WITH CHECK (auth.uid() = %I)', t, t, col);
    EXECUTE format('CREATE POLICY "%s update own" ON public.%I FOR UPDATE TO authenticated USING (auth.uid() = %I) WITH CHECK (auth.uid() = %I)', t, t, col, col);
    EXECUTE format('CREATE POLICY "%s delete own" ON public.%I FOR DELETE TO authenticated USING (auth.uid() = %I)', t, t, col);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);
  END LOOP;
END $$;

ALTER TABLE public.app_user_connections ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.app_user_connections FROM anon, authenticated;

DROP POLICY IF EXISTS "own screenshot files read" ON storage.objects;
DROP POLICY IF EXISTS "own screenshot files insert" ON storage.objects;
DROP POLICY IF EXISTS "own screenshot files delete" ON storage.objects;
CREATE POLICY "screenshots read own folder" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'screenshots' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "screenshots insert own folder" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'screenshots' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "screenshots update own folder" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'screenshots' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'screenshots' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "screenshots delete own folder" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'screenshots' AND (storage.foldername(name))[1] = auth.uid()::text);