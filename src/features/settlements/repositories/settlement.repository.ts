import { db } from "@/lib/firebase/config";
import { collection, doc, writeBatch } from "firebase/firestore";
import { SettlementRecord } from "../types/settlement.types";

const COLLECTION_NAME = "settlements";

export const settlementRepository = {
  async createBatch(records: Omit<SettlementRecord, "id">[]): Promise<void> {
    const batch = writeBatch(db);
    records.forEach(record => {
      const docRef = doc(collection(db, COLLECTION_NAME));
      batch.set(docRef, { ...record, id: docRef.id });
    });
    await batch.commit();
  }
};
