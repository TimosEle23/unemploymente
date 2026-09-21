CREATE TABLE public.app_user_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  connector_id text NOT NULL CHECK (connector_id IN ('google_mail', 'microsoft_outlook')),
  connection_key_ciphertext text NOT NULL,
  reconnect_required boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, connector_id)
);
GRANT ALL ON public.app_user_connections TO service_role;
ALTER TABLE public.app_user_connections ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.email_import_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  connector_id text NOT NULL CHECK (connector_id IN ('google_mail', 'microsoft_outlook')),
  provider_message_id text NOT NULL,
  message_subject text,
  sender_name text,
  sender_email text,
  received_at timestamptz,
  extracted_job jsonb NOT NULL DEFAULT '{}'::jsonb,
  missing_fields text[] NOT NULL DEFAULT '{}'::text[],
  source_url text,
  enrichment_status text NOT NULL DEFAULT 'NOT_ATTEMPTED' CHECK (enrichment_status IN ('NOT_ATTEMPTED', 'ENRICHED', 'INACCESSIBLE', 'FAILED')),
  review_status text NOT NULL DEFAULT 'PENDING' CHECK (review_status IN ('PENDING', 'SAVED', 'DISMISSED')),
  duplicate_application_id uuid REFERENCES public.applications(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, connector_id, provider_message_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_import_drafts TO authenticated;
GRANT ALL ON public.email_import_drafts TO service_role;
ALTER TABLE public.email_import_drafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own email import drafts" ON public.email_import_drafts FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER app_user_connections_updated_at BEFORE UPDATE ON public.app_user_connections FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER email_import_drafts_updated_at BEFORE UPDATE ON public.email_import_drafts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();