# NestJS Best Practices Audit — BluPresenter API

**Date:** 2026-03-14
**Scope:** `/api/src`
**Rules evaluated:** 40 across 10 categories
**Result:** 12 ✅ Pass · 10 ⚠️ Partial · 10 ❌ Fail · Overall compliance: ~50%

---

## Summary by Impact

### ❌ Critical Failures (must fix)

| Rule | Issue | Affected Files |
|------|-------|----------------|
| `arch-avoid-circular-deps` | Potential circular dependency between `AuthService` ↔ `OrganizationsService` via shared guards | `auth/auth.service.ts`, `organizations/organizations.service.ts`, `supabase/supabase.guard.ts` |
| `error-handle-async-errors` | Fire-and-forget Supabase calls with empty `.catch()`, bare `console.warn` | `users/users.service.ts:95`, `auth/auth.controller.ts:77` |
| `error-use-exception-filters` | No global exception filter — error response shape is inconsistent | `main.ts` |
| `devops-graceful-shutdown` | `enableShutdownHooks()` missing, no SIGTERM/SIGINT handler | `main.ts` |
| `test-use-testing-module` | Only one test file exists (`themes.service.spec.ts`); most services have zero coverage | `__tests__/` |
| `test-mock-external-services` | No mocked unit tests for Supabase, TypeORM repos, or external calls | — |
| `test-e2e-supertest` | No E2E tests exist | `test/` |

### ⚠️ Partial (should fix)

| Rule | Gap | Affected Files |
|------|-----|----------------|
| `arch-use-events` | No `@nestjs/event-emitter` — cross-module side effects done inline inside services | `organizations/organizations.service.ts` |
| `di-scope-awareness` | REQUEST scope used in several services without documented rationale | `auth/auth.service.ts:30`, `organizations/organizations.service.ts:61`, `supabase/supabase.guard.ts:12` |
| `api-use-dto-serialization` | No `ClassSerializerInterceptor`; entities returned directly, risking exposure of internal fields | `main.ts`, all controllers |
| `api-use-interceptors` | No logging interceptor or response-shape interceptor | `main.ts` |
| `api-versioning` | No URI or header versioning strategy | All controllers |
| `security-rate-limiting` | Uniform 60 req/min for all routes; auth routes need a much stricter limit | `app.module.ts:31-34` |
| `security-sanitize-output` | No `helmet` middleware for security headers (CSP, HSTS, etc.) | `main.ts` |
| `devops-use-logging` | `console.log/warn` used throughout instead of NestJS `Logger` | `auth/auth.service.ts`, `auth/auth.controller.ts` |
| `perf-use-caching` | No caching — list endpoints hit the database on every request | All GET list controllers |
| `perf-optimize-database` | No `@Index()` decorators on frequently queried fields (`authId`, `orgId`, `email`); list endpoints lack pagination | `entities/*.entity.ts` |

### ✅ Passing

| Rule | Notes |
|------|-------|
| `arch-feature-modules` | Well-organized by domain: `auth/`, `users/`, `organizations/`, `songs/`, `themes/`, `sessions/`, `schedules/` |
| `arch-use-repository-pattern` | TypeORM repositories injected and used consistently |
| `arch-single-responsibility` | Services have focused, well-scoped responsibilities |
| `di-prefer-constructor-injection` | Constructor injection used exclusively throughout |
| `di-use-interfaces-tokens` | Class-based tokens used; no runtime-invalid interface tokens |
| `di-interface-segregation` | Minimal, focused service dependencies |
| `security-use-guards` | `SupabaseGuard` registered as `APP_GUARD`; `@OrganizationRole()` enforces RBAC |
| `security-validate-all-input` | Global `ValidationPipe` with `whitelist: true` and `transform: true` |
| `security-auth-jwt` | Supabase JWT validated via `JwtVerificationService` |
| `db-use-transactions` | `DataSource.transaction()` used for multi-step operations (create org, transfer ownership, update user) |
| `devops-use-config-module` | `ConfigModule` configured globally, environment loaded from `../env` |
| `api-use-pipes` | `ValidationPipe` applied globally in `main.ts` |

---

## Detailed Findings

### 1. Architecture

#### `arch-avoid-circular-deps` ❌
`AuthService` imports `OrganizationsService` and `UsersService`. `SupabaseGuard` depends on both. If either service imports anything from `auth/`, a circular graph forms. Extract shared request-context data (userId, orgId) into a dedicated lightweight `RequestContextService` that any module can import without pulling in business logic.

#### `arch-feature-modules` ✅
Feature-module layout is clean. Each domain has its own `*.module.ts`, `*.controller.ts`, `*.service.ts`.

#### `arch-module-sharing` ⚠️
No `@Global()` misuse found. `OrganizationsBaseService` pattern is reasonable but the distinction between it and `OrganizationsService` should be documented.

#### `arch-single-responsibility` ✅
Services are appropriately focused.

#### `arch-use-repository-pattern` ✅
TypeORM repository injection used consistently.

#### `arch-use-events` ⚠️
`OrganizationsService.create()` and member-invite flows perform inline cross-cutting work. These would benefit from `EventEmitter2` events (`organization.created`, `member.invited`) to decouple notification, logging, and audit concerns.

---

### 2. Dependency Injection

#### `di-prefer-constructor-injection` ✅

#### `di-scope-awareness` ⚠️
Three services/guards use `Scope.REQUEST`. This is correct since they need per-request Supabase context, but the cascade effect on their consumers is undocumented. Add a comment explaining why and consider `nestjs-cls` to avoid scope bubble-up.

