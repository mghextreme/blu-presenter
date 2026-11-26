# Frontend (`app/`)

## Commands

```bash
pnpm dev                      # dev server
pnpm build                    # type check + production build
pnpm lint                     # ESLint (check only)
pnpm test run                 # all tests, once
pnpm test run <file-pattern>  # specific tests, once
```

`pnpm test` without `run` (and `pnpm test:ui`) is interactive and never exits.

## Structure

- `src/routes/` — pages and their `*.loader.ts`; all routes are declared in `src/routes/router.tsx`.
- `src/layouts/`, `src/components/` (`ui/` is shadcn), `src/hooks/` (providers and hooks), `src/lib/` (pure helpers), `src/types/`.
- `src/services/` — one class per API resource, extending `ApiService`. Components get them through `useServices()`.
- State: Zustand for global client state (`useAuth` holds session, user and organizations), TanStack Query for server data.
- Routes are lazy-loaded (`lazy` in `router.tsx`); keep page modules free of exports the router needs eagerly (loaders live in `*.loader.ts`).

## Server data (TanStack Query)

- **Services own the cache.** Each read has a query definition on its service (`songsService.byIdQuery(id, secret)`, built with `queryOptions` and a key under the resource prefix, e.g. `['songs', …]`) plus an imperative method (`getById`) built on `queryClient.query(...)`. Mutation methods invalidate the resource prefix themselves; components never invalidate.
- **Pages with a loader** read with `useSuspenseQuery(service.xQuery(<same args as the loader>))`; other reads use `useQuery` (with `enabled` for conditional reads). No reads in `useEffect` + `setState`.
- **User-triggered writes** use `useMutation` and its `isPending`/`onError`, not manual loading state.
- **Paginated lists** use `useFilteredList` (built on `useInfiniteQuery`) with the resource's key prefix.
- Client defaults are in `src/lib/query-client.ts` (offline-aware `networkMode: 'always'`, 30 s stale time, no refetch on focus/reconnect, no retry). In tests use `render` / `createQueryWrapper` from `@/test/test-utils`, which share those defaults.
- TanStack Query 5.105 deprecates `fetchQuery`, `ensureQueryData`, `prefetchQuery` and `FetchQueryOptions`: use `queryClient.query(...)`.

## Controller

`ControllerProvider` creates one Zustand store per provider (the live controller persists to storage; previews don't). Read it with a selector so components re-render only for what they use: `useController((s) => ({ next: s.next, selection: s.selection }))`.
- Path alias `@/*` → `src/*`. Use named exports.
- File naming in `src/types/`: `.interface.ts` (data shapes), `.type.ts` (aliases/unions), `.class.ts` (classes), `.schema.ts` (Zod schemas).

## Conventions

- TypeScript strict mode, with `noImplicitAny: false`.
- Tailwind utility classes; merge classes with `cn()` from `@/lib/utils`.
- **shadcn/ui first:** check whether shadcn provides a component before building one. Add components with `pnpm dlx shadcn@latest add <component>`. The CLI can overwrite customized files (e.g. `button.tsx`), so check the diff and restore customizations. For composite patterns (e.g. date pickers) follow shadcn's documented composition (Popover + Calendar) instead of writing wrappers. Config: `components.json`.
- **Translations:** use `useTranslation('<namespace>')`; namespaces are the files in `locales/<lang>/`. Add every key to both `en` and `pt`.
- **User-supplied URLs:** open or link them only through `safeExternalUrl()` from `@/lib/utils`, which allows `http(s)` only.
- Build config and vendor chunk splitting: `vite.config.ts`.

## Tests

- Vitest + Testing Library, in `__tests__/` next to the code, named `*.spec.ts(x)`.
- Render with `render` from `@/test/test-utils`.
- When mocking named exports, put the export's name in the mock object, not `default`.
