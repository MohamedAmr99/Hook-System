# Hook System - Multi-Channel E-Commerce Management System

Hook System is an enterprise e-commerce management platform built for sellers operating across multiple marketplaces (Amazon, Noon, Jumia, B.Tech, Rannan) with self-fulfilled (FBM/Physical) and Amazon FBA warehouses.

---

## 🛠 Tech Stack & Architecture

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: TailwindCSS, Radix UI primitives, class-variance-authority, tailwind-merge
- **State Management**:
  - **Server State / Async Data**: TanStack Query (`@tanstack/react-query`) for all Firebase/Firestore reads and writes.
  - **Client UI State**: Zustand (ONLY for modal states, UI preferences, sidebar toggles).
- **Forms & Validation**: React Hook Form + Zod (always define Zod schemas first).
- **Backend / BaaS**: Firebase (Authentication, Firestore, Storage).
- **Routing**: React Router DOM.
- **Language Conventions**:
  - **Code**: Variable names, function names, types, comments, and git commits must be in **English**.
  - **User Interface**: All user-facing UI text must be in **Arabic (RTL)**.

---

## 📦 Domain Model & Core Entities

```
Product -> Warehouse Stock -> Platform Listing (Amazon, Noon, Jumia, etc.)
   |
   +---> Order -> Order Items
           |
           +---> Return / Collection / Expense
```

- **Product vs. Listing**: A single internal `Product` can map to multiple platform `Listings` (different SKU, ASIN, title, price per platform).
- **Warehouse Types**:
  - `physical`: Self-fulfilled warehouses (Noon, Jumia, Kenz, B.Tech, Rannan).
    - `availableQuantity = quantity - reservedQuantity - unavailableQuantity`.
    - Every reservation operation MUST execute inside a Firestore `runTransaction` to prevent concurrent overselling.
  - `fba_virtual`: Inventory synced from Amazon API (read-only in our system, never apply local reservation logic).

---

## ⚖️ Critical Business Logic Rules (Do Not Regress)

### 1. Inventory & Stock Lifecycle
- **Deduction Timing**: Stock is deducted from physical `quantity` **only once**, on the transition to `Shipped`. Never deduct on `Delivered`.
- **Order Stock State**: Every order tracks `stockState: 'reserved' | 'deducted' | 'released'` to ensure idempotent state transitions.
- **Cancellations**: Cancelling an order in `Pending` or `Processing` releases `reservedQuantity` only—never touch physical `quantity`.

### 2. Orders Lifecycle & State Machine
- **Allowed Transitions**: `Pending` -> `Processing` -> `Shipped` -> `Delivered`.
- `Cancelled` is only reachable from `Pending` or `Processing`. Arbitrary jumps between states are forbidden.

### 3. Returns System (Independent Entity)
- Returns live in their own `returns` Firestore collection, scoped by `orderId` and `orderItemId` (supports partial returns).
- **Condition & Restocking**:
  - `returnCondition`: `'healthy' | 'damaged' | 'wrong_item' | 'missing_parts'`.
  - `restocked: boolean`: Inventory is incremented **only** when `returnCondition === 'healthy'` and `restocked === true`.
  - Damaged or missing items must never be automatically returned to sellable stock.
- **Financials**: Net profit for any order with a return must account for refund losses, platform fees, and claims/compensations.

### 4. COGS & Financial Calculations (Single Source of Truth)
- Purchases record supplier price using **Weighted Average Cost** (not FIFO).
- `unitCogs` is snapshot onto `orderItem` at the time of shipment.
- Both the Dashboard and Orders pages must use the exact same calculation helper (`calculateOrderFinancials`) to prevent metric mismatches.

---

## 📁 Key Directory Structure

- `src/features/products/`: Product catalog, schemas, inventory tracking, repositories.
- `src/features/orders/`: Order lifecycle, transactions, inventory reservation services.
- `src/features/returns/`: Returns management, claim tracking, restock workflows.
- `src/features/finance/`: Collections, expenses, payouts, profit reconciliation.
- `src/features/dashboard/`: Executive KPI calculations and charts.
- `src/shared/`: Shared UI components, store, utilities, and financial calculation helpers.

---

## 💡 Developer Guidelines for Changes
1. Strongly typed: Do not use `any`. Always use types defined in `src/features/*/types/`.
2. When modifying inventory or order transitions, propose your plan first and verify transaction safety.
3. Keep business logic in services/hooks, keeping UI components clean and focused.

---

## 🤖 Multi-agent routing

Project agents live in `.claude/agents/`; detailed how-tos live in `.claude/skills/`. **If a skill conflicts with the rules above, this file wins.**

| Agent | Owns |
|---|---|
| `orders-agent` | `features/orders`, `features/returns`, `features/platforms`, order import |
| `inventory-agent` | `features/products`, `features/inventory`, `features/purchases` |
| `finance-agent` | `features/finance`, `features/loans`, `features/settlements`, `features/calculator` |
| `auth-settings-agent` | `features/auth`, `features/settings`, route guards, `app/` |
| `ui-i18n-agent` | `src/shared`, `features/dashboard`, locales, Tailwind/RTL |
| `firebase-security` | `src/lib/firebase`, rules, indexes, atomicity |
| `reviewer` | read-only review of any diff (run last) |

**Parallel rule:** run agents in parallel only when their file ownership doesn't overlap. Cross-slice changes (e.g. order → inventory → ledger) go: owner agent designs the contract first, then the other agents implement their side, then `reviewer`.

## Commands
`npm run dev` · `npm run build` (`tsc -b && vite build`, the real type check) · `npm run lint`

## Known debt
- `// @ts-nocheck` in `repository.ts`, `order.service.ts` and others — remove when touching them.
- `storage.rules` allows public read/write; no `firestore.rules` in repo → `firebase-security` agent.
- Root junk: `temp_*.txt`, `revert*.py`, `fix-ts-errors.cjs`, `scaffold.ps1`.
