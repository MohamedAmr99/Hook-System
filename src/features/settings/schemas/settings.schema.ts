import { z } from "zod";

export const TaxSettingsSchema = z.object({
  globalVatRate: z.number().min(0).max(100).default(14),
  categoryVatRates: z.record(z.string(), z.number().min(0).max(100)).default({}),
});

export const AppSettingsSchema = z.object({
  id: z.string(),
  tax: TaxSettingsSchema,
  updatedAt: z.number(),
  updatedBy: z.string()
});
