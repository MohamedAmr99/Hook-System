import { costHistoryRepository } from "../repositories/inventory.repository";
import { productRepository } from "@/features/products/repositories/product.repository";
import { CostHistory } from "../types/inventory.types";

export class CostingService {
  /**
   * Recalculates the Weighted Average Cost when new inventory is purchased.
   */
  async recordPurchaseCost(
    productId: string,
    addedQuantity: number,
    addedUnitCost: number,
    referenceId: string,
    isEstimated: boolean = false,
  ): Promise<void> {
    if (addedQuantity <= 0) return;

    const product = await productRepository.getById(productId);
    if (!product) throw new Error(`Product ${productId} not found`);

    const previousStock = product.quantity || 0;
    const previousWac = product.costPrice || 0;

    const newTotalStock = previousStock + addedQuantity;

    // Formula: ((Old Stock * Old WAC) + (New Stock * New Cost)) / Total New Stock
    const newWeightedAverageCost =
      (previousStock * previousWac + addedQuantity * addedUnitCost) /
      newTotalStock;

    // 1. Save cost history
    const history: Omit<CostHistory, "id"> = {
      productId,
      date: Date.now(),
      newWeightedAverageCost,
      previousStock,
      previousWac,
      addedQuantity,
      addedUnitCost,
      newTotalStock,
      referenceId,
      isEstimated,
    };

    await costHistoryRepository.create(history);

    // 2. Update Product with new WAC
    await productRepository.update(productId, {
      costPrice: newWeightedAverageCost,
    });
  }
}

export const costingService = new CostingService();
