import { z } from "zod";
import { AppSettingsSchema, TaxSettingsSchema } from "../schemas/settings.schema";

export type TaxSettings = z.infer<typeof TaxSettingsSchema>;
export type AppSettings = z.infer<typeof AppSettingsSchema>;
