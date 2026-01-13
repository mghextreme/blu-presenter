# BluPresenter - Agent Developer Guide

This guide provides essential information for AI coding agents working on the BluPresenter codebase.

## Project Overview

BluPresenter is a monorepo containing two main projects:
- **app/**: React + TypeScript frontend (Vite + React Router)
- **api/**: NestJS backend API with TypeORM and Supabase integration

**Package Manager**: pnpm (v10.11.0)
**Node Version**: 22.16.0 (managed via Volta)

## Build, Lint & Test Commands

### Frontend (app/)

```bash
cd app

# Development
pnpm dev                    # Start dev server
pnpm build                  # Type check + build for production
pnpm preview               # Preview production build
pnpm lint                  # Run ESLint

# Testing
pnpm test                  # Run all tests (Vitest)
pnpm test <file-pattern>   # Run specific test file(s)
pnpm test:ui               # Run tests with UI
pnpm test:coverage         # Run tests with coverage report

# Example: Run a single test file
pnpm test src/lib/__tests__/utils.spec.ts
```

### Backend (api/)

```bash
cd api

# Development
pnpm start:dev             # Start dev server with watch mode
pnpm start:debug           # Start with debugging enabled
pnpm build                 # Build for production
pnpm start:prod            # Run production build

# Linting & Formatting
pnpm lint                  # Run ESLint with auto-fix
pnpm format                # Format code with Prettier

# Testing
pnpm test                  # Run all tests (Jest)
pnpm test <file-pattern>   # Run specific test file(s)
pnpm test:watch            # Run tests in watch mode
pnpm test:cov              # Run tests with coverage
pnpm test:e2e              # Run end-to-end tests

# Example: Run a single test file
pnpm test themes.service.spec.ts
```

### Database (Supabase)

```bash
# From project root
supabase start             # Start local Supabase instance
```

## Code Style Guidelines

### General Formatting

- **Indentation**: 2 spaces (enforced by .editorconfig)
- **Line endings**: LF (Unix-style)
- **Final newline**: Always include
- **Encoding**: UTF-8 for .js/.ts/.jsx/.tsx files

### Frontend (app/)

#### Import Order
```typescript
// 1. External libraries
import { useState } from "react";
import { useNavigate } from "react-router-dom";

// 2. Internal components/hooks (using @/ alias) - ALWAYS use named imports
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggler } from "@/components/shared/theme-toggler";

// 3. Relative imports
import { localHelper } from "./helpers";
```

#### TypeScript
- Use TypeScript for all files (`.tsx` for components, `.ts` for utilities)
- Path alias: `@/*` maps to `./src/*`
- Strict mode enabled, but `noImplicitAny: false`
- Prefer explicit return types for complex functions
- Use `interface` for object shapes, `type` for unions/intersections

#### React Components
```typescript
// Use named exports for components
export function ComponentName({ prop }: Props) {
  // Hooks at the top
  const { isLoggedIn } = useAuth();
  const [state, setState] = useState(false);

  // Return JSX
  return (
    <div className="flex items-center gap-2">
      {/* Conditional rendering with && or ternary */}
      {isLoggedIn && <ProfileButton />}
    </div>
  );
}
```

#### Styling
- Use Tailwind CSS utility classes
- Use `cn()` utility from `@/lib/utils` to merge classes
- Component library: Radix UI primitives with custom styling

#### Testing
- Test framework: Vitest
- Test files: `*.spec.ts` or `*.test.tsx`
- Location: Co-located in `__tests__` directories
- Use `describe`, `it`, `expect` from Vitest
- Include Testing Library utilities: `@testing-library/react`
- **IMPORTANT**: When mocking named exports, use the function name in the mock object, not `default`

#### Type Definitions
- File naming conventions:
  - `.interface.ts` - TypeScript interfaces for data structures
  - `.type.ts` - Type aliases, unions, enums
  - `.class.ts` - Class definitions with methods
  - `.schema.ts` - Zod/validation schemas

### Backend (api/)

#### Import Order
```typescript
// 1. NestJS core
import { Injectable, Inject, BadRequestException } from '@nestjs/common';

// 2. External libraries
import { SupabaseClient } from '@supabase/supabase-js';

// 3. Internal modules (using src/ alias)
import { User } from 'src/entities';
import { UsersService } from 'src/users/users.service';
import { SignInDto } from 'src/types';
```

#### TypeScript
- Module system: CommonJS
- Decorators enabled (NestJS requirement)
- Target: ES2021
- No explicit return types required (ESLint rule disabled)
- `any` type allowed (ESLint rule disabled)

#### NestJS Patterns
```typescript
@Injectable({ scope: Scope.REQUEST }) // Use request scope when needed
export class MyService {
  constructor(
    @Inject(DependencyService)
    private readonly depService: DependencyService,
  ) {}

