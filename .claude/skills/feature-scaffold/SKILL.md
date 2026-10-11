---
name: feature-scaffold
description: Use when creating a new feature module, page, form or table in this project so it matches the existing structure, shadcn components and conventions.
---

# New feature scaffold

Layout (create only the folders you need):
```
src/features/<name>/
  types/<name>.types.ts        # interfaces, unions
  schemas/<name>.schema.ts     # zod (v4) schemas + inferred types
  repositories/<name>.repository.ts   # see firestore-repository
  services/<name>.service.ts   # business rules
  hooks/use<Name>.ts           # TanStack Query hooks
  components/                  # forms, modals
  pages/<Name>ListPage.tsx ...
```
Steps: types → schema → repository → service → hooks → components → pages → route in `app/router.tsx` → nav item in `shared/layouts/AppLayout.tsx` → permission (`rbac-auth`) → translations (`i18n-rtl`).

Conventions:
- Forms: react-hook-form + `zodResolver` + `shared/components/ui/form`. Tables: `shared/components/DataTable`. Search/filter: `SearchInput`, `FilterDropdown`. Empty state: `EmptyState`. KPIs: `StatsCard`. Add missing shadcn primitives via `components.json` style, not ad-hoc.
- Class merging with `cn()` from `@/shared/lib/utils`. Toasts via `sonner`.
- List/Create/Edit page triplet like `products` and `purchases`; keep pages thin, logic in hooks/services.
- Log user actions through `shared/services/activity.service.ts`.
- No `@ts-nocheck`, no `any` in new code.

Finish with `npm run build` and `npm run lint`.
