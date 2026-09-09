import { db } from "@/lib/firebase/config";
import {
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";

export interface ActivityLog {
  id?: string;
  userId: string;
  userDisplayName: string;
  actionType: "create" | "update" | "delete" | "archive" | "inventory_edit";
  entityType: "product";
  entityId: string;
  entityName: string;
  description: string;
  metadata?: Record<string, any>;
  createdAt: number;
}

export const ActivityService = {
  /**
   * Logs an action in the system
   */
  async logAction(log: Omit<ActivityLog, "createdAt">): Promise<void> {
    try {
      const logsCollection = collection(db, "activityLogs");
      await addDoc(logsCollection, {
        ...log,
        createdAt: Date.now(),
      });
    } catch (error) {
      console.error("Failed to write audit log:", error);
    }
  },

  /**
   * Retrieves recent activity logs
   */
  async getRecentLogs(maxCount: number = 20): Promise<ActivityLog[]> {
    try {
      const logsCollection = collection(db, "activityLogs");
      const q = query(
        logsCollection,
        orderBy("createdAt", "desc"),
        limit(maxCount),
      );
      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ActivityLog[];
    } catch (error) {
      console.error("Failed to get activity logs:", error);
      return [];
    }
  },
};
