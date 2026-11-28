# Architecture

## Request path

- App services (`app/src/services/*`, all extending `ApiService`) call the API over REST with `Authorization: Bearer <Supabase access token>` and, for organization-scoped endpoints, an `Organization: <orgId>` header.
- Auth goes through the API (`/auth/*` wraps Supabase Auth). The app does not call Supabase directly; `@supabase/supabase-js` is used only for types.
- The global `SupabaseGuard` verifies the JWT and loads the internal `User` — any failure is **401**. `@OrganizationRole(...)` reads the `Organization` header and checks the caller's role — a missing header or a role not allowed is **403**, a malformed header is **400**. `@Public()` opts a route out.
- The app refreshes the session only on 401, and signs the user out only when `/auth/refresh` rejects the refresh token (400/401/403). 5xx, 429 and network errors keep the session.

## Organizations

- Every song, theme, schedule and session belongs to an organization (`orgId`). Queries must be scoped by it.
- Roles, highest first: `owner` > `admin` > `member` > `guest` (`isRoleHigherThan` / `isRoleHigherOrEqualThan`). Each organization has exactly one owner; ownership moves only through transfer.
- Organizations can disable the `schedules`, `sessions` and `themes` features (`disabledFeatures`). The API enforces this (`assertFeatureEnabled`); the app hides them (`filterOrganizationsByFeature`).

## Sharing

Organizations, songs, schedules and sessions have a `secret`. Public routes under `/shared/...` in the app pass it to public API endpoints. Treat secrets as credentials: never log them or return them to users who should not have them.

## Live sessions (projection)

1. The controller (`/app/controller`) opens projector windows through `WindowProvider` and writes state over REST (`PUT /sessions/:sessionId/broadcast/...`). `BroadcastService` in the app queues writes so they land in order.
2. The API persists the state, then `SessionsGateway.broadcastToSession` emits to the Socket.io room `session:<id>`.
3. Receivers (`/shared/session/:orgId/:sessionId/:secret`) join by secret through `useSessionSocket` and render. Socket messages are not authenticated; the secret is the only check.

Socket rooms and rate-limit state are in-process: the API assumes a **single instance** (no Redis adapter).

## Offline / PWA

- `vite-plugin-pwa` with prompt-based updates. It precaches only the app shell and caches fonts at runtime; API responses are not cached by the service worker.
- Songs, schedules and themes the user downloads go into the Dexie database `blu-presenter-offline` (`app/src/lib/offline/`). Read paths fall back to it on network errors.

## Playlists

Spotify and YouTube playlist sync live in `api/src/spotify`, `api/src/youtube` and `api/src/playlist-integration`. OAuth tokens are stored server-side in `users."spotify"` / `users."youtube"` (jsonb, `select: false`) and never reach the client. Locally, use `http://127.0.0.1:5173` rather than `localhost`: Spotify rejects `localhost` redirect URIs.

## API modules (`api/src/`)

`auth`, `users`, `organizations`, `songs` (plus `songs/text-format` for markdown import/export), `themes`, `schedules`, `sessions` (REST + gateway + broadcast), `spotify`, `youtube`, `playlist-integration`, `vcs-sync` (imports songs from git sources; see its README), `supabase` (guard, JWT verification). Shared DTOs and types are in `types/`, entities in `entities/`.

## Deployment

- **API:** a push to `master` touching `api/` runs `.github/workflows/api-build-and-deploy.yml`, which builds `api/Dockerfile`, pushes it to ECR and redeploys the Lightsail container service `blu-presenter-api`.
- **App:** manual, `pnpm run deploy` in `app/` (build + `wrangler deploy` to Cloudflare). Note `pnpm deploy` without `run` is a different, built-in pnpm command.
- **Database:** hosted Supabase. Migrations are applied by hand; apply them before deploying code that depends on them.
