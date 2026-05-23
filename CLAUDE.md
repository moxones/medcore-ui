# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Golden Rules — read first

These are non-negotiable. Every new or modified file MUST satisfy all of them.

1. **Zero comments** — no comments in `.ts`, `.html`, or `.scss`. Self-document via clear names instead.
2. **No `any`** — use precise interfaces/types from `src/app/core/models/` or `unknown` + explicit narrowing.
3. **Clean code** — small single-responsibility functions, early returns, no dead code, no duplication, no premature abstraction.
4. **Visual consistency** — new/edited UI must look like the existing app: same colors, same button styles, same spacing, same card patterns, same role-based accents. Reuse shared components; never invent a one-off look.
5. **Tailwind-first responsive** — layout, spacing, grid, flex, breakpoints and responsive behavior use Tailwind utility classes. Mobile-first, fully responsive on every screen.
6. **No raw HTML tables** — never use `<table>` for data. Use responsive card grids / modern list layouts that are pretty, interactive, and user-friendly.
7. **Angular 21 modern APIs only** — signals, signal stores, new control flow, `inject()`, standalone, zoneless. No legacy patterns.
8. **Interactive & friendly UX** — smooth transitions, hover/focus states, loading skeletons, empty states, optimistic feedback. The app must feel polished and human.

Keywords: `angular-21` `zoneless` `signals` `ngrx-signal-store` `standalone` `tailwind-v4` `responsive` `card-grid-not-tables` `design-system` `visual-consistency` `clean-code` `no-comments` `no-any` `accessible` `interactive-ux`.

---

## Commands

```bash
npm start            # ng serve (dev server)
npm run build        # production build
npm run watch        # dev build, watch mode
npm test             # unit tests
```

### Local Dev URLs

App runs under the `healthcare` subdomain locally:

```
Frontend:  http://healthcare.localhost:4200
Backend:   http://healthcare.localhost:8080
```

Example endpoints: `http://healthcare.localhost:8080/public/tenant-info`, `http://healthcare.localhost:8080/users`

No linting script — TypeScript strict mode + Angular `strictTemplates: true` are the static checks. Run `npm run build` to validate types and templates before declaring work done.

---

## Architecture Overview

**MedCore UI** is a multi-tenant **Angular 21** SPA for clinic management: SSR (Angular Universal + Express), standalone components, zoneless change detection, NgRx Signals state.

### Path Aliases

```
@core/*         → src/app/core/*
@shared/*       → src/app/shared/*
@features/*     → src/app/features/*
@layout/*       → src/app/layout/*
@environments/* → src/environments/*
```

### Routing & Shell Layout

Five role-based shells under `src/app/layout/shells/`:

| Shell | Route prefix | Roles |
|---|---|---|
| `admin-shell` | `/admin` | SUPER_ADMIN, CLINIC_ADMIN |
| `reception-shell` | `/reception` | ASSISTANT, RECEPTIONIST |
| `doctor-shell` | `/doctor` | DOCTOR |
| `patient-shell` | `/patient` | PATIENT |
| `public-shell` | `/` | Unauthenticated |

Each shell hosts a `<router-outlet>`. Features in `src/app/features/` are **lazy-loaded with `loadComponent`**. Each feature owns its `*.routes.ts` and is imported by the parent shell route config.

### Multi-Tenant System

Subdomain-driven. `TenantService.getSubdomain()` reads the subdomain from `window.location.hostname`. `tenantInterceptor` rewrites every API request: `localhost:8080` → `{subdomain}.localhost:8080`. When subdomain is `"localhost"` the interceptor MUST skip the rewrite (avoid `localhost.localhost:8080`).

`TenantStore` (signal store) holds branding (`name`, `logoUrl`, `primaryColor`, `subtitle`) loaded once on shell `ngOnInit()` from `GET /public/tenant-info`.

### Auth & Roles

`AuthStore` is the single source of truth: `accessToken`, `refreshToken`, `roles[]`, full `UserMeResponse`. After login it calls `/auth/me`, resolves `primaryRole`, navigates via `ROLE_REDIRECTS` (`role.model.ts`):

```
SUPER_ADMIN / CLINIC_ADMIN  → /admin/dashboard
DOCTOR                      → /doctor/dashboard
ASSISTANT / RECEPTIONIST    → /reception/dashboard
PATIENT                     → /patient/dashboard
```

Tokens persisted to `localStorage` by `TokenService`. `authInterceptor` injects `Authorization: Bearer ...` from `access_token` on every request (browser-only, SSR-safe).

