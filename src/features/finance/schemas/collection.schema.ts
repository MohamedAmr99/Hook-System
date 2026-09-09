import { z } from "zod";

export const CollectionStatusSchema = z.enum(["Reconciled", "PartiallyReconciled", "Difference", "Disputed"]);

export const CollectionSchema = z.object({
  id: z.string().optional(),
  platformId: z.string().min(1, "Platform is required"),
  collectionDate: z.coerce.number(),
  
  expectedAmount: z.coerce.number().min(0, "Expected amount must be non-negative"),
  actualAmount: z.coerce.number().min(0, "Actual amount must be non-negative"),
  difference: z.coerce.number(),
  
  status: CollectionStatusSchema.default("Reconciled"),
  
  reference: z.string().optional(),
  externalReference: z.string().optional(),
  externalSettlementId: z.string().optional(),
  importBatchId: z.string().optional(),
  
  receivingAccountId: z.string().min(1, "Receiving account is required"),
  
  settlementPeriodStart: z.coerce.number().optional(),
  settlementPeriodEnd: z.coerce.number().optional(),
  ordersCount: z.coerce.number().optional(),
  
  notes: z.string().optional(),
  
  createdBy: z.string().optional(),
  createdAt: z.coerce.number().optional(),
  updatedBy: z.string().optional(),
  updatedAt: z.coerce.number().optional(),
});

export type CollectionInput = z.infer<typeof CollectionSchema>;
