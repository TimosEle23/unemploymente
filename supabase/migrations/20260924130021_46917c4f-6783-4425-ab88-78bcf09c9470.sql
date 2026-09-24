CREATE TABLE public.letter_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'New letter',
  application_id uuid REFERENCES public.applications(id) ON DELETE SET NULL,
  job_text text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.letter_threads TO authenticated;
GRANT ALL ON public.letter_threads TO service_role;
ALTER TABLE public.letter_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lt_select" ON public.letter_threads FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "lt_insert" ON public.letter_threads FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "lt_update" ON public.letter_threads FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "lt_delete" ON public.letter_threads FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER letter_threads_updated_at BEFORE UPDATE ON public.letter_threads FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.letter_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.letter_threads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_id text NOT NULL,
  role text NOT NULL CHECK (role IN ('user','assistant')),
  parts jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (thread_id, message_id)
);
CREATE INDEX letter_messages_thread_idx ON public.letter_messages(thread_id, created_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.letter_messages TO authenticated;
GRANT ALL ON public.letter_messages TO service_role;
ALTER TABLE public.letter_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lm_select" ON public.letter_messages FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "lm_insert" ON public.letter_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.letter_threads t WHERE t.id = thread_id AND t.user_id = auth.uid()));
CREATE POLICY "lm_update" ON public.letter_messages FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "lm_delete" ON public.letter_messages FOR DELETE TO authenticated USING (auth.uid() = user_id);