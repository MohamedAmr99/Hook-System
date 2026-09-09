import { SettlementRecord } from "../types/settlement.types";

/**
 * Parses Amazon Settlement flat file (TSV).
 * Expects the first 7 rows to be header information, and row 8 to be the column names.
 */
export class AmazonParserService {
  static parse(tsvData: string, userId: string): Omit<SettlementRecord, "id">[] {
    const lines = tsvData.split('\n');
    if (lines.length < 8) return [];

    // Row 8 contains the headers (index 7)
    const headers = lines[7].split('\t').map(h => h.trim().toLowerCase());
    
    // Map required column names to their index
    const colMap: Record<string, number> = {};
    headers.forEach((h, i) => {
      if (h) colMap[h] = i;
    });

    const records: Omit<SettlementRecord, "id">[] = [];

    // Parse data rows starting from row 9 (index 8)
    for (let i = 8; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const cols = line.split('\t');
      
      const getValue = (colName: string): string => {
        const idx = colMap[colName];
        return idx !== undefined && cols[idx] !== undefined ? cols[idx].trim() : "";
      };

      const getNum = (colName: string): number => {
        const val = getValue(colName).replace(/,/g, '');
        const num = parseFloat(val);
        return isNaN(num) ? 0 : num;
      };

      // Create record
      const record: Omit<SettlementRecord, "id"> = {
        date: new Date(getValue("date/time")).getTime() || Date.now(),
        settlementId: getValue("settlement id"),
        type: getValue("type"),
        platformOrderId: getValue("order id"),
        sku: getValue("sku"),
        description: getValue("description"),
        quantity: getNum("quantity"),
        marketplace: getValue("marketplace"),
        fulfillment: getValue("fulfillment"),
        productSales: getNum("product sales"),
        shippingCredits: getNum("shipping credits"),
        promotionalRebates: getNum("promotional rebates"),
        sellingFees: getNum("selling fees"),
        fbaFees: getNum("fba fees"),
        otherTransactionFees: getNum("other transaction fees"),
        other: getNum("other"),
        total: getNum("total"),
        transactionStatus: getValue("transaction status") || getValue("transaction status "), // Handling possible trailing space
        createdAt: Date.now(),
        createdBy: userId
      };

      records.push(record);
    }

    return records;
  }
}
