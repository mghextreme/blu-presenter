CREATE TABLE IF NOT EXISTS public.schedules (
  "id" serial PRIMARY KEY,
  "orgId" integer not null references public.organizations (id),
  "title" varchar(255) not null,
  "date" date default null,
  "items" json not null default '[]',
  "createdBy" integer not null references public.users (id),
  "updatedBy" integer references public.users (id),
  "createdAt" timestamp default CURRENT_TIMESTAMP(6),
  "updatedAt" timestamp default CURRENT_TIMESTAMP(6)
);

-- RLS Policy for Supabase
CREATE POLICY "schedules_policy"
ON public.schedules
AS PERMISSIVE FOR ALL
TO authenticated
WITH CHECK (true);
