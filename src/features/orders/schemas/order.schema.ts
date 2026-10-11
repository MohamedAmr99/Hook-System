import { z } from "zod";

export const PlatformSchema = z.string().min(1, "Platform is required");

export const OrderStatusSchema = z.enum([
  "Pending",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
  "Returned",
  "ReturnedToSeller",
  "ReturningToSeller",
  "RejectedByBuyer",
]);
export const PaymentStatusSchema = z.enum([
  "Unpaid",
  "Paid",
  "PartiallyRefunded",
  "Refunded",
]);
export const FinancialStatusSchema = z.enum([
  "Unsettled",
  "PendingSettlement",
  "PartiallySettled",
  "Settled",
  "Disputed",
  "Compensated",
  "PartiallyCompensated",
  "NotCompensated",
]);
export const ReturnStatusSchema = z.enum([
  "None",
  "Requested",
  "Returned",
  "Damaged",
  "LostInTransit",
]);

export const OrderItemSchema = z.object({
  id: z.string().optional(),
  productId: z.string().min(1, "Product ID is required"),
  sku: z.string().min(1, "SKU is required"),
  name: z.string().min(1, "Product name is required"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  unitPrice: z.coerce.number().min(0, "Unit price must be non-negative"),
  unitCogs: z.coerce.number().default(0),
  discount: z.coerce.number().default(0),
  tax: z.coerce.number().default(0),
});

export const OrderSchema = z.object({
  id: z.string().optional(),
  platformOrderId: z.string().min(1, "Platform Order ID is required"),
  platform: PlatformSchema,

  status: OrderStatusSchema.default("Pending"),
  paymentStatus: PaymentStatusSchema.default("Unpaid"),
  financialStatus: FinancialStatusSchema.default("Unsettled"),
  returnStatus: ReturnStatusSchema.default("None"),

  orderDate: z.coerce.number(), // Date in ms

  items: z.array(OrderItemSchema).min(1, "At least one item is required"),

  // Financials
  subtotal: z.coerce.number().default(0),
  discountTotal: z.coerce.number().default(0),
  taxTotal: z.coerce.number().default(0),
  shippingCollected: z.coerce.number().default(0),

  totalRevenue: z.coerce.number().default(0),
  totalCogs: z.coerce.number().default(0),
  grossProfit: z.coerce.number().default(0),

  sellingFees: z.coerce.number().default(0),
  fulfillmentFees: z.coerce.number().default(0),
  otherFees: z.coerce.number().default(0),

  netPayoutExpected: z.coerce.number().default(0),

  // Payments & Collections
  paidAmount: z.coerce.number().optional(),
  refundedAmount: z.coerce.number().optional(),
  netCollectedAmount: z.coerce.number().optional(),

  // Returns Financials
  returnShippingCost: z.coerce.number().optional(),
  refundAmount: z.coerce.number().optional(),
  returnClaimAmount: z.coerce.number().optional(),

  settlementId: z.string().optional(),
});

export type OrderInput = z.infer<typeof OrderSchema>;
