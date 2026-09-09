import { AppSettings } from "../types/settings.types";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, setDoc } from "firebase/firestore";

const SETTINGS_DOC_ID = "global_settings";
const COLLECTION_NAME = "settings";

export const settingsRepository = {
  async getSettings(): Promise<AppSettings> {
    const docRef = doc(db, COLLECTION_NAME, SETTINGS_DOC_ID);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as AppSettings;
    }
    // Default settings
    return {
      id: SETTINGS_DOC_ID,
      tax: {
        globalVatRate: 14,
        categoryVatRates: {}
      },
      updatedAt: Date.now(),
      updatedBy: "system"
    };
  },

  async updateSettings(settings: Partial<AppSettings>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, SETTINGS_DOC_ID);
    await setDoc(docRef, settings, { merge: true });
  }
};
