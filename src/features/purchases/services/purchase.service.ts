// @ts-nocheck
import { purchaseRepository } from "../repositories/purchase.repository";
import { Purchase } from "../types/purchase.types";
import { inventoryMovementRepository } from "@/features/inventory/repositories/inventory.repository";
import { costingService } from "@/features/inventory/services/costing.service";
import { ledgerService } from "@/features/finance/services/ledger.service";

export const PurchaseService = {
  async getPurchases(): Promise<Purchase[]> {
    return await purchaseRepository.getAll();
  },

  async getPurchaseById(id: string): Promise<Purchase | null> {
    return await purchaseRepository.getById(id);
  },

  async createPurchase(data: Omit<Purchase, "id">): Promise<Purchase> {
    if (!data.items || data.items.length === 0) {
      throw new Error("Purchase must have items");
    }

    const newPurchase = await purchaseRepository.create(data);

    // If purchase is already marked as received upon creation
    if (newPurchase.status === "Received") {
      await this.processReceivedPurchase(newPurchase);
    }

    return newPurchase;
  },

  async updatePurchaseStatus(id: string, status: Purchase["status"], createdBy: string): Promise<void> {
    const purchase = await purchaseRepository.getById(id);
    if (!purchase) throw new Error("Purchase not found");
    
    if (purchase.status !== "Received" && status === "Received") {
      purchase.status = "Received";
      purchase.updatedAt = Date.now();
      purchase.updatedBy = createdBy;
      
      // Update in db
      await purchaseRepository.update(id, { status, updatedAt: purchase.updatedAt, updatedBy: createdBy });
      
      // Process receipt (inventory & costing)
      await this.processReceivedPurchase(purchase);
    } else {
      await purchaseRepository.update(id, { status, updatedAt: Date.now(), updatedBy: createdBy });
    }
  },

  /**
   * Internal method to process inventory logic when a purchase is received
   */
  async processReceivedPurchase(purchase: Purchase): Promise<void> {
    for (const item of purchase.items) {
      // 1. Generate Inventory Movement
      await inventoryMovementRepository.create({
        productId: item.productId,
        sku: item.sku,
        type: "PURCHASE_RECEIVE",
        quantity: item.orderedQuantity, // Assuming receiving full ordered qty for now
        referenceId: purchase.id,
        unitCost: item.unitCost,
        previousStock: 0, 
        newStock: 0,
        createdAt: Date.now(),
        createdBy: purchase.createdBy
      });

      // 2. Apply Weighted Average Cost
      await costingService.recordPurchaseCost(
        item.productId,
        item.orderedQuantity,
        item.unitCost,
        purchase.id,
        false
      );
    }

    // 3. Post Financial Ledger Entries
    // Debit: Inventory Asset
    // Credit: Accounts Payable (Supplier)
    await ledgerService.postTransaction(
      {
        type: "PurchasePayment", // or PurchaseReceive
        referenceId: purchase.id,
        date: purchase.purchaseDate,
        description: `Purchase Received from ${purchase.supplierName}`,
        status: "Posted",
        createdBy: purchase.createdBy,
        createdAt: Date.now(),
      },
      [
        {
          accountId: "inventory_asset",
          debit: purchase.totalCost,
          credit: 0,
        },
        {
          accountId: "supplier_payable",
          debit: 0,
          credit: purchase.totalCost,
        }
      ]
    );
  }
};

