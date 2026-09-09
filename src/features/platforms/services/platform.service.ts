import { db } from "@/lib/firebase/config";
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";
import type { Platform } from "../types/platform.types";

const PLATFORMS_COLLECTION = "platforms";

export const PlatformService = {
  async createPlatform(
    data: Pick<Platform, "name" | "logoUrl" | "categories">,
    userId: string,
    userDisplayName: string,
  ): Promise<Platform> {
    const colRef = collection(db, PLATFORMS_COLLECTION);
    const newDocRef = doc(colRef);
    const now = Date.now();
    const platform: Platform = {
      id: newDocRef.id,
      name: data.name,
      logoUrl: data.logoUrl || "",
      categories: data.categories || [],
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      updatedBy: userDisplayName,
    };
    await setDoc(newDocRef, platform);
    return platform;
  },

  async updatePlatform(
    id: string,
    data: Partial<Pick<Platform, "name" | "logoUrl" | "categories">>,
    userDisplayName: string,
  ): Promise<void> {
    const docRef = doc(db, PLATFORMS_COLLECTION, id);
    await updateDoc(docRef, { ...data, updatedAt: Date.now(), updatedBy: userDisplayName });
  },

  async deletePlatform(id: string): Promise<void> {
    await deleteDoc(doc(db, PLATFORMS_COLLECTION, id));
  },

  async getPlatforms(): Promise<Platform[]> {
    const q = query(collection(db, PLATFORMS_COLLECTION), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as Platform);
  },
};
