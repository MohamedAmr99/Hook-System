// @ts-nocheck
import { orderRepository } from "../repositories/order.repository";
import { Order } from "../types/order.types";
import { inventoryMovementRepository } from "@/features/inventory/repositories/inventory.repository";
import { ledgerService } from "@/features/finance/services/ledger.service";

export const OrderService = {
  async getOrders(): Promise<Order[]> {
    return await orderRepository.getAll();
  },

  async getOrderById(id: string): Promise<Order | null> {
    return await orderRepository.getById(id);
  },

  async createOrder(data: Omit<Order, "id">): Promise<Order> {
    // Basic validations
    if (!data.items || data.items.length === 0) {
      throw new Error("Order must have items");
    }

    // 1. Create Order
    const newOrder = await orderRepository.create(data);

    // 2. Generate Inventory Movements (deducting stock)
    for (const item of data.items) {
      await inventoryMovementRepository.create({
        productId: item.productId,
        sku: item.sku,
        type: "SALE",
        quantity: -(item.orderedQuantity || item.receivedQuantity || 0), // Negative for sale
        referenceId: newOrder.id,
        unitCost: item.unitCogs,
        previousStock: 0, // Should be fetched properly in full implementation
        newStock: 0,
        createdAt: Date.now(),
        createdBy: data.createdBy
      });
    }

    // 3. Post Financial Ledger Entries
    // Debits (Receivable from Marketplace)
    // Credits (Revenue)
    // Cost of Goods Sold (Debit)
    // Inventory Asset (Credit)
    await ledgerService.postTransaction(
      {
        type: "OrderSale",
        referenceId: newOrder.id,
        date: newOrder.orderDate,
        description: `Sale Order ${newOrder.platformOrderId} on ${newOrder.platform}`,
        status: "Posted",
        createdBy: data.createdBy,
        createdAt: Date.now(),
      },
      [
        {
          accountId: "marketplace_receivable", // This should dynamically lookup the platform account
          debit: newOrder.netPayoutExpected,
          credit: 0,
        },
        {
          accountId: "marketplace_fees", // Expenses
          debit: newOrder.sellingFees + newOrder.fulfillmentFees + newOrder.otherFees,
          credit: 0,
        },
        {
          accountId: "sales_revenue", // Revenue
          debit: 0,
          credit: newOrder.totalRevenue,
        },
        {
          accountId: "cogs", // Expense
          debit: newOrder.totalCogs,
          credit: 0,
        },
        {
          accountId: "inventory_asset", // Asset
          debit: 0,
          credit: newOrder.totalCogs,
        },
      ]
    );

    return newOrder;
  },

  async updateOrderStatus(id: string, updates: Partial<Order>): Promise<void> {
    await orderRepository.update(id, updates);
  }
};