#### `di-use-interfaces-tokens` ✅

#### `di-interface-segregation` ✅

#### `di-avoid-service-locator` ✅
No `ModuleRef.get()` usage found.

#### `di-liskov-substitution` ✅

---

### 3. Error Handling

#### `error-use-exception-filters` ❌
No global filter registered. Different services throw exceptions with different shapes. Add:

```typescript
// main.ts
app.useGlobalFilters(new AllExceptionsFilter());
```

With a consistent response envelope: `{ statusCode, message, timestamp, path }`.

#### `error-throw-http-exceptions` ✅
`BadRequestException`, `NotFoundException`, `ForbiddenException` used appropriately in services.

#### `error-handle-async-errors` ❌
`users/users.service.ts:95` — Supabase metadata update is fire-and-forget with a `.catch()` that does nothing. `auth/auth.controller.ts:77` uses `console.warn`. These should use the NestJS `Logger` and optionally enqueue failed operations for retry.

---

### 4. Security

#### `security-auth-jwt` ✅
Supabase JWT validated via `JwtVerificationService`. No custom secret management required.

#### `security-validate-all-input` ✅
Global `ValidationPipe` active.

#### `security-use-guards` ✅
`APP_GUARD` pattern correct. `@Public()` decorator for opt-out.

#### `security-sanitize-output` ⚠️
API is JSON-only (low XSS risk) but lacks `helmet`. Add:

```typescript
import helmet from 'helmet';
app.use(helmet());
```

#### `security-rate-limiting` ⚠️
Current: 60 req/60s globally. Auth endpoints (`/auth/signin`, `/auth/signup`) should be 5–10 req/min. Apply `@Throttle({ default: { limit: 5, ttl: 60000 } })` to auth routes.

---

### 5. Performance

#### `perf-use-caching` ❌
No caching. Frequently read resources (themes, song lists) hit the database every time. Add `CacheModule` with Redis and `@UseInterceptors(CacheInterceptor)` on read-heavy endpoints with appropriate TTLs.

#### `perf-optimize-database` ⚠️
- Missing `@Index()` on `authId`, `email`, `organizationId` in entities.
- List endpoints (`GET /songs`, `GET /schedules`, etc.) return unbounded results. Add `take`/`skip` pagination.

#### `perf-lazy-loading` ✅ (N/A)
Module count is small enough that lazy loading isn't needed yet.

#### `perf-async-hooks` ⚠️
No lifecycle hooks implemented. No issue currently, but `OnModuleInit` should be used if any async initialization is needed in future services.

---

### 6. Testing

#### `test-use-testing-module` ❌
Only `themes/__tests__/themes.service.spec.ts` exists. All other services have no tests.

#### `test-mock-external-services` ❌
Supabase client and TypeORM repositories need to be mocked in unit tests. No mock factories or stubs exist.

#### `test-e2e-supertest` ❌
`test/` directory contains only the jest config. No E2E test files. Add at minimum smoke tests for auth and CRUD flows.

---

### 7. Database & ORM

#### `db-use-transactions` ✅
Used in `organizations.service.ts` (create, transferOwnership) and `users.service.ts` (update).

#### `db-avoid-n-plus-one` ✅
Selective `relations` and `select` used in queries. No obvious N+1 patterns found.

#### `db-use-migrations` ⚠️
Migrations are managed via Supabase (`supabase/migrations/`). Confirm `synchronize: false` in TypeORM config for production. TypeORM's own migration runner is not used — this is acceptable but should be documented.

---

### 8. API Design

#### `api-use-dto-serialization` ⚠️
Entities are returned directly from controllers in some cases. Add `ClassSerializerInterceptor` globally and use `@Expose()` / `@Exclude()` on entity fields or create explicit response-DTO classes.

#### `api-use-interceptors` ⚠️
No request/response logging interceptor. No response-envelope interceptor. Add a `LoggingInterceptor` and consider a `TransformInterceptor` for consistent `{ data, meta }` responses.

#### `api-versioning` ⚠️
No versioning. For future-proofing add in `main.ts`:

```typescript
app.enableVersioning({ type: VersioningType.URI });
```

#### `api-use-pipes` ✅

---

### 9. Microservices

`micro-*` rules are not applicable — BluPresenter API is a monolithic NestJS app, not a microservices architecture.

---

### 10. DevOps & Deployment

#### `devops-use-config-module` ✅

#### `devops-use-logging` ⚠️
Replace all `console.log/warn/error` with:

```typescript
private readonly logger = new Logger(MyService.name);
this.logger.warn('message', context);
```

#### `devops-graceful-shutdown` ❌
Add to `main.ts`:

```typescript
app.enableShutdownHooks();
process.on('SIGTERM', async () => {
  await app.close();
  process.exit(0);
});
```

---

## Recommended Fix Order

1. `main.ts` — add `helmet()`, global exception filter, `enableShutdownHooks()`
2. Replace `console.*` with `new Logger()` throughout
3. Fix fire-and-forget async handling in `users.service.ts` and `auth.controller.ts`
4. Add `ClassSerializerInterceptor` globally + `@Expose()` on response fields
5. Tune rate limits on auth routes
6. Add `@Index()` decorators to entity fields + pagination on list endpoints
7. Break circular dependency risk by extracting `RequestContextService`
8. Begin unit test coverage — start with `songs`, `organizations`, `auth` services
9. Add E2E smoke tests
10. Evaluate `@nestjs/event-emitter` for cross-module decoupling
