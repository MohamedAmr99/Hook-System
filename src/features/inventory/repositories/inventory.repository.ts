import { BaseRepository } from "@/lib/firebase/repository";
import { InventoryMovement, CostHistory } from "../types/inventory.types";

class InventoryMovementRepository extends BaseRepository<InventoryMovement> {
  constructor() {
    super("inventoryMovements");
  }
}

class CostHistoryRepository extends BaseRepository<CostHistory> {
  constructor() {
    super("costHistory");
  }
}

export const inventoryMovementRepository = new InventoryMovementRepository();
export const costHistoryRepository = new CostHistoryRepository();
