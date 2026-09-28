alter table public.organizations
add column "disabledFeatures" json not null default '[]';
