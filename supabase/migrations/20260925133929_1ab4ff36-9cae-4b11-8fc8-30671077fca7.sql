ALTER TABLE public.profiles ALTER COLUMN headline DROP DEFAULT;
ALTER TABLE public.profiles ALTER COLUMN education SET DEFAULT '{}'::text[];
ALTER TABLE public.profiles ALTER COLUMN skills SET DEFAULT '{}'::text[];