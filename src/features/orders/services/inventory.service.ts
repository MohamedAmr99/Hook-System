import { db } from "@/lib/firebase/config";
import { doc, runTransaction } from "firebase/firestore";
import { Order } from "../types/order.types";
import { Product } from "@/features/products/types";
import { ActivityService } from "@/shared/services/activity.service";

const ORDERS_COLLECTION = "orders";
const PRODUCTS_COLLECTION = "products";

interface CreateOrderAtomicParams {
  order: Order;
  userId: string;
  userDisplayName: string;
}

interface UpdateOrderAtomicParams {
  oldOrder: Order;
  updatedOrder: Order;
  userId: string;
  userDisplayName: string;
}

/**
 * Creates an order inside a Firestore Transaction, ensuring stock reservation is atomic and overselling is prevented.
 */
export async function createOrderAtomic({
  order,
  userId,
  userDisplayName,
}: CreateOrderAtomicParams): Promise<void> {
  await runTransaction(db, async (transaction) => {
    // 1. Validate & Reserve stock for each order item
    for (const item of order.items) {
      const productId = item.productId;
      if (!productId) continue;

      const productRef = doc(db, PRODUCTS_COLLECTION, productId);
      const productSnap = await transaction.get(productRef);

      if (!productSnap.exists()) {
        throw new Error(`المنتج غير موجود: "${item.name}"`);
      }

      const productData = productSnap.data() as Product;
      const currentQty = Number(productData.quantity || 0);
      const reservedQty = Number(productData.reservedQuantity || 0);
      const unavailableQty = Number(productData.unavailableQuantity || 0);

      const availableQty = currentQty - reservedQty - unavailableQty;
      const requestedQty = Number(item.quantity || 1);

      if (availableQty < requestedQty) {
        throw new Error(
          `البيع الزائد مرفوض: المخزون المتاح للمنتج "${productData.productName}" هو ${Math.max(0, availableQty)} فقط، بينما المطلوبة في الطلب ${requestedQty}.`,
        );
      }

      // Update reserved quantity on product
      transaction.update(productRef, {
        reservedQuantity: reservedQty + requestedQty,
        updatedAt: Date.now(),
        updatedBy: userId,
      });
    }

    // 2. Save the order document
    const orderRef = doc(db, ORDERS_COLLECTION, order.id);
    transaction.set(orderRef, {
      ...order,
      stockState: "reserved",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: userId,
      updatedBy: userId,
    });
  });

  // Log activity
  await ActivityService.logAction({
    userId,
    userDisplayName,
    actionType: "create",
    entityType: "order",
    entityId: order.id,
    entityName: `Order ${order.platformOrderId}`,
    description: `Created order ${order.platformOrderId} on ${order.platform} and reserved stock atomically.`,
  }).catch(() => {});
}

/**
 * Updates an order inside a Firestore Transaction, adjusting reserved quantities according to delta.
 */
export async function updateOrderAtomic({
  oldOrder,
  updatedOrder,
  userId,
  userDisplayName,
}: UpdateOrderAtomicParams): Promise<void> {
  await runTransaction(db, async (transaction) => {
    // Map old item quantities by productId
    const oldQtyMap = new Map<string, number>();
    (oldOrder.items || []).forEach((item) => {
      if (item.productId) {
        oldQtyMap.set(
          item.productId,
          (oldQtyMap.get(item.productId) || 0) + Number(item.quantity || 0),
        );
      }
    });

    // Map updated item quantities by productId
    const newQtyMap = new Map<string, number>();
    (updatedOrder.items || []).forEach((item) => {
      if (item.productId) {
        newQtyMap.set(
          item.productId,
          (newQtyMap.get(item.productId) || 0) + Number(item.quantity || 0),
        );
      }
    });

    // Collect all affected product IDs
    const allProductIds = new Set([...oldQtyMap.keys(), ...newQtyMap.keys()]);

    for (const productId of allProductIds) {
      const productRef = doc(db, PRODUCTS_COLLECTION, productId);
      const productSnap = await transaction.get(productRef);

      if (!productSnap.exists()) continue;

      const productData = productSnap.data() as Product;
      const currentReserved = Number(productData.reservedQuantity || 0);
      const oldQty = oldQtyMap.get(productId) || 0;
      const newQty = newQtyMap.get(productId) || 0;
      const diff = newQty - oldQty;

      if (diff > 0) {
        // Quantity increased - check available stock
        const currentQty = Number(productData.quantity || 0);
        const unavailableQty = Number(productData.unavailableQuantity || 0);
        const availableQty = currentQty - currentReserved - unavailableQty;

        if (availableQty < diff) {
          throw new Error(
            `البيع الزائد مرفوض: المخزون المتاح للمنتج "${productData.productName}" هو ${Math.max(0, availableQty)} فقط، لا يكفي للزيادة المطلوبة (+${diff}).`,
          );
        }
      }

      const nextReserved = Math.max(0, currentReserved + diff);
      transaction.update(productRef, {
        reservedQuantity: nextReserved,
        updatedAt: Date.now(),
        updatedBy: userId,
      });
    }

    // Update order doc
    const orderRef = doc(db, ORDERS_COLLECTION, updatedOrder.id);
    transaction.update(orderRef, {
      ...updatedOrder,
      updatedAt: Date.now(),
      updatedBy: userId,
    });
  });

  // Log activity
  await ActivityService.logAction({
    userId,
    userDisplayName,
    actionType: "update",
    entityType: "order",
    entityId: updatedOrder.id,
    entityName: `Order ${updatedOrder.platformOrderId}`,
    description: `Updated order ${updatedOrder.platformOrderId} and adjusted stock reservation atomically.`,
  }).catch(() => {});
}

