create table if not exists public.vcs_sources (
  "id" serial primary key,
  "name" varchar(64) not null unique,
  "repo" varchar(255) not null,
  "branch" varchar(255) not null default 'main',
  "basePath" varchar(255) not null default '',
  "orgId" integer references public.organizations ("id") on delete restrict,
  "includePatterns" jsonb not null default '["**/*.md"]',
  "excludePatterns" jsonb not null default '["README.md"]',
  "allowedActions" jsonb not null default '["add", "update", "remove"]',
  "enabled" boolean not null default true,
  "lastSyncedCommitSha" char(40),
  "lastSyncedAt" timestamptz,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table if not exists public.song_vcs_files (
  "id" serial primary key,
  "songId" integer not null references public.songs ("id") on delete cascade,
  "sourceId" integer not null references public.vcs_sources ("id") on delete cascade,
  "path" text not null,
  "blobSha" char(40) not null,
  "contentHash" varchar(64),
  "syncedAt" timestamptz not null default now(),
  unique ("sourceId", "path")
);

create index if not exists "songVcsFilesSongIdIdx" on public.song_vcs_files ("songId");

create table if not exists public.vcs_sync_runs (
  "id" serial primary key,
  "sourceId" integer not null references public.vcs_sources ("id") on delete cascade,
  "startedAt" timestamptz not null default now(),
  "finishedAt" timestamptz,
  "baseCommitSha" char(40),
  "status" varchar(16) not null,
  "added" integer not null default 0,
  "updated" integer not null default 0,
  "removed" integer not null default 0,
  "failed" integer not null default 0,
  "details" jsonb not null default '[]'
);

alter table public.vcs_sources enable row level security;
alter table public.song_vcs_files enable row level security;
alter table public.vcs_sync_runs enable row level security;
