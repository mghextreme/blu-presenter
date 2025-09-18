CREATE TABLE IF NOT EXISTS public.themes (
  "id" serial PRIMARY KEY,
  "name" varchar(255) not null,
  "extends" varchar(255) not null,
  "orgId" integer not null references public.organizations (id),
  "config" json not null default '{}',
  "createdAt" timestamp default CURRENT_TIMESTAMP(6),
  "updatedAt" timestamp default CURRENT_TIMESTAMP(6)
);

CREATE POLICY "themes_policy"
ON public.themes
AS PERMISSIVE FOR ALL
TO authenticated
WITH CHECK (true);

ALTER TABLE public.organizations
ADD column "secret" varchar(64) null default null;