**Roles — authoritative DB values** (never invent other codes):

| id | code | display name |
|---|---|---|
| 1 | `SUPER_ADMIN` | Super Admin |
| 2 | `CLINIC_ADMIN` | Admin Clínica |
| 3 | `DOCTOR` | Médico |
| 4 | `ASSISTANT` | Asistente |
| 5 | `RECEPTIONIST` | Recepcionista |
| 6 | `PATIENT` | Paciente |

`Role` type in `role.model.ts` mirrors these codes. `normalizeRole()` maps API strings → `Role`.

### State Management — NgRx Signals

All stores in `src/app/core/`. Pattern:

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

Bridge Observables → Signals with `toSignal()` (`@angular/core/rxjs-interop`). **No `subscribe()` in components**; use `firstValueFrom()` for one-shot async in store methods. Business logic and state mutations live in stores, never in components or services.

### API Layer

`src/app/core/api/api.config.ts` centralises **all** endpoint strings. Services MUST import from `API_ROUTES` — zero hardcoded URLs anywhere else.

Responses: `ApiResponse<T> = { success: boolean; data: T; message: string }`. Paginated: `PagedResponse<T>` (`content[]`, `totalElements`, `totalPages`, `pageNumber`, `pageSize`, `last`).

**Public vs protected** — `/public/**` (e.g. `/public/tenant-info`, `/public/bookings`) MUST NOT receive the `Authorization` header; `authInterceptor` skips them. Never add guards or token logic to public routes.

Optional query params:
```typescript
private buildParams(filters: object): HttpParams {
  return Object.entries(filters)
    .filter(([, v]) => v !== undefined && v !== null)
    .reduce((params, [k, v]) => params.set(k, String(v)), new HttpParams());
}
```
Param type must be `object` (not `Record<string, unknown>`) to avoid invalid TS casts from model interfaces.

---

## UI / UX Design System

> The single most important UX rule: **anything new or modified must be visually indistinguishable in style from what already exists.** Same palette, same buttons, same cards, same spacing rhythm, same role accents. Before building UI, open a sibling feature (e.g. `src/app/features/admin/users/users-page.component.html` + `.scss`) and copy its structural and visual patterns.

### Visual consistency (mandatory)

- **Reuse shared components first**: `@shared/components/` provides `button`, `card`, `badge`, `avatar`, `modal`, `input`, `skeleton`, `empty-state`, `alert-banner`, plus `@shared/widgets/kpi-card`. Compose these before writing new markup. Only create a new shared component when no existing one fits — and match the existing API/styling conventions.
- **Buttons** look and behave identically across the app: same shape, padding, font weight, hover/active/disabled states, and the same primary/secondary/danger intent colors. Never style a button ad-hoc.
- **Cards** are the default container: rounded corners, soft border (`--color-border`), subtle elevation on hover, consistent internal padding. Match the existing `.user-card` / card-grid structure.
- **Dialogs** use Angular Material `MatDialog` with the existing confirm/form-dialog pattern (`@shared/dialogs/`). Destructive actions always go through `ConfirmDialogComponent`.

### Color & theming tokens

Use the design tokens — never hardcode hex values in components.

- Brand scale: `--color-primary-50…900` (sky/azure family).
- Semantic: `--color-surface`, `--color-background`, `--color-text-primary`, `--color-text-secondary`, `--color-text-muted`, `--color-border`, `--color-danger`, `--color-success`, `--color-warning`.
- Angular Material system tokens app-wide: `--mat-sys-primary`, `--mat-sys-on-surface`, etc.
- Tinted backgrounds: `color-mix(in srgb, var(--mat-sys-primary) 12%, transparent)`.
- **Role-based accents are a fixed convention** — every role has a consistent accent color used for avatars, chips, and card accents (`--superadmin`, `--clinic-admin`, `--doctor`, `--assistant`, `--receptionist`, `--patient`, `--inactive`). Reuse the same role→class mapping pattern seen in `users-page.component.ts` (`avatarClass`, `roleClass`, `cardAccentClass`); never assign a role a new arbitrary color.

### Styling stack

- **Tailwind CSS v4** via `@tailwindcss/vite` — no `tailwind.config.*`; config lives in `src/styles.scss` (`@use "tailwindcss"` + `@plugin` for `forms` and `typography`).
- **Angular Material 21** themed with `mat.$azure-palette` via `mat.theme()` in `styles.scss`.
- **Tailwind-first**: use Tailwind utility classes for layout, flex/grid, spacing, sizing, and responsive breakpoints directly in templates. Use scoped component SCSS only for component-specific theming/states that reference the CSS tokens above. Don't reinvent layout in SCSS when a utility class exists.

