# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Commands

```bash
npm start            # ng serve (dev server at localhost:4200)
npm run build        # production build
npm run watch        # dev build with watch mode
npm test             # run unit tests
```

### Local Dev URLs

The app runs under the `healthcare` subdomain locally:

```
Frontend:  http://healthcare.localhost:4200
Backend:   http://healthcare.localhost:8080
```

Example endpoints:
- `http://healthcare.localhost:8080/public/tenant-info`
- `http://healthcare.localhost:8080/users`

No linting script is configured — TypeScript strict mode acts as the primary static check. Angular's strict template checking (`strictTemplates: true`) catches template errors at build time.

---

## Architecture Overview

**MedCore UI** is a multi-tenant Angular 21 SPA for clinic management. It uses SSR (Angular Universal + Express), standalone components, zoneless change detection, and NgRx Signals for state.

### Path Aliases

```
@core/*        → src/app/core/*
@shared/*      → src/app/shared/*
@features/*    → src/app/features/*
@layout/*      → src/app/layout/*
@environments/* → src/environments/*
```

### Routing & Shell Layout

There are five role-based shells under `src/app/layout/shells/`:

| Shell | Route prefix | Role |
|---|---|---|
| `admin-shell` | `/admin` | ADMIN, SUPERADMIN |
| `reception-shell` | `/reception` | USER |
| `doctor-shell` | `/doctor` | (doctor role) |
| `patient-shell` | `/patient` | PATIENT |
| `public-shell` | `/` | Unauthenticated |

Each shell hosts a `<router-outlet>` for its feature routes. Features under `src/app/features/` are lazy-loaded with `loadComponent`. All feature `*.routes.ts` files define their own child routes and are imported by the parent shell route config.

### Multi-Tenant System

The app is subdomain-driven. `TenantService.getSubdomain()` extracts the subdomain from `window.location.hostname`. `tenantInterceptor` rewrites every API request: `localhost:8080` → `{subdomain}.localhost:8080`. For local development where subdomain equals `"localhost"` the interceptor must skip the rewrite to avoid `localhost.localhost:8080`.

`TenantStore` (NgRx signal store) holds branding info (`name`, `logoUrl`, `primaryColor`, `subtitle`) loaded once on shell `ngOnInit()` from `GET /public/tenant-info`.

### Auth & Roles

`AuthStore` is the single source of truth for authentication state. It stores `accessToken`, `refreshToken`, `roles[]`, and the full `UserMeResponse`. After a successful login the store calls `/auth/me`, resolves `primaryRole`, and navigates using `ROLE_REDIRECTS` from `role.model.ts`:

```
ADMIN / SUPERADMIN  → /admin/dashboard
USER                → /reception/dashboard
PATIENT             → /patient/dashboard
```

Tokens are persisted to `localStorage` by `TokenService`. `authInterceptor` reads `access_token` from localStorage and injects `Authorization: Bearer ...` on every request (browser-only, SSR-safe).

Roles are uppercase string literals: `'SUPERADMIN' | 'ADMIN' | 'USER' | 'PATIENT'`.

### State Management — NgRx Signals

All stores live in `src/app/core/`. Pattern:

```typescript
export const FooStore = signalStore(
  { providedIn: 'root' },
  withState<FooState>({ ... }),
  withComputed(({ stateSlice }) => ({ derived: computed(() => ...) })),
  withMethods((store, service = inject(FooService)) => ({
    async doThing() { patchState(store, { loading: true }); ... }
  }))
);
```

Use `toSignal()` (from `@angular/core/rxjs-interop`) to bridge Observables → Signals in components. Avoid `subscribe()` in components; use `firstValueFrom()` for one-shot async calls in store methods.

### API Layer

`src/app/core/api/api.config.ts` centralises all endpoint strings. Services must **always** import from `API_ROUTES` — no hardcoded URLs anywhere else.

All HTTP responses follow `ApiResponse<T> = { success: boolean; data: T; message: string }`. Paginated endpoints return `PagedResponse<T>` (`content[]`, `totalElements`, `totalPages`, `pageNumber`, `pageSize`, `last`).

