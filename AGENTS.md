# BluPresenter — Agent Guide

BluPresenter presents song lyrics and slides on projector windows, and manages a song library, schedules and live sessions for organizations. It is a pnpm workspace:

- `app/` — React 19 + TypeScript, Vite, React Router, Tailwind 4, shadcn/ui. Deployed to Cloudflare.
- `api/` — NestJS + TypeORM on Supabase Postgres, auth through Supabase Auth. Deployed to AWS Lightsail.
- `supabase/` — SQL migrations, seeds and local Supabase config.

## Read only what the task needs

These files are not loaded automatically. Read the matching one before starting:

| When the task… | Read |
|---|---|
| touches app ↔ API contracts, auth, organizations/roles, sharing, live sessions, offline, playlists or deployment | `agents/architecture.md` |
| changes code in `app/` | `agents/frontend.md` |
| changes code in `api/` | `agents/backend.md` |
| adds or changes a migration, entity, seed or SQL query | `agents/database.md` |

## How to work

- **Confirm before building.** If investigating a task turns up a complication, an open question, a risk, or a better approach than the one requested, stop and ask the user before acting on it. Make sure you are building the right thing before building it.
- **One responsibility per unit** (Single Responsibility Principle). Each function, class, component and module does one thing. When a unit starts doing two, split it.
- **Let the code explain itself.** Use explicit names and declarations instead of comments. Comment only what the code cannot say: a non-obvious reason, a constraint, a workaround. Don't write comments that restate the code.
- **Prefer existing, well-tested libraries over custom code.** Before writing a helper, check whether a dependency the project already uses (or the platform: browser, Node, React, TanStack Query, React Router, Zustand, NestJS…) already provides it, including in the installed version. Add a new library only when it is maintained and well tested; write custom code only when the library would be heavy or overkill for the need.
- **Test behaviour, not implementation.** Tests check what a unit does through its public interface (inputs, outputs, visible effects), so they survive refactors and don't flake. Don't assert on internal calls, exact markup or timing unless that is the behaviour under test.

## Rules that always apply

- **Setup:** Node version is in `.nvmrc`; pnpm 12. Install once from the repo root with `pnpm install`. Env lives in one repo-root `.env` (copy `.env.sample`), read by both app and api. Never print or commit it.
- **Commands with traps:**
  - `app/`: `pnpm test` is watch mode and never exits. Use `pnpm test run [file-pattern]`.
  - `api/`: `pnpm lint` runs `eslint --fix` and rewrites files. To only check: `pnpm exec eslint <files>`.
- **Translations:** every user-facing string needs a key in both `app/locales/en/` and `app/locales/pt/`.
- **Verify after each logical step**, in each project you touched: `pnpm build`, then the tests (`pnpm test run` in `app/`, `pnpm test` in `api/`). Fix failures before moving on.
- **Commits are made by the user**, not by agents.
- **License:** GPL-3.0-or-later; all contributions must comply.
