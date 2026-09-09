import { z } from "zod";

export const PurchaseStatusSchema = z.enum(["Draft", "Pending", "PartiallyReceived", "Received", "Cancelled"]);
export const PaymentStatusSchema = z.enum(["Unpaid", "PartiallyPaid", "Paid"]);

export const PurchaseItemSchema = z.object({
  id: z.string().optional(),
  productId: z.string().min(1, "Product ID is required"),
  sku: z.string().min(1, "SKU is required"),
  name: z.string().min(1, "Product name is required"),
  orderedQuantity: z.number().min(1, "Quantity must be at least 1"),
  receivedQuantity: z.number().min(0).default(0),
  unitCost: z.number().min(0, "Unit cost must be non-negative"),
});

export const PurchaseSchema = z.object({
  id: z.string().optional(),
  supplierId: z.string().default(""),
  supplierName: z.string().min(1, "Supplier name is required"),
  purchaseDate: z.coerce.number(), // Date in ms
  
  status: PurchaseStatusSchema.default("Pending"),
  paymentStatus: PaymentStatusSchema.default("Unpaid"),

  items: z.array(PurchaseItemSchema).min(1, "At least one item is required"),

  // Financials
  subtotal: z.number().min(0).default(0),
  shippingCost: z.number().default(0),
  tax: z.number().default(0),
  otherExpenses: z.number().default(0),

  totalCost: z.number().default(0),
  
  amountPaid: z.number().default(0),
  balanceDue: z.number().default(0),
});

export type PurchaseInput = z.infer<typeof PurchaseSchema>;

