import { BaseRepository } from "@/lib/firebase/repository";
import { Purchase } from "../types/purchase.types";

class PurchaseRepository extends BaseRepository<Purchase> {
  constructor() {
    super("purchases");
  }
}

export const purchaseRepository = new PurchaseRepository();
