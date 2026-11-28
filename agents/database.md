# Database (`supabase/`)

## Local

```bash
supabase start          # from the repo root
supabase db reset       # rebuild the local DB: migrations + supabase/seeds/*.sql
cd api && pnpm seed:songs   # then import seed songs
```

Seed songs live in `supabase/seeds/songs/` in the song markdown export/import format, not as SQL inserts.

## Migrations

- The schema is owned by SQL migrations. TypeORM `synchronize` is **off**, so changing an entity changes nothing in the database.
- Create one with `supabase migration new <kebab-case-name>`, which writes `supabase/migrations/<timestamp>_<name>.sql`. Never edit a migration that is already on `master`; add a new one.
- Columns are camelCase and must be double-quoted in SQL (`"orgId"`, `"createdAt"`).
- In the same change, update the entity in `api/src/entities/` to match: column type, nullability, length, and `select: false` for anything secret.
- New tables: `enable row level security` and add no policies (as in the `vcs_*` tables). The API's database role bypasses RLS, and public access is revoked.
- Index foreign keys used to scope queries (e.g. `"orgId"`).
- Production migrations are applied by hand. Say so in your summary when a change needs one.
