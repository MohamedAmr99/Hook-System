// @ts-nocheck
/**
 * InventoryService
 * ----------------
 * Central place for ALL Firebase stock adjustments driven by order events.
 * Keeps OrderListPage / OrderForm / ReturnListPage thin and consistent.
 *
 * Rules:
 *  addStock    → quantity += qty  (restock)
 *  deductStock → quantity -= qty  (deduct, floor 0)
 */

import { ProductService } from "@/features/products/services/product.service";
import { Product } from "@/features/products/types";
import { Order } from "../types/order.types";

type StockOp = "deduct" | "restock";

interface AdjustParams {
  order: Order;
  products: Product[];      // current list from Firebase (useProducts data)
  op: StockOp;
  userId: string;
  userDisplayName: string;
}

async function adjustStock({ order, products, op, userId, userDisplayName }: AdjustParams) {
  for (const item of order.items) {
    const product = products.find((p) => p.sku === item.sku);
    if (!product) continue;

    const qty = item.quantity || (item as any).orderedQuantity || (item as any).receivedQuantity || 0;
    const newQty =
      op === "deduct"
        ? Math.max(0, Number(product.quantity) - Number(qty))
        : Number(product.quantity) + Number(qty);

    await ProductService.updateProduct(
      product.id,
      { quantity: newQty },
      userId,
      userDisplayName
    );
  }
}

// ─────────────────────────────────────────────
// Public helpers — one per event
// ─────────────────────────────────────────────

/** Called when a NEW order is placed → deduct from stock */
export async function onOrderCreated(params: Omit<AdjustParams, "op">) {
  await adjustStock({ ...params, op: "deduct" });
}

/** Called when order is CANCELLED from any active state → restock */
export async function onOrderCancelled(params: Omit<AdjustParams, "op">) {
  await adjustStock({ ...params, op: "restock" });
}

/**
 * Called when a RETURNED order is received.
 * - condition "Intact"  → restock (item is sellable again)
 * - condition anything else (Damaged / Missing Parts / Unknown) → do NOT restock
 */
export async function onOrderReturned(
  params: Omit<AdjustParams, "op"> & { condition: string }
) {
  if (params.condition === "Intact") {
    await adjustStock({ ...params, op: "restock" });
  }
  // Damaged / Missing Parts → no stock action
}

/**
 * Called when a Returned+Intact order condition is CHANGED to Damaged.
 * We need to undo the restock that happened before.
 */
export async function onanyChangedToDamaged(params: Omit<AdjustParams, "op">) {
  await adjustStock({ ...params, op: "deduct" });
}

/**
 * Called when a Returned+Damaged order condition is CHANGED to Intact.
 * We restock now.
 */
export async function onanyChangedToIntact(params: Omit<AdjustParams, "op">) {
  await adjustStock({ ...params, op: "restock" });
}

/**
 * Called when a Cancelled order is RE-ACTIVATED (Cancelled → Active).
 * Need to deduct stock again.
 */
export async function onOrderReactivated(params: Omit<AdjustParams, "op">) {
  await adjustStock({ ...params, op: "deduct" });
}

/**
 * Called when an order is DELETED.
 * - Was Active → restock
 * - Was Returned+Intact → deduct (stock was already restored, avoid double-restock)
 * - Was Cancelled / Returned+Damaged → no action
 */
export async function onOrderDeleted(params: Omit<AdjustParams, "op"> & { wasIntact: boolean }) {
  const activeStatuses = ["Pending", "Processing", "Shipped", "Delivered"];
  const returnStatuses = ["Returned", "ReturnedToSeller", "ReturningToSeller", "RejectedByBuyer"];

  if (activeStatuses.includes(params.order.status)) {
    await adjustStock({ ...params, op: "restock" });
  } else if (returnStatuses.includes(params.order.status) && params.wasIntact) {
    await adjustStock({ ...params, op: "deduct" });
  }
  // Cancelled or Returned+Damaged → nothing
}

