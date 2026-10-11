---
name: rbac-auth
description: Use when changing login/registration, roles, permissions, route guards, or deciding who may see/do something in this project.
---

# Auth & RBAC

Files: `features/auth/{constants/roles.ts,components/AuthGuards.tsx,components/AuthInitializer.tsx,store/auth.store.ts,services/auth.service.ts}`, `app/router.tsx`.

- Roles: Owner, Admin, Editor, Warehouse, Designer. Permissions: `can_view_dashboard`, `can_manage_products`, `can_manage_orders`, `can_manage_inventory`, `can_manage_finance`. The mapping lives only in `ROLE_PERMISSIONS`.
- New capability → add a `PERMISSIONS` entry, map it per role, guard the route in `router.tsx`, hide the nav item in `AppLayout`, AND enforce it server-side in Firestore rules (client checks are UX only).
- Never self-assign roles at registration: new users get the lowest role; only Owner/Admin may change `role`. The profile doc (`users/{uid}`) must not be client-writable for `role`/`permissions`.
- Finance pages require `can_manage_finance`; Designer is view-only.
- Auth errors map through `utils/error-mapper.ts` to translated messages (see `i18n-rtl`).
- Don't store tokens/passwords in Zustand persist or localStorage.
