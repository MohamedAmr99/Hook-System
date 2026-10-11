Domain expertise for multi-platform e-commerce order/inventory/returns management systems (Hook System — Amazon, Noon, Jumia, Kenz, B.Tech, Rannan). Use this skill whenever a task touches products, warehouses/stock, order lifecycle, returns/RMA, FBA vs FBM fulfillment, purchase orders/COGS, platform collections/payouts, or profit/dashboard calculations — even if the user just says "fix the orders page" or "add a field to returns" without naming these concepts explicitly. Always consult this before writing or modifying any inventory, order-status, or returns logic.

E-commerce OMS Domain Skill (Hook System)

This skill encodes the agreed business logic for Hook System so it is applied consistently across every session, not re-derived (or regressed) each time. Read this in full before touching inventory, orders, or returns code. If a proposed change conflicts with a rule below, flag the conflict to the user before implementing — do not silently follow older/simpler logic.

Core principle: entities, not statuses

Do not model business events as a single status field on the order. Returns, purchases, and payouts are independent entities related to the order, not values the order's status field cycles through. This is the single most common mistake to avoid regressing to.

1. Inventory & Warehouses
   Every warehouse has type: 'physical' | 'fba_virtual'.
   FBM (self-fulfilled — Noon, Jumia, Kenz, B.Tech, Rannan): track per (product, warehouse):
   quantity — physical on-hand
   reservedQuantity — held for unshipped orders
   unavailableQuantity — damaged or pending return inspection
   availableQuantity = quantity - reservedQuantity - unavailableQuantity (derived, never stored redundantly without a reason)
   FBA (Amazon-fulfilled): numbers are synced periodically from Amazon's API (available, reserved, inbound). Never apply local reservation/deduction logic to an fba_virtual warehouse — treat it as read-only/sync-target.
   Physical stock is deducted exactly once, on the order's first transition into Shipped. Delivered never touches stock.
   Every order has stockState: 'reserved' | 'deducted' | 'released'. Inventory-affecting code must branch on this field and be idempotent — re-running the same transition must not double-deduct or double-release.
   Reserve/deduct/release operations that read-then-write a quantity must run inside a Firestore transaction (runTransaction) — never a plain read followed by a separate write, which allows overselling under concurrent orders.
   Editing an order's item quantity while Pending/Processing must adjust reservedQuantity by the delta, not just on cancel/delete.
2. Orders — Lifecycle

Canonical order-level state machine:

Pending -> Processing -> Shipped -> Delivered
Pending -> Cancelled
Processing -> Cancelled

No other transition is valid without going through the states between. Each orderItem also carries its own state for partial fulfillment/return purposes — never infer item-level status from the parent order alone.

3. Returns (RMA) — independent entity

Collection: returns, each document linked to orderId + orderItemId (supports partial returns — one item out of a multi-item order).

Required fields:

returnCondition: 'healthy' | 'damaged' | 'wrong_item' | 'missing_parts'
returnStage: 'requested' | 'shipping_to_seller' | 'received' | 'inspected' | 'case_filed'
caseReference, caseStatus: 'not_opened' | 'opened' | 'under_review' | 'resolved' | 'rejected' (platform claims, e.g. Amazon SAFE-T — claim windows differ per platform; keep the window as a configurable per-platform setting, not a hardcoded number of days)
compensationType: 'full' | 'partial' | 'none', compensationAmount
Financials: customerRefundAmount, platformFeeRetained, shippingCostRetained, netLoss (= refund − compensation received)
restocked: boolean, restockedAt

Rules:

Only increment warehouse quantity (and clear unavailableQuantity) when returnCondition === 'healthy' AND returnStage === 'inspected' — never restock on request/receipt alone.
Any order/item with an active or resolved return must show reduced net profit — a returned line item showing full positive profit is a bug, not acceptable behavior. 4. Purchases & COGS
purchaseOrders: supplierId, quantity, unit cost, date — one record per incoming batch.
Cost method: weighted average, recalculated on each new purchase. (FIFO is more "correct" but not worth the complexity at this stage — do not implement FIFO unless explicitly asked.)
unitCogs is snapshotted onto the orderItem at ship time. Historical order profit must never be recomputed from the product's current cost. 5. Collections / Payouts
collections (or payouts): platformId, expectedAmount, actualAmount, payoutDate, status: 'pending' | 'received' | 'discrepancy'.
This is the foundation for settlement reconciliation (estimated vs. actual profit per platform) — design so a future settlement-report import can populate actualAmount and auto-flag discrepancies, without a schema change. 6. Dashboard & Metrics — single source of truth
Any number shown in more than one place (revenue, order count, profit) must come from one shared calculation function/query, called from both places. Independently computing the "same" metric on two screens is the bug class that caused the dashboard/orders mismatch found in testing — treat any new metric the same way from the start.
Period-over-period comparison percentages must be computed from real previous-period data; if the previous period's value is zero, render "—", never a misleading percentage.
Working process for this project
Before implementing anything touching sections 1–6, restate which rules apply to the current task and propose a short plan.
Wait for the user's go-ahead on non-trivial changes (schema changes, new collections, anything touching money or stock).
Prefer extending the entities above over adding new status fields to orders or products.
Write or update a unit test for any change to inventory, returns, or pricing/COGS logic.
