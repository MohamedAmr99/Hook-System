import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export const ActivityService = {
  async log(action: string, userId: string, details?: Record<string, any>) {
    try {
      await addDoc(collection(db, "activity_logs"), {
        action,
        userId,
        details: details || {},
        timestamp: Date.now(),
      });
    } catch (e) {
      console.error("Failed to log activity:", e);
    }
  }
};