export interface OrderInventoryContext {
  order: Order;
  products?: Product[];
  userId: string;
  userDisplayName: string;
  wasIntact?: boolean;
}

export async function onOrderCancelled({
  order,
  userId,
}: OrderInventoryContext): Promise<void> {
  await runTransaction(db, async (transaction) => {
    for (const item of order.items || []) {
      if (!item.productId) continue;
      const productRef = doc(db, PRODUCTS_COLLECTION, item.productId);
      const snap = await transaction.get(productRef);
      if (!snap.exists()) continue;
      const p = snap.data() as Product;
      const nextReserved = Math.max(
        0,
        Number(p.reservedQuantity || 0) - Number(item.quantity || 1),
      );
      transaction.update(productRef, {
        reservedQuantity: nextReserved,
        updatedAt: Date.now(),
        updatedBy: userId,
      });
    }
  }).catch(() => {});
}

export async function onOrderReactivated({
  order,
  userId,
}: OrderInventoryContext): Promise<void> {
  await runTransaction(db, async (transaction) => {
    for (const item of order.items || []) {
      if (!item.productId) continue;
      const productRef = doc(db, PRODUCTS_COLLECTION, item.productId);
      const snap = await transaction.get(productRef);
      if (!snap.exists()) continue;
      const p = snap.data() as Product;
      const nextReserved =
        Number(p.reservedQuantity || 0) + Number(item.quantity || 1);
      transaction.update(productRef, {
        reservedQuantity: nextReserved,
        updatedAt: Date.now(),
        updatedBy: userId,
      });
    }
  }).catch(() => {});
}

export async function onOrderDeleted(
  ctx: OrderInventoryContext,
): Promise<void> {
  await onOrderCancelled(ctx);
}

export async function syncOrderStock(
  order: Order,
  products?: Product[],
  oldStatus?: OrderStatus,
  newStatus?: OrderStatus,
  userId?: string,
  userDisplayName?: string,
  oldCondition?: string,
  newCondition?: string,
): Promise<void> {
  if (!order || !order.items) return;
  const uid = userId || "system";

  await runTransaction(db, async (transaction) => {
    for (const item of order.items) {
      if (!item.productId) continue;
      const productRef = doc(db, PRODUCTS_COLLECTION, item.productId);
      const snap = await transaction.get(productRef);
      if (!snap.exists()) continue;

      const p = snap.data() as Product;
      let qty = Number(p.quantity || 0);
      let reserved = Number(p.reservedQuantity || 0);
      let unavailable = Number(p.unavailableQuantity || 0);
      const itemQty = Number(item.quantity || 1);

      if (newCondition === "Healthy" && oldCondition !== "Healthy") {
        qty += itemQty;
      } else if (
        newCondition &&
        ["Damaged", "MissingParts"].includes(newCondition) &&
        oldCondition === "Healthy"
      ) {
        qty = Math.max(0, qty - itemQty);
        unavailable += itemQty;
      }

      transaction.update(productRef, {
        quantity: qty,
        reservedQuantity: reserved,
        unavailableQuantity: unavailable,
        updatedAt: Date.now(),
        updatedBy: uid,
      });
    }
  }).catch(() => {});
}
