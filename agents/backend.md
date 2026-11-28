# Backend (`api/`)

## Commands

```bash
pnpm start:dev                # dev server with watch
pnpm build                    # compile
pnpm test                     # all tests (Jest, exits on its own)
pnpm test <file-pattern>      # specific tests
pnpm exec eslint <files>      # lint, check only
pnpm lint                     # lint WITH --fix: rewrites files
pnpm format                   # Prettier, rewrites files
pnpm seed:songs               # import seed songs (see agents/database.md)
```

## Conventions

- One folder per module (`controller`, `service`, `module`, `__tests__/`). Imports of shared code use the `src/` alias (`src/entities`, `src/types`).
- Providers are singletons; nothing is request-scoped. `SupabaseGuard` (the global guard) stores the caller on `request.user`; controllers read it with the param decorators in `src/auth/request-context.decorator.ts` (`@CurrentUser()`, `@OptionalUser()` on `@Public()` routes, `@OrgId()`, `@OrgRole()`, `@AccessToken()`) and pass it to services as arguments. Never inject `REQUEST`.
- Protect endpoints with `@OrganizationRole('owner', 'admin', …)` or mark them `@Public()`. On `@OrganizationRole` routes read the organization with `@OrgId()` (parsed and checked by the guard), never `@Headers('Organization')`. Scope every query by the organization id.
- To annotate entities with the caller's role in their organization, use `withOrganizationRole` (`src/utils/organization-membership.ts`).
- TypeScript runs with `strictNullChecks`: repository lookups return `T | null`, so handle the null.
- **DTOs:** class-validator decorators on every field. Nested objects and arrays need `@ValidateNested({ each: true })` plus `@Type(() => Dto)`, or they are not validated. The global `ValidationPipe` uses `whitelist` and `transform`.
- **Outbound HTTP:** use `fetchWithTimeout` (`src/utils/fetch-with-timeout.ts`), never bare `fetch`: a stalled upstream must fail with a 504, not hang the request.
- **Logging:** Nest `Logger` (`new Logger(Class.name)`), never `console` (CLI scripts in `src/scripts/` excepted). Never log secrets, tokens or query strings.
- **Errors:** throw Nest exceptions (`BadRequestException`, `ForbiddenException`, `NotFoundException`, `UnprocessableEntityException`). Always `await` service calls that can throw.
- File naming in `src/types/`: `.dto.ts` (request bodies), `.view-model.ts` (responses), `.interface.ts`, `.type.ts`.
- Prettier: single quotes, trailing commas.

## Tests

- Jest, in `__tests__/` inside the module, named `*.spec.ts`.
- Build a `Test.createTestingModule` with mocked repositories (`getRepositoryToken(Entity)`) and get the service with `module.get()`; pass the user or organization as method arguments.
- Controller tests that boot an app without the guard set `request.user` with a small middleware (see `sessions/__tests__/broadcast.controller.spec.ts`).
- `test/app.e2e-spec.ts` is an unmaintained scaffold; CI does not run it.
