export type OrderStatus = 
  | "Pending" 
  | "Processing" 
  | "Shipped" 
  | "Delivered" 
  | "Cancelled"
  | "Returned"
  | "ReturnedToSeller"
  | "ReturningToSeller"
  | "RejectedByBuyer";

export type PaymentStatus = 
  | "Unpaid"
  | "Paid"
  | "PartiallyRefunded"
  | "Refunded";

export type FinancialStatus = 
  | "Unsettled"
  | "PendingSettlement"
  | "PartiallySettled"
  | "Settled"
  | "Disputed";

export type ReturnStatus = 
  | "None"
  | "Requested"
  | "Returned"
  | "Damaged"
  | "LostInTransit";

export interface OrderItem {
  id: string; // Internal Item ID
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number; // Selling price
  unitCogs: number; // Historical Weighted Average Cost at time of sale
  discount: number;
  tax: number; // Configurable tax
}

export interface Order {
  id: string; // Internal ID
  platformOrderId: string; // External ID
  platform: string;
  
  // Statuses (Separated)
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  financialStatus: FinancialStatus;
  returnStatus: ReturnStatus;
  
  orderDate: number; // Unix timestamp
  
  items: OrderItem[];

  // Financials
  subtotal: number; // Gross items
  discountTotal: number;
  taxTotal: number;
  shippingCollected: number; // Shipping charged to customer
  
  totalRevenue: number; // subtotal - discountTotal + taxTotal + shippingCollected
  totalCogs: number; // Sum of (items.unitCogs * quantity)
  grossProfit: number; // totalRevenue - totalCogs

  // Marketplace Fees (Not COGS)
  sellingFees: number;
  fulfillmentFees: number;
  otherFees: number;
  
  netPayoutExpected: number; // totalRevenue - (sellingFees + fulfillmentFees + otherFees)

  // Returns Financials
  returnShippingCost?: number;
  refundAmount?: number;
  returnClaimAmount?: number;
  
  // Settlement Reference
  settlementId?: string;

  // Audit
  createdAt: number;
  updatedAt: number;
  createdBy: string;
  updatedBy: string;
}
