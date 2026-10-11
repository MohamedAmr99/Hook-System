# Hook System (hooh-system)

Back-office system for a marketplace seller (Amazon etc.): products, orders, purchases, inventory costing, double-entry finance, loans, settlements. Arabic (RTL) + English UI.

**Stack:** React 19, TypeScript, Vite, Tailwind 3 + shadcn/ui (Radix), Firebase (Firestore/Auth/Storage/Hosting), TanStack Query + Table, Zustand, react-hook-form + zod, i18next, recharts.

## Commands
- `npm run dev` — dev server
- `npm run build` — `tsc -b && vite build` (the real type check)
- `npm run lint`

## Architecture
Feature-sliced: `src/features/<feature>/{pages,components,hooks,services,repositories,schemas,types,store}`.
- **repositories** extend `BaseRepository<T>` (`src/lib/firebase/repository.ts`) — the only layer touching Firestore.
- **services** hold business rules and orchestrate repositories (orders → inventory movements → ledger).
- **pages/components** call services via TanStack Query hooks; no Firestore in UI.
- Shared UI in `src/shared`, i18n in `src/lib/i18n/locales/{ar,en}.json`.
- Path alias `@/` → `src/`.

## Domain rules (do not break)
1. Ledger transactions must balance: total debit == total credit (±0.01), written atomically via `writeBatch` (`ledger.service.ts`).
2. Inventory cost uses Weighted Average Cost; every stock change writes an inventory movement + cost history (`costing.service.ts`).
3. Every user-facing string exists in BOTH `ar.json` and `en.json`; layouts must work in RTL.
4. Roles/permissions come from `features/auth/constants/roles.ts` — never hardcode role names elsewhere.
5. Amazon settlement parsing is positional (header on row 8, data from row 9) — change only with a sample file.

## Known debt (fix opportunistically, don't make worse)
- `// @ts-nocheck` in `repository.ts`, `order.service.ts` and a few others — remove when touching them.
- `order.service.createOrder` is not atomic and writes `previousStock: 0` / `newStock: 0`; ledger account IDs are hardcoded strings.
- `storage.rules` allows public read/write; no `firestore.rules` in repo. Treat as security work (`firebase-security` agent).
- Root junk: `temp_*.txt`, `revert*.py`, `fix-ts-errors.cjs`, `scaffold.ps1` — don't depend on them.

## Multi-agent routing
Project agents live in `.claude/agents/`. Each owns a slice; pick by the files being changed.

| Agent | Owns |
|---|---|
| `orders-agent` | `features/orders`, `features/platforms`, order import |
| `inventory-agent` | `features/products`, `features/inventory`, `features/purchases` |
| `finance-agent` | `features/finance`, `features/loans`, `features/settlements`, `features/calculator` |
| `auth-settings-agent` | `features/auth`, `features/settings`, route guards, `app/` |
| `ui-i18n-agent` | `src/shared`, `features/dashboard`, locales, Tailwind/RTL |
| `firebase-security` | `src/lib/firebase`, rules, indexes, atomicity |
| `reviewer` | read-only review of any diff (run last) |

**Parallel rule:** run agents in parallel only when their file ownership doesn't overlap. Cross-slice changes (e.g. order → inventory → ledger) go: owner agent designs the contract first, then the other agents implement their side, then `reviewer`.
Skills in `.claude/skills/` hold the detailed how-to for each area; agents load them as needed.
