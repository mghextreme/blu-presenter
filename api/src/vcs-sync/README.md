# VCS song sync

Syncs song markdown files from configured GitHub repositories into the songs
database — primarily the **Public Archive** (songs without an organization),
but also into organizations (for example a repo subfolder that may only *add*
songs to an org).

Files use the same markdown format as the song export feature
(YAML frontmatter + `# title` / `## artist` / `### part` body), so anything you
can export from BluPresenter can live in the repo.

Default repo layout: `language/artist/title.md` — but any layout works, as
long as files are `.md` and match the source's include patterns.

## Prerequisites

The script runs inside the `api` package and uses the same database
configuration as the server (`DATABASE_TYPE`, `DATABASE_HOST`, `DATABASE_PORT`,
`DATABASE_NAME`, `DATABASE_USERNAME`, `DATABASE_PASSWORD` from `.env`).

Add a GitHub token to `.env`:

```
GITHUB_TOKEN=github_pat_...
```

Without a token GitHub allows only 60 requests/hour; with one, 5,000.

## Creating a GitHub token

1. Go to https://github.com/settings/personal-access-tokens/new
   (Settings → Developer settings → Personal access tokens → Fine-grained tokens).
2. **Repository access**: select only the repositories you will sync.
3. **Permissions → Repository permissions → Contents**: `Read-only`.
4. Generate the token and put it in `.env` as `GITHUB_TOKEN`.

The token only needs read access; the sync never writes to the repository.

## Configuring sources

A *source* is one repository (optionally a subfolder of it) mapped to the
public archive or to an organization, with its own filters and allowed
actions. Sources are stored in the database and managed with subcommands:

```bash
cd api

# Public archive, whole repo
pnpm sync:vcs sources add --name public-archive --repo owner/songs --public

# Public archive, songs live under a subfolder, ignore drafts
pnpm sync:vcs sources add --name archive-main \
  --repo owner/songs --basePath songs/ --public \
  --exclude drafts/**

# Organization 12: this subfolder may only ADD new songs
pnpm sync:vcs sources add --name org12-additions \
  --repo owner/songs --basePath orgs/church-12/ --org 12 \
  --actions add

# List / edit / remove / dump as JSON
pnpm sync:vcs sources list
pnpm sync:vcs sources update org12-additions --actions add,update
pnpm sync:vcs sources remove org12-additions
pnpm sync:vcs sources export
```

Flags:

| Flag | Meaning |
| --- | --- |
| `--name` | Unique identifier of the source |
| `--repo` | GitHub repository, `owner/name` |
| `--branch` | Branch to sync (default `main`) |
| `--basePath` | Only files under this folder are considered (patterns match *relative to it*) |
| `--public` / `--org <id>` | Target: public archive (`orgId IS NULL`) or an organization |
| `--include` | Comma-separated allowlist globs (default `**/*.md`) |
| `--exclude` | Comma-separated blocklist globs |
| `--actions` | What the sync may do: `add`, `update`, `remove` (default all three) |

Pattern semantics: a path is synced when it matches **at least one include
pattern and none of the exclude patterns**. Only `.md` files are considered.
Globs support `**` and `*` (same engine as many gitignore-like tools), but
gitignore `!` negation is not supported — use the two lists instead.

## Running a sync

```bash
cd api

# Dry run (default): shows what WOULD change, writes nothing
pnpm sync:vcs --source public-archive

# Apply
pnpm sync:vcs --source public-archive --apply

# Everything configured, and stop on the first file that fails to parse
pnpm sync:vcs --all --apply --strict
```

Each run:

1. Fetches the branch head and its file tree from GitHub.
2. Compares the filtered tree against the links stored in the database
   (`song_vcs_files`): new files → add, changed files (different git blob SHA)
   → update, files gone from the repo → remove, identical SHA → skip.
3. Prints a report and writes an audit row into `vcs_sync_runs`.

Exit codes: `0` clean, `1` some files failed (they are listed in the report),
`2` fatal error.

### Syncing a single file

```bash
# Dry run by default, like everything else
pnpm sync:vcs file public-archive en/John Newton/Amazing Grace.md

# After fixing a file in the repo, or restoring a song from the repo:
pnpm sync:vcs file public-archive en/john-newton/amazing-grace.md --apply
pnpm sync:vcs file public-archive en/john-newton/amazing-grace.md --apply --force
```

Paths may be relative to the repo root or to the source's `basePath`.
`--force` re-applies the file even when its content is unchanged in the repo
(useful to overwrite local edits made through the app). A single-file sync
never removes anything.

## How files map to songs

- Every synced song gets a row in `song_vcs_files` linking it to
  `(source, path)`. The sync only ever touches songs that have such a link —
  songs created by users in the app are invisible to it.
- **Repo wins**: if a linked song was edited in the app since the last sync,
  the next sync overwrites it and flags the overwrite in the report
  (`overwrites local changes`). The audit table records what was overwritten.
- **Renames** are detected (delete + add with identical content) and keep the
  same song id, so schedules and sessions referencing the song keep working.
- **Removals** only happen when the file disappears from the repo *and* the
  source's allowed actions include `remove`. A file that merely fails to parse
  never removes its song.
- **Parse failures** are reported and retried automatically on every
  subsequent run — the link's recorded state is not advanced, so the file is
  picked up again as soon as it is fixed (or re-sync it directly with
  `sync:vcs file ... --apply`).
- **Secrets**: public archive songs are created without a share secret so
  they are publicly visible; organization songs get one, same as songs
  created in the app.

First sync note: if the target scope (e.g. the public archive) already has
hand-created songs, the first `--apply` run creates a second copy of each
matching file. Delete the old hand-created copies afterwards — the sync will
never touch them, because they have no link.

## Running inside Docker

```bash
docker compose exec api node dist/scripts/sync-vcs.js --source public-archive --apply
docker compose exec api node dist/scripts/sync-vcs.js sources list
```

The script needs the same environment variables as the API container
(plus `GITHUB_TOKEN`, add it to the `api` service environment in
`docker-compose.yml` if you use Docker).
