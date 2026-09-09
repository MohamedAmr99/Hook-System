import { SettlementRecord } from "../types/settlement.types";
import { settlementRepository } from "../repositories/settlement.repository";
import { AmazonParserService } from "./amazonParser.service";
import { useStore } from "@/shared/store/useStore";

export class SettlementService {
  /**
   * Processes a raw settlement TSV string.
   * Parses it, stores raw records in Firestore, and updates matching Orders in Zustand store.
   */
  static async importAmazonSettlement(tsvData: string, userId: string): Promise<{ matched: number, total: number }> {
    // 1. Parse TSV
    const records = AmazonParserService.parse(tsvData, userId);
    if (records.length === 0) return { matched: 0, total: 0 };

    // 2. Save raw records to DB
    // We should probably chunk this if it's very large, but Firebase writeBatch can handle up to 500 ops.
    const CHUNK_SIZE = 450;
    for (let i = 0; i < records.length; i += CHUNK_SIZE) {
      const chunk = records.slice(i, i + CHUNK_SIZE);
      await settlementRepository.createBatch(chunk);
    }

    // 3. Reconcile with Orders
    // We only care about transaction types like 'Order' or 'Refund' that link to an order id.
    const { orders, updateOrder } = useStore.getState();
    let matchedCount = 0;

    // Group records by order id to calculate total settlement per order
    const recordsByOrder: Record<string, SettlementRecord[]> = {};
    for (const record of records) {
      if (record.platformOrderId) {
        if (!recordsByOrder[record.platformOrderId]) recordsByOrder[record.platformOrderId] = [];
        recordsByOrder[record.platformOrderId].push(record as SettlementRecord);
      }
    }

    for (const [platformOrderId, orderRecords] of Object.entries(recordsByOrder)) {
      const order = orders.find(o => o.platformOrderId === platformOrderId);
      if (order) {
        // Calculate the actual settled amount for this order from the report
        const totalSettled = orderRecords.reduce((sum, r) => sum + r.total, 0);

        // Update the order
        updateOrder(order.id, {
          financialStatus: "Settled",
          netPayoutExpected: totalSettled,
          updatedAt: Date.now(),
          updatedBy: userId
        });
        matchedCount++;
      }
    }

    return {
      matched: matchedCount,
      total: records.length
    };
  }
}