**Public vs. protected endpoints** — URLs under `/public/**` (e.g. `/public/tenant-info`, `/public/bookings`) must NOT have the `Authorization` header injected. The `authInterceptor` must skip those requests. Do not add guards or token logic to any public route.

Optional query params are built with:
```typescript
private buildParams(filters: object): HttpParams {
  return Object.entries(filters)
    .filter(([, v]) => v !== undefined && v !== null)
    .reduce((params, [k, v]) => params.set(k, String(v)), new HttpParams());
}
```
The parameter type must be `object` (not `Record<string, unknown>`) to avoid invalid TypeScript casts from specific model interfaces.

### Styling

- **Tailwind CSS v4** via `@tailwindcss/vite` — no `tailwind.config.*` file; configuration lives in `src/styles.scss` using `@use "tailwindcss"` with `@plugin` directives.
- **Angular Material 21** with the `mat.$azure-palette` theme applied globally via `mat.theme()` in `styles.scss`.
- **CSS custom properties** defined in `:root` in `styles.scss`: `--color-surface`, `--color-background`, `--color-text-primary`, `--color-text-secondary`, `--color-text-muted`, `--color-border`, `--color-danger`, `--color-success`, `--color-warning`.
- Material system tokens (`--mat-sys-primary`, `--mat-sys-on-surface`, etc.) are available app-wide from the theme setup.
- Component SCSS uses `color-mix(in srgb, var(--mat-sys-primary) 12%, transparent)` for tinted backgrounds.

---

## Coding Rules

**No comments anywhere** — not in TypeScript, HTML, or SCSS. If logic needs explanation, rename identifiers to be self-documenting.

**No `any`** — never use `any` as a type. Every value must have a properly defined interface or type alias in `src/app/core/models/`. If a shape is unknown, use `unknown` and narrow it explicitly.

**No `Zone.js`** — the app uses `provideZonelessChangeDetection()`. Never call `NgZone.run()`. Reactivity comes exclusively from Angular Signals and NgRx Signals.

**Standalone components only** — no `NgModule`. Every component, directive, and pipe declares its own `imports[]`.

**SOLID / clean architecture boundaries:**
- `core/` — framework-agnostic services, stores, models, interceptors, guards. No UI imports.
- `shared/` — reusable UI components, directives, and pipes. No feature-specific logic.
- `features/` — feature modules. Each feature owns its own route config (`*.routes.ts`).
- `layout/` — shell components that compose a feature area's chrome (sidebar, topbar, footer).

**HTTP services** are thin: one service per domain, each method returns an `Observable`. Business logic and state mutations belong in stores, not services.

**Forms** use Reactive Forms (`FormGroup` / `FormControl`). Template-driven forms are not used. Cross-field validators are standalone functions (not methods).

**SSR safety** — any code that accesses `window`, `document`, or `localStorage` must be guarded with `isPlatformBrowser(PLATFORM_ID)` or moved to browser-only interceptors/services that already perform this check.

**Routing** — all routes use `loadComponent` (lazy). No eagerly loaded feature components in route configs. Guards (`auth.guard.ts`, `role.guard.ts`) are placed on shell and child routes.

---

## Key Files Quick Reference

| Purpose | File |
|---|---|
| Global providers & interceptors | `src/app/app.config.ts` |
| Top-level routes | `src/app/app.routes.ts` |
| All API endpoint strings | `src/app/core/api/api.config.ts` |
| Auth state + login/logout | `src/app/core/auth/auth.store.ts` |
| Tenant branding state | `src/app/core/tenant/tenant.store.ts` |
| Token persistence | `src/app/core/auth/token.service.ts` |
| Global CSS variables + Material theme | `src/styles.scss` |
| Role → redirect mapping | `src/app/core/models/role.model.ts` |
| Shared response wrappers | `src/app/core/models/api-response.model.ts`, `pagination.model.ts` |
