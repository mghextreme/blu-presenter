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
- `SupabaseGuard` is request-scoped and is the global guard, so most services are request-scoped too and read the caller from `request.user` (`internal` = `User`, `organization`, `role`). Follow the pattern of the module you are in.
- Protect endpoints with `@OrganizationRole('owner', 'admin', …)` or mark them `@Public()`. Scope every query by the organization id.
- **DTOs:** class-validator decorators on every field. Nested objects and arrays need `@ValidateNested({ each: true })` plus `@Type(() => Dto)`, or they are not validated. The global `ValidationPipe` uses `whitelist` and `transform`.
- **Errors:** throw Nest exceptions (`BadRequestException`, `ForbiddenException`, `NotFoundException`, `UnprocessableEntityException`). Always `await` service calls that can throw.
- File naming in `src/types/`: `.dto.ts` (request bodies), `.view-model.ts` (responses), `.interface.ts`, `.type.ts`.
- Prettier: single quotes, trailing commas.

## Tests

- Jest, in `__tests__/` inside the module, named `*.spec.ts`.
- Build a `Test.createTestingModule` with mocked repositories (`getRepositoryToken(Entity)`) and `{ provide: REQUEST, useValue: { user: … } }`. Request-scoped providers must be obtained with `module.resolve()`, not `get()`.
- `test/app.e2e-spec.ts` is an unmaintained scaffold; CI does not run it.
