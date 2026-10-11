import { ReturnRepository } from "../repositories/return.repository";
import { Return } from "../types/return.types";
import { db } from "@/lib/firebase/config";
import { doc, getDocs, collection, query, where, runTransaction } from "firebase/firestore";
import { Product } from "@/features/products/types";
import { useStore } from "@/shared/store/useStore";

const PRODUCTS_COLLECTION = "products";

async function adjustProductStock(productId: string | undefined, sku: string | undefined, quantityChange: number) {
  if (!productId && !sku) return;

  // 1. Update in Firestore via Transaction
  try {
    await runTransaction(db, async (transaction) => {
      let targetDocRef = productId ? doc(db, PRODUCTS_COLLECTION, productId) : null;
      let pSnap = targetDocRef ? await transaction.get(targetDocRef) : null;

      // Fallback: If not found by ID, query by SKU
      if ((!pSnap || !pSnap.exists()) && sku) {
        const q = query(collection(db, PRODUCTS_COLLECTION), where("sku", "==", sku));
        const querySnap = await getDocs(q);
        if (!querySnap.empty) {
          const foundDoc = querySnap.docs[0];
          targetDocRef = doc(db, PRODUCTS_COLLECTION, foundDoc.id);
          pSnap = await transaction.get(targetDocRef);
        }
      }

      if (targetDocRef && pSnap && pSnap.exists()) {
        const p = pSnap.data() as Product;
        const currentQty = Number(p.quantity || 0);
        const newQty = Math.max(0, currentQty + quantityChange);

        transaction.update(targetDocRef, {
          quantity: newQty,
          updatedAt: Date.now(),
        });
      }
    });
  } catch (err) {
    console.warn("Firestore transaction stock update warning:", err);
  }

  // 2. Update local Zustand store so immediate UI matches
  try {
    const store = useStore.getState();
    if (store.products && store.products.length > 0) {
      const updatedProducts = store.products.map((p) => {
        const item = p as typeof p & { id?: string };
        if ((productId && item.id === productId) || (sku && item.sku === sku)) {
          return {
            ...p,
            quantity: Math.max(0, Number(p.quantity || 0) + quantityChange),
          };
        }
        return p;
      });
      useStore.setState({ products: updatedProducts });
    }
  } catch (err) {
    console.warn("Local store stock update warning:", err);
  }
}

export const ReturnService = {
  async getAllReturns(): Promise<Return[]> {
    return ReturnRepository.getAll();
  },

  async createReturn(data: Omit<Return, "id" | "createdAt" | "updatedAt">): Promise<Return> {
    const created = await ReturnRepository.create(data);

    if (created.returnCondition === "healthy" && created.restocked) {
      await adjustProductStock(created.productId, created.sku, Number(created.quantity || 1));
    }

    return created;
  },

  async updateReturn(id: string, updates: Partial<Return>, currentReturn?: Return): Promise<void> {
    await ReturnRepository.update(id, updates);

    const isRestockToggled = updates.restocked !== undefined && (!currentReturn || updates.restocked !== currentReturn.restocked);

    const effectiveCondition = updates.returnCondition || currentReturn?.returnCondition;

    if (isRestockToggled) {
      const productId = updates.productId || currentReturn?.productId;
      const sku = updates.sku || currentReturn?.sku;
      const qty = Number(updates.quantity || currentReturn?.quantity || 1);

      if (updates.restocked && effectiveCondition === "healthy") {
        // Restock -> Increment inventory only for healthy returns
        await adjustProductStock(productId, sku, qty);
      } else if (!updates.restocked && currentReturn?.restocked && currentReturn?.returnCondition === "healthy") {
        // Undo restock -> Decrement previously restocked inventory
        await adjustProductStock(productId, sku, -qty);
      }
    }
  },

  async deleteReturn(id: string, currentReturn?: Return): Promise<void> {
    await ReturnRepository.delete(id);
    if (currentReturn && currentReturn.restocked) {
      const productId = currentReturn.productId;
      const sku = currentReturn.sku;
      const qty = Number(currentReturn.quantity || 1);
      await adjustProductStock(productId, sku, -qty);
    }
  },
};

