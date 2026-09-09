export type PurchaseStatus = "Draft" | "Pending" | "PartiallyReceived" | "Received" | "Cancelled";
export type PaymentStatus = "Unpaid" | "PartiallyPaid" | "Paid";

export interface PurchaseItem {
  id: string;
  productId: string;
  sku: string;
  name: string;
  orderedQuantity: number;
  receivedQuantity: number;
  unitCost: number; // Wholesale price per unit
}

export interface Purchase {
  id: string;
  supplierId: string;
  supplierName: string;
  purchaseDate: number;
  
  // Statuses
  status: PurchaseStatus;
  paymentStatus: PaymentStatus;
  
  items: PurchaseItem[];

  // Financials
  subtotal: number; // Sum of (orderedQuantity * unitCost)
  shippingCost: number; 
  tax: number;
  otherExpenses: number; 
  
  totalCost: number; // subtotal + shippingCost + tax + otherExpenses
  
  // Payment Tracking
  amountPaid: number;
  balanceDue: number; // totalCost - amountPaid

  // Audit
  createdAt: number;
  updatedAt: number;
  createdBy: string;
  updatedBy: string;
}