### Responsive (Tailwind, mobile-first)

- Design mobile-first, then layer `sm: md: lg: xl: 2xl:` overrides. Every screen must work from ~360px up to wide desktop.
- Data collections use responsive grids: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4` style — cards reflow, never overflow horizontally.
- Toolbars, filters, and headers stack vertically on mobile and align horizontally on larger breakpoints.
- Test layout at narrow widths; nothing should clip, overlap, or require horizontal scroll.

### No tables — use modern data layouts

- **Never render data as an HTML `<table>`.** Replace any tabular data with responsive **card grids** (the established pattern: see `users-page`) or clean stacked list rows with clear visual hierarchy.
- Each record card shows: an identity element (avatar/icon with role accent), a title, a status indicator (active/inactive dot, status chip), key metadata with leading icons, and a footer with grouped actions (icon buttons + tooltips, iOS-style toggles for status).
- Include: a search box, filter pills, a results-count summary, optional grouping headers (e.g. by tenant), and a friendly empty state — mirror the `users-page` structure.

### Interactivity & polish

- Smooth, subtle transitions on hover/focus/active and on state changes (use Tailwind transitions / scoped SCSS). Nothing should pop in abruptly.
- **Loading**: use `skeleton` components or `MatProgressBar` — never a bare "Loading…".
- **Empty states**: always use the `empty-state` pattern with an icon and a helpful, context-aware message (distinguish "no results for filter" vs "nothing exists yet").
- **Feedback**: surface errors via `alert-banner`; give immediate visual feedback for toggles/actions.
- **Accessibility**: real `aria-label`s on icon-only buttons, `matTooltip` for affordance, visible focus states, sufficient contrast, semantic headings. Keyboard-usable.
- Spanish is the UI language for all user-facing copy (labels, messages, empty states).

---

## Coding Rules

**No comments anywhere** — `.ts`, `.html`, `.scss`. If logic needs explaining, rename identifiers until it doesn't.

**No `any`** — every value has a defined interface/type alias in `src/app/core/models/`. Unknown shapes: `unknown` + explicit narrowing.

**Clean code** — single responsibility, descriptive names, early returns, no duplication, no dead code, no over-engineering. Prefer pure standalone functions for logic (e.g. cross-field validators are standalone functions, not methods).

**Angular 21 modern APIs (use the latest, no legacy):**
- Standalone components/directives/pipes only — **no `NgModule`**. Each declares its own `imports[]`.
- **Signals everywhere**: `signal()`, `computed()`, `effect()`, NgRx signal stores. Signal-based `input()` / `output()` / `model()` and signal queries (`viewChild`, `contentChild`) over decorators.
- **New control flow** in templates: `@if`, `@for` (with `track`), `@switch`. Never use `*ngIf` / `*ngFor` / `*ngSwitch`.
- Use `@defer` for heavy/below-the-fold content where it improves perceived performance.
- Dependency injection via `inject()` (not constructor params).
- **Zoneless** (`provideZonelessChangeDetection()`) — no `Zone.js`, never `NgZone.run()`. Reactivity is exclusively Signals/NgRx Signals.

**SOLID / clean architecture boundaries:**
- `core/` — framework-agnostic services, stores, models, interceptors, guards. No UI imports.
- `shared/` — reusable UI components, directives, pipes. No feature-specific logic.
- `features/` — feature areas; each owns its `*.routes.ts`.
- `layout/` — shell components composing chrome (sidebar, topbar, footer).

**HTTP services are thin** — one service per domain, every method returns an `Observable`. State/business logic belongs in stores.

**Forms** — Reactive Forms (`FormGroup` / `FormControl`) only. No template-driven forms. Cross-field validators are standalone functions.

**SSR safety** — any `window` / `document` / `localStorage` access guarded by `isPlatformBrowser(PLATFORM_ID)` or confined to browser-only interceptors/services that already guard.

**Routing** — all routes `loadComponent` (lazy). No eagerly loaded feature components. Guards (`auth.guard.ts`, `role.guard.ts`) on shell and child routes.

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
| Reference UI pattern (cards, filters, role accents) | `src/app/features/admin/users/users-page.component.{ts,html,scss}` |
| Shared UI building blocks | `src/app/shared/components/`, `src/app/shared/widgets/` |
| Shared dialogs (confirm, forms) | `src/app/shared/dialogs/` |
