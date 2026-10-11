import { useEffect, useRef } from "react";
import { useStore } from "@/shared/store/useStore";
import { OrderService } from "../services/order.service";
import { orderRepository } from "../repositories/order.repository";

/**
 * Single source of truth for orders — Zustand store (locally persisted).
 *
 * Hydration strategy:
 * - If the local store already has orders → skip Firestore fetch (trust local)
 * - If the local store is EMPTY → fetch from Firestore once and seed the store
 *
 * This ensures that:
 * - New orders (added via OrderForm → addOrder) appear immediately
 * - Status/payment changes (via updateOrder/updateOrderStatus) are reflected immediately
 * - Deletes (via deleteOrder) are reflected immediately
 * - All of the above also write to Firestore via patchOrderInFirestore / deleteOrderFromFirestore
 */
export function useOrders() {
  const orders = useStore((state) => state.orders) || [];
  const addOrder = useStore((state) => state.addOrder);
  const hydrated = useRef(false);

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;

    const currentOrders = useStore.getState().orders || [];

    // Only seed from Firestore when local store is completely empty
    if (currentOrders.length === 0) {
      OrderService.getOrders()
        .then((remoteOrders) => {
          remoteOrders.forEach((o) => addOrder(o));
        })
        .catch(() => {
          // Silently ignore — local store still works offline
        });
    }
  }, []);

  return {
    data: orders,
    isLoading: false,
  };
}

/**
 * Delete an order from Firestore.
 * Call alongside store.deleteOrder() in the UI.
 */
export async function deleteOrderFromFirestore(id: string): Promise<void> {
  try {
    await orderRepository.delete(id);
  } catch (e) {
    console.warn("Failed to delete order from Firestore:", e);
  }
}

/**
 * Patch order fields in Firestore.
 * Call alongside store.updateOrder() / store.updateOrderStatus() in the UI.
 */
export async function patchOrderInFirestore(
  id: string,
  updates: Record<string, unknown>
): Promise<void> {
  try {
    await orderRepository.update(id, updates as never);
  } catch (e) {
    console.warn("Failed to patch order in Firestore:", e);
  }
}
