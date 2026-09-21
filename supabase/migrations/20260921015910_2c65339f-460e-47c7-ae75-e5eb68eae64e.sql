ALTER TABLE public.profiles
  ADD COLUMN cv_file_name text,
  ADD COLUMN cv_storage_path text,
  ADD COLUMN cv_updated_at timestamptz;

CREATE POLICY "Users can view own CV files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'profile-cvs' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can upload own CV files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'profile-cvs' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own CV files"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'profile-cvs' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'profile-cvs' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own CV files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'profile-cvs' AND (storage.foldername(name))[1] = auth.uid()::text);