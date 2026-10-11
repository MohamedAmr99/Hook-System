---
name: inventory-costing
description: Use when touching stock quantities, inventory movements, purchases, returns, COGS or weighted average cost in this project.
---

# Inventory & costing

Files: `features/inventory/services/costing.service.ts`, `repositories/inventory.repository.ts`, `features/orders/services/inventory.service.ts`, `features/purchases/*`.

- Cost method: **Weighted Average Cost**. On purchase: `newWAC = (oldStock*oldWAC + qty*unitCost) / (oldStock+qty)`; record a `costHistory` doc and update `product.costPrice`.
- Sales and returns do NOT change WAC; they use the current WAC as `unitCogs` (a return restores stock at the original sale's `unitCogs`).
- Every stock change = one `inventoryMovement` (`PURCHASE`, `SALE`, `RETURN`, `ADJUSTMENT`) with correct `previousStock`/`newStock`, `referenceId`, `createdBy`. Do not write `0/0` placeholders — read the product inside a transaction.
- Product `quantity` must equal the sum of its movements; the movement and the product update go in the same transaction.
- Guard: quantity <= 0 purchases are ignored; sales that would make stock negative need an explicit decision (reject or flag), never silent.
- Purchases with estimated cost set `isEstimated: true`; when the real invoice arrives, post a correction and re-run WAC.
- Order → inventory → ledger must stay consistent: any change here needs the matching COGS/inventory-asset ledger lines (see `double-entry-ledger`).

Test mentally: buy 10 @ 5, buy 10 @ 7 → WAC 6; sell 5 → stock 15, WAC 6, COGS 30.
