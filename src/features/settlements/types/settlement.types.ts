import { z } from "zod";
import { SettlementRecordSchema } from "../schemas/settlement.schema";

export type SettlementRecord = z.infer<typeof SettlementRecordSchema>;
