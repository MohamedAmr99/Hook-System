import { describe, it, expect } from "vitest";
import { Order } from "@/features/orders/types/order.types";
import { Return } from "@/features/returns/types/return.types";
import {
  calculateOrderFinancials,
  calculateReturnedItemCogs,
  calculateNetReturnYield,
} from "../orderCalculations";

describe("Domain Financial & Return Economics", () => {
  it("Test 1: Normal Sale without Return calculates financials accurately", () => {
    const order: Order = {
      id: "ord-1",
      platformOrderId: "AMZ-101",
      platform: "Amazon",
      status: "Delivered",
      paymentStatus: "Paid",
      financialStatus: "Settled",
      orderDate: Date.now(),
      items: [
        {
          id: "item-1",
          productId: "prod-1",
          sku: "SKU-A",
          name: "Receiver X10",
          quantity: 2,
          unitPrice: 1000,
          unitCogs: 400,
          discount: 0,
          tax: 0,
        },
      ],
      subtotal: 2000,
      discountTotal: 0,
      taxTotal: 0,
      shippingCollected: 100,
      totalRevenue: 2100,
      totalCogs: 800,
      grossProfit: 1300,
      sellingFees: 200,
      fulfillmentFees: 100,
      otherFees: 0,
      netPayoutExpected: 1800,
      paidAmount: 2100,
      refundedAmount: 0,
      netCollectedAmount: 2100,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: "u1",
      updatedBy: "u1",
    };

    const financials = calculateOrderFinancials(order);

    expect(financials.originalRevenue).toBe(2100);
    expect(financials.originalCogs).toBe(800);
    expect(financials.originalFees).toBe(300);
    expect(financials.originalProfit).toBe(1000);
    expect(financials.hasReturn).toBe(false);
    expect(financials.effectiveRevenue).toBe(2100);
    expect(financials.finalNetProfit).toBe(1000);
  });

  it("Test 2: Damaged Return with SAFE-T Compensation", () => {
    const order: Order = {
      id: "ord-2",
      platformOrderId: "AMZ-102",
      platform: "Amazon",
      status: "Delivered",
      paymentStatus: "Paid",
      financialStatus: "Settled",
      orderDate: Date.now(),
      items: [
        {
          id: "item-2",
          productId: "prod-2",
          sku: "SKU-B",
          name: "Camera 4K",
          quantity: 1,
          unitPrice: 1500,
          unitCogs: 600,
          discount: 0,
          tax: 0,
        },
      ],
      subtotal: 1500,
      discountTotal: 0,
      taxTotal: 0,
      shippingCollected: 0,
      totalRevenue: 1500,
      totalCogs: 600,
      grossProfit: 900,
      sellingFees: 150,
      fulfillmentFees: 50,
      otherFees: 0,
      netPayoutExpected: 1300,
      paidAmount: 1500,
      refundedAmount: 1500,
      netCollectedAmount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: "u1",
      updatedBy: "u1",
    };

    const returnDoc: Return = {
      id: "ret-1",
      orderId: order.id,
      orderItemId: "item-2",
      quantity: 1,
      returnCondition: "damaged",
      returnStage: "case_filed",
      caseReference: "SAFE-T-999",
      caseStatus: "resolved",
      compensationType: "partial",
      compensationAmount: 800,
      customerRefundAmount: 1500,
      platformFeeRetained: 50,
      shippingCostRetained: 0,
      netLoss: 750,
      restocked: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const financials = calculateOrderFinancials(order, returnDoc);

    const directYield = calculateNetReturnYield(1500, 800, 50, 0, true, 600);
    expect(directYield).toBe(-1350);

    expect(financials.hasReturn).toBe(true);
    expect(financials.customerRefund).toBe(1500);
    // Net Return Yield = 800 (compensation) - 1500 (refund) - 50 (fees) - 600 (damaged cogs) = -1350
    expect(financials.netReturnYield).toBe(-1350);
  });

  it("Test 3: Healthy Return Restocked with 0 Compensation", () => {
    const order: Order = {
      id: "ord-3",
      platformOrderId: "AMZ-103",
      platform: "Amazon",
      status: "Delivered",
      paymentStatus: "Paid",
      financialStatus: "Settled",
      orderDate: Date.now(),
      items: [
        {
          id: "item-3",
          productId: "prod-3",
          sku: "SKU-C",
          name: "Smart Watch",
          quantity: 1,
          unitPrice: 800,
          unitCogs: 300,
          discount: 0,
          tax: 0,
        },
      ],
      subtotal: 800,
      discountTotal: 0,
      taxTotal: 0,
      shippingCollected: 0,
      totalRevenue: 800,
      totalCogs: 300,
      grossProfit: 500,
      sellingFees: 80,
      fulfillmentFees: 20,
      otherFees: 0,
      netPayoutExpected: 700,
      paidAmount: 800,
      refundedAmount: 800,
      netCollectedAmount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: "u1",
      updatedBy: "u1",
    };

    const returnDoc: Return = {
      id: "ret-2",
      orderId: order.id,
      orderItemId: "item-3",
      quantity: 1,
      returnCondition: "healthy",
      returnStage: "received",
      compensationType: "none",
      compensationAmount: 0,
      customerRefundAmount: 800,
      platformFeeRetained: 20,
      shippingCostRetained: 0,
      netLoss: 820,
      restocked: true,
      restockedAt: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const financials = calculateOrderFinancials(order, returnDoc);

    // Healthy return: COGS is restored since item is back in inventory stock
    expect(financials.hasReturn).toBe(true);
    expect(financials.customerRefund).toBe(800);
  });

  it("Test 4: Partial Item Return calculates specific item COGS only", () => {
    const order: Order = {
      id: "ord-4",
      platformOrderId: "AMZ-104",
      platform: "Amazon",
      status: "Delivered",
      paymentStatus: "Paid",
      financialStatus: "Settled",
      orderDate: Date.now(),
      items: [
        {
          id: "item-4a",
          productId: "prod-4a",
          sku: "SKU-D1",
          name: "Item 1",
          quantity: 2,
          unitPrice: 500,
          unitCogs: 200,
          discount: 0,
          tax: 0,
        },
        {
          id: "item-4b",
          productId: "prod-4b",
          sku: "SKU-D2",
          name: "Item 2",
          quantity: 1,
          unitPrice: 1000,
          unitCogs: 500,
          discount: 0,
          tax: 0,
        },
      ],
      subtotal: 2000,
      discountTotal: 0,
      taxTotal: 0,
      shippingCollected: 0,
      totalRevenue: 2000,
      totalCogs: 900,
      grossProfit: 1100,
      sellingFees: 200,
      fulfillmentFees: 100,
      otherFees: 0,
      netPayoutExpected: 1700,
      paidAmount: 2000,
      refundedAmount: 500,
      netCollectedAmount: 1500,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: "u1",
      updatedBy: "u1",
    };

    const returnDoc: Return = {
      id: "ret-3",
      orderId: order.id,
      orderItemId: "item-4a",
      quantity: 1,
      returnCondition: "damaged",
      returnStage: "received",
      compensationType: "none",
      compensationAmount: 0,
      customerRefundAmount: 500,
      platformFeeRetained: 0,
      shippingCostRetained: 0,
      netLoss: 500,
      restocked: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const itemCogs = calculateReturnedItemCogs(order, returnDoc);
    expect(itemCogs).toBe(200); // 1 qty of item-4a with unitCogs 200
  });
});
