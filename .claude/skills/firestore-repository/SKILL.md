---
name: firestore-repository
description: Use when adding or changing Firestore data access in this project — new collections, repositories, queries, batched/atomic writes, or React Query hooks over them.
---

# Firestore repositories

1. Create `features/<f>/repositories/<name>.repository.ts`:
   ```ts
   export class XRepository extends BaseRepository<X> { constructor(){ super("xCollection"); } }
   export const xRepository = new XRepository();
   ```
   Types in `features/<f>/types`, zod schema in `schemas/` (validate at the form boundary, not in the repo).
2. Timestamps are `number` (`Date.now()`), not Firestore `Timestamp`. Money is a plain number rounded to 2 dp at the service layer.
3. **Multi-document changes must be atomic**: use `writeBatch(db)` or `runTransaction`, never sequential `create()` calls in a loop (see `ledger.service.ts` for the batch pattern). Reads that feed a write (stock level, balance) go inside a transaction.
4. Queries: `getAll([where(...), orderBy(...)])`. If a compound query needs an index, add it to `firestore.indexes.json` and mention it.
5. UI access: wrap service calls in TanStack Query hooks (`hooks/useX.ts`); invalidate related keys after mutations (orders → products, inventory, dashboard stats).
6. Never import `firebase/firestore` in pages/components.
7. When touching `BaseRepository` or any `@ts-nocheck` file, prefer removing the nocheck and typing properly.

Verify with `npm run build`.
