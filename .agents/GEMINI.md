Hook System Rules
Tech Stack
Framework: React 19 + TypeScript + Vite
Styling: TailwindCSS, Radix UI, class-variance-authority, tailwind-merge (Shadcn-like setup)
State Management: Zustand (client state), Tanstack Query (server state/async data)
Forms & Validation: React Hook Form + Zod
Backend/BaaS: Firebase (Auth, Firestore, Storage)
Routing: React Router DOM
Coding Guidelines
TypeScript First: Always use strong typing. Avoid any. Define proper interfaces for every Firestore document shape in a shared types/ directory.
Component Architecture:
Keep components small and functional.
Separate business logic from UI using custom hooks (e.g. useReturns, useInventory).
Styling & Aesthetics:
Use Tailwind utility classes. Avoid inline styles or standard CSS files unless necessary.
Prioritize a premium, modern design with smooth interactions (using tailwindcss-animate).
State Handling:
Use Tanstack React Query for all Firebase reads/writes.
Use Zustand ONLY for global UI state (e.g. modals, themes, sidebar toggles).
Form Management:
Always define a Zod schema first.
Use react-hook-form with the Zod resolver.
Domain Model (Core Entities)
Product -> Warehouse Stock -> Listing (per platform) -> Order -> Order Items
|
Return / Collection / Expense

A single internal Product can map to multiple platform Listings (different SKU/ASIN, price, title per platform). Keep a productPlatformMapping collection linking internal SKU to each platform's SKU/ASIN.

Business Logic Rules (Critical — do not regress on these)
Inventory & Warehouses
Every warehouse has type: 'physical' | 'fba_virtual'.
Physical/FBM warehouses (Noon, Jumia, Kenz, B.Tech, Rannan — self-fulfilled): track quantity (physical on-hand), reservedQuantity, and unavailableQuantity (damaged / pending inspection) per product per warehouse. availableQuantity = quantity - reservedQuantity - unavailableQuantity.
FBA virtual warehouse: inventory numbers (available, reserved, inbound) are synced periodically from Amazon's API, not managed locally. Never apply local reservation logic to FBA stock — it's read-only/sync-only in our system.
Stock is deducted from physical quantity only once, on the first transition to Shipped. Never deduct again on Delivered.
Every order carries stockState: 'reserved' | 'deducted' | 'released' to make status transitions idempotent — apply inventory effects only on the transition itself, never re-apply on re-render or repeated calls.
Any check-and-reserve operation (checking availableQuantity then incrementing reservedQuantity) MUST run inside a Firestore transaction (runTransaction) to prevent overselling from concurrent orders.
Cancelling a Pending/Processing order releases reservedQuantity only — never touches physical quantity. Deleting or editing the quantity on such an order must adjust the reservation by the difference.
Orders — Lifecycle & State Machine
Order-level status: Pending -> Processing -> Shipped -> Delivered, with Cancelled reachable only from Pending/Processing.
Each orderItem carries its own return-related state — never collapse a partial return into a whole-order status change.
Define an explicit allowed-transitions table in code; the UI must never allow an arbitrary status jump.
Returns (independent entity, not an order status)
Returns live in their own returns collection, each linked to an orderId and (for partial returns) an orderItemId — a return is scoped to a product within an order, not the whole order.
Required fields per return:
returnCondition: 'healthy' | 'damaged' | 'wrong_item' | 'missing_parts'
returnStage: 'requested' | 'shipping_to_seller' | 'received' | 'inspected' | 'case_filed'
caseReference, caseStatus: 'not_opened' | 'opened' | 'under_review' | 'resolved' | 'rejected' (for platform claims like Amazon SAFE-T)
compensationType: 'full' | 'partial' | 'none', compensationAmount
Financials: customerRefundAmount, platformFeeRetained, shippingCostRetained, netLoss (= refund − compensation received)
restocked: boolean, restockedAt — only set true, and only then increment inventory, once returnCondition === 'healthy' and it has passed inspection.
A healthy, inspected return increments quantity (and clears unavailableQuantity) on the relevant warehouse via the same transactional pattern used for reservations.
Net profit on any order/item with an active or completed return must reflect the loss — never leave a returned item's profit figure as if it were a normal sale.
Purchases & COGS
purchaseOrders records supplier purchases: supplierId, quantity, unit cost, date.
Use weighted-average cost (not FIFO) for unitCogs, recalculated on each purchase.
Snapshot unitCogs onto the orderItem at the time of shipment — never compute historical profit from the current product cost.
Collections / Payouts
collections (or payouts) tracks money owed by each platform: platformId, expectedAmount, actualAmount, payoutDate, status: 'pending' | 'received' | 'discrepancy'.
This is the foundation for later settlement reconciliation (estimated vs. actual profit) — design fields so a settlement-report import can populate actualAmount and flag discrepancies.
Single Source of Truth
Dashboard metrics and the Orders page must call the same calculation function/query for revenue, order count, and profit. Never let two screens compute the same number independently — this caused the dashboard/orders mismatch found in testing.
Comparison percentages (e.g. "+12% vs last month") must be computed from real previous-period data. If the previous period is zero, display "—", never a fabricated percentage.
Security
Never commit .env or any file containing API keys/secrets. Verify .gitignore covers it before every commit.
Firebase Security Rules must scope every collection to the authenticated seller (no publicly readable/writable collections).
If a secret was ever committed to git history, it must be rotated, not just deleted from the latest commit.
Language Convention
All code (variable names, function names, comments, commit messages): English.
All user-facing UI text: Arabic (RTL).
Git Workflow
One feature = one branch (feature/xyz). Never commit non-trivial changes directly to main.
Write a unit test for any change to inventory, returns, or pricing logic before merging.
Agent Behavior
When asked to create a feature, focus on full completeness (UI + State + Firebase logic + the relevant Business Logic Rules above).
Before implementing anything touching inventory, orders, or returns, restate which rules above apply and propose a plan. Wait for approval before writing code on non-trivial changes.
Be concise in text responses and prioritize writing working code.@