  async method(): Promise<ReturnType> {
    // Implementation
  }
}
```

#### Controllers
- Use decorators: `@Controller()`, `@Get()`, `@Post()`, `@Put()`, `@Delete()`
- Use custom decorators: `@OrganizationRole()`, `@Public()`
- Extract DTOs for request/response validation
- Use `@Headers()`, `@Param()`, `@Body()`, `@Query()` for input

#### Entities (TypeORM)
```typescript
@Entity({ name: 'table_name' })
export class EntityName {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  field: string;

  @ManyToOne(() => RelatedEntity, relation => relation.field, {
    createForeignKeyConstraints: true,
  })
  @JoinColumn({ name: 'relatedId' })
  related: RelatedEntity;
}
```

#### Error Handling
- Use NestJS exceptions: `BadRequestException`, `ForbiddenException`, `NotFoundException`
- Handle Supabase errors with status code checks (401, 403, etc.)
- Use try-catch for non-critical operations, log warnings with `console.warn()`

#### Testing
- Test framework: Jest
- Test files: `*.spec.ts`
- Location: `__tests__` subdirectories within modules
- E2E tests: `test/` directory with `jest-e2e.json` config

#### Type Definitions
- File naming conventions:
  - `.interface.ts` - TypeScript interfaces for data structures
  - `.type.ts` - Type aliases, unions, enums
  - `.dto.ts` - Data Transfer Objects
  - `.view-model.ts` - View models for API responses

#### Prettier Configuration
- Single quotes: `true`
- Trailing commas: `all`

## Common Patterns

### Authentication
- Frontend: Supabase auth via custom `useAuth` hook
- Backend: JWT strategy with Supabase integration, request-scoped services

### State Management
- Frontend: Zustand for global state, React Query for server state
- Backend: Dependency injection via NestJS

### API Communication
- REST endpoints for CRUD operations
- WebSocket (Socket.io) for real-time features (sessions, broadcasts)

## Build Optimization

### Frontend Bundle Structure

The frontend uses **vendor chunk splitting** to optimize bundle sizes and caching:

- **Main bundle** (`index.js`): ~695 KB (189 KB gzipped) - Application code
- **Vendor chunks**: Separated by category for optimal caching
  - `vendor-react`: Core React libraries (React, React DOM, React Router)
  - `vendor-radix`: Radix UI components library
  - `vendor-data`: State management (React Query, Zustand, React Table)
  - `vendor-i18n`: Internationalization (i18next)
  - `vendor-forms`: Form libraries (React Hook Form, Zod)
  - `vendor-ui-utils`: UI utilities (Heroicons, Lucide, etc.)
  - `vendor-dnd`: Drag & drop functionality (DnD Kit)
  - `vendor-socket`: Real-time communication (Socket.io)

**Benefits**:
- Initial load: 52% smaller (gzipped)
- Vendor chunks cached separately (download once, reuse forever)
- Only main bundle changes on app updates
- Better cache hit rate for returning users

**Configuration**: See `app/vite.config.ts` → `build.rollupOptions.output.manualChunks`

## Important Files

- `app/src/lib/utils.ts` - Utility functions (cn, etc.)
- `app/vite.config.ts` - Build configuration and chunk splitting
- `api/src/entities/` - TypeORM entity definitions
- `api/src/types/` - Shared DTOs and type definitions
- `.editorconfig` - Editor configuration
- `tsconfig.json` - TypeScript configuration per project

## Development Workflow

### Making Changes

When making code changes, always follow this workflow:

1. **Make your changes** to the codebase
2. **Test after each logical step**:
   ```bash
   # Frontend
   cd app
   pnpm build  # Verify TypeScript compilation
   pnpm test run  # Run all tests
   
   # Backend
   cd api
   pnpm build  # Verify compilation
   pnpm test  # Run all tests
   ```
3. **Verify the application works** if making significant changes
4. **Commit manually** - commits are done by the user, not automatically

### Testing Best Practices

- Run `pnpm build` first to catch TypeScript errors quickly
- Run `pnpm test run` to verify all tests pass
- If a test fails, fix it before proceeding
- For large refactors, test after each phase of changes

## License

GPL-3.0-or-later. All contributions must comply with this license.
