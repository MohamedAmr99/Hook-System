import { z } from "zod";

export const SettlementRecordSchema = z.object({
  id: z.string(), // e.g. platformOrderId or composite key
  date: z.number(), // Extracted from 'date/time'
  settlementId: z.string(),
  type: z.string(), // Order, Refund, Service Fee, etc.
  platformOrderId: z.string(),
  sku: z.string().optional(),
  description: z.string().optional(),
  quantity: z.number().default(0),
  marketplace: z.string().optional(),
  fulfillment: z.string().optional(),
  productSales: z.number().default(0),
  shippingCredits: z.number().default(0),
  promotionalRebates: z.number().default(0),
  sellingFees: z.number().default(0),
  fbaFees: z.number().default(0),
  otherTransactionFees: z.number().default(0),
  other: z.number().default(0),
  total: z.number().default(0),
  transactionStatus: z.string().optional(),
  createdAt: z.number(),
  createdBy: z.string()
});
